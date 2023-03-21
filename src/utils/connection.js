import Sequelize from 'sequelize';
import db from "../models/index.js";
import { sendEmail } from "../utils/helpers.js";
import { EXPERIENCE_TYPE, EXP_VERIFY_VALUE, EDU_VERIFY_VALUE } from "../constants/index.js";
import URLS from "../constants/urls.js";

const UserExperience = db.UserExperience;
const UserEducation = db.UserEducation;
const User = db.User;
const ConnectionRequest = db.ConnectionRequest;
const Connection = db.Connection;
const Endorsement = db.ExperienceEndorsement;

export const sendConnRequests = async (t, exp) => {
    const { Op } = Sequelize;
    if(exp) {
      let condition = {};
  
      // get users of overlapping experience with given experience in specified company
      if (exp.to) {
        // user has left the company
        condition = {
          [Op.or]: [{
            [Op.and]: [
              { '$experience.from$':  { [Op.gte]: exp.from } },
              { '$experience.from$':  { [Op.lt]: exp.to } }
            ]
          }, {
            [Op.and]: [
              { '$experience.to$':  { [Op.gt]: exp.from } },
              { '$experience.to$':  { [Op.lte]: exp.to } }
            ],
          }, {
            [Op.and]: [
              { '$experience.from$':  { [Op.lte]: exp.from } },
              { '$experience.to$':  { [Op.gte]: exp.to } }
            ],
          }, {
            [Op.and]: [
              { '$experience.from$':  { [Op.lte]: exp.from } },
              { '$experience.to$':  null }
            ]
          }]
        };
      } else {
        // user is currently working
        condition = {
          [Op.or]: [
            { '$experience.to$': { [Op.gt]: exp.from } },
            { '$experience.to$': null }
          ]
        };
      }
  
      const users = await User.findAll({
        where: {
            id: { [Op.not]: exp.user.id },
            ...condition
        },
        include: [
            {
                model: UserExperience,
                as:"experience",
                where: {
                  '$experience.companyId$': exp.companyId,
                  '$experience.isVerified$': EXP_VERIFY_VALUE.verified
                },
                required: true
            }
        ]
      });
  
      if(users) {
        let connEmails = [];
        var results = await Promise.all(users.map(async (user) => {
          const cxnRequest = await ConnectionRequest.findOrCreate({
            where: {
              [Op.or]: [
                { senderId: exp.user.id, receiverId: user.id },
                { receiverId: exp.user.id, senderId: user.id },
              ]
            },
            defaults: {
              senderId: exp.user.id,
              receiverId: user.id
            },
            transaction: t
          }).catch((err) => { 
            // console.log('error===>>>', err);
          });
  
          if(Array.isArray(cxnRequest) && cxnRequest[1]) {
            connEmails.push(user.email);
          }
        }));
  
        var results1 = await Promise.all(connEmails.map(async (email) => {
          await sendEmail({
            to: email,
            subject: "Connection Request",
            emailBody: `You have been added as a connection.\nPlease click on <a target='_blank' 
                        href='${URLS.CONNECTION_REQUESTS_URL}'> THIS LINK </a> to 
                        respond to this connection request.`,
          }).catch((err) => { throw {
            message: `Email couldn't be sent to user, either email id is not valid or server didn't respond. Please check email and try again.`
          }});
        }));
      }
    }
};

export const addExpConnections = async (t, exp) => {
    const { Op } = Sequelize;
    if(exp) {
      let condition = {};
  
      // get users of overlapping experience with given experience in specified company
      if (exp.to) {
        // user has left the company
        condition = {
          [Op.or]: [{
            [Op.and]: [
              { '$experience.from$':  { [Op.gte]: exp.from } },
              { '$experience.from$':  { [Op.lt]: exp.to } }
            ]
          }, {
            [Op.and]: [
              { '$experience.to$':  { [Op.gt]: exp.from } },
              { '$experience.to$':  { [Op.lte]: exp.to } }
            ],
          }, {
            [Op.and]: [
              { '$experience.from$':  { [Op.lte]: exp.from } },
              { '$experience.to$':  { [Op.gte]: exp.to } }
            ],
          }, {
            [Op.and]: [
              { '$experience.from$':  { [Op.lte]: exp.from } },
              { '$experience.to$':  null }
            ]
          }]
        };
      } else {
        // user is currently working
        condition = {
          [Op.or]: [
            { '$experience.from$': { [Op.gte]: exp.from } },
            { '$experience.to$': { [Op.gte]: exp.from } },
            { [Op.and]: [{ '$experience.from$':  { [Op.lte]: exp.from } }, { '$experience.to$':  null }] }
          ]
        };
      }
  
      const users = await User.findAll({
        where: {
            id: { [Op.not]: exp.userId },
            ...condition
        },
        include: [
            {
                model: UserExperience,
                as:"experience",
                where: {
                  '$experience.companyId$': exp.companyId,
                  '$experience.isVerified$': EXP_VERIFY_VALUE.verified
                },
                required: true
            }
        ]
      });
  
      if(users) {
        var results = await Promise.all(users.map(async (user) => {
  
          const cxn = await Connection.findOrCreate({
            where: {
              [Op.or]: [
                { userOneId: exp.userId, userTwoId: user.id },
                { userTwoId: exp.userId, userOneId: user.id },
              ]
            },
            defaults: {
              userOneId: exp.userId,
              userTwoId: user.id
            },
            transaction: t
          }).catch((err) => {
            // console.log('error===>>>', err);
          });

          if(cxn[1]) { 
            // new connection added
          }
        }));
      }
    }
};

export const updateExpEndorsementPoints = (res, companyId) => {
    return UserExperience.scope("fullUser", "company").findAll({
      where: {
        companyId,
        isVerified: EXP_VERIFY_VALUE.verified,
        expType: EXPERIENCE_TYPE.employee
      }
    })
    .then(async (exps) => {
      if(exps && exps.length>0) {
        const promises = exps.map(async (exp) => {
          return {
            expId: exp.id,
            rating: await updateEmployeeEndorsementPoints(res, exp)
          }
        });

        return Promise.all(promises).then((promiseResult) => {
          return promiseResult;
        });
      }
      return false;
    });
}

export const updateEmployeeEndorsementPoints = (res, exp) => {
  return Endorsement.scope('endorser').findAll({
    where: { userExperienceId: exp.id }
  }).then(async ends => {
    if(ends && ends.length>0) {
      const relationPromises = ends.map(async (end) => {
        return { end, endorserAuth: await end.getEndorserRelation(end.endorser, exp) }
      });

      return await Promise.all(relationPromises).then(async (relationResult) => {

        const endPromises = relationResult.map(async (end) => {
          return { updatedEnd: await end.end.assignPoints(res, exp, end.endorserAuth) }
        });

        return await Promise.all(endPromises).then((endResult) => {
          return endResult;
        });
      });
    }
    return false;
  });
}

// creates connections of given education's user with other users of same batch
export const addEduConnections = async (edu) => {
  const { Op } = Sequelize;
  if(edu) {
    const condition = UserEducation.getOverlappingEduCondition(edu.from, 'education');
    
    // get users of overlapping education with given education in specified institue
    const users = await User.findAll({
      where: { id: { [Op.not]: edu.userId } },
      include: [
          {
              model: UserEducation,
              as:"education",
              where: {
                '$education.instituteId$': edu.instituteId,
                '$education.isVerified$': EDU_VERIFY_VALUE.verified
              },
              required: true
          }
      ],
      ...condition
    });

    // return { edu, condition, users };

    if(users) {
      return Promise.all(users.map(async (user) => {

        return await Connection.findOrCreate({
          where: {
            [Op.or]: [
              { userOneId: edu.userId, userTwoId: user.id },
              { userTwoId: edu.userId, userOneId: user.id },
            ]
          },
          defaults: { userOneId: edu.userId, userTwoId: user.id }
        });
      }));
    }
  }
};