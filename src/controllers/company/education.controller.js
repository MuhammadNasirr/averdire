import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { EDU_VERIFY_VALUE } from "../../constants/index.js";
import { addEduConnections } from "../../utils/connection.js";

const UserEducation = db.UserEducation;

export const requestsList = (req, res) => {
  UserEducation.scope("user").findAll({
    where: { 
      instituteId: req.user.companyId,
      isVerified: EDU_VERIFY_VALUE.pending
    }
  })
  .then((data) => {
    return res.send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const verifyRequest = (req, res) => {
  UserEducation.scope("user").findOne({
    where: {
      id: req.params.modelId,
      instituteId: req.user.companyId,
      isVerified: EDU_VERIFY_VALUE.pending
    }
  })
  .then((data) => {
    if (!data) throw { eCode: 404, message: "Education request not found or already declined/verified." };

    data.update({
      isVerified : EDU_VERIFY_VALUE.verified,
      verifiedAt : Date.now()
    }, { hooks: false }).then(async (verifiedEdu) => {

      const connections = await addEduConnections(verifiedEdu);
      return res.send({ message: "Education request verified successfully.", data:verifiedEdu });
    });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const declineRequest = (req, res) => {
  UserEducation.scope("user").findOne({
    where: {
      id: req.params.modelId,
      instituteId: req.user.companyId,
      isVerified: EDU_VERIFY_VALUE.pending
    }
  })
  .then((data) => {
    if (!data) throw { eCode: 404, message: "Education request not found or already declined/verified." };

    data.update({
      isVerified : EDU_VERIFY_VALUE.declined,
      verifiedAt : Date.now()
    }, { hooks: false }).then((declined) => {
      return res.send({ message: "Education request declined successfully.", data:declined });
    });
  })
  .catch((err) => sendErrorResponse(err, res));
};