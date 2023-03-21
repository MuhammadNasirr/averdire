import Model from '../utils/model.js';
import { JOB_TYPES, JOB_GENDERS, JOB_MIN_QUALIFICATION, JOB_CAREER_LEVEL } from '../constants/job.js';

export default (sequelize, DataTypes) => {
  class Job extends Model {
    static associate(models) {
        this.belongsTo(models.Company, {foreignKey: 'companyId', as: 'company'});
        this.belongsTo(models.User, {foreignKey: 'createdBy', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        short: {attributes: ["id", "jobTitle", "jobLocation"]},
        company: {include: [{
          model: m.Company.scope("logo"), as: 'company', attributes: ["name", "email"], required: true
        }]},
      }
    }
  };
  
  Job.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    jobLocation: {
        type: DataTypes.STRING,
        allowNull: false
    },
    jobType: {
        type: DataTypes.ENUM(Object.values(JOB_TYPES)),
        allowNull: false,
        validate: {
          isIn: [Object.values(JOB_TYPES)]
        }
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    totalPositions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true
        }
    },
    salary: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: true
        }
    },
    gender: {
      type: DataTypes.ENUM(Object.values(JOB_GENDERS)),
        defaultValue: JOB_GENDERS.none,
        validate: {
          isIn: [Object.values(JOB_GENDERS)]
        }
    },
    minQualification: {
      type: DataTypes.ENUM(Object.values(JOB_MIN_QUALIFICATION)),
        validate: {
          isIn: [Object.values(JOB_MIN_QUALIFICATION)]
        }
    },
    careerLevel: {
      type: DataTypes.ENUM(Object.values(JOB_CAREER_LEVEL)),
        validate: {
          isIn: [Object.values(JOB_CAREER_LEVEL)]
        }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Job',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['createdBy', 'updatedAt']
      }
    }
  });
  return Job;
};
