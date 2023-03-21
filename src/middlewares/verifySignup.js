import db from '../models/index.js';

const { ROLES } = db;
const User = db.User;

const checkDuplicateUsernameOrEmail = (req, res, next) => {

  if(!req.body.email) {
    res.status(400).send({
      message: 'Email is not provided.'
    });
  }

  // Check Email
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then((user1) => {
    if (user1) {
      res.status(400).send({
        message: 'Email is already in use!'
      });
      return;
    }

    next();
  });
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role does not exist = ${req.body.roles[i]}`
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

export default verifySignUp;
