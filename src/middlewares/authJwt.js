import jwt from 'jsonwebtoken';
import { secret } from '../config/auth.config.js';
import db from '../models/index.js';
import { AUTH_USER_TYPES, USER_STATUS_VALUE } from '../constants/index.js';

const User = db.User;

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({
      message: 'Access token not provided!'
    });
  }

  return jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: 'Unauthorized!'
      });
    }

    User.scope('basic', 'avatar', 'cover').findOne({where: {
      id: decoded.id,
      status: USER_STATUS_VALUE.active
    }}).then(function(user){
        req.user = user;
        return next();
    }).catch(err=>{
      return res.status(401).send({
        message: 'Unauthorized!'
      });
    });
  });
};

const isDefaultUser = (req, res, next) => {
  if(req.user && req.user.role && req.user.role === AUTH_USER_TYPES.default) {
    next();
    return;
  }
  res.status(403).send({ message: 'Not Authorized.' });
};

const isCompanyAdmin = (req, res, next) => {
  if(req.user && req.user.role && req.user.role === AUTH_USER_TYPES.companyAdmin) {
    next();
    return;
  }
  res.status(403).send({ message: 'Not Authorized.' });
};

const isSuperAdmin = (req, res, next) => {
  if(req.user && req.user.role && req.user.role === AUTH_USER_TYPES.superAdmin) {
    next();
    return;
  }
  res.status(403).send({ message: 'Not Authorized.' });
};

const authJwt = {
  verifyToken,
  isDefaultUser,
  isCompanyAdmin,
  isSuperAdmin
};
export default authJwt;
