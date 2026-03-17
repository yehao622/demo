import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function MatchesScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState<any[]>([]);

    useEffect(() => {
        // Refresh the match list every time the user opens this tab
        const unsubscribe = navigation.addListener('focus', () => {
            loadMatches();
        });

        loadMatches();
        return unsubscribe;
    }, [navigation]);

    const loadMatches = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('user_token');
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

            // Fetching from your current dummy route in index.ts
            const response = await fetch(`${apiUrl}/api/matches`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMatches(data.matches || []);
            } else {
                console.error("Failed to fetch matches");
            }
        } catch (error) {
            console.error("Error loading matches:", error);
        } finally {
            setLoading(false);
        }
    };

    // This function designs how a single match card looks
    const renderMatchCard = ({ item }: { item: any }) => (
        <View style={[styles.card, { marginHorizontal: 16, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>

                {/* Blood Type Badge */}
                <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{item.bloodType}</Text>
                </View>
            </View>

            <Text style={[styles.cardText, { marginBottom: 12 }]}>📍 {item.location}</Text>

            <TouchableOpacity
                style={[styles.primaryButton, { padding: 12, marginBottom: 0 }]}
                onPress={() => Alert.alert("Coming Soon", `View full medical profile for ${item.name}`)}
            >
                <Text style={styles.primaryButtonText}>View Details</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Finding best matches...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>

            <View style={styles.homeHeader}>
                <Text style={styles.title}>Your Matches</Text>
                <Text style={styles.subtitle}>Highly compatible profiles near you</Text>
            </View>

            {matches.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.cardText}>No matches found yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                    renderItem={renderMatchCard}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}