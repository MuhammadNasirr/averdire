import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class RssNews extends Model {
    static associate(models) {
      this.hasMany(models.SharedRssNews, { foreignKey: 'rssNewsId', as: 'sharedNews' });
    }
  };
  
  RssNews.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imageLink: {
      type: DataTypes.STRING
    },
    publishDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: { isDate: true }
    }
  }, {
    tableName: 'RssNews',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });
  return RssNews;
};
