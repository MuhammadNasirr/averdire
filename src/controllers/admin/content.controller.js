import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";

const AppContent = db.AppContent;

export const view = (req, res) => {
    AppContent.findByPk(1)
    .then((data) => {
      return res.status(200).send({ data });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const update = (req, res) => {
    AppContent.findByPk(1)
    .then((data) => {
      data.update({...req.body}).then((updatedData) => {
        return res.status(200).send({ data:updatedData });
      });
    })
    .catch((err) => sendErrorResponse(err, res));
}