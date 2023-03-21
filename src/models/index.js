import Sequelize from 'sequelize';
import dbConfig from '../config/db.config.cjs';
import models from './index.model.js';

const env = process.env.NODE_ENV || 'development';
const db = {};
const config = dbConfig[env];
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

const allModels = models(sequelize, Sequelize.DataTypes);
allModels.forEach(model => {
  const attributes = model.getAttributes();
  const attributesArray = Object.keys(attributes);
  attributesArray.forEach(attribute => {
    if(attributes[attribute].type instanceof Sequelize.DATEONLY) {
      attributes[attribute].set = function (value) {
        // Change string to date in case of DATEONLY attribute data type.
        // Otherwise sequelize throw warning and validation doesn't work
        if(value) this.setDataValue(attribute, new Date(value));
        else this.setDataValue(attribute, value);
      };
    }
  });
  
  db[model.name] = model;
});

const modelsArray = Object.keys(db);

// add associations
modelsArray.forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// add scopes
modelsArray.forEach(modelName => {
  if (db[modelName].scopes) {
    const scopes = db[modelName].scopes();
    const scopeKeys = Object.keys(scopes);
    scopeKeys.forEach(key => {
      if(key==="excludeOnUpdate") {
        db[modelName].addHook('beforeUpdate', (model, options) => {
            if(scopes[key].attributes && scopes[key].attributes.exclude) {
              scopes[key].attributes.exclude.forEach(attribute => {
                delete model.dataValues[attribute];
              });
            }
        });

        db[modelName].addHook('beforeBulkUpdate', (model, options) => {
            if(scopes[key].attributes && scopes[key].attributes.exclude) {
              scopes[key].attributes.exclude.forEach(attribute => {
                var fieldIndex = model.fields.indexOf(attribute);
                if (fieldIndex !== -1) model.fields.splice(fieldIndex, 1);
              });
            }
        });
      } else {
        if(typeof scopes[key] === 'function') {
          const oldScope = scopes[key];
          scopes[key] = function() {
            let arg = Array.from(arguments);
            let scopeResponse = oldScope(...arg);
            if(scopeResponse.attributes) {
              if(Array.isArray(scopeResponse.attributes)) {
                const attrs = {};
                attrs.include = scopeResponse.attributes;
                scopeResponse.attributes = attrs;
                
                if(!scopeResponse.attributes.exclude) {
                  scopeResponse.attributes.exclude = Object.keys(db[modelName].rawAttributes);
                }
              }
            }
            return scopeResponse;
          }
        }
        else if(scopes[key].attributes) {
          if(Array.isArray(scopes[key].attributes)) {
            const attrs = {};
            attrs.include = scopes[key].attributes;
            scopes[key].attributes = attrs;
            
            if(!scopes[key].attributes.exclude) {
              scopes[key].attributes.exclude = Object.keys(db[modelName].rawAttributes);
            }
          }
        }
        db[modelName].addScope(key, scopes[key]);
      }
    });
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.sequelize.sync();

export default db;
