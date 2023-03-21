import Model from '../utils/model.js';

import { CONNECTION_REQ_STATUS } from '../constants/connection.js'

export default (sequelize, DataTypes) => {
  class ConnectionRequest extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' })
      this.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver' })
    }
  };

  const { pending, accepted, declined } = CONNECTION_REQ_STATUS;

  ConnectionRequest.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    senderId: {
      type: DataTypes.INTEGER,
    },
    receiverId: {
      type: DataTypes.INTEGER
    },
    receiverEmail: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM(pending, accepted, declined)
    },
  }, {
    tableName: 'ConnectionRequest',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return ConnectionRequest;
};
