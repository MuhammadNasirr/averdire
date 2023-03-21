import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { PUBLICATION } from "../../constants/attachment.js";
import { AUTO_POST_FORMAT, POST_TYPES } from "../../constants/post.js";

const Publication = db.Publication;
const Attachment = db.Attachment;
const PublicationBookmark = db.PublicationBookmark;
const PublicationComment = db.PublicationComment;
const Connection = db.Connection;
const Post = db.Post;
const PublicationLike = db.PublicationLike;
const sequelize = db.sequelize;

const isPublication = (req, res) => {
  return Publication.findOne({
    where: { id: req.body.publicationId }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send('Publication not found.');
      }
      return data;
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

export const list = (req, res) => {
  if (req.user && req.user.id) {
    Publication.scope('user', 'banner', { method: ['publicationStats', req.user.id] }).findAll({
      where: { userId: req.user.id },
      order:[['id', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send('Publications not found.');
  }
};

export const update = (req, res) => {
  Publication.findOne({
    where: { id: req.params.modelId }
  })
    .then((publication) => {
      if (!publication) {
        return res.status(404).send({ message: 'Publication Not found.' });
      }
      publication.update({
        ...req.body
      })
        .then(async (data) => {
          await Attachment.saveAttachment(PUBLICATION.value, data.id, PUBLICATION.fields.banner, req);
          const updatedData = await data.reload();
          res.status(200).send({ message: 'Publication updated successfully!', data: updatedData });
        })
        .catch((err) => sendErrorResponse(err, res));
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const create = (req, res) => {
  // Save Publication to Database
  Publication.create({
    ...req.body,
    userId: req.user.id
  })
    .then(async (data) => {
      await Attachment.saveAttachment(PUBLICATION.value, data.id, PUBLICATION.fields.banner, req);
      const updatedData = await Publication
                            .scope('user', 'banner', { method: ['publicationStats', req.user.id] })
                            .findOne({
                              where: { id: data.id }
                            });

      const post = AUTO_POST_FORMAT.publication(data);
      Post.generatePost(req, post, PUBLICATION.fields.banner);

      res.status(200).send({ message: 'Publication created successfully!', data: updatedData });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const view = (req, res) => {
  Publication.scope('user', 'banner', { method: ['publicationStats', req.user.id] }).findOne({
    where: { id: req.params.modelId }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Publication Not found.' });
      }
      res.status(200).send({ data });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const dlt = (req, res) => {
  Publication.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then(async (data) => {
      if (!data) {
        return res.status(404).send({ message: 'Publication not found or you are not authorized to delete it.' });
      }
      await Post.deletePostByModelId(req.params.modelId, POST_TYPES.publication);
      return res.status(200).send({ message: 'Publication deleted successfully' });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const addBookmark = async (req, res) => {
  const publication = await isPublication(req, res);
  if(publication) {
    PublicationBookmark.findOne({
      where: { publicationId: req.body.publicationId }
    }).then((publicationBookmark) => {
      if (!publicationBookmark) {
        PublicationBookmark.create({
          ...req.body,
          userId: req.user.id
        })
          .then(async (data) => {
            const updatedData = await data.reload();
            res.status(200).send({ message: 'Publication bookmarked successfully!', data: updatedData });
          });
      } else {
        return res.status(404).send({ message: 'Publication already bookmarked.' });
      }
    }).catch((err) => {
      res.status(500).send({ message: err.message });
    })
  }
};

export const listBookmarks = (req, res) => {
  if (req.user && req.user.id) {
    PublicationBookmark.scope('publication').findAll({
      where: { userId: req.user.id },
      order:[['id', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send('No publication bookmark found.');
  }
};

export const dltBookmark = (req, res) => {
  PublicationBookmark.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Publication bookmark not found or you are not authorized to delete it.' });
      }
      res.status(200).send({ message: 'Publication Bookmark deleted successfully!' });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const feed = async (req, res) => {
  const { Op } = Sequelize;
  const coonectionUsersSql = Connection.userConnectionsRawSql(req.user.id);
  
  if (req.user && req.user.id) {
    let filters = {};
    if(req.query.category) { 
      filters = { [Op.and]: { category: req.query.category }};
    }
    Publication.scope('user', 'banner', { method: ['publicationStats', req.user.id] }).findAll({
      where:{
        [Op.or]: [{userId: {[Op.in]: sequelize.literal(`(${coonectionUsersSql})`)}}, {userId: req.user.id}],
        ...filters
      },
      order:[['id', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send('No publications found.');
  }
};

export const getPublicationComments = (req, res) => {
  PublicationComment.scope("user").findAll({
      where: { publicationId: req.params.modelId }
  })
  .then((data) => {
      res.status(200).send({ data: data });
  })
  .catch((err) => {
      return res.status(404).send({ message: "There isn't any Publication comment." });
  });
};

export const addPublicationComment = async (req, res) => {
  try {
      if(!req.body.publicationId) throw({message: "Invalid data."});
      const publication = await Publication.findOne({ where: {id: req.body.publicationId} });
      if(!publication) throw({message: "Publication not found."});
  
      // Save Publication Comment
      const comment = await PublicationComment.create({
          ...req.body,
          publicationId: publication.id,
          userId: req.user.id
      });
      if(comment) {
          return res.status(200).send({ message: 'Comment added successfully!', data: comment });
      }
  }
  catch (err) { sendErrorResponse(err, res); }
};

export const likePublication = async (req, res) => {
  try {
      if (!req.body.publicationId) throw ({ message: "Invalid data." });
      const publication = await Publication.findOne({ where: { id: req.body.publicationId } });
      if (!publication) throw ({ message: "Publication not found." });

      // Save Publication Like
      const [like, created] = await PublicationLike.findOrCreate({
          where: {
              publicationId: publication.id,
              userId: req.user.id
          }
      });
      if (like) return res.status(200).send({ message: 'Publication liked!', data: like });
      else throw ({ message: "Failed to like publication." });
  }
  catch (err) { sendErrorResponse(err, res); }
};

export const unlikePublication = async (req, res) => {
  if (!req.body.publicationId) throw ({ message: "Invalid data." });

  PublicationLike.destroy({
      where: { publicationId: req.body.publicationId, userId: req.user.id },
  }).then((data) => {
      return res.status(200).send({ message: "Publication unliked!" });
  }).catch((err) => sendErrorResponse(err, res));
};
