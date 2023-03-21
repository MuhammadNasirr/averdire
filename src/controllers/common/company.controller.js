import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";
import { FOLLOW_TYPES } from "../../constants/index.js";

const Company = db.Company;
const Follower = db.Follower;

export const publicProfile = (req, res) => {
    Company.scope("logo", "cover").findOne({
      where: {
        id: req.params.modelId
      }
    })
      .then((company) => {
        if (!company) {
          return res.status(404).send({ message: "Company Not found." });
        }
        return res.status(200).send({ ...company.dataValues });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
};  

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
  
export const followCompany = (req, res) => {
Company.scope('admin').findOne({
    where: { id: req.params.modelId }
})
.then((company) => {
    if (!company || req.user.companyId === company.id) {
    return res.status(404).send({ message: "Company not found." });
    }
    if(company.admin) {
    return follow(res, company.admin.id, req.user.id, FOLLOW_TYPES.company);
    }
    return res.status(404).send({ message: "This company can't be followed yet." });
})
.catch((err) => {
    return res.status(500).send({ message: err.message });
});
}
  
export const companyFollowStats = async (req, res) => {
if (req.params.modelId && req.user.id) {
    Company.scope('admin').findOne({
    where: { id: req.params.modelId }
    })
    .then(async (company) => {
    if (company && company.admin) {
        const data = await Follower.scope({method:["userStats", company.admin.id, req.user.id]}).findOne();
        return res.status(200).send({ data }); 
    }
    return res.status(404).send({ message: "Company not found." });
    })
    .catch((err) => {
    return res.status(500).send({ message: err.message });
    });
} else {
    return res.status(500).send({ message: "Invalid parameters." });
}
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
  
export const unFollowCompany = (req, res) => {
Company.scope('admin').findOne({
    where: { id: req.params.modelId }
})
.then((company) => {
    if (!company || req.user.companyId === company.id) {
    return res.status(404).send({ message: "Company not found." });
    }
    if(company.admin) {
    return unFollow(res, company.admin.id, req.user.id, FOLLOW_TYPES.company);
    }
    return res.status(404).send({ message: "This company can't be followed yet." });
})
.catch((err) => {
    return res.status(500).send({ message: err.message });
});
}

export const companyRanking = async (req, res) => {
  const ranking = await Company.companyRanking(req.params.modelId);
  return res.status(200).send({ data: {ranking} });
}

export const instituteRanking = async (req, res) => {
  const ranking = await Company.instituteRanking(req.params.modelId);
  return res.status(200).send({ data: {ranking} });
}