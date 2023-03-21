import db from "../../models/index.js";
import { convertSequalizeErrors, sendErrorResponse } from "../../utils/helpers.js";
import { AUTH_USER_TYPES, FOLLOW_TYPES } from "../../constants/index.js";
import { ABUSE_REASONS } from "../../constants/userAbuse.js";

const User = db.User;
const ReportedUser = db.ReportedUser;
const Follower = db.Follower;

export const publicProfile = (req, res) => {
  User.scope("full").findOne({
    where: {
      id: req.params.modelId,
      role: AUTH_USER_TYPES.default
    },
    include: [
      // required: false should be provided in join so that sequelize use left outer join
      // other wise sequelize is using inner join becuase multiple conditions are given in join "ON" condition
      { model: db.UserExperience.scope('isVerified', 'company'), as: "experience", required: false},
      { model: db.UserEducation.scope('isVerified', 'institute'), as: "education", required: false},
    ],
    order: [['experience', 'from', 'DESC'],['education', 'from', 'DESC']]
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      return res.status(200).send({ ...user.dataValues });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
}

export const followUser = (req, res) => {
  User.findOne({
    where: {
      id: req.params.modelId,
      role: AUTH_USER_TYPES.default
    }
  })
  .then((user) => {
    if (!user || req.user.id === user.id) {
      return res.status(404).send({ message: "User not found." });
    }
    return follow(res, user.id, req.user.id, FOLLOW_TYPES.user);
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
}
  
const follow = (res, leadId, followerId, followType) => {
  Follower.findOrCreate({
    where: {
      leadId: leadId,
      followerId: followerId,
      type: followType
    }
  })
  .then((data) => {
    if(data[1]) {
      return res.status(200).send({ message: "Successfully followed!", data: data[0] });
    }
    return res.status(200).send({ message: "Already followed!", data: data[0] });
  })
  .catch((err) => {
    let errArray = convertSequalizeErrors(err);
    return res.status(500).send({ errors: errArray });
  });
}

const unFollow = (res, leadId, followerId, followType) => {
  Follower.destroy({
    where: {
      leadId: leadId,
      followerId: followerId,
      type: followType
    }
  })
  .then((data) => {
    if(data) {
      return res.status(200).send({ message: "Successfully unfollowed!" });
    }
    return res.status(400).send({ message: "Not Following." });
  })
  .catch((err) => {
    let errArray = convertSequalizeErrors(err);
    return res.status(500).send({ errors: errArray });
  });
}

export const unFollowUser = (req, res) => {
  User.findOne({
    where: {
      id: req.params.modelId,
      role: AUTH_USER_TYPES.default
    }
  })
  .then((user) => {
    if (!user || req.user.id === user.id) {
      return res.status(404).send({ message: "User not found." });
    }
    return unFollow(res, user.id, req.user.id, FOLLOW_TYPES.user);
  })
  .catch((err) => {
    return res.status(500).send({ message: err.message });
  });
}
  
export const userFollowStats = async (req, res) => {
  if (req.params.modelId && req.user.id) {
    const data = await Follower.scope({method:["userStats", req.params.modelId, req.user.id]}).findOne();
    return res.status(200).send({ data }); 
  } else {
    return res.status(500).send({ message: "Invalid parameters." });
  }
}

export const checkReport = (req, res) => {
  ReportedUser.findOne({
    where: {
      userId: req.params.modelId,
      reportedBy: req.user.id
    }
  })
  .then((user) => {
    return res.status(200).send({ data: {abuseReasons: ABUSE_REASONS, report: user} });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const reportUser = async (req, res) => {
  try {
    if(req.params.modelId == req.user.id) {
      throw { eCode: 500, message: "You can't report yourself." }
    }
    const user = await ReportedUser.findOrCreate({
      where: {
        userId: req.params.modelId,
        reportedBy: req.user.id,
        reason: req.body.reason
      }
    });
    if(user[1]) {
      return res.status(200).send({ data: user[0], message: "Reported user successfully." });
    }
    return res.status(200).send({ data: user[0], message: "Already reported." });
  }
  catch(err) { sendErrorResponse(err, res); }
}

export const ratingStats = async (req, res) => {
  const userRating = await User.getRating(req.params.modelId);
  return res.status(200).send({ data: {rating: userRating ? userRating.overallRating : 0} });
}