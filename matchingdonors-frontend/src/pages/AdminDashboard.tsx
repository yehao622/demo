import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/auth.types';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import '../styles/AdminDashboard.css';

interface UnlabeledArticle {
    id: number | string;
    title: string;
    source: string;
    url: string;
    published_at: string;
}

// 1. Define the Lead interface based on your backend model
interface Lead {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    monthlyBudget?: string;
    campaignGoals?: string;
    status: string;
    timestamp: string;
}

export const AdminDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'users' | 'leads' | 'articles'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [unlabeledArticles, setUnlabeledArticles] = useState<UnlabeledArticle[]>([]);
    const [isRetrying, setIsRetrying] = useState<string | number | null>(null);

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
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            const [usersRes, leadsRes, articlesRes] = await Promise.all([
                api.get('/api/admin/users'),
                api.get('/api/advertiser/leads'),
                api.get('/api/admin/articles/unlabeled')
            ]);

            setUsers(usersRes.data.users);
            setLeads(leadsRes.data.leads);
            setUnlabeledArticles(articlesRes.data.articles || []);
        } catch (err: any) {
            setError('Failed to fetch dashboard data. Please check your connection.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetryLabeling = async (articleId: string | number) => {
        try {
            setIsRetrying(articleId);
            await api.post(`/api/admin/articles/${articleId}/retry`);
            alert('Success! AI labeled the article.');
            // Remove the article from the "unlabeled" list
            setUnlabeledArticles(unlabeledArticles.filter(a => a.id !== articleId));
        } catch (err) {
            alert('AI failed to label the article. The content might be too short or complex.');
        } finally {
            setIsRetrying(null);
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

    // --- Lead Actions ---
    const handleLeadStatusChange = async (leadId: string, newStatus: string) => {
        try {
            await api.patch(`/api/advertiser/leads/${leadId}/status`, { status: newStatus });
            // Update the local state so the UI reacts instantly
            setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        } catch (err) {
            alert("Failed to update lead status.");
        }
    };

    if (isLoading) return <LoadingSpinner message="Verifying Admin Credentials..." />;
    if (!user?.is_admin) return null;

    return (
        <div className="admin-dashboard-container">
            <div className="admin-header">
                <h2>🛡️ System Administrator Dashboard</h2>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Manage Users
                </button>
                <button
                    className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leads')}
                >
                    📈 Sponsor Leads ({leads.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'articles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('articles')}
                >
                    📰 Unlabeled Articles {unlabeledArticles.length > 0 && <span style={{ color: 'red' }}>({unlabeledArticles.length})</span>}
                </button>
            </div>

            <div className="users-table-wrapper">
                {activeTab === 'users' && (
                    <>
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
                    </>
                )}

                {activeTab === 'leads' && (
                    <>
                        <h3>AI-Generated Sponsor Leads</h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Company / Contact</th>
                                    <th>Contact Info</th>
                                    <th>Budget & Goals</th>
                                    <th>Sales Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-leads-cell">
                                            No leads have been generated yet. Talk to the AI Advertiser Agent to generate one!
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map(lead => (
                                        <tr key={lead.id}>
                                            <td className="lead-date-cell">
                                                {new Date(lead.timestamp).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <strong>{lead.companyName}</strong><br />
                                                <span className="lead-sub-text">{lead.contactName}</span>
                                            </td>
                                            <td>
                                                <a href={`mailto:${lead.email}`}>{lead.email}</a><br />
                                                <span className="lead-sub-text">{lead.phone || 'No phone provided'}</span>
                                            </td>
                                            <td>
                                                <strong>{lead.monthlyBudget || 'N/A'}</strong><br />
                                                <span className="lead-meta-text">{lead.campaignGoals || 'No goals specified'}</span>
                                            </td>
                                            <td>
                                                <select
                                                    className={`status-select status-${lead.status}`}
                                                    value={lead.status}
                                                    onChange={(e) => handleLeadStatusChange(lead.id, e.target.value)}
                                                >
                                                    <option value="new">🆕 New</option>
                                                    <option value="contacted">📞 Contacted</option>
                                                    <option value="qualified">⭐ Qualified</option>
                                                    <option value="converted">✅ Converted</option>
                                                    <option value="rejected">❌ Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </>
                )}


                {activeTab === 'articles' && (
                    <>
                        <h3>⚠️ Articles Missing AI Topics</h3>
                        <p style={{ color: '#666', marginBottom: '15px' }}>
                            These articles were scraped but Gemini failed to assign them topics. They will not appear in the News Hub search until they are labeled.
                        </p>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Source</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unlabeledArticles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="empty-leads-cell">
                                            🎉 All articles are perfectly labeled!
                                        </td>
                                    </tr>
                                ) : (
                                    unlabeledArticles.map(article => (
                                        <tr key={article.id}>
                                            <td>{article.id}</td>
                                            <td>
                                                <strong>{article.title}</strong><br />
                                                <a href={article.url} target="_blank" rel="noreferrer" className="lead-meta-text">View Original Article</a>
                                            </td>
                                            <td>{article.source}</td>
                                            <td>
                                                <button
                                                    className="suspend-btn"
                                                    style={{ backgroundColor: '#667eea' }}
                                                    onClick={() => handleRetryLabeling(article.id)}
                                                    disabled={isRetrying === article.id}
                                                >
                                                    {isRetrying === article.id ? '🤖 Thinking...' : '🤖 Retry Gemini'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};