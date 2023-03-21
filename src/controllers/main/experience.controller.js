import db from "../../models/index.js";
import { sendEmail, sendErrorResponse, randomToken } from "../../utils/helpers.js";
import { EXPERIENCE } from "../../constants/attachment.js";
import { AUTO_POST_FORMAT } from "../../constants/post.js";
import { COMPANY_TYPES, EXP_VERIFY_VALUE } from "../../constants/index.js";
import { updateExpEndorsementPoints } from "../../utils/connection.js";
import { SEND_AUTO_FORMATTED_EMAIL , EMAIL_TYPES } from '../../constants/email.js';

const UserExperience = db.UserExperience;
const UserExperienceGallery = db.UserExperienceGallery;
const Attachment = db.Attachment;
const Post = db.Post;
const Company = db.Company;
const CompanyDepartment = db.CompanyDepartment;
const Endorsement = db.Endorsement;

export const list = (req, res) => {
  UserExperience.scope("company", "department").findAll({
    where: { userId: req.user.id },
    order:[['from', 'DESC']]
  })
    .then((data) => {
      return res.status(200).send({ data });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
};

export const update = (req, res) => {
  UserExperience.scope('company').findOne({
    where: { 
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then(async (experience) => {
      if (!experience) throw { eCode: 404, message: "User Experience not found."};
      
      const { createPost = "0 ", departmentName } = req.body;
      const { companyId } = experience;
      let { departmentId } = req.body;

      let department = null;
      if (!departmentId) {
        department = await CompanyDepartment.findOrCreate({
            where: { name: departmentName, companyId },
            defaults: { suggestedBy: req.user.id }
        });
        
        department = Array.isArray(department) && department[0];
      } else {
        department = await CompanyDepartment.findOne({
          where: { id: departmentId, companyId }
        });
        if(!department) {
          throw { customErrors: {departmentId: "{FIELD} is not a department."}};
        }
      }

      experience
        .update({
          ...req.body,
          to: req.body.to || null,
          departmentId: department.id
        })
        .then(async (updatedExperience) => {

          if (req.files && Array.isArray(req.files)) {
            for (let index = 0; index < req.files.length; index++) {
              await UserExperienceGallery.create({
                userExperienceId: updatedExperience.id,
              }).then(async (galleryItem) => {
                await Attachment.saveSingleAttachment(
                  EXPERIENCE.value,
                  galleryItem.id,
                  EXPERIENCE.fields.photo,
                  req,
                  index
                );
              });
            }
          }

          const post = AUTO_POST_FORMAT.experience(updatedExperience, experience.company);
          createPost === "1" && Post.generatePost(req, post);
          req.params.modelId = updatedExperience.id;
          return view(req, res);
        }).catch((err) => sendErrorResponse(err, res));
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const create = async (req, res) => {
  const { companyEmail, companyName, departmentName, createPost = "0" } = req.body;
  let { companyId, departmentId } = req.body;

  const t = await db.sequelize.transaction();

  try {
    let company = null;

    if (!companyId) {
      let token = randomToken(7);
      company = await Company.findOrCreate({
        where: { email: companyEmail },
        defaults: { 
          name: companyName, 
          type: COMPANY_TYPES.company, 
          suggestedBy: req.user.id,
          signupToken: token
        },
        transaction: t
      });

      company = company[0];
      companyId = company && company.id;
    } else {
      company = await Company.findByPk(companyId);
    }

    if(!company) {
      throw { message: "Given company information could not be validated."};
    }

    let department = null;
    if (!departmentId) {
      department = await CompanyDepartment.findOrCreate({
          where: { name: departmentName, companyId },
          defaults: { suggestedBy: req.user.id },
          transaction: t
      });
      
      department = department[0];
    } else {
      department = await CompanyDepartment.findOne({
        where: { id: departmentId, companyId }
      });
    }

    if(!department) {
      throw { customErrors: {departmentId: "{FIELD} is not a department."}};
    }

    const newExperience = await UserExperience.create({
        ...req.body,
        departmentId: department.id,
        companyId,
        userId: req.user.id,
      }, { transaction: t }
    );

    if (req.files && Array.isArray(req.files)) {
      for (let index = 0; index < req.files.length; index++) {
        const galleryItem = await UserExperienceGallery.create(
          { userExperienceId: newExperience.id },
          { transaction: t }
        );
        await Attachment.saveSingleAttachment(
          EXPERIENCE.value,
          galleryItem.id,
          EXPERIENCE.fields.photo,
          req,
          index
        );
      }
    }

    const post = AUTO_POST_FORMAT.experience(newExperience, company);
    createPost === "1" && (await Post.generatePost(req, post, null, t));

    if (company.email) {
      await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.expCompanyVerification](company, req.user)
      .catch((err) => { throw {
        message: `Email couldn't be sent at company email, either email id is not valid or server didn't respond. Please check email and try again.`
      }});
    }

    if(newExperience.managerEmail) {
      await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.expManagerVerification](company, req.user, newExperience)
      .catch((err) => { throw {
        message: `Email couldn't be sent at company email, either email id is not valid or server didn't respond. Please check email and try again.`
      }});
    }

    await t.commit();
    req.params.modelId = newExperience.id;
    return view(req, res);
  } catch (err) {
    await t.rollback();
    sendErrorResponse(err, res);
  }
};

export const view = (req, res) => {
  UserExperience.scope("companyWithDepartments", "gallery", "department").findOne({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: "User Experience Not found." });
      }

      res.status(200).send({ data });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const dlt = (req, res) => {
  UserExperience.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id,
    },
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: "User Experience Not found." });
      }
      res.status(200).send({ message: "User Experience deleted successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const dltPhoto = (req, res) => {
  UserExperienceGallery.scope("experience").findOne({
    where: { 
      id: req.params.modelId,
      '$experience.userId$' : req.user.id
    }
  })
    .then(async (gallery) => {
      if (!gallery) {
        return res.status(404).send({ message: "Photo Not found." });
      }
      await Attachment.deleteAttachment(EXPERIENCE.value, gallery.id, EXPERIENCE.fields.photo);
      gallery.destroy();
      res
        .status(200)
        .send({ message: "Photo deleted from gallery successfully." });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

// Manager gets list of experience requests
export const requestList = (req, res) => {
  UserExperience.scope("company", "department", "user").findAll({
    where: { managerEmail: req.user.email, isMgrVerified: EXP_VERIFY_VALUE.pending },
    order:[['from', 'DESC']]
  })
    .then((data) => {
      return res.status(200).send({ data });
    })
    .catch((err) => {
      return res.status(500).send({ message: err.message });
    });
};

// Manager verifies an experience
export const verifyRequest = (req, res) => {
  UserExperience.scope("fullUser", "company").findOne({
    where: {
      id: req.params.modelId,
      managerEmail: req.user.email,
      isMgrVerified: EXP_VERIFY_VALUE.pending
    }
  })
  .then(async (exp) => {
    if (!exp) throw { eCode: 404, message: "Experience request not found or already verified/declined." };

    exp.update({
      isMgrVerified : EXP_VERIFY_VALUE.verified,
      mgrVerifiedAt : Date.now()
    }, { hooks: false}).then(async (verifiedExp) => {

      // update endorsement points if any
      await updateExpEndorsementPoints(res, exp.companyId);

      return res.send({ message: "Experience request verified successfully.", data:verifiedExp });
    });
  })
  .catch((err) => sendErrorResponse(err, res));
};

// Manager declines an experience
export const declineRequest = (req, res) => {
  UserExperience.scope("user", "department", "company").findOne({
    where: {
      id: req.params.modelId,
      managerEmail: req.user.email,
      isMgrVerified: EXP_VERIFY_VALUE.pending
    }
  })
  .then(async (exp) => {
    if (!exp) throw { eCode: 404, message: "Experience request not found or already verified/declined." };

    exp.update({
      isMgrVerified : EXP_VERIFY_VALUE.declined,
      mgrVerifiedAt : Date.now()
    }, { hooks: false}).then(async (verifiedExp) => {
      return res.send({ message: "Experience request declined successfully.", data:verifiedExp });
    });
  })
  .catch((err) => sendErrorResponse(err, res));
};