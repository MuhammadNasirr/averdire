import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const AppFaq = db.AppFaq;

export const list = (req, res) => {
  AppFaq.findAll().then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const create = async (req, res) => {
  AppFaq.create({
    ...req.body
  }).then(async (data) => {
    data.reload().then((newD) => {
      res.status(200).send({ message: "Question added successfully!", data: newD });
    });
  }).catch((err) => sendErrorResponse(err, res));
}

export const update = (req, res) => {
  AppFaq.findByPk(req.params.modelId)
  .then((data) => {
    if(data) {
      return data.update({...req.body}).then((updatedData) => {
        return res.status(200).send({ data:updatedData });
      });
    }
    return res.status(404).send({ message: "Data not found." });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const view = (req, res) => {
  AppFaq.findByPk(req.params.modelId)
  .then((data) => {
    if(data) return res.status(200).send({ data });
    return res.status(404).send({ message: "Data not found." });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const dlt = (req, res) => {
  AppFaq.destroy({
    where: { id: req.params.modelId },
  }).then((data) => {
    if (!data) return res.status(404).send({ message: "Data not found." });
    return res.status(200).send({ message: "Data deleted successfully" });
  }).catch((err) => sendErrorResponse(err, res));
};