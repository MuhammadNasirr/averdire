import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class SignupVerifyRequest extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        user: {include: [ { model: m.User, as: "user" } ]},
      }
    }
  };
  SignupVerifyRequest.init({
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
    }
  }, {
    tableName: 'SignupVerifyRequest',
    sequelize,
    timestamps: false,
  });
  return SignupVerifyRequest;
};
