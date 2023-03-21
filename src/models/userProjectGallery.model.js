import Model from '../utils/model.js';
import {PROJECT} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class UserProjectGallery extends Model {
    static associate(models) {
        this.hasOne(models.Attachment, {foreignKey: 'modelId', as: PROJECT.fields.photo});
        this.belongsTo(models.UserProject, {foreignKey: 'userProjectId', as: 'project'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userProjectId'] } },
        photo: {include: [
          m.Attachment.getIncludeQueryObject(PROJECT.value, PROJECT.fields.photo)
        ]},
        project: {include: ["project"]}
      }
    }
  };

  UserProjectGallery.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'UserProjectGallery',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userProjectId', 'updatedAt']
      }
    }
  });
  return UserProjectGallery;
};
