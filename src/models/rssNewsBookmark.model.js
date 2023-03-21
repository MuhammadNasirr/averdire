import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class RssNewsBookmark extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.RssNews, {foreignKey: 'rssNewsId', as: 'news'});
    }
  };

  RssNewsBookmark.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rssNewsId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    tableName: 'RssNewsBookmark',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });

  return RssNewsBookmark;
};
