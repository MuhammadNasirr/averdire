import db from "../../models/index.js";
import { AUTH_USER_TYPES } from "../../constants/index.js";
import { sendEmail } from "../../utils/emailManager.js";
import { sendEmail as sendSimpleEmail } from '../../utils/helpers.js';
import { emailTemplates } from "../../constants/emailTemplates.js";
import { SEND_AUTO_FORMATTED_EMAIL, EMAIL_TYPES } from "../../constants/email.js";
import URLS from "../../constants/urls.js";

const User = db.User;
const Company = db.Company;
const sequelize = db.sequelize;

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

export const emailTest = async (req, res) => {

  await sendEmail({
    ...req.body,
    template: emailTemplates.signup,
    templateParams: {
      username: req.body.email,
      verifyLink: URLS.VERIFY_ACCOUNT_EMAIL('123')
    }
  });

  return res.send({ message: "Email Sent.", params: req.body });
};

export const simpleEmailTest = async (req, res) => {

  await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.professionalSignup]({name: "AWAAIS"}, {token: 'sadhkasjd'});

  return res.send({ message: "Email Sent.", params: req.body });
};