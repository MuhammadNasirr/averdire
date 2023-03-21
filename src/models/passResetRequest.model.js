import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class PasswordResetRequest extends Model {
    static associate(models) {
      // define association here
    }
  };
  PasswordResetRequest.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Date.now()
    }
  }, {
    tableName: 'PassResetRequest',
    sequelize,
    timestamps: false,
  });
  return PasswordResetRequest;
};
