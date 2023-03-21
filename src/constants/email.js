import moment from 'moment';
import URLS from './urls.js';
import { sendEmail } from "../utils/helpers.js";

export const EMAIL_TYPES = {
  professionalSignup: 'professionalSignup',
  instituteSignup: 'instituteSignup',
  companySignup: 'companySignup',
  projectVerification: 'projectVerification',
  expCompanyVerification: 'expCompanyVerification',
  expManagerVerification: 'expManagerVerification',
  eduInstituteVerfication: 'eduInstituteVerfication'
}

export const SEND_AUTO_FORMATTED_EMAIL = {

  [EMAIL_TYPES.professionalSignup]: (user, verifyRequest) => {
    const { firstName, lastName, email } = user;
    const { token } = verifyRequest;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Account Signup Verification";

    let emailBody = `Hi ${firstName} ${lastName}`;
    emailBody += `<br />Thank you for signing up on ${averdireURL}`;
    emailBody += `<br /><br />We're confident that Averdire services will help you socialize and connect with new people for your professional growth and development.`;
    emailBody += `<br /><br />Averdire is a platform where you can highlight your profile, expertise, connections that creates a professional impression over the employers and recruiters.`;
    emailBody += `<br /><br />We help you in providing the interactive guidelines related to your professional interest, so you grow your professional career without any limits.`;
    emailBody += `<br /><br />Please click the “Confirm Email Address” button to get your account verified on Averdire.`;
    emailBody += `<br /><a target='_blank' href='${URLS.VERIFY_ACCOUNT_EMAIL(token)}'> Confirm Email Address </a>`;
    emailBody += `<br /><br />If you have any question, please feel free to ask, we would love to help you.`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: email, subject, emailBody });
  },

  [EMAIL_TYPES.instituteSignup]: (institute, verifyRequest) => {
    const { name } = institute;
    const { email } = user;
    const { token } = verifyRequest;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Institute Signup Verification";

    let emailBody = `Hi ${name}`;
    emailBody += `<br />Thank you for signing up on ${averdireURL}`;
    emailBody += `<br /><br />We're confident that Averdire services will help you socialize and connect with new people for your professional growth and development.`;
    emailBody += `<br /><br />Averdire is a platform where you can highlight your profile, expertise, connections that creates a professional impression over the employers and recruiters.`;
    emailBody += `<br /><br />We help you providing the interactive guidelines related to your professional interest, so you grow your professional career without any limits.`;
    emailBody += `<br /><br />Please click the “Confirm Email Address” button to get your account verified on Averdire.`;
    emailBody += `<br /><a target='_blank' href='${URLS.VERIFY_ACCOUNT_EMAIL(token)}'> Confirm Email Address </a>`;
    emailBody += `<br /><br />If you have any question, please feel free to ask, we would love to help you.`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: email, subject, emailBody });
  },

  [EMAIL_TYPES.companySignup]: (company, user, verifyRequest) => {
    const { name } = company;
    const { email } = user;
    const { token } = verifyRequest;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Company Signup Verification";

    let emailBody = `Hi ${name}`;
    emailBody += `<br />Thank you for signing up on ${averdireURL}, let’s stay connected!`;
    emailBody += `<br /><br />We are confident that Averdire services will help you with the right candidates for the professional growth and development of your company by highlighting your profile, expertise and connections that creates a professional impression over competitors and other companies.`;
    emailBody += `<br /><br />Be sure to check out our Web and App guidelines and explore the new features so you make the most of what we offer.`;
    emailBody += `<br /><br />Please click the “Confirm Email Address” button to get your account verified on Averdire.`;
    emailBody += `<br /><a target='_blank' href='${URLS.VERIFY_ACCOUNT_EMAIL(token)}'> Confirm Email Address </a>`;
    emailBody += `<br /><br />If you have any question, please feel free to ask, we would love to help you.`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: email, subject, emailBody });
  },
  
  [EMAIL_TYPES.projectVerification]: (project, user) => {
    const { referenceEmail } = project;
    const { firstName, lastName } = user;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Project Verification Request";

    let emailBody = `Hi there ${referenceEmail}`;
    emailBody += `<br /><br />Your company's project has been added as a reference by the ${firstName} ${lastName} on ${averdireURL}.`;
    emailBody += `<br /><br />Please click the “Respond” button to accept/reject that ${firstName} ${lastName} has worked on the mentioned project.`;
    emailBody += `<br /><a target='_blank' href='${URLS.CONNECTION_REQUESTS_URL}'> “Respond” </a>`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: referenceEmail, subject, emailBody });
  },

  [EMAIL_TYPES.eduInstituteVerfication]: (institute, user) => {
    const { email, name, signupToken } = institute;
    const { firstName, lastName } = user;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Education Verification Request";
    const emailLink = URLS.EDUCATION_REQUESTS_URL;
    if(institute._options.isNewRecord) {
      emailLink = URLS.INSTITUTE_TOKEN_SIGNUP(signupToken);
    }

    let emailBody = `Hi there ${name}`;
    emailBody += `<br /><br />Your institute has been added as a reference by the ${firstName} ${lastName} on ${averdireURL}. Kindly verify if this user is currently working in your company or was a part of your company.`;
    emailBody += `<br /><br />Please click the “Respond” button to accept/reject if the user is currently connected or was a part of your company.`;
    emailBody += `<br /><a target='_blank' href='${emailLink}'> “Respond” </a>`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: email, subject, emailBody });
  },

  [EMAIL_TYPES.expCompanyVerification]: (company, user) => {
    const { email, name, signupToken } = company;
    const { firstName, lastName } = user;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Experience Verification Request";
    const emailLink = URLS.EXPERIENCE_REQUESTS_URL;
    if(company._options.isNewRecord) {
      emailLink = URLS.COMPANY_TOKEN_SIGNUP(signupToken);
    }

    let emailBody = `Hi there,`;
    emailBody += `<br />${name}`;
    emailBody += `<br /><br />Your company has been added as a reference by the ${firstName} ${lastName} on ${averdireURL}. Kindly endorse their working experience to verify if they are currently working in your company or were a part of your company.`;
    emailBody += `<br /><br />Please click the “Respond” button to accept/reject if the user is currently connected or was a part of your company.`;
    emailBody += `<br /><a target='_blank' href='${emailLink}'> “Respond” </a>`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: email, subject, emailBody });
  },
  
  [EMAIL_TYPES.expManagerVerification]: (company, user, experience) => {
    const { name } = company;
    const { managerEmail } = experience;
    const { firstName, lastName } = user;
    const averdireURL = `<a target='_blank' href='${URLS.APP_URL}'> Averdire </a>`;
    const subject = "Experience Verification Request";
    const emailLink = URLS.CONNECTION_REQUESTS_URL;

    let emailBody = `Hi there,`;
    emailBody += `<br />${managerEmail} at ${name}`;
    emailBody += `<br />Hope you are doing well,`;
    emailBody += `<br /><br />${firstName} ${lastName} has added you as a manager to endorse his working experience under you on ${averdireURL}. Kindly verify if they are currently working in your company or were a part of your company.`;
    emailBody += `<br /><br />Please click the “Respond” button to accept/reject if the ${firstName} ${lastName} is currently connected or was a part of your company.`;
    emailBody += `<br /><a target='_blank' href='${emailLink}'> “Respond” </a>`;
    emailBody += `<br /><br />Thank you,`;
    emailBody += `<br />Team Averdire.`;

    return sendEmail({ to: managerEmail, subject, emailBody });
  },
}