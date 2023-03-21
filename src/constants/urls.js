const serverPath = process.env.SERVER_URL;
const appPath = process.env.APP_URL;
export default {
    SERVER_URL: serverPath,
    APP_URL: appPath,
    CONNECTION_REQUESTS_URL: appPath+"account/connections/requests",
    EXPERIENCE_REQUESTS_URL: appPath+"account/c/experience/requests",
    EDUCATION_REQUESTS_URL: appPath+"account/c/education/requests",
    CONNECTIONS_URL: appPath+`account/connections`,
    COMPANY_TOKEN_SIGNUP: (token) => appPath+`auth/c/registerCompany/${token}`,
    INSTITUTE_TOKEN_SIGNUP: (token) => appPath+`auth/c/registerInstitute/${token}`,
    VERIFY_ACCOUNT_EMAIL: (token) => appPath+`account-verified/${token}`
}