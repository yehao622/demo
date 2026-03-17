import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function MatchesScreen() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSecureMatches();
    }, []);

    const fetchSecureMatches = async () => {
        try {
            const token = await SecureStore.getItemAsync('user_token');
            if (!token) {
                setError('No authentication token found. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/matches`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error(`Backend rejected request: ${response.status}`);

            const data = await response.json();
            setMatches(data.matches || []);
        } catch (err: any) {
            setError(err.message || 'Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={[styles.subtitle, { marginTop: 10 }]}>Finding your matches...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={[styles.title, { color: '#ef4444' }]}>Oops!</Text>
                <Text style={styles.subtitle}>{error}</Text>
                <TouchableOpacity style={styles.loginButton} onPress={fetchSecureMatches}>
                    <Text style={styles.loginButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { padding: 0 }]}>
            <View style={[styles.header, { marginTop: 40 }]}>
                <Text style={styles.title}>Your Matches</Text>
                <Text style={styles.subtitle}>Securely fetched from your database.</Text>
            </View>
            <FlatList
                data={matches}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ListEmptyComponent={<Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No matches found yet.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.name || 'Unknown User'}</Text>
                        <Text style={styles.cardText}>Blood Type: {item.bloodType || 'N/A'}</Text>
                        <Text style={styles.cardText}>Location: {item.location || 'N/A'}</Text>
                    </View>
                )}
            />
        </View>
    );
}