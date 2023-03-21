import _ from "lodash";
import db from "../../models/index.js";
import { sendErrorResponse } from "../../utils/helpers.js";
import { AUTH_USER_TYPES } from "../../constants/index.js";
const User = db.User;
const ChatRoom = db.ChatRoom;
const ChatParticipant = db.ChatParticipant;
const ChatMessage = db.ChatMessage;

export const list = (req, res) => {
    ChatRoom.scope([
        {method: ["participants", req.user.id]},
        {method: ["isParticipant", req.user.id]},
        {method: ["lastMessage", req.user.id]}
    ])
    .findAll({
      // sort in ascending order so that latest message is at last and selected as lastMessage
      order: [['lastMessage', 'createdAt', 'ASC']]
    })
    .then((data) => {
      data = _.orderBy(data, [function(o) { return o.lastMessage.createdAt; }], ['desc']);
      return res.status(200).send({ data });
    })
    .catch((err) => sendErrorResponse(err, res));
};

export const chatMessages = (req, res) => {
  let pagination = {
    limit : 10,
    lastId : 0
  }

  if(req.body.pagination) {
    pagination = { ...pagination, ...req.body.pagination };
  }

  let where = { roomId: req.params.modelId };
  if(pagination && pagination.lastId>0) {
    where.id = { [db.Sequelize.Op.lt]: pagination.lastId };
  }
  
  ChatMessage.findAll({
    where,
    limit: parseInt(pagination.limit),
    order: [['id', 'DESC']]
  })
  .then((data) => {
    if(data.length > 0) {
      pagination.lastId = data[data.length-1].id
    }
    return res.status(200).send({ data: { pagination, messages: data } });
  })
  .catch((err) => sendErrorResponse(err, res));
};

export const userRoom = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    let room = null;
    const limit = 1;

    room = await ChatRoom.scope([
      {method: ["isParticipant", req.user.id]},
      {method: ["participant", req.params.modelId]},
      {method: ["participants", req.user.id, limit]}])
    .findOne();

    if(!room) {
      const user = await User.findOne({id: req.params.modelId, role: AUTH_USER_TYPES.default});
      if(user) {
        room = await ChatRoom.create({}, { transaction: t });
        if(room) {
          const p1 = await ChatParticipant.create(
            { roomId:room.id, userId: req.user.id },
            { transaction: t }
          );
          const p2 = await ChatParticipant.create(
            { roomId:room.id, userId: req.params.modelId }, 
            { transaction: t }
          );
          if (p1 && p2) {
            await t.commit();
            room = await ChatRoom.scope([
              {method: ["isParticipant", req.user.id]},
              {method: ["participant", req.params.modelId]},
              {method: ["participants", req.user.id, limit]}])
            .findOne();
          }
          else { throw {message: "User chat could not be created. Please try again later."}; }
        }
      }
    } else {
      await t.commit();
    }

    if(room) return res.status(200).send({ data:room });
    else throw {message: "User chat could not be retrieved. Please try again later."}
  } catch (err) {
    await t.rollback();
    sendErrorResponse(err, res);
  }
};
