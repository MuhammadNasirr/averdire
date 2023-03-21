import Sequelize from "sequelize";
import Model from '../utils/model.js';
import {PUBLICATION} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class Publication extends Model {
    static associate(models) {
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
        this.hasOne(models.Attachment, {foreignKey: 'modelId', as: PUBLICATION.fields.banner});
        this.hasMany(models.PublicationComment, { foreignKey: 'publicationId', as: 'comments' });
        this.hasMany(models.PublicationLike, { foreignKey: 'publicationId', as: 'likes' });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] },
        banner: {include: [
          sequelize.models.Attachment.getIncludeQueryObject(PUBLICATION.value, PUBLICATION.fields.banner)
        ]},
        publicationStats: (uId=null) => {
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
                { model: m.PublicationComment, as: 'comments', attributes: [] },
                { model: m.PublicationLike, as: 'likes', attributes: [] }
            ],
            // grouping is required when using count in the query
            group: ['id']
          }
        }
      }
    }
  };
  
  Publication.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reference: {
        type: DataTypes.STRING
    }
  }, {
    tableName: 'Publication',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });
  return Publication;
};
