import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { AUTH_USER_TYPES } from "../../constants/index.js";
import { COMPANY } from "../../constants/attachment.js";

const Job = db.Job;
const User = db.User;
const Company = db.Company;
const Attachment = db.Attachment;
const sequelize = db.sequelize;

export const list = (req, res) => {
  Job.scope('company').findAll({
    order:[['createdAt', 'DESC']]
  }).then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const view = (req, res) => {
  Job.scope('company').findByPk(req.params.modelId)
  .then((data) => {
    if(data) return res.status(200).send({ data });
    return res.status(404).send({ message: "Data not found." });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const globalJobSearch = (req, res) => {
  const { Op } = Sequelize;
  const { query, location, jobTypes, minSalary, maxSalary, careerLevel, gender } = req.body;
  let orQueryArr = [];
  let andQueryArr = [];

  // jobTypes filter
  // jobTypes should be an array of selected job types
  if(jobTypes && Array.isArray(jobTypes) && jobTypes.length>0) {
    andQueryArr.push({jobType: {[Op.in]: jobTypes}});
  }
  // job salary range filter
  if(minSalary) {
    andQueryArr.push({salary: {[Op.gte]: minSalary}});
  }
  if(maxSalary) {
    andQueryArr.push({salary: {[Op.lte]: maxSalary}});
  }
  // job gender filter
  if(gender) {
    andQueryArr.push({gender: gender});
  }
  // job careerLevel filter
  if(careerLevel) {
    andQueryArr.push({careerLevel: careerLevel});
  }
  // job location filter
  if(location) {
    andQueryArr.push({jobLocation: { [Op.like]: '%'+location+'%' }});
  }
  // job title or company name filter
  if(query) {
    orQueryArr.push({jobTitle: { [Op.like]: '%'+query+'%' }});
    orQueryArr.push({'$company.name$' : { [Op.like]: '%'+query+'%' }});
  } else {
    orQueryArr.push({jobTitle: { [Op.like]: '%' }});
  }
  
  Job.findAll({
    where: {
      [Op.or]: orQueryArr,
      [Op.and]: andQueryArr,
    },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["name"],
        include: [Attachment.getIncludeQueryObject(COMPANY.value, COMPANY.fields.logo)],
        required: true,
      },
    ],
    order:[['createdAt', 'DESC']]
  })
    .then((data) => {
      return res.status(200).send({ data });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
};
