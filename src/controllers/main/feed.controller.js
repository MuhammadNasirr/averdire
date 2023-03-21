import Sequelize from "sequelize";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const Post = db.Post;
const PostComment = db.PostComment;
const PostLike = db.PostLike;
const Connection = db.Connection;

export const index = (req, res) => {
    const { Op } = Sequelize;

    if (req.user && req.user.id) {
        const conectionUsersSql = Connection.userConnectionsRawSql(req.user.id);

        Post.scope("user", "attachments", { method: ['postStats', req.user.id] }).findAll({
            where: {
                [Op.or]: [
                    { userId: { [Op.in]: db.sequelize.literal(`(${conectionUsersSql})`) } },
                    { userId: req.user.id },
                ],
            },
            order: [['id', 'DESC']],
        })
            .then((data) => {
                return res.status(200).send({ data });
            })
            .catch((err) => {
                return res.status(500).send({ message: err.message });
            });
    } else {
        return res.status(404).send({ message: 'Posts not found.' });
    }
};

export const getPostComments = (req, res) => {
    PostComment.scope("user").findAll({
        where: { postId: req.params.modelId }
    })
        .then((data) => {
            res.status(200).send({ data: data });
        })
        .catch((err) => {
            return res.status(404).send({ message: "There isn't any post comment." });
        });
};

export const addPostComment = async (req, res) => {
    try {
        if (!req.body.postId) throw ({ message: "Invalid data." });
        const post = await Post.findOne({ where: { id: req.body.postId } });
        if (!post) throw ({ message: "Post not found." });

        // Save Post Comment
        const comment = await PostComment.create({
            ...req.body,
            postId: post.id,
            userId: req.user.id
        });
        if (comment) {
            return res.status(200).send({ message: 'Post Comment added successfully!', data: comment });
        }
    }
    catch (err) { sendErrorResponse(err, res); }
};

export const likePost = async (req, res) => {
    try {
        if (!req.body.postId) throw ({ message: "Invalid data." });
        const post = await Post.findOne({ where: { id: req.body.postId } });
        if (!post) throw ({ message: "Post not found." });

        // Save Post Like
        const [like, created] = await PostLike.findOrCreate({
            where: {
                postId: post.id,
                userId: req.user.id
            }
        });
        if (like) return res.status(200).send({ message: 'Post liked!', data: like });
        else throw ({ message: "Failed to like post." });
    }
    catch (err) { sendErrorResponse(err, res); }
};

export const unlikePost = async (req, res) => {
    if (!req.body.postId) throw ({ message: "Invalid data." });

    PostLike.destroy({
        where: { postId: req.body.postId, userId: req.user.id },
    }).then((data) => {
        return res.status(200).send({ message: "Post unliked!" });
    }).catch((err) => sendErrorResponse(err, res));
};