import Sequelize from "sequelize";
import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class SharedRssNews extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'sharedBy' });
      this.belongsTo(models.RssNews, {foreignKey: 'rssNewsId', as: 'news'});
      this.hasMany(models.RssNewsComment, { foreignKey: 'sharedNewsId', as: 'comments' });
      this.hasMany(models.RssNewsLike, { foreignKey: 'sharedNewsId', as: 'likes' });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "sharedBy", required: true }] },
        news: {include: [ 'news' ]},
        newsStats: (uId=null, group=['id']) => {
          let include = [
            [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`comments.id`))), "commentsCount"],
            [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`likes.id`))), "likesCount"]
          ];
          if(uId) {
            include.push([Sequelize.literal('COUNT(DISTINCT if(likes.userId = '+uId+', likes.id, null))'), "isLiked"]);
          }
          return {
            attributes: { include },
            include: [
                { model: m.RssNewsComment, as: 'comments', attributes: [] },
                { model: m.RssNewsLike, as: 'likes', attributes: [] }
            ],
            // grouping is required when using count in the query
            group: group
          }
        }
      }
    }
  };

  SharedRssNews.init({
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
    tableName: 'SharedRssNews',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });

  return SharedRssNews;
};
