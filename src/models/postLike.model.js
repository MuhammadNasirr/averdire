import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class PostLike extends Model {
    static associate(models) {
        this.belongsTo(models.Post, {foreignKey: 'postId', as: 'post'});
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'postId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] }
      }
    }
  };

  PostLike.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'PostLike',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['postId', 'userId', 'updatedAt']
      }
    }
  });
  return PostLike;
};
