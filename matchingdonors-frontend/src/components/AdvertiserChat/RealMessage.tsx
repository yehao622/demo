import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import './RealMessage.css';

// Dynamically set the API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || (import.meta as any).env?.VITE_API_URL || 'https://matchingdonors-demo.onrender.com' || 'http://localhost:8080';

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
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Declare socketInstance outside the async function so React can clean it up
        let socketInstance: Socket | null = null;

        const initializeChat = async () => {
            if (!user || !token) return;

            try {
                // 1. Get Room ID
                const roomRes = await fetch(`${API_BASE_URL}/api/chat/room`, {
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

                // 2. Fetch History
                const historyRes = await fetch(`${API_BASE_URL}/api/chat/room/${currentRoomId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const historyData = await historyRes.json();
                setMessages(historyData);

                // 3. Setup Socket Connection securely
                socketInstance = io(API_BASE_URL, {
                    transports: ['websocket', 'polling']
                });
                setSocket(socketInstance);

                socketInstance.emit('join_advertiser_chat', currentRoomId);

                socketInstance.on('receive_advertiser_message', (incomingMessage: Message) => {
                    setMessages((prevMessages) => {
                        if (prevMessages.some(msg => msg.id === incomingMessage.id)) return prevMessages;
                        return [...prevMessages, incomingMessage];
                    });
                });
            } catch (error) {
                console.error("Failed to initialize chat:", error);
            }
        };

        initializeChat();

        // PROPER REACT CLEANUP: This guarantees the socket closes when the user leaves the page
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [advertiserId, user, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !roomId || !user) return;

        const messageData = {
            roomId,
            senderId: user.id.toString(),
            senderType: 'user',
            content: inputText.trim()
        };

        socket.emit('send_advertiser_message', messageData);
        setInputText('');
    };

    return (
        <div className="real-message-container">
            <div className="real-message-header">
                <h3>Direct Message with {advertiserName}</h3>
            </div>

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