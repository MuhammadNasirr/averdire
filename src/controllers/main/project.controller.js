import db from "../../models/index.js";
import { convertSequalizeErrors, sendEmail, sendErrorResponse } from "../../utils/helpers.js";
import {PROJECT} from "../../constants/attachment.js";
import { AUTO_POST_FORMAT } from "../../constants/post.js";
import { SEND_AUTO_FORMATTED_EMAIL, EMAIL_TYPES } from '../../constants/email.js';

const User = db.User;
const UserProject = db.UserProject;
const UserProjectGallery = db.UserProjectGallery;
const Attachment = db.Attachment;
const Post = db.Post;
const ConnectionRequest = db.ConnectionRequest;

export const list = (req, res) => {
  UserProject.findAll({
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
  UserProject.findOne({
    where: { 
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((project) => {
      if (!project) {
        return res.status(404).send({ message: 'Project Not found.' });
      }
      project.update({
        ...req.body,
        to: req.body.to || null,
      })
        .then(async (updatedProject) => {
          const { createPost = '0' } = req.body;

          if (req.files && Array.isArray(req.files)) {
            for (let index = 0; index < req.files.length; index++) {
              const file = req.files[index];
              await UserProjectGallery.create({ userProjectId: updatedProject.id })
                .then(async (galleryItem) => {
                  await Attachment.saveSingleAttachment(PROJECT.value, galleryItem.id, PROJECT.fields.photo, req, index);
                });
            }
          };

          const post = AUTO_POST_FORMAT.project(updatedProject);
          createPost === "1" && Post.generatePost(req, post);

          req.params.modelId = updatedProject.id;
          return view(req, res);
        })
        .catch((err) => sendErrorResponse(err, res));
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const create = async (req, res) => {

  const { referenceEmail, createPost = '0' } = req.body;
  const t = await db.sequelize.transaction();

  try {
    // Save UserProject to Database
    const newProject = await UserProject.create({
      ...req.body,
      userId: req.user.id,
    }, { transaction: t }
    );

    if (req.files && Array.isArray(req.files)) {
      for (let index = 0; index < req.files.length; index++) {
        const galleryItem = await UserProjectGallery.create(
          { userProjectId: newProject.id },
          { transaction: t }
        );
        await Attachment.saveSingleAttachment(
          PROJECT.value,
          galleryItem.id,
          PROJECT.fields.photo,
          req,
          index
        );
      }
    }

    const post = AUTO_POST_FORMAT.project(newProject);
    createPost === "1" && (await Post.generatePost(req, post, null, t));

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
        await SEND_AUTO_FORMATTED_EMAIL[EMAIL_TYPES.projectVerification](newProject, req.user);
      }
    }

    await t.commit();
    req.params.modelId = newProject.id;
    return view(req, res);

  } catch (error) {
    let errArray = convertSequalizeErrors(error);
    await t.rollback();
    return res.status(500).send({ errors: errArray });
  }
};

export const view = (req, res) => {
  UserProject.scope("gallery").findOne({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Project Not found.' });
      }

      res.status(200).send({ data });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const dlt = (req, res) => {
  UserProject.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Project Not found.' });
      }
      res.status(200).send({ message: 'Project deleted successfully' });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const dltPhoto = (req, res) => {
  UserProjectGallery.scope("project").findOne({
    where: {
      id: req.params.modelId,
      '$project.userId$' : req.user.id
    }
  })
    .then(async (gallery) => {
      if (!gallery) {
        return res.status(404).send({ message: 'Photo Not found.' });
      }
      await Attachment.deleteAttachment(PROJECT.value, gallery.id, PROJECT.fields.photo);
      gallery.destroy();
      res.status(200).send({ message: 'Photo deleted from gallery successfully.' });

    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};