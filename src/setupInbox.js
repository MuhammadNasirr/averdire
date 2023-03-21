import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import { secret } from './config/auth.config.js';
import { get_Current_User, user_Disconnect, connect_User, join_Room, saveMessage } from "./InboxManager.js";

const setupInbox = (server) => {
    const io = new Server(server, {cors: {
        // origin: ["http://localhost:3000", "http://localhost:3001", "http://demo.averdire.intellicel.com"],
        // origin: ["*"],
        methods: ["GET", "POST"]
    }});
    
    // initializing and authenticating the socket io connection 
    io.use((socket, next) => {
        if (socket.handshake.auth && socket.handshake.auth.token){
            const token = socket.handshake.auth.token;
            jwt.verify(token, secret, function(err, decoded) {
                if (err) return next(new Error('Authentication error'));
                socket.userId = decoded.id;
                next();
            });
        } else {
            next(new Error('Authentication error'));
        }
    })
    .on("connection", (socket) => {
        // create user
        const new_user = connect_User(socket.id, socket.userId);
    
        // if user is a new connection only then subscribe to events
        // else if user is null then user is already subscribed
        if(new_user===null) return null;
    
        // for a new user joining the room
        socket.on("joinRoom", ({ roomId }) => {
            const room_user = join_Room(socket.id, socket.userId, roomId);
    
            // if a user is added in rooms list then join then room
            if(room_user === null) return null;
    
            socket.join(roomId);
    
            // display a welcome message to the user who have joined a room
            // socket.emit("message", {
            //     userId: room_user.userId,
            //     data:{text: `Welcome ${room_user.userId}`},
            // });
    
            // displays a joined room message to all other room users except that particular user
            // socket.broadcast.to(p_user.room).emit("message", {
            //   userId: room_user.userId,
            //   data:{text: `${room_user.userId} has joined the chat`},
            // });
        });
    
        // user sending message
        socket.on("chat", async ({data, roomId}) => {
            // gets the room user and the message sent
            const p_user = get_Current_User(socket.id);
            if(p_user && p_user.rooms && p_user.rooms.indexOf(roomId) !== -1) {
                const saved = await saveMessage(roomId, p_user.userId, data.message);
                if(saved) {
                    io.to(roomId).emit("message", {
                        userId: p_user.userId,
                        data: saved
                    });
                }
            }
        });

        // user sending message
        socket.on("typing", ({data, roomId}) => {
            socket.to(roomId).emit("isTyping", {data});
        });

        // user sending message
        socket.on("inRoom", ({data, roomId}) => {
            socket.to(roomId).emit("isActive", {data});
        });
    
        // when the user exits the room
        socket.on("disconnect", () => {
            // the user is deleted from array of users and a left room message displayed
            const p_user = user_Disconnect(socket.id);
    
            if(p_user && p_user.rooms) {
            //   io.to(p_user.room).emit("message", {
            //     userId: p_user.userId,
            //     data:{text: `${p_user.userId} has left the room`},
            //   });
            }
        });
    });
};
export default setupInbox;