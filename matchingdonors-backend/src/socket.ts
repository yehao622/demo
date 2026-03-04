import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import crypto from 'crypto';
import db from './database/init';
import { Resend } from 'resend';

let io: Server;

const resend = new Resend(process.env.RESEND_API_KEY);

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [
                'http://localhost:3000',
                process.env.FRONTEND_URL || ''
            ].filter(Boolean),
            credentials: true,
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
        socket.on('send_advertiser_message', async (messageData) => {
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

                // We only send an email if the 'user' (the sponsor) sent the message
                if (senderType === 'user') {
                    const { data, error } = await resend.emails.send({
                        from: 'onboarding@resend.dev', // Resend's required default testing address
                        to: process.env.EMAIL_USER as string, // Your email address receiving the alert
                        subject: `New Sponsor Message from User ID: ${senderId}`,
                        text: `You have received a new message from a sponsor on the platform.\n\nMessage: "${content}"\n\nChat Room ID: ${roomId}\nLog in to the database to reply.`
                    });

                    if (error) {
                        console.error("Error sending email notification via Resend:", error);
                    } else {
                        console.log("Email notification sent successfully via Resend:", data);
                    }
                }

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