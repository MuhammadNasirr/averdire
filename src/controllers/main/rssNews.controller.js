import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const RssNews = db.RssNews;
const RssNewsBookmark = db.RssNewsBookmark;
const RssNewsPreferences = db.RssNewsPreferences;
const RssNewsComment = db.RssNewsComment;
const SharedRssNews = db.SharedRssNews;
const Connection = db.Connection;
const RssNewsLike = db.RssNewsLike;
const sequelize = db.sequelize;

const checkNews = (req, res) => {
  return RssNews.findOne({
    where: { title: req.body.title }
  })
    .then((data) => {
      if (!data) {
        return RssNews.create({ ...req.body })
          .then(async (news) => { return news; })
          .catch((err) => sendErrorResponse(err, res));
      }
      return data;
    })
    .catch((err) => {
      return null;
    });
};

export const addBookmark = async (req, res) => {
  const news = await checkNews(req, res);
  if(news) {
    RssNewsBookmark.findOne({
      where: { rssNewsId: news.id, userId: req.user.id }
    }).then((newsBookmark) => {
      if (!newsBookmark) {
        RssNewsBookmark.create({ rssNewsId: news.id, userId: req.user.id })
          .then(async (data) => {
            res.status(200).send({ message: 'News bookmarked successfully!', data });
          });
      } else {
        return res.status(404).send({ message: 'News already bookmarked.' });
      }
    }).catch((err) => {
      res.status(500).send({ message: err.message });
    })
  }
};

export const listBookmarks = (req, res) => {
  if (req.user && req.user.id) {
    RssNewsBookmark.findAll({
      where: { userId: req.user.id },
      include: ['news'],
      order: [['createdAt', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send('No bookmark found.');
  }
};

export const dltBookmark = (req, res) => {
  RssNewsBookmark.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'News bookmark not found or you are not authorized to delete it.' });
      }
      res.status(200).send({ message: 'News Bookmark deleted successfully!' });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const shareNews = async (req, res) => {
  const news = await checkNews(req, res);
  if(news) {
    SharedRssNews.findOne({
      where: { rssNewsId: news.id, userId: req.user.id }
    }).then((sharedNews) => {
      if (!sharedNews) {
        SharedRssNews.create({ rssNewsId: news.id, userId: req.user.id })
          .then(async (data) => {
            res.status(200).send({ message: 'News shared successfully!', data });
          });
      } else {
        return res.status(404).send({ message: 'News already shared.' });
      }
    }).catch((err) => {
      res.status(500).send({ message: err.message });
    })
  }
};

export const listSharedNews = async (req, res) => {
  const { Op } = Sequelize;
  const connectionUsersSql = Connection.userConnectionsRawSql(req.user.id);
  
  if (req.user && req.user.id) {
    SharedRssNews.scope('user', 'news', { method: ['newsStats', req.user.id] }).findAll({
      where:{
        [Op.or]: [
          {userId: {[Op.in]: sequelize.literal(`(${connectionUsersSql})`)}},
          {userId: req.user.id}
        ]
      },
      order: [['createdAt', 'DESC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send('No news found.');
  }
};

export const dltSharedNews = (req, res) => {
  SharedRssNews.destroy({
    where: {
      id: req.params.modelId,
      userId: req.user.id
    }
  })
    .then((data) => {
      if (!data) {
        return res.status(404).send({ message: 'Distributed News not found or you are not authorized to delete it.' });
      }
      res.status(200).send({ message: 'News unshared successfully!' });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

export const likeNews = async (req, res) => {
  try {
      if (!req.body.sharedNewsId) throw ({ message: "Invalid data." });
      const news = await SharedRssNews.findOne({ where: { id: req.body.sharedNewsId } });
      if (!news) throw ({ message: "News not found." });

      // Save News Like
      const [like, created] = await RssNewsLike.findOrCreate({
          where: {
              sharedNewsId: news.id,
              userId: req.user.id
          }
      });
      if (like) return res.status(200).send({ message: 'News liked!', data: like });
      else throw ({ message: "Failed to like news." });
  }
  catch (err) { sendErrorResponse(err, res); }
};

export const unlikeNews = async (req, res) => {
  if (!req.body.sharedNewsId) throw ({ message: "Invalid data." });

  RssNewsLike.destroy({
      where: { sharedNewsId: req.body.sharedNewsId, userId: req.user.id },
  }).then((data) => {
      return res.status(200).send({ message: "News unliked!" });
  }).catch((err) => sendErrorResponse(err, res));
};

export const getPreferences = async (req, res) => {
  return RssNewsPreferences.findOrCreate({
    where: { userId: req.user.id }
  })
  .then((data) => {
    const [preference, created] = data;
    if (!preference) {
      return res.status(404).send({ message: 'Publication Not found.' });
    }
    res.status(200).send({ data: preference });
  })
  .catch(err => sendErrorResponse(err, res));
};

export const savePreferences = async (req, res) => {
  return RssNewsPreferences.findOne(
    { where: { userId: req.user.id } }
  )
  .then(async (preference) => {
    // setting default values to avoid empty(undefined) values from body
    const {categories=null, countries=null} = req.body;
    await preference.update({ categories, countries }),
    res.status(200).send({ data: preference });
  })
  .catch(err => sendErrorResponse(err, res));
};

export const getComments = (req, res) => {
  return RssNewsComment.scope("user").findAll({
      where: { sharedNewsId: req.params.modelId }
  })
  .then((data) => { return res.status(200).send({ data }); })
  .catch(err => sendErrorResponse(err, res));
};

export const addComment = async (req, res) => {
  try {
      if(!req.body.sharedNewsId) throw({message: "Invalid data."});
      const sharedNews = await SharedRssNews.findOne({ where: {id: req.body.sharedNewsId} });
      if(!sharedNews) throw({message: "Shared News not found."});
  
      // Save News Comment
      const comment = await RssNewsComment.create({
          ...req.body,
          sharedNewsId: sharedNews.id,
          userId: req.user.id
      });
      if(comment) {
          return res.status(200).send({ message: 'Comment added successfully!', data: comment });
      }
  }
  catch (err) { sendErrorResponse(err, res); }
};