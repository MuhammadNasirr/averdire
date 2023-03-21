import Sequelize from "sequelize";
import Model from '../utils/model.js';
import { POST } from '../constants/attachment.js';
import { POST_TYPES } from '../constants/post.js';

export default (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.hasOne(models.Attachment, { foreignKey: 'modelId', as: POST.fields.photo });
      this.hasOne(models.Attachment, { foreignKey: 'modelId', as: POST.fields.document });
      this.hasMany(models.PostComment, { foreignKey: 'postId', as: 'comments' });
      this.hasMany(models.PostLike, { foreignKey: 'postId', as: 'likes' });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] },
        attachments: {include: [
          sequelize.models.Attachment.getIncludeQueryObject(POST.value, POST.fields.photo),
          sequelize.models.Attachment.getIncludeQueryObject(POST.value, POST.fields.document)
        ]},
        postStats: (uId=null) => {
          return {
            attributes: {
              include: [
                [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`comments.id`))), "commentsCount"],
                [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`likes.id`))), "likesCount"],
                [Sequelize.literal('COUNT(DISTINCT if(likes.userId = '+uId+', likes.id, null))'), "isLiked"]
              ]
            },
            include: [
                { model: m.PostComment, as: 'comments', attributes: [] },
                { model: m.PostLike, as: 'likes', attributes: [] }
            ],
            // grouping is required when using count in the query
            group: ['id']
          }
        }
      }
    }

    // A post should only be created using this method only
    static generatePost = (req, postOptions, imageField=null, transaction=null) => {
      const { description, type=POST_TYPES.default, modelId=null } = postOptions;
      return Post.create(
          { description, type, modelId, userId: req.user.id },
          { transaction }
        ).then(async (post) => {
        imageField && await sequelize.models.Attachment.saveAttachment(
          POST.value, post.id, POST.fields.photo, req, imageField
        );
        return post;
      });
    }

    // A post should only be deleted using this method only
    static deletePostByModelId = (modelId, type) => {
      return Post.destroy({ where: { modelId, type } });
    }
  };

  Post.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(Object.values(POST_TYPES)),
      defaultValue: POST_TYPES.default,
      validate: { isIn: [Object.values(POST_TYPES)] }
    },
    modelId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
  }, {
    tableName: 'Post',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });
  return Post;
};
