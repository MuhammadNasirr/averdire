import Sequelize from "sequelize";
import Model from '../utils/model.js';
import {FOLLOW_TYPES} from '../constants/index.js';

export default (sequelize, DataTypes) => {
  class Follower extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'leadId', as: 'lead' });
      this.belongsTo(models.User, { foreignKey: 'followerId', as: 'follower' });
    }

    static scopes() {
      const { Op } = Sequelize;
      return {
        userStats: (uId, fId) => { return {
          attributes: { include: [
              [Sequelize.literal('COUNT(if(leadId = '+uId+', followerId, null))'), "followersCount"],
              [Sequelize.literal('COUNT(if(followerId = '+uId+', leadId, null))'), "followingCount"],
              [Sequelize.literal('COUNT(if(followerId = '+fId+' && leadId = '+uId+', 1, null))'), "isFollower"]
          ]},
          where: {
            [Op.or]: [{leadId: uId}, {followerId: uId}]
          }
        }}
      }
    }
  };

  Follower.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
    },
    followerId: {
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.ENUM(Object.values(FOLLOW_TYPES)),
      allowNull: false,
      validate: {
        isIn: [Object.values(FOLLOW_TYPES)]
      }
    },
  }, {
    tableName: 'Follower',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['type', 'updatedAt']
      }
    }
  });

  return Follower;
};
