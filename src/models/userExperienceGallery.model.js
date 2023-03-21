import Model from '../utils/model.js';
import {EXPERIENCE} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class UserExperienceGallery extends Model {
    static associate(models) {
        this.hasOne(models.Attachment, {foreignKey: 'modelId', as: EXPERIENCE.fields.photo});
        this.belongsTo(models.UserExperience, {foreignKey: 'userExperienceId', as: 'experience'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userExperienceId'] } },
        photo: {include: [
          m.Attachment.getIncludeQueryObject(EXPERIENCE.value, EXPERIENCE.fields.photo)
        ]},
        experience: {include: ["experience"]}
      }
    }
  };
  
  UserExperienceGallery.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userExperienceId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'UserExperienceGallery',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userExperienceId', 'updatedAt']
      }
    }
  });
  return UserExperienceGallery;
};
