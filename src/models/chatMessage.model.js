import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    
  };

  ChatMessage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'ChatMessage',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['roomId', 'updatedAt']
      }
    }
  });

  return ChatMessage;
};
