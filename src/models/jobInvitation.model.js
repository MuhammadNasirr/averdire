import Model from '../utils/model.js';
import { JOB_INVITATION_STATUS } from "../constants/index.js";

export default (sequelize, DataTypes) => {
  class JobInvitation extends Model {
    static associate(models) {
        this.belongsTo(models.Job, {foreignKey: 'jobId', as: 'job'});
        this.belongsTo(models.User, {foreignKey: 'userId', as: 'user'});
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['jobId', 'userId', 'status'] } },
        user: { include: [{ model: m.User.scope('short', 'avatar'), as: "user" }] },
        job: { include: [{ model: m.Job.scope('company', 'short'), as: "job" }] }
      }
    }
  };
  
  JobInvitation.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    jobId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM(Object.values(JOB_INVITATION_STATUS)),
      defaultValue: JOB_INVITATION_STATUS.pending,
      validate: {
        isIn: [Object.values(JOB_INVITATION_STATUS)]
      }
    }
  }, {
    tableName: 'JobInvitation',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userId', 'updatedAt']
      }
    }
  });
  return JobInvitation;
};
