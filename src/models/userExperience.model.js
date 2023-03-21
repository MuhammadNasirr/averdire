import Sequelize from "sequelize";
import Model from '../utils/model.js';
import { EXP_VERIFY_VALUE } from "../constants/index.js";
import { EXPERIENCE_TYPE } from "../constants/index.js";

export default (sequelize, DataTypes) => {
  class UserExperience extends Model {
    static associate(models) {
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
        this.hasMany(models.UserExperienceGallery, {foreignKey: 'userExperienceId', as: 'gallery'});
        this.belongsTo(models.Company, {foreignKey: 'companyId', as: 'company'});
        this.belongsTo(models.CompanyDepartment, {foreignKey: 'departmentId', as: 'department'});
        this.hasOne(models.ExperienceEndorsement, {foreignKey: 'userExperienceId', as: 'endorsement'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: [
          'companyId', 'userId', 'isVerified', 'verifiedAt', 'isMgrVerified', 'mgrVerifiedAt'
        ] } },
        isVerified: { where: { isVerified: EXP_VERIFY_VALUE.verified } },
        short: { attributes: ['id', 'jobTitle', 'designation'] },
        company: {include: [
          { model: m.Company.scope("logo"), as: "company", attributes: [ "name", "email" ], required: true }
        ]},
        companyWithDepartments: {include: [
          { model: m.Company.scope("logo", "verifiedDepartments"), as: "company", attributes: [ "name", "email" ] }
        ]},
        department: {include: [
          { model: m.CompanyDepartment, as: "department", attributes: [ "name" ] }
        ]},
        gallery: {include: [
          { model: m.UserExperienceGallery.scope("photo"), as: "gallery" },
        ]},
        endorsement: {include: [
          { model: m.ExperienceEndorsement, as: "endorsement" },
        ]},
        user: {include: [
          { model: m.User.scope("short", "avatar"), as: "user" }
        ]},
        fullUser: {include: [
          { model: m.User, as: "user" }
        ]},
        sortDesc: {
          order: [['id', 'DESC']]
        }
      }
    }

    static findOverlappingExp(options) {
      const { Op } = Sequelize;
      const {from, to} = options;
      delete options.from;
      delete options.to;
      
      // from value is required in options
      if(!from) return null;

      let condition = {};
      if (to) {
          // ceo is no more working at company
          condition = {
            [Op.or]: [{
              [Op.and]: [{ 'from':  { [Op.gte]: from } }, { 'from':  { [Op.lt]: to } }]
            }, {
              [Op.and]: [{ 'to':  { [Op.gt]: from } }, { 'to':  { [Op.lte]: to } }]
            }, {
              [Op.and]: [{ 'from':  { [Op.lte]: from } }, { 'to':  { [Op.gte]: to } }]
            }, {
              [Op.and]: [{ 'from':  { [Op.lte]: from } }, { 'to':  null }]
            }]
          };
      } else {
          // ceo is currently working
          condition = {
            [Op.or]: [
              { 'from': { [Op.gte]: from } },
              { 'to': { [Op.gte]: from } },
              { [Op.and]: [{ 'from':  { [Op.lte]: from } }, { 'to':  null }] }
            ]
          };
      }

      return this.findOne({ where: { ...options, ...condition } });
    }
  };
  
  UserExperience.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jobTitle: {
    	type: DataTypes.STRING,
    	allowNull: false
    },
    designation: {
    	type: DataTypes.STRING,
    	allowNull: false
    },
    departmentId: {
    	type: DataTypes.INTEGER,
    	allowNull: false
    },
    managerEmail: {
    	type: DataTypes.STRING,
    	allowNull: true,
      validate: {
        is_null(value) {
          if(this.expType !== EXPERIENCE_TYPE.ceo && !value) {
            throw new Error('Null value is not allowed.');
          }
        },
        isEmail: true
      }
    },
    from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: { isDate: true }
    },
    to: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: true,
        isGreaterThanFromDate(value) {
          if (new Date(this.from) >= new Date(value)) {
            throw new Error("To date must be greater than from date.");
          }
        }
      }
    },
    description: {
      type: DataTypes.STRING
    },
    expType: {
      type: DataTypes.ENUM(Object.values(EXPERIENCE_TYPE)),
      allowNull: false,
      defaultValue: EXPERIENCE_TYPE.employee,
      validate: {
        isIn: [Object.values(EXPERIENCE_TYPE)]
      }
    },
    isVerified: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: EXP_VERIFY_VALUE.pending
    },
    verifiedAt: {
      type: DataTypes.DATE
    },
    isMgrVerified: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: EXP_VERIFY_VALUE.pending
    },
    mgrVerifiedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'UserExperience',
    sequelize,
    defaultScope: {
      attributes: { exclude: ['updatedAt', 'mgrVerifiedAt', 'verifiedAt'] }
    }
  });
  return UserExperience;
};
