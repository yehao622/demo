import React, { useState, useEffect, useRef } from 'react';
import './AdvertiserChat.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface LeadData {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    monthlyBudget?: string;
    campaignGoals?: string;
}

const API_BASE = 'http://localhost:8080/api/advertiser';

const AdvertiserChat: React.FC = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showLeadForm, setShowLeadForm] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initialize chat session on mount
    useEffect(() => {
        initChat();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const initChat = async () => {
        try {
            const response = await fetch(`${API_BASE}/chat/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                setSessionId(data.sessionId);

                // Display initial message
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages.filter((msg: Message) => msg.role === 'assistant'));
                }
            }
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            setMessages([{
                role: 'assistant',
                content: 'Sorry, I\'m having trouble connecting. Please refresh the page or email Paul Dooley at ceo@matchingdonors.com',
                timestamp: new Date()
            }]);
        }
    };

    const sendMessage = async (messageText?: string) => {
        const message = messageText || inputMessage.trim();

        if (!message || !sessionId || isSending) return;

        setIsSending(true);
        setInputMessage('');

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Show typing indicator
        setIsTyping(true)

        try {
            const response = await fetch(`${API_BASE}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message })
            });

            const data = await response.json();

            if (data.success && data.response) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(data.timestamp)
                };
                setMessages(prev => [...prev, assistantMessage]);

                // Check if we should show lead form
                if (shouldShowLeadForm(data.response)) {
                    setTimeout(() => setShowLeadForm(true), 1000);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again or contact Paul Dooley at ceo@matchingdonors.com',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
            setIsSending(false);
        }
    };

    const shouldShowLeadForm = (message: string): boolean => {
        const triggers = [
            'sales rep',
            'contact you',
            'get started',
            'connect you',
            'follow up',
            'schedule a call'
        ];

        const lowerMessage = message.toLowerCase();
        return triggers.some(trigger => lowerMessage.includes(trigger));
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Save chat history
    const saveChatHistoryAsPDF = () => {
        if (messages.length === 0) {
            alert('No chat history to save yet!');
            return;
        }

        // Create a simple HTML representation of the chat
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>MatchingDonors.com - Advertising Chat History</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 3px solid #667eea;
                    }
                    .header h1 {
                        color: #667eea;
                        margin: 0 0 10px 0;
                    }
                    .header p {
                        color: #666;
                        margin: 5px 0;
                    }
                    .message {
                        margin: 20px 0;
                        padding: 15px;
                        border-radius: 10px;
                    }
                    .assistant {
                        background: #f0f4ff;
                        border-left: 4px solid #667eea;
                    }
                    .user {
                        background: #f9f9f9;
                        border-left: 4px solid #999;
                    }
                    .role {
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 5px;
                    }
                    .user .role {
                        color: #666;
                    }
                    .timestamp {
                        font-size: 12px;
                        color: #999;
                        margin-top: 8px;
                    }
                    .content {
                        line-height: 1.6;
                        white-space: pre-wrap;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #eee;
                        text-align: center;
                        font-size: 14px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>MatchingDonors.com Advertising Chat</h1>
                    <p>Conversation History</p>
                    <p>Session ID: ${sessionId}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                </div>
            `;

        messages.forEach((msg) => {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            const role = msg.role === 'assistant' ? 'AI Assistant' : 'You';

            htmlContent += `
                    <div class="message ${msg.role}">
                        <div class="role">${role}</div>
                        <div class="content">${msg.content}</div>
                        <div class="timestamp">${time}</div>
                    </div>
                `;
        });

        htmlContent += `
                    <div class="footer">
                        <p><strong>MatchingDonors.com</strong></p>
                        <p>For inquiries, contact Paul Dooley at ceo@matchingdonors.com</p>
                    </div>
                </body>
                </html>
                `;

        // Create a Blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MatchingDonors-Chat-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show success message
        alert('Chat history saved! Open the HTML file and use your browser\'s Print to PDF feature to create a PDF.');
    };

    const quickActions = [
        { text: 'Pricing', message: 'What are your advertising rates?' },
        { text: 'Audience', message: 'Tell me about your audience' },
        { text: 'Ad Formats', message: 'What ad formats do you offer?' },
        { text: 'Get Started', message: 'How do I get started?' }
    ];

    return (
        <div className="advertiser-chat-container">
            <div className="chat-header">
                <h1>Advertise with MatchingDonors.com</h1>
                <p>Reach 90K+ monthly visitors across our medical network</p>
                {messages.length > 0 && (
                    <button
                        className="save-history-btn"
                        onClick={saveChatHistoryAsPDF}
                        title="Download chat history as HTML (then print to PDF)"
                    >
                        💾 Save Chat History
                    </button>
                )}
            </div>

            <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <div className="message-avatar">AI</div>
                        )}
                        <div className="message-content">
                            {msg.content}
                        </div>
                        {msg.role === 'user' && (
                            <div className="message-avatar">You</div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                )}
            </div>

            <div className="quick-actions">
                {quickActions.map((action, index) => (
                    <button
                        key={index}
                        className="quick-action-btn"
                        onClick={() => sendMessage(action.message)}
                        disabled={isSending}
                    >
                        {/* {action.icon}  */}
                        {action.text}
                    </button>
                ))}
            </div>

            <div className="chat-input-container">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type your question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSending}
                />
                <button
                    className="send-button"
                    onClick={() => sendMessage()}
                    disabled={isSending || !inputMessage.trim()}
                >
                    Send
                </button>
            </div>

            {showLeadForm && (
                <LeadFormModal
                    sessionId={sessionId}
                    onClose={() => setShowLeadForm(false)}
                    onSuccess={(contactName, email) => {
                        setShowLeadForm(false);
                        const successMessage: Message = {
                            role: 'assistant',
                            content: `Thank you, ${contactName}! 🎉\n\nYour information has been received. Paul Dooley and our team will contact you at ${email} within 1 business day to discuss your campaign.\n\nIn the meantime, feel free to ask me any other questions!`,
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, successMessage]);
                    }}
                />
            )}
        </div>
    );
};

interface LeadFormModalProps {
    sessionId: string | null;
    onClose: () => void;
    onSuccess: (contactName: string, email: string) => void;
}

const LeadFormModal: React.FC<LeadFormModalProps> = ({ sessionId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<LeadData>({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        monthlyBudget: '',
        campaignGoals: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, leadData: formData })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(formData.contactName, formData.email);
            } else {
                setError(data.error || 'Failed to submit. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h3>📝 Tell us about your advertising needs</h3>
                <p style={{ color: '#666', marginBottom: '20px', fontSize: '15px' }}>
                    Paul Dooley will personally review your inquiry
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="companyName">Company Name *</label>
                        <input
                            type="text"
                            id="companyName"
                            required
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contactName">Your Name *</label>
                        <input
                            type="text"
                            id="contactName"
                            required
                            value={formData.contactName}
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="monthlyBudget">Monthly Budget</label>
                        <select
                            id="monthlyBudget"
                            value={formData.monthlyBudget}
                            onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                        >
                            <option value="">Select budget range</option>
                            <option value="$500-$1,000">$500 - $1,000</option>
                            <option value="$1,000-$2,500">$1,000 - $2,500</option>
                            <option value="$2,500-$5,000">$2,500 - $5,000</option>
                            <option value="$5,000-$10,000">$5,000 - $10,000</option>
                            <option value="$10,000+">$10,000+</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="campaignGoals">Campaign Goals</label>
                        <textarea
                            id="campaignGoals"
                            placeholder="What would you like to achieve with your advertising?"
                            value={formData.campaignGoals}
                            onChange={(e) => setFormData({ ...formData, campaignGoals: e.target.value })}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdvertiserChat;