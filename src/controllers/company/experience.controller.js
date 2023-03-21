import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { EXP_VERIFY_VALUE } from "../../constants/index.js";
import { addExpConnections, updateExpEndorsementPoints } from "../../utils/connection.js";

const UserExperience = db.UserExperience;

export const requestsList = (req, res) => {
  UserExperience.scope("user", "department").findAll({
    where: { 
      companyId: req.user.companyId,
      isVerified: EXP_VERIFY_VALUE.pending
    }
  })
  .then((data) => { return res.send({ data }); })
  .catch((err) => sendErrorResponse(err, res));
};

export const verifyRequest = (req, res) => {
  UserExperience.scope("user", "department").findOne({
    where: {
      id: req.params.modelId,
      companyId: req.user.companyId,
      isVerified: EXP_VERIFY_VALUE.pending
    }
  })
  .then(async (exp) => {
    if (!exp) throw { eCode: 404, message: "Experience request not found or already verified/declined." };

    const department = await exp.getDepartment();
    const t = await db.sequelize.transaction();
    let transactionStatus = 0; // pending or in progress

    try {
      exp.update({
        isVerified : EXP_VERIFY_VALUE.verified,
        verifiedAt : Date.now()
      }, { hooks: false, transaction: t }).then(async (verifiedExp) => {
        if(department && department.isVerified == EXP_VERIFY_VALUE.pending) {
          await department.update(
            {isVerified: EXP_VERIFY_VALUE.verified},
            { transaction: t }
          );
        }

        await addExpConnections(t, verifiedExp);
        await t.commit();
        transactionStatus = 1; // committed
        await updateExpEndorsementPoints(res, verifiedExp.companyId);
        return res.send({ message: "Experience request verified successfully.", data:verifiedExp });
      });
    } catch (err) {
        // roll back only if not commited
        if(transactionStatus !== 1) await t.rollback();
        sendErrorResponse(err, res);
      }
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const declineRequest = (req, res) => {
  UserExperience.scope("user", "department").findOne({
    where: {
      id: req.params.modelId,
      companyId: req.user.companyId,
      isVerified: EXP_VERIFY_VALUE.pending
    }
  })
  .then((data) => {
    if (!data) throw { eCode: 404, message: "Experience request not found or already declined/verified." };

    data.update({
      isVerified : EXP_VERIFY_VALUE.declined,
      verifiedAt : Date.now()
    }, { hooks: false }).then((declined) => {
      return res.send({ message: "Experience request declined successfully.", data:declined });
    });
  })
  .catch((err) => sendErrorResponse(err, res));
};