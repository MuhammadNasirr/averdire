import Sequelize from 'sequelize';
import db from "../../models/index.js";
import { AUTH_USER_TYPES } from "../../constants/index.js";

const User = db.User;
const Company = db.Company;
const UserExperience = db.UserExperience;
const sequelize = db.sequelize;

export const test = (req, res) => {
    // get current experience of user
    const { Op } = Sequelize;
    //[Op.or]: [{userOneId: uId}, {userTwoId: uId}]
    UserExperience.scope("company", "department", "user").findOne({
        where: {
            userId: req.user.id,
            // companyId: 46,
            // to: { [Op.not]: null }
            // '$to$': null,
        },
        // order:[['from', 'DESC']]
    })
    .then((exp) => {
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

            return User.scope("avatar").findAll({
              where: {
                  id: { [Op.not]: req.user.id },
                  ...condition
              },
              include: [
                  {
                      model: UserExperience,
                      as:"experience",
                      where: { '$experience.companyId$': exp.companyId },
                      required: true
                  }
              ]
            })
            .then((data) => {
                return res.status(200).send({ experience: exp, users: data });
            });
        } 
        return res.status(200).send({ experience: exp, users: null });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
};

export const globalSearch = (req, res) => {
    const { Op } = db.Sequelize;
 
    let userFilters = [];
    let companyFilters = [];
    if(req.query.searchQuery) { 
      userFilters.push({
        [Op.or]: [
          {
            nameQuery: sequelize.where(
              sequelize.fn("concat",sequelize.col("firstName")," ",sequelize.col("lastName")),
              { [Op.like]: `%${req.query.searchQuery}%` }
            ),
          }
        ]
      });

      companyFilters.push({
        [Op.or]: [
          {name : { [Op.like]: '%'+req.query.searchQuery+'%' }}
        ]
      });
    }

    Promise.all([
      User.scope('short', 'avatar').findAll({
        where: {
          [Op.and]: userFilters,
          role: AUTH_USER_TYPES.default,
          '$experience.to$': null
        },
        include: [
          { model: db.UserExperience.scope('short', 'company'), as: "experience" },
          { model: db.UserProfile, as: "profile", attributes:["city", "state", "country"] }
        ]
      }),

      Company.scope('short', 'logo').findAll({
        where: {
          [Op.and]: companyFilters
        },
        attributes: {
          include: ["city", "state", "country", "industry", "website"]
        }
      })

    ]).then((promiseResult) => {
      const users = promiseResult[0] || null;
      const companies = promiseResult[1] || null;
      return res.status(200).send({ users, companies });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
};
