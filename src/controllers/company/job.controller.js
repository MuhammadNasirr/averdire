import { convertSequalizeErrors } from '../../utils/helpers.js';
import db from '../../models/index.js';

const Job = db.Job;
const JobInvitation = db.JobInvitation;
const JobApplication = db.JobApplication;

export const list = (req, res) => {
    if (req.user && req.user.id) {
      Job.findAll({
        where: { companyId: req.user.companyId }
      })
        .then((data) => {
          return res.status(200).send({ data });
        })
        .catch((err) => {
          return res.status(500).send({ message: err.message });
        });
    } else {
      return res.status(404).send('Jobs not found.');
    }
};
  
export const update = (req, res) => {
    Job.findOne({
      where: {
          id: req.params.modelId,
          companyId: req.user.companyId
        }
    })
      .then((job) => {
        if (!job) {
          return res.status(404).send({ message: 'Job Not found.' });
        }
        job.update({
          ...req.body
        })
          .then(async (data) => {
            res.status(200).send({ message: 'Job updated successfully!', data: data });
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

export const create = (req, res) => {
    // Save Job to Database
    Job.create({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id
    })
    .then(async (data) => {
      res.status(200).send({ message: 'Job created successfully!', data: data });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};
  
export const view = (req, res) => {
    Job.findOne({
      where: {
          id: req.params.modelId,
          companyId: req.user.companyId
        }
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
  
export const dlt = (req, res) => {
    Job.destroy({
      where: {
        id: req.params.modelId,
        companyId: req.user.companyId
      }
    })
      .then((data) => {
        if (!data) {
          return res.status(404).send({ message: 'Job not found or you are not authorized to delete it.' });
        }
        res.status(200).send({ message: 'Job deleted successfully' });
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
};

export const applications = (req, res) => {
    Job.scope("company").findOne({
      where: {
          id: req.params.modelId,
          companyId: req.user.companyId
      }
    })
    .then(async (job) => {
        if (!job) {
            return res.status(404).send({ message: 'Job Not found.' });
        }
        JobApplication.scope("applicant").findAll({
            where: { jobId: job.id }
        })
        .then((data) => {
            return res.status(200).send({ data: {job, applications:data} });
        })
        .catch((err) => {
            return res.status(500).send({ message: err.message });
        });
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
};

export const viewApplication = (req, res) => {
    JobApplication.scope("jobWithCompany").findOne({
        where: {
            id: req.params.modelId,
            '$job.companyId$': req.user.companyId
        }
    })
    .then((data) => {
        if (!data) {
            return res.status(404).send({ message: 'Job Application Not found.' });
        }
        res.status(200).send({ data });
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
};

export const jobInvitationsList = (req, res) => {
    JobInvitation.scope("user").findAll({
        where: { jobId: req.params.modelId },
        include: [{
            model: Job,
            as: 'job',
            where: { companyId: req.user.companyId },
            attributes: []
        }]
    })
    .then((data) => {
        return res.status(200).send({ data });
    })
    .catch((err) => {
        return res.status(500).send({ message: err.message });
    });
};

export const sendInvite = (req, res) => {
    Job.findOne({
        where: {
            id: req.params.modelId,
            companyId: req.user.companyId
        }
    })
    .then((job) => {
        if (!job) {
            return res.status(404).send({ message: 'Job Not found.' });
        }
        JobInvitation.findOrCreate({
            where: {
                jobId: job.id,
                userId: req.body.userId
            },
            defaults: {
                ...req.body
            }
        })
        .then((data) => {
            if(data[1]) {
                return data[0].reload().then((newD) => {
                    res.status(200).send({ message: 'Invitation sent successfully!', data: newD });
                });
            }
            return res.status(200).send({ message: "Already invited!", data: data[0] });
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
