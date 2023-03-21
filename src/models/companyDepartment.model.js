import Model from '../utils/model.js';
import { COMPANY_DEP_VERIFY_VALUE } from '../constants/index.js';

export default (sequelize, DataTypes) => {
  class CompanyDepartment extends Model {
    static associate(models) {
      this.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
    }

    static scopes() {
      return {
        short: {attributes: ['id', 'name']},
        verified: {where: { isVerified: COMPANY_DEP_VERIFY_VALUE.verified }}
      }
    }
  };

  CompanyDepartment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: COMPANY_DEP_VERIFY_VALUE.not_verified
    },
    suggestedBy: {
      type: DataTypes.INTEGER,
    }
  }, {
    tableName: 'CompanyDepartment',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return CompanyDepartment;
};
