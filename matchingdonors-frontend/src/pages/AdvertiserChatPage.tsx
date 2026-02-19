import React, { useState } from 'react';
import AdvertiserChat from '../components/AdvertiserChat/AdvertiserChat';
import RealMessage from '../components/AdvertiserChat/RealMessage';

const AdvertiserChatPage: React.FC = () => {
    // State to toggle between the AI bot and the Live chat
    const [chatMode, setChatMode] = useState<'ai' | 'live'>('ai');

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }}>
            {/* Mode Switcher Tabs */}
            <div style={{
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '10px',
                borderRadius: '8px'
            }}>
                <button
                    onClick={() => setChatMode('ai')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: chatMode === 'ai' ? '#fff' : 'transparent',
                        color: chatMode === 'ai' ? '#764ba2' : '#fff',
                        fontWeight: chatMode === 'ai' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    Talk to AI Assistant
                </button>
                <button
                    onClick={() => setChatMode('live')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: chatMode === 'live' ? '#fff' : 'transparent',
                        color: chatMode === 'live' ? '#764ba2' : '#fff',
                        fontWeight: chatMode === 'live' ? 'bold' : 'normal',
                        transition: 'all 0.3s'
                    }}
                >
                    Direct Message Sponsor
                </button>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '800px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                {chatMode === 'ai' ? (
                    <AdvertiserChat />
                ) : (
                    // Note: In a fully finished app, these props would likely come from 
                    // a URL parameter (e.g., /chat/:advertiserId) or a selected list.
                    // We are hardcoding them here for testing!
                    <RealMessage advertiserId="test_sponsor_123" advertiserName="HealthCorp" />
                )}
            </div>
        </div>
    );
};

export default AdvertiserChatPage;