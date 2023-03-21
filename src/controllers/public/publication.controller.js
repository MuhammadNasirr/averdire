import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const Publication = db.Publication;

export const list = (req, res) => {
  Publication.scope('user', 'banner', { method: ['publicationStats', null] }).findAll().then((data) => {
    return res.status(200).send({ data });
  })
  .catch((err) => sendErrorResponse(err, res));
}

export const view = (req, res) => {
  Publication.scope('user', 'banner', { method: ['publicationStats', null] }).findByPk(req.params.modelId)
  .then((data) => {
    if(data) return res.status(200).send({ data });
    return res.status(404).send({ message: "Data not found." });
  })
  .catch((err) => sendErrorResponse(err, res));
}