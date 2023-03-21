import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { secret } from "../../config/auth.config.js";
import db from "../../models/index.js";
import { AUTH_USER_TYPES, LOGIN_STATUS } from "../../constants/index.js";

const User = db.User;

export const signin = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(404).send({ message: "Email or password is required." });
  }
  User.unscoped().findOne({
    where: {
      email: req.body.email,
      role: AUTH_USER_TYPES.superAdmin
    }
  })
    .then(async (user) => {
      if (!user) {
        return res
          .status(404)
          .send({ message: "Email or password is not valid." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Email or password is not valid."
        });
      }

      const token = jwt.sign({ id: user.id }, secret, {
        expiresIn: 2592000, // 30 days
      });

      // update login status and time
      await user.update({loginStatus: LOGIN_STATUS.active, lastLogin: Date.now()});
      const newuser = await User.scope('basic', 'avatar', 'cover').findOne({
        where: { id: user.id },
      });
      if(newuser) {
        return res.status(200).send({
          ...newuser.dataValues,
          accessToken: token,
        });
      }

      return res.status(401).send({
        accessToken: null,
        message: "Email or password is not valid."
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
