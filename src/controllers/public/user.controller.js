import db from "../../models/index.js";
import { AUTH_USER_TYPES } from "../../constants/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const User = db.User;

export const publicProfile = (req, res) => {
  User.scope("public").findOne({
    where: {
      id: req.params.modelId,
      role: AUTH_USER_TYPES.default
    },
    include: [
      { model: db.UserExperience.scope('company'), as: "experience" },
      { model: db.UserEducation.scope('institute'), as: "education" },
    ],
    order: [['experience', 'from','DESC'],['education', 'from','DESC']]
  })
  .then((user) => {
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    return res.status(200).send({ ...user.dataValues });
  })
  .catch((err) => sendErrorResponse(err, res));
}
