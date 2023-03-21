import Sequelize from 'sequelize';
import Model from '../utils/model.js';
import { COMPANY } from "../constants/attachment.js";
import { COMPANY_TYPES, COMPANY_STATUS_VALUE } from '../constants/index.js';
import { roundNum } from '../utils/helpers.js';

export default (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      this.hasOne(models.User, { foreignKey: "companyId", as: "admin" });
      this.hasOne(models.Attachment, { foreignKey: "modelId", as: COMPANY.fields.logo });
      this.hasOne(models.Attachment, { foreignKey: "modelId", as: COMPANY.fields.cover });
      this.hasMany(models.CompanyDepartment, { foreignKey: "companyId", as: "departments" });
      this.hasMany(models.UserExperience, { foreignKey: "companyId", as: "experiences" });
      this.hasMany(models.UserEducation, { foreignKey: "instituteId", as: "educations" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['status'] } },
        short: { attributes: ['id', 'name'] },
        admin: {include: ['admin']},
        logo: {include: [ m.Attachment.getIncludeQueryObject(COMPANY.value, COMPANY.fields.logo) ]},
        cover: {include: [ m.Attachment.getIncludeQueryObject(COMPANY.value, COMPANY.fields.cover) ]},
        verifiedDepartments: {include: [
          { model: m.CompanyDepartment.scope("verified", "short"), as: "departments", required: false }
        ]},
        employeeStats: () => {
          let include = [[Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`experiences.userId`))), "employeeCount"]];
          return {
            attributes: { include },
            include: [{ model: m.UserExperience, as: 'experiences', attributes: [] }],
            // grouping is required when using count in the query
            group: ['experiences.companyId']
          }
        },
        studentStats: () => {
          let include = [[Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col(`educations.userId`))), "studentCount"]];
          return {
            attributes: { include },
            include: [{ model: m.UserEducation, as: 'educations', attributes: [] }],
            // grouping is required when using count in the query
            group: ['educations.instituteId']
          }
        }
      }
    }

    static companyRanking(cId) {
      const m = sequelize.models;

      return m.UserExperience.findAll({
          where: { companyId: cId, to: null },
          attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('userId')) ,'userId']]
      }).then(async (exps) => {
          let ranking = 0;
          if(exps && exps.length>0) {
              const promises = exps.map(async (exp) => {
                return {
                  userId: exp.userId,
                  rating: await m.User.getRating(exp.userId)
                }
              });

              return Promise.all(promises).then((promiseResult) => {
                if(promiseResult && promiseResult.length>0) {
                  promiseResult.map((userRating) => {
                    userRating = userRating ? userRating.rating : null;
                    const overallRating =  userRating ? userRating.overallRating : 0;
                    ranking = ranking + overallRating;
                  });
                }
                ranking = ranking/exps.length;
                return roundNum(ranking);
              });
          } else {
            return ranking;
          }
          
        }).catch(() => null);
    }

    static instituteRanking(cId) {
      const m = sequelize.models;

      return m.UserEducation.findAll({
          where: { instituteId: cId },
          attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('userId')) ,'userId']]
      }).then((edus) => {
          let ranking = 0;
          if(edus && edus.length>0) {
              const promises = edus.map(async (edu) => {
                return {
                  userId: edu.userId,
                  rating: await m.User.getRating(edu.userId)
                }
              });

              return Promise.all(promises).then((promiseResult) => {
                if(promiseResult && promiseResult.length>0) {
                  promiseResult.map((userRating) => {
                    userRating = userRating ? userRating.rating : null;
                    const overallRating =  userRating ? userRating.overallRating : 0;
                    ranking = ranking + overallRating;
                  });
                }
                ranking = ranking/edus.length;
                return roundNum(ranking);
              });
          }
          return ranking;
        }).catch(() => null);
    }
  };

  Company.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: COMPANY_STATUS_VALUE.active
    },
    emailVerified: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    city: {
      type: DataTypes.STRING
    },
    state: {
      type: DataTypes.STRING
    },
    country: {
      type: DataTypes.STRING
    },
    address: {
      type: DataTypes.STRING
    },
    phoneNumber: {
      type: DataTypes.STRING
    },
    industry: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM(Object.values(COMPANY_TYPES)),
      validate: {
        isIn: [Object.values(COMPANY_TYPES)]
      }
    },
    bio: {
      type: DataTypes.STRING
    },
    facebook: {
      type: DataTypes.STRING
    },
    instagram: {
      type: DataTypes.STRING
    },
    linkedin: {
      type: DataTypes.STRING
    },
    website: {
      type: DataTypes.STRING
    },
    suggestedBy: {
      type: DataTypes.INTEGER,
    },
    signupToken: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'Company',
    sequelize,
    defaultScope: {
      attributes: {
        exclude: ['updatedAt']
      }
    }
  });

  return Company;
};
