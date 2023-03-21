import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class UserInterest extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
    }
  };

  UserInterest.init({
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
      type: DataTypes.STRING
    }
  }, {
    tableName: 'UserInterest',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });

  return UserInterest;
};
