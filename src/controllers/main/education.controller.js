import db from "../../models/index.js";
import { sendEmail, sendErrorResponse, randomToken } from "../../utils/helpers.js";
import {EDUCATION} from "../../constants/attachment.js";
import { AUTO_POST_FORMAT } from "../../constants/post.js";
import { COMPANY_TYPES } from "../../constants/index.js";
import URLS from "../../constants/urls.js";
import { SEND_AUTO_FORMATTED_EMAIL , EMAIL_TYPES } from "../../constants/email.js";

const UserEducation = db.UserEducation;
const UserEducationGallery = db.UserEducationGallery;
const Attachment = db.Attachment;
const Post = db.Post;
const Company = db.Company;
const User = db.User;
const ConnectionRequest = db.ConnectionRequest;

export const list = (req, res) => {
  UserEducation.scope("institute").findAll({
    where: { userId: req.user.id },
    order:[['from', 'DESC']]
  })
  .then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const update = (req, res) => {
  UserEducation.scope('institute').findOne({
    where: { 
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((education) => {
      if (!education) throw { eCode: 404, message: "User Education not found."};
      education.update({
        ...req.body,
        to: req.body.to || null,
      })
        .then(async (updatedEducation) => {
          const { createPost = '0' } = req.body;

          if(req.files && Array.isArray(req.files)) {
            for (let index = 0; index < req.files.length; index++) {
              await UserEducationGallery.create({userEducationId: updatedEducation.id})
              .then(async (galleryItem)=>{
                await Attachment.saveSingleAttachment(EDUCATION.value, galleryItem.id, EDUCATION.fields.photo, req, index);
              });
            }
          };

          const post = AUTO_POST_FORMAT.education(updatedEducation, education.institute);
          createPost === '1' && Post.generatePost(req, post);
          req.params.modelId = updatedEducation.id;
          return view(req, res);
        }).catch((err) => sendErrorResponse(err, res));
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const create = async (req, res) => {

  const { instituteEmail, instituteName, referenceEmail, createPost = '0' } = req.body;
  let { instituteId } = req.body;

  const t = await db.sequelize.transaction();

  try {
    let institute = null;

    if (!instituteId) {
      let token = randomToken(7);
      institute = await Company.findOrCreate({
        where: { email: instituteEmail },
        defaults: { 
          name: instituteName, 
          type: COMPANY_TYPES.institute, 
          suggestedBy: req.user.id,
          signupToken: token
        },
        transaction: t
      });

      institute = institute[0];
      instituteId = institute && institute.id;
    } else {
      institute = await Company.findOne({
        where: { id: instituteId, type: COMPANY_TYPES.institute }
      });
    }
    if(!institute) {
      throw { customErrors: {instituteId: "{FIELD} is not an institute."}};
    }

    const newEducation = await UserEducation.create({
        ...req.body,
        instituteId,
        userId: req.user.id,
      }, { transaction: t }
    );

    if (req.files && Array.isArray(req.files)) {
      for (let index = 0; index < req.files.length; index++) {
        const galleryItem = await UserEducationGallery.create(
          { userEducationId: newEducation.id },
          { transaction: t }
        );
        await Attachment.saveSingleAttachment(
          EDUCATION.value,
          galleryItem.id,
          EDUCATION.fields.photo,
          req,
          index
        );
      }
    }
    
    const post = AUTO_POST_FORMAT.education(newEducation, institute);
    createPost === '1' && (await Post.generatePost(req, post, null, t));

    if (referenceEmail) {
      const referenceUser = await User.findOne({
        where: { email: referenceEmail }
      });

      const cxnRequest = await ConnectionRequest.findOrCreate({
        where: {
          senderId: req.user.id,
          ...(referenceUser ? { receiverId: referenceUser.id } : { receiverEmail: referenceEmail })
        },
        transaction: t
      });

      if(Array.isArray(cxnRequest) && cxnRequest[1]) {
        await sendEmail({
          to: referenceEmail,
          subject: "Connection Verification Request",
          emailBody: `You have been added as a reference.\nPlease click on <a target='_blank' 
                      href='${URLS.CONNECTION_REQUESTS_URL}'> THIS LINK </a> to 
                      respond to this connection request.`,
        }).catch((err) => { throw {
          message: `Email couldn't be sent to reference, either email id is not valid or server didn't respond. Please check email and try again.`
        }});
      }
    }

    if (institute.email) {
      await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.eduInstituteVerfication](institute, req.user)
      .catch((err) => { throw {
        message: `Email couldn't be sent at institute email, either email id is not valid or server didn't respond. Please check email and try again.`
      }});
    }

    await t.commit();
    req.params.modelId = newEducation.id;
    return view(req, res);
  } catch (err) {
    await t.rollback();
    sendErrorResponse(err, res);
  }
};

export const view = (req, res) => {
  UserEducation.scope("institute", "gallery").findOne({
    where: { 
      id: req.params.modelId,
      userId: req.user.id
    }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'User Education Not found.' });
    }

    res.status(200).send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const dlt = (req, res) => {
  UserEducation.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
  .then((data) => {
    if (!data) {
      return res.status(404).send({ message: 'User Education Not found.' });
    }
    res.status(200).send({ message: 'User Education deleted successfully' });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const dltPhoto = (req, res) => {
  UserEducationGallery.scope("education").findOne({
    where: { 
      id: req.params.modelId,
      '$education.userId$' : req.user.id
    }
  })
	.then(async (gallery) => {
		if (!gallery) {
			return res.status(404).send({ message: 'Photo Not found.' });
		}
    await Attachment.deleteAttachment(EDUCATION.value, gallery.id, EDUCATION.fields.photo);
    gallery.destroy();
    res.status(200).send({ message: 'Photo deleted from gallery successfully.' });

	})
	.catch((err) => sendErrorResponse(err, res));
};