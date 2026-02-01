import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import '../../styles/UserHeader.css';

export const UserHeader: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const getRoleIcon = () => {
        return user.role === 'patient' ? '🙏' : '❤️';
    };

    const getRoleLabel = () => {
        return user.role === 'patient' ? 'Patient' : 'Donor';
    };

    return (
        <div className="user-header">
            <div className="user-info">
                <span className="user-role-icon">{getRoleIcon()}</span>
                <span className="user-greeting">
                    Welcome, <strong>{user.firstName}</strong>!
                </span>
                <span className="user-role-badge">{getRoleLabel()}</span>
            </div>
            <button className="logout-btn" onClick={logout}>
                Logout
            </button>
        </div>
    );
};