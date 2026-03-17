import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function HomeScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        matchesFound: 0,
        profileCompleteness: 0
    });
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // We use a listener so the dashboard updates every time the user navigates back to it!
        const unsubscribe = navigation.addListener('focus', () => {
            loadDashboardData();
        });

        // Load it immediately the first time
        loadDashboardData();
        return unsubscribe;
    }, [navigation]);

    // --- Helper to calculate % complete ---
    const calculateCompleteness = (profile: any) => {
        if (!profile) return 0;

        // List of important fields we want the user to fill out
        const fieldsToCheck = [
            'name', 'blood_type', 'organ_type', 'age',
            'city', 'state', 'description', 'medical_info'
        ];

        let filledFields = 0;
        fieldsToCheck.forEach(field => {
            // Check if the field exists and isn't empty
            if (profile[field] && profile[field].toString().trim() !== '') {
                filledFields++;
            }
        });

        // Calculate percentage (e.g., 4/8 = 50%)
        return Math.round((filledFields / fieldsToCheck.length) * 100);
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('user_token');
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

            // 1. Fetch Profile Data (Using your existing /me route!)
            const profileResponse = await fetch(`${apiUrl}/api/profile/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            let completenessScore = 0;
            let currentProfile = null;

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                currentProfile = profileData.profile;
                if (currentProfile) {
                    setUserName(currentProfile.name || '');
                    completenessScore = calculateCompleteness(currentProfile);
                }
            }

            // 2. Fetch Match Count (Using your existing dummy route for now!)
            // We will upgrade this to the real AI route later.
            let matchesCount = 0;
            const matchResponse = await fetch(`${apiUrl}/api/matches`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (matchResponse.ok) {
                const matchData = await matchResponse.json();
                matchesCount = matchData.matches?.length || 0;
            }

            // 3. Update State
            setStats({
                matchesFound: matchesCount,
                profileCompleteness: completenessScore
            });

        } catch (error) {
            console.error("Network Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={styles.scrollContent}>

            {/* Header Section */}
            <View style={styles.homeHeader}>
                <Text style={styles.title}>Dashboard</Text>
                {/* Dynamically show the user's name if we have it! */}
                <Text style={styles.subtitle}>
                    Welcome back{userName ? `, ${userName}` : ' to the Donor Network'}
                </Text>
            </View>

            {/* Statistics Card */}
            <View style={[styles.card, { margin: 16 }]}>
                <Text style={styles.cardTitle}>Your Impact & Status</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.matchesFound}</Text>
                        <Text style={styles.statLabel}>Potential Matches</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.profileCompleteness}%</Text>
                        <Text style={styles.statLabel}>Profile Complete</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Matches')}
                >
                    <Text style={styles.primaryButtonText}>Find a Match</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.secondaryButtonText}>Update My Profile</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}