import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import crypto from 'crypto';
import db from './database/init';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket: Socket) => {
        console.log('A user connected via Socket.IO:', socket.id);

        // When a user logs in, they tell the server their ID so we can put them in a private "room"
        socket.on('join', (userId: number) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their notification room.`);
        });

        // Join a specific chat room
        socket.on('join_advertiser_chat', (roomId: string) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined chat room: ${roomId}`);
        });

        // Handle sending and broadcasting a message
        socket.on('send_advertiser_message', (messageData) => {
            const { roomId, senderId, senderType, content } = messageData;
            const messageId = crypto.randomUUID();

            try {
                // Save the message to our SQLite database synchronously
                db.prepare(
                    `INSERT INTO messages (id, room_id, sender_id, sender_type, content) 
                     VALUES (?, ?, ?, ?, ?)`
                ).run(messageId, roomId, senderId, senderType, content);

                // Construct the message object to send back out
                const savedMessage = {
                    id: messageId,
                    room_id: roomId,
                    sender_id: senderId,
                    sender_type: senderType,
                    content,
                    created_at: new Date().toISOString()
                };

                // Broadcast the message to everyone in that specific room
                io.to(roomId).emit('receive_advertiser_message', savedMessage);

            } catch (error) {
                console.error("Error saving/sending chat message:", error);
                // Notify the sender that their message failed
                socket.emit('message_error', { error: "Failed to send message." });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized!');
    }
    return io;
};