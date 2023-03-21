import Sequelize from "sequelize";
import db from "../../models/index.js";
import { convertSequalizeErrors } from "../../utils/helpers.js";
import { CONNECTION_REQ_STATUS } from "../../constants/connection.js";

const ConnectionRequest = db.ConnectionRequest;
const Connection = db.Connection;
const User = db.User;
const sequelize = db.sequelize;

export const listConnectionRequest = (req, res) => {
  const { Op } = Sequelize;

  if (req.user && req.user.id) {
    ConnectionRequest.findAll({
      where: {
        [Op.or]: [
          { receiverId: req.user.id },
          { receiverEmail: req.user.email },
        ],
        status: CONNECTION_REQ_STATUS.pending,
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "email", "firstName", "lastName"],
        },
      ],
      attributes: { exclude: ["senderId"] },
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send("Connection requests not found.");
  }
};

export const createConnectionRequest = async (req, res) => {
  ConnectionRequest.findOrCreate({
    where: {
      receiverId: req.params.receiverId,
      senderId: req.user.id,
    }
  })
    .then(async (data) => {
      const updatedData = await data[0].reload();
      if(data[1]) {
        return res.status(200).send({ message: "Connection request sent successfully!", data: updatedData });
      }
      return res.status(200).send({ message: "Connection request already sent.", data: updatedData });
    })
    .catch((err) => {
      let errArray = convertSequalizeErrors(err);
      return res.status(500).send({ errors: errArray });
    });
};

export const updateConnectionRequest = (req, res) => {
  ConnectionRequest.findOne({
    where: {
      id: req.params.id,
      status: CONNECTION_REQ_STATUS.pending,
    },
  })
    .then((cxnReq) => {
      if (!cxnReq) {
        return res
          .status(404)
          .send({ message: "Connection Request not found." });
      }
      cxnReq
        .update({
          ...req.body,
        })
        .then((data) => {
          if (req.body.status === CONNECTION_REQ_STATUS.accepted) {
            Connection.create({
              userOneId: data.senderId,
              userTwoId: data.receiverId,
            }).then(() => {
              res
                .status(200)
                .send({ message: "Connection Request accepted", data });
            });
          } else {
            res
              .status(200)
              .send({ message: "Connection Request declined", data });
          }
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

export const listConnection = (req, res) => {
  if (req.user && req.user.id) {
    const { Op } = Sequelize;

    const conectionUsersSql = Connection.userConnectionsRawSql(req.user.id);

    let orQueryArr = [];
    if(req.query.queryName) { 
      orQueryArr.push({firstName : { [Op.like]: '%'+req.query.queryName+'%' }});
      orQueryArr.push({lastName : { [Op.like]: '%'+req.query.queryName+'%' }});
    }
    if(req.query.queryEmail) {
      orQueryArr.push({email : { [Op.like]: '%'+req.query.queryEmail+'%' }});
    }
    if(orQueryArr.length===0) {
      orQueryArr.push({firstName : { [Op.like]: '%%' }});
    }

    User.scope('short', 'avatar').findAll({
      where: {
        [Op.or]: orQueryArr,
        id: {[Op.in]: sequelize.literal(`(${conectionUsersSql})`)}
      },
      order:[['firstName', 'ASC']]
    })
      .then((data) => {
        return res.status(200).send({ data });
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  } else {
    return res.status(404).send("You don't have any connection yet.");
  }
};
