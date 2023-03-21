import db from "../../models/index.js";
import { COMPANY_TYPES } from "../../constants/index.js";

const Company = db.Company;

export const listCompanies = (req, res) => {
  Company.scope("verifiedDepartments").findAll({
    attributes: ["id", "name", "email"],
    // where: {type: COMPANY_TYPES.company}
  })
  .then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
};

export const listInstitutes = (req, res) => {
  Company.findAll({ 
    attributes: ["id", "name", "email"], 
    where: {type: COMPANY_TYPES.institute}
  })
  .then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
};