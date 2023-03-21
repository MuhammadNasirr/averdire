import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class UserProject extends Model {
    static associate(models) {
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
        this.hasMany(models.UserProjectGallery, {foreignKey: 'userProjectId', as: 'gallery'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId'] } },
        gallery: {include: [
          { model: m.UserProjectGallery.scope("photo"), as: "gallery" },
        ]},
        fullUser: {include: [ { model: m.User, as: "user" } ]}
      }
    }
  };

  UserProject.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { isDate: true }
    },
    to: {
      type: DataTypes.DATEONLY,
      validate: { 
        isDate: true,
        isGreaterThanFromDate(value) {
          if (new Date(this.from) >= new Date(value)) {
            throw new Error("To date must be greater than from date.");
          }
        }
      }
    },
    description: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'UserProject',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });
  return UserProject;
};
