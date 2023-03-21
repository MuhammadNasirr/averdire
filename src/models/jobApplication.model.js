import Model from '../utils/model.js';

export default (sequelize, DataTypes) => {
  class JobApplication extends Model {
    static associate(models) {
        this.belongsTo(models.Job, {foreignKey: 'jobId', as: 'job'});
        this.belongsTo(models.User, {foreignKey: 'applicantId', as: 'applicant'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        applicant: {include: [{ model: m.User.scope("short", "avatar"), as: 'applicant' }]},
        job: {include: [{ model: m.Job, as: 'job', attributes: ['jobTitle', 'jobLocation'] }]},
        jobWithCompany: {include: [{
          model: m.Job.scope("company"), as: 'job', attributes: ['jobTitle', 'jobLocation']
        }]},
      }
    }
  };
  
  JobApplication.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    applicantId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expectedSalary: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true
        }
    }
  }, {
    tableName: 'JobApplication',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });
  return JobApplication;
};
