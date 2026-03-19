import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native'
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    // --- UI States ---
    const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [loading, setLoading] = useState(false);

    // --- Form States ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<'patient' | 'donor'>('patient');

    // --- Forgot Password Specific States ---
    const [resetStep, setResetStep] = useState<1 | 2>(1); // 1: Request Code, 2: Submit Code
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

    const handleLogin = async () => {
        if (!email || !password)
            return Alert.alert('Error', 'Please enter email and password');
        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                await SecureStore.setItemAsync('user_token', data.token);
                await SecureStore.setItemAsync('user_role', data.user.role);
                onLoginSuccess();
            } else {
                Alert.alert('Login Failed', data.error || 'Invalid credentials');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to the backend server.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !firstName || !lastName) {
            return Alert.alert('Error', 'Please fill in all fields');
        }

        if (password !== confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match!');
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName, lastName, role })
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'Account created! Please log in.');
                setViewMode('login');
                setPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Registration Failed', data.error || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPasswordReset = async () => {
        if (!email) return Alert.alert('Error', 'Please enter your email address');
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role })
            });
            if (response.ok) {
                Alert.alert('Code Sent!', 'Check your email for the 6-digit code.');
                setResetStep(2); // Move to the "Enter Code" step
            } else {
                Alert.alert('Error', 'Could not process request for this email.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetCode || !newPassword || !confirmPassword) {
            return Alert.alert('Error', 'Please fill in all fields');
        }

        // Check if the new passwords match!
        if (newPassword !== confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match!');
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: resetCode, newPassword, role })
            });
            if (response.ok) {
                Alert.alert('Success', 'Password has been reset! Please log in.');
                setViewMode('login');
                setResetStep(1);
                setResetCode('');
                setNewPassword('');
                setConfirmPassword('');
                setPassword('');
            } else {
                Alert.alert('Error', 'Invalid or expired code.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: '#0f172a', padding: 20 }}>
            <View style={styles.header}>
                <Text style={styles.title}>MatchingDonors</Text>
                <Text style={styles.subtitle}>
                    {viewMode === 'login' ? 'Sign in to continue' :
                        viewMode === 'register' ? 'Create a new account' : 'Reset your password'}
                </Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.roleContainer}>
                    <TouchableOpacity style={[styles.roleButton, role === 'patient' && styles.activeRole]} onPress={() => setRole('patient')}>
                        <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.roleButton, role === 'donor' && styles.activeRole]} onPress={() => setRole('donor')}>
                        <Text style={[styles.roleText, role === 'donor' && styles.activeRoleText]}>Donor</Text>
                    </TouchableOpacity>
                </View>

                {/* --- REGISTER VIEW --- */}
                {viewMode === 'register' && (
                    <>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="First Name"
                                placeholderTextColor="#64748b"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Last Name"
                                placeholderTextColor="#64748b"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </>
                )}

                {/* --- FORGOT PASSWORD VIEW --- */}
                {viewMode === 'forgot' && resetStep === 2 && (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="6-Digit Code"
                            placeholderTextColor="#64748b"
                            keyboardType="number-pad"
                            value={resetCode}
                            onChangeText={setResetCode} />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#64748b"
                            secureTextEntry value={newPassword}
                            onChangeText={setNewPassword} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#64748b"
                            secureTextEntry value={confirmPassword}
                            onChangeText={setConfirmPassword} />
                    </>
                )}

                {/* --- COMMON FIELDS (Email/Password) --- */}
                {(viewMode === 'login' || viewMode === 'register' || (viewMode === 'forgot' && resetStep === 1)) && (
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                )}

                {/* Show Password for both Login AND Register */}
                {(viewMode === 'login' || viewMode === 'register') && (
                    <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry value={password} onChangeText={setPassword} />
                )}

                {/* Show Confirm Password ONLY for Register */}
                {viewMode === 'register' && (
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#64748b"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                )}

                {/* --- SUBMIT BUTTONS --- */}
                <TouchableOpacity
                    style={styles.loginButton}
                    disabled={loading}
                    onPress={
                        viewMode === 'login' ? handleLogin :
                            viewMode === 'register' ? handleRegister :
                                resetStep === 1 ? handleRequestPasswordReset : handleResetPassword
                    }
                >
                    {loading ? <ActivityIndicator color="#0f172a" /> : (
                        <Text style={styles.loginButtonText}>
                            {viewMode === 'login' ? 'Sign In' :
                                viewMode === 'register' ? 'Create Account' :
                                    resetStep === 1 ? 'Send Code' : 'Reset Password'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* --- NAVIGATION LINKS --- */}
                <View style={{ marginTop: 24, alignItems: 'center', gap: 12 }}>
                    {viewMode === 'login' ? (
                        <>
                            <TouchableOpacity onPress={() => setViewMode('forgot')}>
                                <Text style={{ color: '#38bdf8', fontSize: 14 }}>Forgot Password?</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setViewMode('register')}>
                                <Text style={{ color: '#94a3b8', fontSize: 14 }}>Don't have an account? <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>Sign Up</Text></Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={() => { setViewMode('login'); setResetStep(1); }}>
                            <Text style={{ color: '#94a3b8', fontSize: 14 }}>Back to <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>Sign In</Text></Text>
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        </ScrollView>
    );
}