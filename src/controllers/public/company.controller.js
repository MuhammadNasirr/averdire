import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const Company = db.Company;

export const publicProfile = (req, res) => {
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