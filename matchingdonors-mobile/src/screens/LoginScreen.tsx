import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [role, setRole] = useState<'patient' | 'donor'>('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Login Failed', data.error || 'Invalid credentials');
                return;
            }

            await SecureStore.setItemAsync('user_token', data.token);
            await SecureStore.setItemAsync('user_role', role);

            // Tell App.tsx to change the view!
            onLoginSuccess();

        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to the backend server.');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>MatchingDonors</Text>
                <Text style={styles.subtitle}>Welcome back. Please log in.</Text>
            </View>

            <View style={styles.roleContainer}>
                <TouchableOpacity style={[styles.roleButton, role === 'patient' && styles.activeRole]} onPress={() => setRole('patient')}>
                    <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleButton, role === 'donor' && styles.activeRole]} onPress={() => setRole('donor')}>
                    <Text style={[styles.roleText, role === 'donor' && styles.activeRoleText]}>Donor</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input} placeholder="Email address" placeholderTextColor="#64748b"
                    value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                />
                <TextInput
                    style={styles.input} placeholder="Password" placeholderTextColor="#64748b"
                    value={password} onChangeText={setPassword} secureTextEntry
                />
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="light" />
        </KeyboardAvoidingView>
    );
}