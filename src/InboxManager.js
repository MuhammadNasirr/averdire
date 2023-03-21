import _ from 'lodash';
import db from "./models/index.js";

const ChatMessage = db.ChatMessage;

// basic structure of connected users (c_users)
// c_users = {socketId : { socketId, userId, rooms: [roomId] }}

// basic structure of rooms
// room = {roomId : [socketId]}

const rooms = {};
const c_users = {};

// Save connected user
export const connect_User = (socketId, userId) => {
    userId = parseInt(userId);
    const p_user = { socketId, userId, rooms: [] };
    c_users[socketId] = p_user;
    return p_user;
}

// Add room in rooms list and user in room and add room to user's rooms
export const join_Room = (socketId, userId, roomId) => {
    // here we must have found user other wise we can't allow to join room
    if(c_users[socketId] && c_users[socketId].userId === userId) {
        // add room in rooms list if not exist
        if(!rooms[roomId]) rooms[roomId] = [];
        // add user socket id in given room
        rooms[roomId].indexOf(socketId) === -1 && rooms[roomId].push(socketId);
        c_users[socketId].rooms.indexOf(roomId) === -1 && c_users[socketId].rooms.push(roomId);
        return c_users[socketId];
    }
    return null;
}

// Gets a particular user id to return the current user
export const get_Current_User = (socketId) => {
    return c_users[socketId] || null;
}

// called when the user leaves the chat and its user object deleted from array
export const user_Disconnect = (socketId) => {
    if(c_users[socketId]) {
        const p_user = c_users[socketId];
        // remove user from all rooms
        if(p_user.rooms) {
            p_user.rooms.map((room)=>{
                if(rooms[room]) {
                    const index = rooms[room].indexOf(socketId);
                    if (index > -1) {
                        rooms[room].splice(index, 1);
                    }
                }
            });
        }
        // remove user from users array
        c_users[socketId] = undefined;
        return p_user
    }
    return null;
}

export const saveMessage = (roomId, senderId, message) => {
    return ChatMessage.create({
        roomId,
        senderId,
        message
    }).then((message) => {
        return message;
    })
    .catch((err) => {
        return null;
    });
}
