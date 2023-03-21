import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class ReportedUser extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      this.belongsTo(models.User, { foreignKey: 'reportedBy', as: 'reporter' });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        user: { include: [{ 
          model: m.User.scope("avatar"), attributes:['id', 'firstName', 'lastName', 'status'], as: "user" 
        }]},
        reporter: { include: [{ 
          model: m.User.scope("avatar"), attributes:['id', 'firstName', 'lastName', 'status'], as: "reporter"
        }]}
      }
    }
  };

  ReportedUser.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reportedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'ReportedUser',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return ReportedUser;
};
