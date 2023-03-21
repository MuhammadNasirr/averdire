import Sequelize from "sequelize";
import Model from '../utils/model.js';
import {AUTH_USER_TYPES, ENDORSEMENT_VALUE, ENDORSER_RELATION, EXP_VERIFY_VALUE} from "../constants/index.js";
const valuesArr = Object.values(ENDORSEMENT_VALUE);

export default (sequelize, DataTypes) => {
  class CeoEndorsement extends Model {
    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'endorseeId', as: 'endorsee' });
        this.belongsTo(models.User, { foreignKey: 'endorserId', as: 'endorser' });
        this.belongsTo(models.UserExperience, {foreignKey: 'userExperienceId', as: 'experience'});
    }

    static scopes() {
      const { Op } = Sequelize;
      return {
        excludeOnUpdate: { attributes: { exclude: ['userExperienceId'] } },
        endorser: {include: ['endorser']},
        experienceStats: (expId) => { return {
          attributes: { include: [
              [Sequelize.literal('CAST(COALESCE(SUM(rating), 0) AS SIGNED)'), "rating"]
          ]},
          where: { userExperienceId: expId }
        }},
        ratingStats: (uId) => { return {
          attributes: { include: [
			      [Sequelize.literal('SUM(case when leadership = 1 then (leadershipRate*rating)/100 else 0 end)'), "leadershipRate"],
			      [Sequelize.literal('SUM(case when vision = 1 then (visionRate*rating)/100 else 0 end)'), "visionRate"],
			      [Sequelize.literal('SUM(case when efficiency = 1 then (efficiencyRate*rating)/100 else 0 end)'), "efficiencyRate"]
          ]},
          where: { endorseeId: uId },
          group: ['userExperienceId']
        }}
      }
    }

    static getEndorserAuth = async (user, exp) => {
        const { Op } = Sequelize;
        const m = sequelize.models;
        const UserExperience = m.UserExperience;

        let canEndorse = [];
        let relation = null;
    
        let condition = {};
        if (exp.to) {
            // ceo is no more working at company
            condition = {
              [Op.or]: [{
                [Op.and]: [
                  { 'from':  { [Op.gte]: exp.from } },
                  { 'from':  { [Op.lt]: exp.to } }
                ]
              }, {
                [Op.and]: [
                  { 'to':  { [Op.gt]: exp.from } },
                  { 'to':  { [Op.lte]: exp.to } }
                ],
              }, {
                [Op.and]: [
                  { 'from':  { [Op.lte]: exp.from } },
                  { 'to':  { [Op.gte]: exp.to } }
                ],
              }, {
                [Op.and]: [
                  { 'from':  { [Op.lte]: exp.from } },
                  { 'to':  null }
                ]
              }]
            };
        } else {
            // ceo is currently working
            condition = {
              [Op.or]: [
                { 'from': { [Op.gte]: exp.from } },
                { 'to': { [Op.gte]: exp.from } },
                {
                    [Op.and]: [
                        { 'from':  { [Op.lte]: exp.from } },
                        { 'to':  null }
                    ]
                }
              ]
            };
        }

        const uExp = await UserExperience.findOne({
            where: { 
                companyId: exp.companyId,
                userId: user.id,
                isVerified: EXP_VERIFY_VALUE.verified,
                ...condition
            }
        });

        // if user has an experience in the same company as ceo during ceo's tenure
        if(uExp && user.role === AUTH_USER_TYPES.default) {
            // requesting user is subordinate of ceo        
            relation = ENDORSER_RELATION.ceo_subordinate;
            canEndorse = ["leadership", "vision", "efficiency"];
        }
        return {canEndorse, relation};
    }
  };

  CeoEndorsement.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userExperienceId: {
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
    leadership: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    vision: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    efficiency: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
	leadershipRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	},
	visionRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	},
	efficiencyRate: {
	  type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
	}
  }, {
    tableName: 'CeoEndorsement',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userExperienceId', 'endorserId', 'endorseeId', 'createdAt']
      }
    }
  });

  return CeoEndorsement;
};
