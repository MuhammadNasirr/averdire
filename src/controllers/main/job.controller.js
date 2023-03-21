import Sequelize from "sequelize";
import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";
import { COMPANY } from "../../constants/attachment.js";
import { AUTH_USER_TYPES, JOB_INVITATION_STATUS } from "../../constants/index.js";

const Attachment = db.Attachment;
const Job = db.Job;
const JobApplication = db.JobApplication;
const JobInvitation = db.JobInvitation;
const Company = db.Company;

export const detail = (req, res) => {
  Job.findOne({
    where: { id: req.params.modelId },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["name"],
        include: [Attachment.getIncludeQueryObject(COMPANY.value, COMPANY.fields.logo)],
        required: true,
      },
    ]
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Job Not found.' });
      }
      res.status(200).send({ data });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const search = (req, res) => {
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
  
  if (req.user && req.user.id) {
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
      order:[['id', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send({ message: 'Jobs not found.' });
  }
};

export const apply = (req, res) => {
  if (req.user.role !== AUTH_USER_TYPES.default) {
    return res.status(400).send({ message: 'You are not allowed to apply for the job.' });
  }
  Job.findOne({
    where: { id: req.params.modelId }
  })
    .then(async (job) => {
      if (!job) {
        return res.status(404).send({ message: 'Job Not found.' });
      }
      const app = await JobApplication.findOne({
        where: { jobId: job.id, applicantId: req.user.id}
      });
      if (app) {
        return res.status(200).send({ message: 'You have already applied for this job.' });
      }

      JobApplication.create({
        ...req.body,
        jobId: job.id,
        applicantId: req.user.id
      })
      .then(async (data) => {

        // check if an invitation exists then except it
        await JobInvitation.findOne({
          where: {
            userId: req.user.id,
            jobId: job.id,
            status: JOB_INVITATION_STATUS.pending
          }
        })
        .then(async (data) => {
          if (data) {
            return await data.update({ status: JOB_INVITATION_STATUS.accepted }, { hooks: false });
          }
        })
        
        res.status(200).send({ message: 'Job Application submitted successfully!', data: data });
      })
      .catch((err) => {
        let errArray = convertSequalizeErrors(err);
        return res.status(500).send({ errors: errArray });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const myApplications = (req, res) => {
  JobApplication.scope("jobWithCompany").findAll({
    where: { applicantId: req.user.id },
    order:[['id', 'DESC']]
  })
  .then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
};

export const invitationList = (req, res) => {
  JobInvitation.scope("job").findAll({
    where: {
      userId: req.user.id,
      status: JOB_INVITATION_STATUS.pending
    },
    order:[['id', 'DESC']]
  })
  .then((data) => {
      return res.status(200).send({ data });
  })
  .catch((err) => {
      return res.status(500).send({ message: err.message });
  });
};

export const declineInvitation = (req, res) => {
  JobInvitation.findOne({
    where: {
      userId: req.user.id,
      id: req.params.modelId,
      status: JOB_INVITATION_STATUS.pending
    }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: "Invitation not found." });
    }
    data.update({
      status: JOB_INVITATION_STATUS.declined
    }, { hooks: false }).then((declined) => {
      return res.status(200).send({ message: "Job invitation declined successfully" , data: declined});
    });
  })
  .catch((err) => {
      return res.status(500).send({ message: err.message });
  });
};
