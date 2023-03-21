import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { ENDORSEMENT_VALUE } from "../../constants/index.js";

const Endorsement = db.ProjectEndorsement;
const UserProject = db.UserProject;
const User = db.User;

export const endorseStats = (req, res) => {
  const { Op } = Sequelize;
  UserProject.scope("fullUser").findOne({
    where: { 
      id: req.params.modelId,
      userId: {[Op.ne]: req.user.id}
    }
  }).then(async (proj) => {
    let canEndorse = [];
    if (!proj) {
      return res.status(404).send({ message: "You can't endorse this project." });
    } else {
      const endorser = await Endorsement.getEndorserAuth(req.user, proj);
      canEndorse = endorser.canEndorse;
    }

    if (canEndorse && canEndorse.length > 0) {
      Promise.all([
        Endorsement.scope({method:["projectStats", proj.id]}).findOne(),
        Endorsement.findOne({
          where: { 
            userProjectId: proj.id,
            endorseeId: proj.user.id,
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
      return res.status(400).send({ message: "You can't endorse this project." });
    }
    
  }).catch((err) => sendErrorResponse(err, res));
}

export const endorse = async (req, res) => {
  const { Op } = Sequelize;
  UserProject.scope("fullUser").findOne({
    where: {
      id: req.body.userProjectId,
      userId: { [Op.ne]: req.user.id, [Op.eq]: req.body.userId }
    }
  }).then(async (proj) => {
    if (!proj) {
      return res.status(404).send({ message: "You can't endorse this project." });
    }

    let canEndorse = [];
    const endorserAuth = await Endorsement.getEndorserAuth(req.user, proj);
    canEndorse = endorserAuth.canEndorse;

    let defaults = {};
    if (canEndorse && canEndorse.length > 0) {
      const { behaviour, performance, attention, performanceRate, behaviourRate, attentionRate } = req.body;
      if (canEndorse.includes("behaviour") && behaviour === "true") {
        defaults.behaviour = ENDORSEMENT_VALUE.endorsed;
        defaults.behaviourRate = parseInt(behaviourRate);
      }
      if (canEndorse.includes("performance") && performance === "true") {
        defaults.performance = ENDORSEMENT_VALUE.endorsed;
        defaults.performanceRate = parseInt(performanceRate);
      }
      if (canEndorse.includes("attention") && attention === "true") {
        defaults.attention = ENDORSEMENT_VALUE.endorsed;
        defaults.attentionRate = parseInt(attentionRate);
      }

      if(defaults) {
        return Endorsement.findOrBuild({
          where: { 
            userProjectId: req.body.userProjectId,
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
    return res.status(404).send({ message: "You can't endorse this project." });
    
  }).catch((err) => sendErrorResponse(err, res));
}
