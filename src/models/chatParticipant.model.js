import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class ChatParticipant extends Model {
    static associate(models) {
      this.belongsTo(models.ChatRoom, { foreignKey: "roomId", as: "room" });
      this.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        user: {include: [
          { model: m.User.scope("short", "avatar"), as: "user", required: true }
        ]},
      }
    }
  };

  ChatParticipant.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    tableName: 'ChatParticipant',
    sequelize,
    timestamps: false,
    defaultScope: {
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    }
  });

  return ChatParticipant;
};
