import { sendErrorResponse } from '../../utils/helpers.js';
import db from '../../models/index.js';

const Job = db.Job;

export const listAll = (req, res) => {
  Job.respond(res).paginate(req).scope("company").findAndCountAll();
}

export const view = (req, res) => {
    Job.scope("company").findOne({
      where: { id: req.params.modelId }
    })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Job Not found.' });
      }
      res.status(200).send({ data });
    })
    .catch((err) => sendErrorResponse(err, res));
}

export const deleteJob = (req, res) => {
  Job.destroy({
    where: { id: req.params.modelId }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'Job not found.' });
    }
    res.status(200).send({ message: 'Job removed successfully.' });
  })
  .catch((err) => sendErrorResponse(err, res));
}