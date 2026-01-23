import React from 'react';
import AdvertiserChat from '../components/AdvertiserChat/AdvertiserChat';

const AdvertiserChatPage: React.FC = () => {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }}>
            <AdvertiserChat />
        </div>
    );
};

export default AdvertiserChatPage;