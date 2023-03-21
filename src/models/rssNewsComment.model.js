import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class RssNewsComment extends Model {
    static associate(models) {
        this.belongsTo(models.SharedRssNews, {foreignKey: 'sharedNewsId', as: 'sharedNews'});
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'sharedNewsId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] }
      }
    }
  };

  RssNewsComment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sharedNewsId: {
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
    tableName: 'RssNewsComment',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['sharedNewsId', 'userId', 'updatedAt']
      }
    }
  });
  return RssNewsComment;
};
