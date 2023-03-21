import Model from '../utils/model.js';
import { EDU_VERIFY_VALUE } from "../constants/index.js";

export default (sequelize, DataTypes) => {
  class UserEducation extends Model {
    static associate(models) {
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
        this.hasMany(models.UserEducationGallery, {foreignKey: 'userEducationId', as: 'gallery'});
        this.belongsTo(models.Company, {foreignKey: 'instituteId', as: 'institute'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['instituteId', 'userId', 'isVerified', 'verifiedAt'] } },
        isVerified: { where: { isVerified: EDU_VERIFY_VALUE.verified } },
        short: { attributes: ['id', 'degree'] },
        institute: {include: [
          { model: m.Company.scope("logo"), as: "institute", attributes: [ "name", "email" ], required: true }
        ]},
        gallery: {include: [
          { model: m.UserEducationGallery.scope("photo"), as: "gallery" },
        ]},
        user: {include: [
          { model: m.User.scope("short", "avatar"), as: "user" }
        ]},
      }
    }

    // get condition for overlapping educations based on year
    static getOverlappingEduCondition(from, relation = null) {
      let fromCol = 'from';
      if(relation) fromCol = ''+relation+'.from';

      var batchYear = new Date(from);
      const condition = {
        attributes: {include:[[sequelize.literal('DATE_FORMAT('+fromCol+', "%Y")'), 'batch']]},
        having: {'$batch$': ""+batchYear.getFullYear()+""}
      }

      return condition;
    }

    static findOverlappingEdu(options) {
      const {from} = options;
      
      // from value is required in options
      if(!from) return null;

      delete options.from;
      const condition = this.getOverlappingEduCondition(from);

      return this.findOne({ where: { ...options }, ...condition });
    }
  };

  UserEducation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    instituteId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    degree: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referenceEmail: {
      type: DataTypes.STRING,
      allowNull: false
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
    isVerified: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: EDU_VERIFY_VALUE.pending
    },
    verifiedAt: {
      type: DataTypes.DATE
    },
  }, {
    tableName: 'UserEducation',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['verifiedAt', 'updatedAt']
      }
    }
  });
  return UserEducation;
};
