import db from "../../models/index.js";
import { AUTH_USER_TYPES, USER_STATUS_VALUE } from "../../constants/index.js";
import { sendErrorResponse } from '../../utils/helpers.js';

const User = db.User;
const ReportedUser = db.ReportedUser;

export const listAll = (req, res) => {
  User.respond(res).paginate(req).scope("avatar").findAndCountAll({
    where: { role: { [db.Sequelize.Op.not]: AUTH_USER_TYPES.superAdmin } }
  });
}

export const view = (req, res) => {
  User.scope("full").findOne({
    where: {
      id: req.params.modelId,
      role: { [db.Sequelize.Op.not]: AUTH_USER_TYPES.superAdmin }
    },
    include: [
      { model: db.UserExperience.scope('company'), as: "experience" },
      { model: db.UserEducation.scope('institute'), as: "education" },
    ]
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }
      return res.status(200).send({ ...user.dataValues });
    })
    .catch((err) => sendErrorResponse(err, res));
}

export const listAllAbuseReports = (req, res) => {
  ReportedUser.respond(res).paginate(req).scope("user", "reporter").findAndCountAll();
}

const changeUserStatus = (req, res, status, successMessage) => {
  return User.update(
    { status },
    {where: {
      id: req.params.modelId,
      role: { [db.Sequelize.Op.not]: AUTH_USER_TYPES.superAdmin }
    }, hooks: false }
  )
  .then((user) => {
    if (!user[0]) {
      return res.status(404).send({ message: "User Not found." });
    }
    return res.status(200).send({ message: successMessage});
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const activate = (req, res) => {
  changeUserStatus(req, res, USER_STATUS_VALUE.active, "User activated successfully.");
}

export const deactivate = (req, res) => {
  changeUserStatus(req, res, USER_STATUS_VALUE.inactive, "User deactivated successfully.");
}