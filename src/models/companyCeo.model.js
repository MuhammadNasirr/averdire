import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class CompanyCeo extends Model {
    static associate(models) {
      this.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
      this.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      this.belongsTo(models.UserExperience, { foreignKey: "userExperienceId", as: "experience" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: [] } },
        user: { include: [
          { model: m.User.scope('short', 'avatar', 'email'), as: "user"}
        ]},
        experience: { include: [
          { model: m.UserExperience.scope('department'), as: "experience"}
        ]},
      }
    }
  };

  CompanyCeo.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userExperienceId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'CompanyCeo',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return CompanyCeo;
};
