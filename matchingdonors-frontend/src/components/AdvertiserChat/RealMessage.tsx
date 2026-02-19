import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import './RealMessage.css';

// Define our TypeScript interfaces
interface Message {
    id: string;
    room_id: string;
    sender_id: string;
    sender_type: 'user' | 'advertiser' | 'system';
    content: string;
    created_at: string;
}

interface RealMessageProps {
    advertiserId: string;
    advertiserName: string;
}

const RealMessage: React.FC<RealMessageProps> = ({ advertiserId, advertiserName }) => {
    const { user, token } = useAuth(); // Get current user and JWT token
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    // Ref to automatically scroll to the bottom of the chat
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Room and Fetch History
    useEffect(() => {
        const initializeChat = async () => {
            if (!user || !token) return;

            try {
                // Get or create the room (Updated to port 8080)
                const roomRes = await fetch('http://localhost:8080/api/chat/room', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ advertiserId })
                });
                const roomData = await roomRes.json();
                const currentRoomId = roomData.roomId;
                setRoomId(currentRoomId);

                // Fetch message history (Updated to port 8080)
                const historyRes = await fetch(`http://localhost:8080/api/chat/room/${currentRoomId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const historyData = await historyRes.json();
                setMessages(historyData);

                // Setup Socket Connection (Updated to port 8080)
                const newSocket = io('http://localhost:8080');
                setSocket(newSocket);

                // Join the specific room
                newSocket.emit('join_advertiser_chat', currentRoomId);

                // Listen for incoming messages
                newSocket.on('receive_advertiser_message', (incomingMessage: Message) => {
                    setMessages((prevMessages) => {
                        // Deduplication check: If we already have this message, don't add it again
                        if (prevMessages.some(msg => msg.id === incomingMessage.id)) {
                            return prevMessages;
                        }
                        return [...prevMessages, incomingMessage];
                    });
                });

                // Cleanup on unmount
                return () => {
                    newSocket.disconnect();
                };

            } catch (error) {
                console.error("Failed to initialize chat:", error);
            }
        };

        initializeChat();
    }, [advertiserId, user, token]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle Sending Messages
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !roomId || !user) return;

        const messageData = {
            roomId,
            senderId: user.id.toString(),
            senderType: 'user', // Hardcoded as 'user' for the frontend patient/donor
            content: inputText.trim()
        };

        // Emit to backend
        socket.emit('send_advertiser_message', messageData);

        // Clear the input
        setInputText('');
    };

    return (
        <div className="real-message-container">
            {/* Chat Header */}
            <div className="real-message-header">
                <h3>Direct Message with {advertiserName}</h3>
            </div>

            {/* Messages Area */}
            <div className="real-message-area">
                {messages.map((msg) => {
                    const isMe = msg.sender_type === 'user';
                    return (
                        <div key={msg.id} className={`message-row ${isMe ? 'is-me' : 'is-them'}`}>
                            <div className={`message-bubble ${isMe ? 'is-me' : 'is-them'}`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="real-message-input-area">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    className="real-message-input"
                />
                <button type="submit" className="real-message-send-btn">
                    Send
                </button>
            </form>
        </div>
    );
};

export default RealMessage;