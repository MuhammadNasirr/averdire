import { convertSequalizeErrors } from '../../utils/helpers.js';
import { MEMO } from '../../constants/attachment.js';
import Sequelize from "sequelize";

import db from '../../models/index.js';
const Memo = db.Memo;
const Attachment = db.Attachment;
const MemoComment = db.MemoComment;

export const list = (req, res) => {
    Memo.scope('attachments').findAll({
        where: { companyId: req.user.companyId },
        include: [

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

export const create = (req, res) => {
    Memo.create({
        ...req.body,
        userId: req.user.id,
        companyId: req.user.companyId
    })
    .then(async (data) => {
        await Attachment.saveAttachment(MEMO.value, data.id, MEMO.fields.photo, req);
        await Attachment.saveAttachment(MEMO.value, data.id, MEMO.fields.document, req);
        Memo.scope('attachments').findOne({
            where: { id: data.id }
        }).then((newD) => {
            res.status(200).send({ message: 'Memo saved successfully!', data: newD });
        });
    })
    .catch((err) => {
        let errArray = convertSequalizeErrors(err);
        return res.status(500).send({ errors: errArray });
    });
};

export const update = (req, res) => {
    Memo.scope("attachments").findOne({
        where: { 
          id: req.params.modelId,
          userId: req.user.id,
          companyId: req.user.companyId
        }
    })
    .then((memo) => {
        if (!memo) {
            return res.status(404).send({ message: "Memo not found." });
        }
        memo.update({ ...req.body })
        .then(async (data) => {
            await Attachment.saveAttachment(MEMO.value, data.id, MEMO.fields.photo, req);
            await Attachment.saveAttachment(MEMO.value, data.id, MEMO.fields.document, req);
            data.reload().then((newD) => {
                res.status(200).send({ message: 'Memo updated successfully!', data: newD });
            });
        })
        .catch((err) => {
            let errArray = convertSequalizeErrors(err);
            return res.status(500).send({ errors: errArray });
        });
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
};

export const view = (req, res) => {
    Memo.scope('attachments').findOne({
      where: { 
        id: req.params.modelId,
        companyId: req.user.companyId
      }
    })
    .then((data) => {
        if (!data) {
            return res.status(404).send({ message: 'Memo Not found.' });
        }
        res.status(200).send({ data });
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
    });
};
  
export const dlt = (req, res) => {
    Memo.destroy({
      where: {
        id: req.params.modelId,
        companyId: req.user.companyId,
        userId: req.user.id
      }
    })
    .then((data) => {
        if (!data) {
            return res.status(404).send({ message: 'Memo Not found.' });
        }
        res.status(200).send({ message: 'Memo deleted successfully' });
    })
    .catch((err) => {
        res.status(500).send({ message: err.message });
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
