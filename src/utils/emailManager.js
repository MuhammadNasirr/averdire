import fs from 'fs';
import nodemailer from "nodemailer";
import handlebars from 'handlebars';
import mailConfig from '../config/mail.config.js';
import URLS from '../constants/urls.js';

const readHTMLFile = (path, callback) => {
    fs.readFile(path, {encoding: 'utf-8'}, (err, html) => {
        if (err) {
           callback(err); 
           throw err;
        }
        else {
            callback(null, html);
        }
    });
};

export const sendEmail = ({ to, subject, template, templateParams }) => {
    const emailRegexp =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
    if (!emailRegexp.test(to)) {
      throw 'Email is not valid.';
    }
  
    let transport = nodemailer.createTransport(mailConfig.default);
    let params = {};
    if(template.defaultParams) params = template.defaultParams;
    params = { ...params, ...templateParams };

    return readHTMLFile(template.path, (err, html) => {
        if(err) {
            console.log("FAILED TO READ FILE");
            return false;
        } else {
            handlebars.registerHelper("link", function(path) {
                var url = handlebars.escapeExpression(url);
                return new handlebars.SafeString(URLS.SERVER_URL+path);
            });

            var template = handlebars.compile(html);
            var htmlToSend = template(templateParams);

            const mailOptions = {
                from: 'Averdire <averdire@intellicel.com>',
                to,
                subject,
                html: htmlToSend
            };

            return transport.sendMail(mailOptions, (error, response) => {
                if (error) {
                    console.log(error);
                    callback(error);
                }
            });
        }
    });
  }