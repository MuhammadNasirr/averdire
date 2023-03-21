import Sequelize from "sequelize";
import Model from '../utils/model.js';
import {sendErrorResponse} from '../utils/helpers.js';
import {ENDORSEMENT_VALUE, AUTH_USER_TYPES, ENDORSER_RELATION, EXP_VERIFY_VALUE, USER_VERIFY_VALUE} from "../constants/index.js";
const valuesArr = Object.values(ENDORSEMENT_VALUE);

export default (sequelize, DataTypes) => {
  class ExperienceEndorsement extends Model {
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
        userStats: (uId) => { return {
          attributes: { include: [
              [Sequelize.literal('CAST(SUM(performance=1) AS SIGNED)'), "performanceCount"],
              [Sequelize.literal('CAST(SUM(leadership=1) AS SIGNED)'), "leadershipCount"],
              [Sequelize.literal('CAST(SUM(behaviour=1) AS SIGNED)'), "behaviourCount"]
          ]},
          where: {
            [Op.or]: [{endorseeId: uId}, {endorserId: uId}]
          }
        }},
        experienceStats: (expId) => { return {
          attributes: { include: [
              [Sequelize.literal('CAST(COALESCE(SUM(rating), 0) AS SIGNED)'), "rating"]
          ]},
          where: { userExperienceId: expId }
        }},
        ratingStats: (uId) => { return {
          attributes: { include: [
              [Sequelize.literal('CAST(COALESCE(SUM(rating), 0) AS SIGNED)'), "rating"]
          ]},
          where: { endorseeId: uId },
          group: ['userExperienceId']
        }}
      }
    }

    static getEndorserAuth = async (user, exp) => {
      const m = sequelize.models;
      const UserExperience = m.UserExperience;
      let canEndorse = [];
      let allowedEndorsement = [];
      let relation = null;
      let alreadyEndorsed = false;
      let previousEndorsement = null;
      let endorserExp = null;
    
      const previousEndorsementCond = { userExperienceId: exp.id, endorseeId: exp.user.id };
      const endorserExpCond = { from: exp.from, to: exp.to, companyId: exp.companyId, userId: user.id };
      
      if(user.role === AUTH_USER_TYPES.companyAdmin && user.companyId === exp.companyId) {
        // requesting user is company admin of same company as of the experience
        previousEndorsementCond.behaviour = ENDORSEMENT_VALUE.endorsed;
        relation = ENDORSER_RELATION.hr;
        allowedEndorsement = ["behaviour"];

      } else if (exp.managerEmail == user.email) {
        previousEndorsementCond.performance = ENDORSEMENT_VALUE.endorsed;
        endorserExp = await UserExperience.findOverlappingExp(endorserExpCond);
        if (endorserExp) {
          // requesting user is manager of the experience user
          relation = ENDORSER_RELATION.manager;
          allowedEndorsement = ["performance"];
        }
      } else {
        // requesting user is colleague or subordinate
        previousEndorsementCond.leadership = ENDORSEMENT_VALUE.endorsed;
        endorserExp = await UserExperience.findOverlappingExp({...endorserExpCond, managerEmail: exp.managerEmail});
        
        if (endorserExp) {
          // requesting user is colleague of the experience user
          relation = ENDORSER_RELATION.colleague;
          allowedEndorsement = ["leadership"];
        } else {
          endorserExp = await UserExperience.findOverlappingExp({...endorserExpCond, managerEmail: exp.user.email});

          if (endorserExp) {
            // requesting user is subordinate of the experience user
            relation = ENDORSER_RELATION.subordinate;
            allowedEndorsement = ["leadership"];
          }
        }
      }

      previousEndorsement = await this.unscoped().findOne({ where: previousEndorsementCond });
      
      if(previousEndorsement && previousEndorsement.endorserId === user.id) {
        canEndorse = allowedEndorsement;
        alreadyEndorsed = true;
      } else if(!previousEndorsement && allowedEndorsement.length>0) {
        canEndorse = allowedEndorsement;
      }
    
      return {canEndorse, relation, user, alreadyEndorsed, previousEndorsement, endorserExp};
    }

    // similar to getEndorserAuth except that this function is at instance level
    getEndorserRelation = async (user, exp) => {
      const m = sequelize.models;
      const UserExperience = m.UserExperience;
      let canEndorse = [];
      let relation = null;
      let endorserExp = null;
      const endorserExpCond = { from: exp.from, to: exp.to, companyId: exp.companyId, userId: user.id };

      if(this.behaviour === ENDORSEMENT_VALUE.endorsed) {
        relation = ENDORSER_RELATION.hr;
      } else if(this.performance === ENDORSEMENT_VALUE.endorsed) {
        relation = ENDORSER_RELATION.manager;
        endorserExp = await UserExperience.findOverlappingExp(endorserExpCond);
      } else if(this.leadership === ENDORSEMENT_VALUE.endorsed) {
        endorserExp = await UserExperience.findOverlappingExp({...endorserExpCond, managerEmail: exp.managerEmail});
        if (endorserExp) { 
          relation = ENDORSER_RELATION.colleague;
        } else {
          endorserExp = await UserExperience.findOverlappingExp({...endorserExpCond, managerEmail: exp.user.email});
          if (endorserExp) { relation = ENDORSER_RELATION.subordinate; }
        }
      }
    
      return {canEndorse, relation, endorserExp, user};
    }

    assignPoints = async (res, exp, endorser) => {
      let rating = 0;
      if(!endorser || !endorser.user) {
        // points cannot be updated because enorser user is invalid
        return null;
      }

      if(endorser.user.role === AUTH_USER_TYPES.companyAdmin) {
        rating = 1;
        // if company is verified by email
        if(endorser.user.isVerified === USER_VERIFY_VALUE.verified) {
          rating = 10;
        }
      } else if (endorser.user.role === AUTH_USER_TYPES.default) {
        // endorser has an overlapping exp
        if(endorser && endorser.endorserExp) {
          rating = 1;
          // if company is verified by email
          if(endorser.endorserExp.isVerified === EXP_VERIFY_VALUE.verified) {
            rating = 5;
          }
          if(endorser.endorserExp.isMgrVerified === EXP_VERIFY_VALUE.verified) {
            rating = 5;
            if(endorser.endorserExp.isVerified === EXP_VERIFY_VALUE.verified) {
              rating = 10;
            }
          }
        }
      }
      rating = await this.checkSeries(res, exp, rating, endorser);
      return this.update({ rating }).then((end) => {
        return end;
      });
    }

    checkSeries = (res, exp, rating, endorser) => {
      const { Op } = Sequelize;
      const m = sequelize.models;
      const UserExperience = m.UserExperience;
      const Connection = m.Connection;
    
      if(this.behaviour === ENDORSEMENT_VALUE.endorsed) {
        // for behaviour
        return UserExperience.count({
          where: { 
            to: {[Op.is]: null},
            companyId: exp.companyId,
            isVerified: EXP_VERIFY_VALUE.verified
          }
        }).then(async (expCount) => {
          const companySize = expCount;
          let quotient = 1;
          if(companySize >= 50) {
            quotient = Math.floor(companySize/50);
            quotient = quotient+1;
          }
          return rating * quotient;
        }).catch((err) => sendErrorResponse(err, res));
    
      } else if(this.performance === ENDORSEMENT_VALUE.endorsed) {
        // for performance
        return UserExperience.count({
          where: {
            managerEmail: exp.managerEmail,
            isVerified: EXP_VERIFY_VALUE.verified
          }
        }).then(async (expCount) => {
          const subordinates = expCount;
          let quotient = 1;
          if(subordinates >= 10) {
            let divisor = 10;
            let remainder = subordinates/divisor;
            while (remainder>1) {
              quotient = quotient+1;
              divisor = divisor*2;
              remainder = subordinates/divisor;
            }
          }
          return rating * quotient;
        }).catch((err) => sendErrorResponse(err, res));
    
      } else if(this.leadership === ENDORSEMENT_VALUE.endorsed) {
        // for leadership
    
        let checkManagerEmail = exp.user.email;
        // if endorser is colleague or subordinate
        if(endorser.relation === ENDORSER_RELATION.colleague) {
          checkManagerEmail = exp.managerEmail;
        }
        
        // get connections sql for connections of endorser
        const conectionUsersSql = Connection.userConnectionsRawSql(endorser.user.id);

        // get experience of connections of endorser
        return UserExperience.count({
          where: {
            managerEmail: checkManagerEmail,
            isVerified: EXP_VERIFY_VALUE.verified,
            userId: { [Op.in]: sequelize.literal(`(${conectionUsersSql})`) }
          }
        }).then(async (expCount) => {
          const connections = expCount;
          let quotient = 1;
          if(connections >= 10) {
            let divisor = 10;
            let remainder = connections/divisor;
            while (remainder>1) {
              quotient = quotient+1;
              divisor = divisor*2;
              remainder = connections/divisor;
            }
          }
          return rating * quotient;
        }).catch((err) => sendErrorResponse(err, res));
      }
    }
  };

  ExperienceEndorsement.init({
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
    performance: {
      type: DataTypes.ENUM(valuesArr),
      defaultValue: ENDORSEMENT_VALUE.default,
      validate: { isIn: [valuesArr] }
    },
    leadership: {
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
    }
  }, {
    tableName: 'ExperienceEndorsement',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['userExperienceId', 'endorserId', 'endorseeId', 'createdAt']
      }
    }
  });

  return ExperienceEndorsement;
};
