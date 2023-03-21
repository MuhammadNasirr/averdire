import Model from '../utils/model.js';
import {PUBLICATION} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class PublicationBookmark extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.Publication, {foreignKey: 'publicationId', as: 'publication'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'publicationId'] } },
        publication: {include: [{ model: m.Publication.scope('user', 'banner'), as: "publication" }] },
      }
    }
  };

  PublicationBookmark.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    publicationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    tableName: 'PublicationBookmark',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });

  return PublicationBookmark;
};
