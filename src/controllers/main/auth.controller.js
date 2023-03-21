import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../../models/index.js";
import { secret } from "../../config/auth.config.js";
import { sendErrorResponse, sendEmail, randomToken } from "../../utils/helpers.js";
import { AUTH_USER_TYPES, USER_VERIFY_VALUE, USER_STATUS_VALUE, EMAIL_VERIFY_VALUE, LOGIN_STATUS, COMPANY_TYPES } from "../../constants/index.js";
import { SEND_AUTO_FORMATTED_EMAIL, EMAIL_TYPES } from '../../constants/email.js';
import { updateExpEndorsementPoints } from "../../utils/connection.js";

const User = db.User;
const UserProfile = db.UserProfile;
const PasswordResetRequest = db.PasswordResetRequest;
const SignupVerifyRequest = db.SignupVerifyRequest;
const Company = db.Company;

export const signup = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const user = await User.create(
      {
        ...req.body,
        username: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
      },
      { transaction: t }
    );
    
    await UserProfile.create(
      {
        ...req.body.profile,
        userId: user.id,
      },
      { transaction: t }
    );

    let token = randomToken(7);
    const passRR = await SignupVerifyRequest.create({
      userId: user.id,
      token,
    }, { transaction: t });
    
    await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.professionalSignup](user, passRR);
    await t.commit();
    res.status(200).send({ message: "User was registered successfully!" });
  } catch (err) {
    await t.rollback();
    sendErrorResponse(err, res);
  }
};

export const signin = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(404).send({ message: "Email or password is not valid." });
  }
  User.unscoped().findOne({
    where: {
      email: req.body.email,
      role: AUTH_USER_TYPES.default,
      status: USER_STATUS_VALUE.active
    }
  })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send({ message: "Email or password is not valid." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(404).send({ message: "Email or password is not valid." });
      }

      const token = jwt.sign({ id: user.id }, secret, {
        expiresIn: 2592000, // 30 days
      });

      // update login status and time
      await user.update({loginStatus: LOGIN_STATUS.active, lastLogin: Date.now()});
      const newuser = await User.scope('basic', 'avatar', 'cover').findOne({
        where: { id: user.id },
      });
      res.status(200).send({
        ...newuser.dataValues,
        accessToken: token,
      });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const signout = async (req, res) => {
  if(req.user) {
    await req.user.update({loginStatus: LOGIN_STATUS.inactive});
    return res.status(200).send({ message: "Logged out successfully" });
  }
  return res.status(500).send({ message: "Failed to logout" });
};

export const forgot = (req, res) => {
  if (!req.body.email) {
    return res.status(404).send({ message: "Email is required." });
  }
  const email = req.body.email;
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegexp.test(email)) {
    return res.status(500).send({ message: "Email is not valid." });
  }

  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      let token = randomToken(7);
      PasswordResetRequest.create({
        userId: user.id,
        token,
      })
        .then((passRR) => {
          sendEmail({
            to: email,
            subject: "Reset Password Request",
            emailBody: `Hello User! </br> We have recieved your request to reset 
            password. </br> Please click on <a target='_blank' 
            href='${process.env.APP_URL}auth/resetPassword/${passRR.token}'> THIS LINK </a> to 
            reset your password.`,
          })
            .then(() => {
              res.status(200).send({
                message:
                  "An email with reset code has been sent to entered email.",
              });
            })
            .catch(() => {
              res.status(500).send({ message: "Failed to send password reset email." });
            });
        })
        .catch((err) => {
          res
            .status(500)
            .send({ error: "Failed to complete password reset request." });
        });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const checkReset = (req, res) => {
  if (!req.params.token) {
    return res.status(404).send({ message: "A reset token is required." });
  }

  PasswordResetRequest.findOne({
    where: {
      token: req.params.token,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "This is not a valid token." });
      }

      res.status(200).send({ message: "Its a valid token." });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const reset = (req, res) => {
  if (!req.body.token) {
    return res.status(404).send({ message: "A reset token is required." });
  }

  if (
    !req.body.password ||
    !req.body.confirmPassword ||
    req.body.password !== req.body.confirmPassword
  ) {
    return res.status(404).send({
      message:
        "Password and confirm password is required and they should match.",
    });
  }

  PasswordResetRequest.findOne({
    where: {
      token: req.body.token,
    },
  })
    .then((userToken) => {
      if (!userToken) {
        return res.status(404).send({ message: "This is not a valid token." });
      }

      User.unscoped().findOne({
        where: { id: userToken.userId },
      }).then(async (user) => {
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }

        user.update({
            password: bcrypt.hashSync(req.body.password, 8),
          }, { hooks: false })
          .then(async (updatedUser) => {
            if (!updatedUser) {
              return res
                .status(404)
                .send({ message: "Failed to reset Password." });
            }
            await userToken.destroy();
            return res
              .status(200)
              .send({ message: "Password updated successfully." });
          });
      });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const signupCompany = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    let company = await Company.findOrBuild({
      where: { email: req.body.companyProfile.email },
      defaults: { ...req.body.companyProfile },
      transaction: t
    });

    if(!company[1]) {
      company = company[0];
      if(req.body.companyProfile && req.body.companyProfile.signupToken) {
        if(req.body.companyProfile.signupToken === company.signupToken) {
          company.signupToken = null;
        } else {
          throw { message: `Company with this email already exists. If this company email belongs to you then you should signup using the link sent to you in email.`};
        }
      } else {
        throw { message: `Company with this email already exists. If this company email belongs to you then you should signup using the link sent to you in email.`};
      }
    } else {
      company = company[0];
    }
    
    await company.save({transaction: t});

    const user = await User.create(
      {
        ...req.body,
        username: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        role: AUTH_USER_TYPES.companyAdmin,
        companyId: company.id,
      },
      { transaction: t }
    );

    await UserProfile.create(
      {
        ...req.body.profile,
        userId: user.id,
      },
      { transaction: t }
    );

    let token = randomToken(7);
    const passRR = await SignupVerifyRequest.create({
      userId: user.id,
      token,
    }, { transaction: t });
    
    if(company.type === COMPANY_TYPES.institute) {
      await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.instituteSignup](company, user, passRR);
    } else {
      await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.companySignup](company, user, passRR);
    }
    await t.commit();
    res.status(200).send({ message: "Company was registered successfully!" });
  } catch (err) {
    await t.rollback();
    sendErrorResponse(err, res);
  }
};

export const signinCompany = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(404).send({ message: "Email or password is not valid." });
  }
  User.unscoped().findOne({
    where: {
      email: req.body.email,
      role: AUTH_USER_TYPES.companyAdmin,
      status: USER_STATUS_VALUE.active
    }
  })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send({ message: "Email or password is not valid." });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({ message: "Email or password is not valid." });
      }

      const token = jwt.sign({ id: user.id }, secret, {
        expiresIn: 2592000, // 30 days
      });

      // update login status and time
      await user.update({loginStatus: LOGIN_STATUS.active, lastLogin: Date.now()});
      const userData = await User.scope('basic', 'avatar', 'cover').findOne({
        where: { id: user.id }
      });

      res.status(200).send({
        ...userData.dataValues,
        accessToken: token,
      });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const verifyAccount = (req, res) => {
  if (!req.params.token) {
    return res.status(404).send({ message: "A verification token is required." });
  }

  SignupVerifyRequest.scope("user").findOne({
    where: { token: req.params.token }
  }).then(async (svr) => {
      if(svr && svr.user) {

        const t = await db.sequelize.transaction();
        try {
          // get user role before updating
          const userRole = svr.user.role;
          const updatedUser = await svr.user.update({
            isVerified: USER_VERIFY_VALUE.verified,
            verifiedAt: Date.now()
          }, { transaction: t });

          if(userRole === AUTH_USER_TYPES.companyAdmin && updatedUser.companyId) {
            const company = await Company.findByPk(updatedUser.companyId);
            if(company) {
              const updatedCompany = await company.update(
                { emailVerified: EMAIL_VERIFY_VALUE.verified },
                { transaction: t }
              );
              if(updatedCompany) {
                // update endorsement points if any
                await updateExpEndorsementPoints(res, updatedUser.companyId);
              }
            }
          }
          await svr.destroy({ transaction: t });
          await t.commit();
          return res.status(200).send({ message: "Account verified successfully." });

        } catch (err) {
          await t.rollback();
          return sendErrorResponse(err, res);
        }
      }

      return res.status(404).send({ message: "This is not a valid token." });
    })
    .catch((err) => sendErrorResponse(err, res));
};