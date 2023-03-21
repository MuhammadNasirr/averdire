import Sequelize from 'sequelize';
import Model from '../utils/model.js';
import { CHAT_ROOM_TYPE } from '../constants/index.js';

export default (sequelize, DataTypes) => {
  class ChatRoom extends Model {
    static associate(models) {
      this.hasMany(models.ChatParticipant, { foreignKey: "roomId", as: "participants" });
      this.hasOne(models.ChatParticipant, { foreignKey: "roomId", as: "participant" });
      this.hasOne(models.ChatParticipant, { foreignKey: "roomId", as: "isParticipant" });
      this.hasOne(models.ChatMessage, { foreignKey: "roomId", as: "lastMessage" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        isParticipant: (uId) => { return {include: [
            { model: m.ChatParticipant, as: "isParticipant", attributes: [], where: { userId: uId } }
          ]}
        },
        participant: (uId) => { return {include: [
            { model: m.ChatParticipant, as: "participant", attributes: [], where: { userId: uId } }
          ]}
        },
        participants: (uId, limit=null) => { return {include: [
            { 
              model: m.ChatParticipant.scope("user"), 
              as: "participants", attributes: ["id"], 
              where: { userId: {[Sequelize.Op.not]: uId} },
              limit: limit
            }
          ]}
        },
        lastMessage: () => { return {
          include: [{ model: m.ChatMessage, as: "lastMessage", required: true }],
        }
      },
      }
    }
  };

  ChatRoom.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM(Object.values(CHAT_ROOM_TYPE)),
      defaultValue: CHAT_ROOM_TYPE.individual,
      validate: {
        isIn: [Object.values(CHAT_ROOM_TYPE)]
      }
    }
  }, {
    tableName: 'ChatRoom',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    }
  });

  return ChatRoom;
};
