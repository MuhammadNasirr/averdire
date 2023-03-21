import db from "../../models/index.js";
import { sendErrorResponse } from '../../utils/helpers.js';
import { COMPANY_STATUS_VALUE } from "../../constants/index.js";

const Company = db.Company;

export const listAll = (req, res) => {
  Company.respond(res).paginate(req).scope("logo").findAndCountAll({ 
      attributes: ["id", "name", "email", "status", "type", "industry"] 
  });
};

export const view = (req, res) => {
  Company.scope("logo", "cover").findOne({
    where: { id: req.params.modelId }
  })
    .then((company) => {
      if (!company) {
        return res.status(404).send({ message: "Company Not found." });
      }
      return res.status(200).send({ ...company.dataValues });
    })
    .catch((err) => sendErrorResponse(err, res));
};

const changeCompanyStatus = (req, res, status, successMessage) => {
  return Company.update(
    { status },
    {where: {
      id: req.params.modelId,
    }, hooks: false }
  ).then((user) => {
    if (!user[0]) {
      return res.status(404).send({ message: "Company Not found." });
    }
    return res.status(200).send({ message: successMessage});
  }).catch((err) => sendErrorResponse(err, res));
}

export const activate = (req, res) => {
  changeCompanyStatus(req, res, COMPANY_STATUS_VALUE.active, "Company activated successfully.");
}

export const deactivate = (req, res) => {
  changeCompanyStatus(req, res, COMPANY_STATUS_VALUE.inactive, "Company deactivated successfully.");
}