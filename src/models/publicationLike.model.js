import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class PublicationLike extends Model {
    static associate(models) {
        this.belongsTo(models.Publication, {foreignKey: 'publicationId', as: 'publication'});
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'publicationId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] }
      }
    }
  };

  PublicationLike.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    publicationId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'PublicationLike',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['publicationId', 'userId', 'updatedAt']
      }
    }
  });
  return PublicationLike;
};
