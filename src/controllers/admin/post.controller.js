import db from "../../models/index.js";
import { sendErrorResponse } from '../../utils/helpers.js';

const Post = db.Post;
const PostComment = db.PostComment;

export const listAll = (req, res) => {
  Post.respond(res).paginate(req).scope("user", "attachments").findAndCountAll({});
};

export const postComments = (req, res) => {
  PostComment.scope("user").findAll({
    where: { postId: req.params.modelId }
  })
  .then((data) => {
      res.status(200).send({ data: data });
  })
  .catch((err) => sendErrorResponse(err, res));
}