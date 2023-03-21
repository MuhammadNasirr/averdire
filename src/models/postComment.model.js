import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class PostComment extends Model {
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

  PostComment.init({
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
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }
  }, {
    tableName: 'PostComment',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['postId', 'userId', 'updatedAt']
      }
    }
  });
  return PostComment;
};
