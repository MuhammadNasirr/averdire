import nodemailer from "nodemailer";
import Sequelize from 'sequelize';
import moment from 'moment';
import { SequalizeErrors } from '../constants/seqelize.js';

export const convertSequalizeErrors = (sequalizeErrors) => {
  let errArray = null;
  if (sequalizeErrors && sequalizeErrors instanceof Sequelize.ValidationError) {
    errArray = {};
    if(sequalizeErrors.errors && sequalizeErrors.errors.length > 0) {
      sequalizeErrors.errors.map((e, i) => {
        let message = e.message;
        if (e.validatorKey) {
          switch (e.validatorKey) {
            case SequalizeErrors.IS_NULL:
              message = '{FIELD} is required.';
              break;
            case SequalizeErrors.NOT_UNIQUE:
              message = '{FIELD} is not available or already used.';
              break;
            case SequalizeErrors.IS_DATE:
              message = '{FIELD} is not valid date.';
              break;
            case SequalizeErrors.IS_INT:
              message = '{FIELD} should be an integer.';
              break;
            case SequalizeErrors.IS_IN:
              message = '{FIELD} value is invalid.';
              break;
            case SequalizeErrors.NOT_EMPTY:
              message = '{FIELD} cannot be empty.';
              break;
            case SequalizeErrors.IS_EMAIL:
              message = '{FIELD} is not a valid email.';
              break;
          }
        }
        errArray[e.path] = message;
      });
    }
  }

  return errArray;
};

const convertSequalizeDatabaseErrors = (sequalizeError) => {
  let message = null;
  if(sequalizeError.message) {
    message = sequalizeError.message;
  }

  return message;
};

export const sendErrorResponse = (error, res=null) => {
  let errors = null;
  let message = null;
  let code = 500;
  if(error.eCode) code = error.eCode;
  else if(error.customErrors) errors = error.customErrors;
  else if (error && error instanceof Sequelize.ValidationError) errors = convertSequalizeErrors(error);
  else if (error && error instanceof Sequelize.DatabaseError) message = convertSequalizeDatabaseErrors(error);
  
  const response = errors ? { errors } : message ? { message } : { message: error.message }
  if(res) return res.status(code).send(response);
  return {code, ...response};
}

export const sendEmail = ({ to, subject, emailBody }) => {
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegexp.test(to)) {
    throw 'Email is not valid.';
  }

  let transport = nodemailer.createTransport({
    host: "intellicel.com",
    port: 465,
    auth: {
      user: 'averdire@intellicel.com',
      pass: '@verdire123'
    }
  });

  const message = {
    from: 'Averdire <averdire@intellicel.com>',
    to,
    subject,
    html: emailBody
  };

  return transport.sendMail(message);
}

export const randomToken = (length) => {
  return Math.random().toString(36).substring(length);
}

export const formatDate = (date) => {
  var now = new Date(date);
  return moment(now).format('YYYY-MM-DD');
}

export const roundNum = (num) => {
  return +(Math.round(num + "e+2")  + "e-2");
}