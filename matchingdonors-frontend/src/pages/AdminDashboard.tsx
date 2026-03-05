import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/auth.types';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import '../styles/AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Secret Door Security Check
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        // If they are logged in but NOT an admin, bounce them to their profile!
        if (user && !user.is_admin) {
            console.warn("Unauthorized access attempt to admin dashboard.");
            navigate('/profile-fill');
        }
    }, [user, isAuthenticated, navigate]);

    // 2. Fetch all users for the dashboard
    useEffect(() => {
        if (user?.is_admin) {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/admin/users');
            setUsers(response.data.users);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSoftDelete = async (userId: string | number) => {
        if (!window.confirm("Are you sure you want to suspend this user?")) return;

        try {
            // We will build this backend route next!
            await api.patch(`/api/admin/users/${userId}/status`, { is_active: false });

            // Update the UI to reflect the suspended state
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
        } catch (err) {
            alert("Failed to update user status.");
        }
    };

    if (isLoading) return <LoadingSpinner message="Verifying Admin Credentials..." />;
    if (!user?.is_admin) return null;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <h2>🛡️ System Administrator Dashboard</h2>
                <span className="top-secret-badge">Top Secret</span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="users-table-wrapper">
                <h3>Manage Users</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.firstName} {u.lastName}</td>
                                <td>{u.email}</td>
                                <td><span className="role-badge">{u.role}</span></td>
                                <td>
                                    {u.is_active !== false ?
                                        <span className="status-active">🟢 Active</span> :
                                        <span className="status-suspended">🔴 Suspended</span>
                                    }
                                </td>
                                <td>
                                    {u.is_active !== false && (
                                        <button
                                            className="suspend-btn"
                                            onClick={() => handleSoftDelete(u.id)}
                                        >
                                            Suspend User
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};