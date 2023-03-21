import Sequelize from "sequelize";
import Model from "../utils/model.js";
import { USER } from "../constants/attachment.js";
import { AUTH_USER_TYPES, USER_VERIFY_VALUE, USER_STATUS_VALUE, USER_GENDERS, LOGIN_STATUS } from "../constants/index.js";

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.belongsTo(models.Company, { foreignKey: "companyId", as: "companyProfile" });
      this.hasOne(models.UserProfile, { foreignKey: "userId", as: "profile" });
      this.hasOne(models.Attachment, { foreignKey: "modelId", as: USER.fields.avatar });
      this.hasOne(models.Attachment, { foreignKey: "modelId", as: USER.fields.coverPhoto });
      this.hasMany(models.UserProject, { foreignKey: "userId", as: "projects" });
      this.hasMany(models.UserEducation, { foreignKey: "userId", as: "education" });
      this.hasMany(models.UserExperience, { foreignKey: "userId", as: "experience" });
      this.hasMany(models.UserSkill, { foreignKey: "userId", as: "userSkill" });
      this.hasMany(models.UserInterest, { foreignKey: "userId", as: "userInterest" });
      this.hasMany(models.Follower, { foreignKey: "leadId", as: "followers" });
      this.hasMany(models.Follower, { foreignKey: "followerId", as: "following" });
      this.hasMany(models.ExperienceEndorsement, { foreignKey: "endorseeId", as: "expEndorsements" });
      this.hasOne(models.ExperienceEndorsement, { foreignKey: "endorserId", as: "expEndorsing" });
      this.hasMany(models.JobInvitation, { foreignKey: "userId", as: "jobInvitations" });
    }

    static scopes() {
      const m = sequelize.models;
      return {
        excludeOnUpdate: { attributes: { exclude: ['password', 'role', 'status'] } },
        short: { attributes: ['id', 'firstName', 'lastName'] },
        email: { attributes: { include:['email'] } },
        public: {include: [
            "projects", "userSkill",
            m.Attachment.getIncludeQueryObject(USER.value, USER.fields.avatar),
            m.Attachment.getIncludeQueryObject(USER.value, USER.fields.coverPhoto),
        ]},
        full: {include: [
            "profile", "projects", "userInterest", "userSkill",
            { model: m.Company.scope('logo', 'cover'), as: "companyProfile" },
            m.Attachment.getIncludeQueryObject(USER.value, USER.fields.avatar),
            m.Attachment.getIncludeQueryObject(USER.value, USER.fields.coverPhoto),
        ]},
        basic: {include: [
            "profile",
            { model: m.Company.scope('logo', 'cover'), as: "companyProfile" },
        ]},
        company: {include: [
          { model: m.Company.scope('short', 'logo'), as: "companyProfile" },
        ]},
        avatar: {include: [ m.Attachment.getIncludeQueryObject(USER.value, USER.fields.avatar) ]},
        cover: {include: [ m.Attachment.getIncludeQueryObject(USER.value, USER.fields.coverPhoto) ]},
        projects: {include: ['projects']},
        education: {include: ['education']},
        experience: {include: ['experience']},
        userSkill: {include: ['userSkill']},
        userInterest: {include: ['userInterest']},
        followCounts: {
          attributes: { include: [
              [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col("followers.followerId"))), "followersCount"],
              [Sequelize.fn("COUNT", Sequelize.fn('DISTINCT', Sequelize.col("following.leadId"))), "followingCount"]
          ]},
          include: [
            { model: m.Follower, as:"followers", attributes: [], required: true},
            { model: m.Follower, as:"following", attributes: [], required: true}
          ],
        },
        endorseCounts: (endorserId = null, endorseeId = null) => {
          let scope = {
            attributes: { include: [
                [Sequelize.literal('CAST(SUM(expEndorsements.performance=1) AS SIGNED)'), "performanceCount"],
                [Sequelize.literal('CAST(SUM(expEndorsements.leadership=1) AS SIGNED)'), "leadershipCount"],
                [Sequelize.literal('CAST(SUM(expEndorsements.behaviour=1) AS SIGNED)'), "behaviourCount"]
            ]},
            include: [
              { model: m.ExperienceEndorsement, as:"expEndorsements", attributes: [], required: true, raw: true}
            ]
          };
          endorserId && endorseeId && scope.include.push({ model: m.ExperienceEndorsement, as:"expEndorsing", on: {endorserId: endorserId, endorseeId: endorseeId}});
          return scope;
        }
      }
    }

    static getRating(uId) {
      const m = sequelize.models;

      return Promise.all([
        m.ExperienceEndorsement.scope({method:["ratingStats", uId]}).findAll({}),
        m.ProjectEndorsement.scope({method:["ratingStats", uId]}).findAll({}),
        m.CeoEndorsement.scope({method:["ratingStats", uId]}).findAll({}),
      ]).then((promiseResult) => {
        const expEnds = promiseResult[0] || null;
        const projEnds = promiseResult[1] || null;
        const ceoEnds = promiseResult[2] || null;
        
        let expRating = 0;
        if(expEnds && expEnds.length>0) {
          expEnds.forEach((end, i) => {
            if(end.rating) {
              expEnds[i].rating = Math.round(((end.rating/3) + Number.EPSILON) * 100) / 100;
              expRating = expRating + expEnds[i].rating;
            }
          });
          expRating = expRating/expEnds.length;
        }

        let projRating = 0;
        if(projEnds && projEnds.length>0) {
          projEnds.forEach((end, i) => {
            const rateTotal = parseFloat(end.performanceRate) + parseFloat(end.attentionRate) + parseFloat(end.behaviourRate);
              projEnds[i].rating = Math.round(((rateTotal/3) + Number.EPSILON) * 100) / 100;
              projRating = projRating + projEnds[i].rating;
          });
          projRating = projRating/projEnds.length;
        }

        let ceoRating = 0;
        if(ceoEnds && ceoEnds.length>0) {
          ceoEnds.forEach((end, i) => {
            const rateTotal = parseFloat(end.leadershipRate) + parseFloat(end.visionRate) + parseFloat(end.efficiencyRate);
            ceoEnds[i].rating = Math.round(((rateTotal/3) + Number.EPSILON) * 100) / 100;
            ceoRating = ceoRating + ceoEnds[i].rating;
          });
          ceoRating = ceoRating/ceoEnds.length;
        }

        return {
          overallRating: expRating+projRating+ceoRating, 
          experienceRating: expRating, 
          projectRating: projRating, 
          ceoRating
        };
      }).catch(() => null);
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: USER_STATUS_VALUE.active
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      role: {
        type: DataTypes.ENUM(Object.values(AUTH_USER_TYPES)),
        defaultValue: AUTH_USER_TYPES.default,
        validate: {
          isIn: [Object.values(AUTH_USER_TYPES)]
        }
      },
      gender: {
        type: DataTypes.ENUM(Object.values(USER_GENDERS)),
        validate: {
          isIn: [Object.values(USER_GENDERS)]
        }
      },
      companyId: {
        type: DataTypes.INTEGER,
      },
      isVerified: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: USER_VERIFY_VALUE.pending
      },
      verifiedAt: {
        type: DataTypes.DATE
      },
      loginStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: LOGIN_STATUS.inactive
      },
      lastLogin: {
        type: DataTypes.DATE
      },
    },
    {
      tableName: "User",
      sequelize,
      defaultScope: {
        attributes: {
          exclude: ['password', 'verifiedAt', 'createdAt', 'updatedAt']
        }
      }
    }
  );
  return User;
};
