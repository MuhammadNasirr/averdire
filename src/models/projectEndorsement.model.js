import Sequelize from "sequelize";
import Model from '../utils/model.js';
import {ENDORSEMENT_VALUE, ENDORSER_RELATION} from "../constants/index.js";
const valuesArr = Object.values(ENDORSEMENT_VALUE);

export default (sequelize, DataTypes) => {
  class ProjectEndorsement extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'endorseeId', as: 'endorsee' });
      this.belongsTo(models.User, { foreignKey: 'endorserId', as: 'endorser' });
      this.belongsTo(models.UserProject, {foreignKey: 'userProjectId', as: 'project'});
    }

    static scopes() {
      const { Op } = Sequelize;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userProjectId'] } },
        endorser: {include: ['endorser']},
        projectStats: (projId) => { return {
          attributes: { include: [
              [Sequelize.literal('CAST(COALESCE(SUM(rating), 0) AS SIGNED)'), "rating"]
          ]},
          where: { userProjectId: projId }
        }},
        ratingStats: (uId) => { return {
          attributes: { include: [
			      [Sequelize.literal('SUM(case when performance = 1 then (performanceRate*rating)/100 else 0 end)'), "performanceRate"],
			      [Sequelize.literal('SUM(case when attention = 1 then (attentionRate*rating)/100 else 0 end)'), "attentionRate"],
			      [Sequelize.literal('SUM(case when behaviour = 1 then (behaviourRate*rating)/100 else 0 end)'), "behaviourRate"]
          ]},
          where: { endorseeId: uId },
          group: ['userProjectId']
        }}
      }
    }

    static getEndorserAuth = async (user, proj) => {
      let canEndorse = [];
      let relation = null;
      
      if(user.email === proj.referenceEmail) {
        // requesting user is project partner the project
        relation = ENDORSER_RELATION.project_partner;
        canEndorse = ["performance", "attention", "behaviour"];
      }
    
      return {canEndorse, relation};
    }
  };

  ProjectEndorsement.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    endorseeId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    endorserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    performance: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    attention: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    behaviour: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
	performanceRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	},
	attentionRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	},
	behaviourRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	}
  }, {
    tableName: 'ProjectEndorsement',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userProjectId', 'endorserId', 'endorseeId', 'createdAt']
      }
    }
  });

  return ProjectEndorsement;
};
