import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { ENDORSEMENT_VALUE, EXPERIENCE_TYPE, EXP_VERIFY_VALUE } from "../../constants/index.js";

const Endorsement = db.ExperienceEndorsement;
const CeoEndorsement = db.CeoEndorsement;
const UserExperience = db.UserExperience;
const User = db.User;

export const endorseStats = (req, res) => {
    const { Op } = Sequelize;
    UserExperience.scope("fullUser").findOne({
      where: { 
        id: req.params.modelId,
        userId: {[Op.ne]: req.user.id},
        isVerified: EXP_VERIFY_VALUE.verified
      }
    }).then(async (exp) => {
      if (!exp) {
        return res.status(404).send({ message: "You can't endorse this experience." });
      }

      if(exp.expType === EXPERIENCE_TYPE.ceo) {
        return endorseStatsCeo(req, res, exp);
      } else {
        return endorseStatsEmployee(req, res, exp);
      }
      
    }).catch((err) => sendErrorResponse(err, res));
}

const endorseStatsEmployee = async (req, res, exp) => {
    const endorserAuth = await Endorsement.getEndorserAuth(req.user, exp);
    const { canEndorse, previousEndorsement } = endorserAuth;

    if (canEndorse && canEndorse.length > 0) {
      Endorsement.scope({method:["experienceStats", exp.id]}).findOne()
      .then((result) => {
        let rating = "N/A";
        if(result && result.rating) {
          rating = Math.round(((result.rating/3) + Number.EPSILON) * 100) / 100;
        }
        return res.status(200).send({ data: {
            rating,
            isEndorsing: previousEndorsement ? previousEndorsement.dataValues : null,
            canEndorse
          }
        });
      });
    } else {
      return res.status(400).send({ message: "You can't endorse this experience." });
    }
}

const endorseStatsCeo = async (req, res, exp) => {
  let canEndorse = [];
  const endorser = await CeoEndorsement.getEndorserAuth(req.user, exp);
  canEndorse = endorser.canEndorse;

  if (canEndorse && canEndorse.length > 0) {
    Promise.all([
      CeoEndorsement.scope({method:["experienceStats", exp.id]}).findOne(),
      CeoEndorsement.findOne({
        where: { 
          userExperienceId: exp.id,
          endorseeId: exp.user.id,
          endorserId: req.user.id
        }
      }),
    ]).then((promiseResult) => {
      if(promiseResult[0].rating) {
        promiseResult[0].rating = Math.round(((promiseResult[0].rating/3) + Number.EPSILON) * 100) / 100;
      } else {
        promiseResult[0].rating = "N/A";
      }
      return res.status(200).send({ data: {
          ...promiseResult[0].dataValues,
          isEndorsing: promiseResult[1] ? promiseResult[1].dataValues : null,
          canEndorse
        }
      });
    });
  } else {
    return res.status(400).send({ message: "You can't endorse this experience." });
  }
}

export const endorse = async (req, res) => {
  const { Op } = Sequelize;
  UserExperience.scope("fullUser").findOne({
    where: {
      id: req.body.userExperienceId,
      userId: { [Op.ne]: req.user.id, [Op.eq]: req.body.userId },
      isVerified: EXP_VERIFY_VALUE.verified
    }
  }).then(async (exp) => {
    if (!exp) {
      return res.status(404).send({ message: "You can't endorse this experience." });
    }

    if(exp.expType === EXPERIENCE_TYPE.ceo) {
      // return res.status(200).send({ exp });
      return endorseCeo(req, res, exp);
    } else {
      return endorseEmployee(req, res, exp);
    }
    
  }).catch((err) => sendErrorResponse(err, res));
}

const endorseEmployee = async (req, res, exp) => {
    const endorserAuth = await Endorsement.getEndorserAuth(req.user, exp);
    const { canEndorse } = endorserAuth;

    let defaults = null;
    if (canEndorse && canEndorse.length > 0) {
      const { behaviour, performance, leadership } = req.body;
      if (canEndorse.includes("behaviour")) {
        defaults = { behaviour: behaviour === "true" ? ENDORSEMENT_VALUE.endorsed : undefined };
      } else if (canEndorse.includes("performance")) {
        defaults = { performance: performance === "true" ? ENDORSEMENT_VALUE.endorsed : undefined };
      } else if (canEndorse.includes("leadership")) {
        defaults = { leadership: leadership === "true" ? ENDORSEMENT_VALUE.endorsed : undefined };
      }

      if(defaults) {
        return Endorsement.findOrBuild({
          where: { 
            userExperienceId: req.body.userExperienceId,
            endorseeId: req.body.userId,
            endorserId: req.user.id
          },
          defaults
        }).then((response) => {
          const endorsement = response[0];
          Object.assign(endorsement, defaults);
      
          return endorsement.save().then(async (data) => {
            const endData = await data.assignPoints(res, exp, endorserAuth);
            return res.status(200).send({ message: "Successfully endorsed!", data: endData });
          });
        })
      }
    }
    return res.status(404).send({ message: "You can't endorse this experience." });
}

const endorseCeo = async (req, res, exp) => {
    let canEndorse = [];
    const endorserAuth = await CeoEndorsement.getEndorserAuth(req.user, exp);
    canEndorse = endorserAuth.canEndorse;

    let defaults = {};
    if (canEndorse && canEndorse.length > 0) {
      const { leadership, vision, efficiency, leadershipRate, visionRate, efficiencyRate } = req.body;
      if (canEndorse.includes("vision") && vision === "true") {
        defaults.vision = ENDORSEMENT_VALUE.endorsed;
        defaults.visionRate = parseInt(visionRate);
      }
      if (canEndorse.includes("leadership") && leadership === "true") {
        defaults.leadership = ENDORSEMENT_VALUE.endorsed;
        defaults.leadershipRate = parseInt(leadershipRate);
      }
      if (canEndorse.includes("efficiency") && efficiency === "true") {
        defaults.efficiency = ENDORSEMENT_VALUE.endorsed;
        defaults.efficiencyRate = parseInt(efficiencyRate);
      }

      if(defaults) {
        return CeoEndorsement.findOrBuild({
          where: { 
            userExperienceId: exp.id,
            endorseeId: req.body.userId,
            endorserId: req.user.id
          },
          defaults
        }).then(async (response) => {
          let endorsement = response[0];
          Object.assign(endorsement, defaults);
          const userRating = await User.getRating(req.user.id);
          endorsement.rating = userRating ? userRating.overallRating : 0;
          return endorsement.save().then(async (data) => {
            return res.status(200).send({ message: "Successfully endorsed!", data });
          });
        })
      }
    }
    return res.status(404).send({ message: "You can't endorse this experience." });
}