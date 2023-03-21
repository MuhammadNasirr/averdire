import Model from '../utils/model.js';
import {EDUCATION} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class UserEducationGallery extends Model {
    static associate(models) {
        this.hasOne(models.Attachment, {foreignKey: 'modelId', as: EDUCATION.fields.photo});
        this.belongsTo(models.UserEducation, {foreignKey: 'userEducationId', as: 'education'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userEducationId'] } },
        photo: {include: [
          m.Attachment.getIncludeQueryObject(EDUCATION.value, EDUCATION.fields.photo)
        ]},
        education: {include: ["education"]}
      }
    }
    
  };
  UserEducationGallery.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userEducationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'UserEducationGallery',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userEducationId', 'updatedAt']
      }
    }
  });
  return UserEducationGallery;
};
