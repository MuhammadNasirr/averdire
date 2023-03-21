import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";
import { USER, POST } from "../../constants/attachment.js";
import { AUTO_POST_FORMAT } from "../../constants/post.js";

const User = db.User;
const UserProfile = db.UserProfile;
const Attachment = db.Attachment;
const UserSkill = db.UserSkill;
const UserInterest = db.UserInterest;
const Post = db.Post;

export const profile = (req, res) => {
  if (req.user && req.user.id) {
    User.scope("full").findOne({
      where: { id: req.user.id },
      include: [
        { model: db.UserExperience.scope('company'), as: "experience" },
        { model: db.UserEducation.scope('institute'), as: "education" },
      ]
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
  } else {
    return res.status(404).send("User not found.");
  }
};

export const update = (req, res) => {
  const User = req.user;
  User.update({
    ...req.body,
  })
    .then((user) => {
      UserProfile.upsert({
        ...req.body.profile,
        userId: user.id
      }).then(async (profile) => {
        const updatedUser = await user.reload();
        return res.send({
          message: "Profile updated successfully!",
          data: updatedUser,
        });
      });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};

export const updateAvatar = async (req, res) => {
  if (req.user && req.user.id) {
    if (req.files && req.files.avatar) {
      const avatar = await Attachment.saveAttachment(
        USER.value,
        req.user.id,
        USER.fields.avatar,
        req
      );
      if (avatar) {
        const user = await req.user.reload();
        const post = AUTO_POST_FORMAT.avatar(user);
        const avatarPost = await Post.generatePost(req, post);
        await Attachment.copyAttachment(avatar[0].id, POST.value, avatarPost.id, POST.fields.photo, POST.paths.photo);

        return res
          .status(200)
          .send({ message: "Avatar updated successfully.", data: user });
      }
    }
  }

  return res.status(500).send({ message: "Avatar couldn't be updated." });
};

export const updateCoverPhoto = async (req, res) => {
  if (req.user && req.user.id) {
    if (req.files && req.files.coverPhoto) {
      const coverPhoto = await Attachment.saveAttachment(
        USER.value,
        req.user.id,
        USER.fields.coverPhoto,
        req
      );
      if (coverPhoto) {
        const user = await req.user.reload();
        return res
          .status(200)
          .send({ message: "Cover photo updated successfully.", data: user });
      }
    }
  }

  return res.status(500).send({ message: "Cover photo couldn't be updated." });
};

export const addSkill = async (req, res) => {
  UserSkill.create({
    ...req.body,
    userId: req.user.id,
  })
    .then(async (data) => {
      data.reload().then((newD) => {
        res.status(200).send({ message: "Skill added successfully!", data: newD });
      });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};

export const dltSkill = (req, res) => {
  UserSkill.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id,
    },
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: "Skill Not found." });
      }
      res.status(200).send({ message: "Skill deleted successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const addInterest = async (req, res) => {
  UserInterest.create({
    ...req.body,
    userId: req.user.id,
  })
    .then(async (data) => {
      data.reload().then((newD) => {
        res
          .status(200)
          .send({ message: "Interest added successfully!", data: newD });
      });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};

export const dltInterest = (req, res) => {
  UserInterest.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id,
    },
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: "Interest Not found." });
      }
      res.status(200).send({ message: "Interest deleted successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
