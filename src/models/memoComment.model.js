import Model from '../utils/model.js';
import {USER} from '../constants/attachment.js';

export default (sequelize, DataTypes) => {
  class MemoComment extends Model {
    static associate(models) {
        this.belongsTo(models.Memo, {foreignKey: 'memoId', as: 'memo'});
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userId', 'memoId'] } },
        user: {include: [{ model: m.User.scope('short', 'avatar', 'company'), as: "user" }] }
      }
    }
  };

  MemoComment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    memoId: {
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
    tableName: 'MemoComment',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['memoId', 'userId', 'updatedAt']
      }
    }
  });
  return MemoComment;
};
