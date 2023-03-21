import { sendErrorResponse } from '../../utils/helpers.js';
import db from "../../models/index.js";

const UserSkill = db.UserSkill;
const UserInterest = db.UserInterest;

export const listSkills = (req, res) => {
  UserSkill.respond(res).paginate(req).findAndCountAll();
}

export const listInterests = (req, res) => {
  UserInterest.respond(res).paginate(req).findAndCountAll();
}

export const deleteSkill = (req, res) => {
  UserSkill.destroy({
    where: { id: req.params.modelId }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'Skill not found.' });
    }
    res.status(200).send({ message: 'Skill removed successfully.' });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const deleteInterest = (req, res) => {
  UserInterest.destroy({
    where: { id: req.params.modelId }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'User Interest not found.' });
    }
    res.status(200).send({ message: 'User Interest removed successfully.' });
  })
  .catch((err) => sendErrorResponse(err, res));
};