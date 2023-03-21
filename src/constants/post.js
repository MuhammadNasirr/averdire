import moment from 'moment';

export const POST_TYPES = {
  default: 'default',
  avatar: 'avatar',
  experience: 'exp',
  education: 'edu',
  project: 'proj',
  publication: 'pub'
}

export const AUTO_POST_FORMAT = {
  avatar: (user) => {
    const { id } = user;
    let description = `Updated their profile picture`;

    return { description, type: POST_TYPES.avatar, modelId: id }; 
  },

  experience: (userExperience, company) => {
    const { id, jobTitle, from, to=null } = userExperience;
    const companyName = company ? company.name : "COMPANY";

    const fromDate = moment(new Date(from)).format('DD MMM YYYY');
    const toDate = moment(new Date(to)).format('DD MMM YYYY');

    let description = `${to ? 'Worked' : 'Started working'} at ${companyName} as ${jobTitle} `;
    description += `${to ? 'from' : 'since'} ${fromDate} ${to ? `to ${toDate}` : ''}`;

    return { description, type: POST_TYPES.experience, modelId: id };
  },

  education: (userEducation, institute) => {
    const { id, degree, from, to=null } = userEducation;
    const instituteName = institute ? institute.name : "INSTITUTE";

    const fromDate = moment(new Date(from)).format('DD MMM YYYY');
    const toDate = moment(new Date(to)).format('DD MMM YYYY');

    let description = `${to ? 'Studied' : 'Started studying'} ${degree} at ${instituteName} `;
    description += `${to ? 'from' : 'since'} ${fromDate} ${to ? `to ${toDate}` : ''}`;

    return { description, type: POST_TYPES.education, modelId: id };
  },

  project: (userProject) => {
    const { id, name, from, to=null } = userProject;

    const fromDate = moment(new Date(from)).format('DD MMM YYYY');
    const toDate = moment(new Date(to)).format('DD MMM YYYY');
    
    let description = `${to ? 'Worked' : 'Started working'} on ${name} `;
    description += `${to ? 'from' : 'since'} ${fromDate} ${to ? `to ${toDate}` : ''}`;

    return { description, type: POST_TYPES.project, modelId: id }; 
  },

  publication: (publication) => {
    const { id, title } = publication;
    
    let description = `Shared - ${title}`;

    return { description, type: POST_TYPES.publication, modelId: id }; 
  }
}