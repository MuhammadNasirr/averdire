import Sequelize from "sequelize";
import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";

const Memo = db.Memo;
const MemoComment = db.MemoComment;

export const companyMemos = (req, res) => {
    Memo.scope('attachments').findAll({
        where: { companyId: req.params.modelId },
        include: [
            {
                model: db.UserExperience, as: 'experience',
                where: { userId: req.user.id, to: null },
                required: true, attributes: [],
            },
            { model: MemoComment, as: 'comments', attributes: [] }
        ],
        attributes: {
            include: [[Sequelize.fn("COUNT", Sequelize.col(`comments.id`)), "commentsCount"]]
        },
        group: ['Memo.id'],
        order:[['id', 'DESC']]
    })
    .then((data) => {
        return res.status(200).send({ data });
    })
    .catch((err) => {
        return res.status(500).send({ message: err.message });
    });
};

export const getMemoComments = (req, res) => {
    MemoComment.scope("user").findAll({
        where: { memoId: req.params.modelId }
    })
    .then((data) => {
        res.status(200).send({ data: data });
    })
    .catch((err) => {
        return res.status(404).send({ message: "There isn't any memo comment." });
    });
};

export const addMemoComment = async (req, res) => {
    try {
        if(!req.body.memoId) throw({message: "Invalid data."});
        const memo = await Memo.findOne({ where: {id: req.body.memoId} });
        if(!memo) throw({message: "Memo not found."});
    
        // Save Memo Comment
        const comment = await MemoComment.create({
            ...req.body,
            memoId: memo.id,
            userId: req.user.id
        });
        if(comment) {
            return res.status(200).send({ message: 'Comment added successfully!', data: comment });
        }
    }
    catch(err) {
        let errArray = convertSequalizeErrors(err);
        errArray ? 
            res.status(500).send({ errors: errArray }) : 
            res.status(500).send({ message: err.message });
    }
};
