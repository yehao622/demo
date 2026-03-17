import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = await SecureStore.getItemAsync('user_token');
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

            const response = await fetch(`${apiUrl}/api/profile/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data.profile);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            Alert.alert("Error", "Could not load your profile data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const ReadOnlyField = ({ label, value }: { label: string, value?: string }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.cardText}>{label}</Text>
            <View style={[styles.input, { paddingVertical: 14, backgroundColor: '#0f172a', borderColor: '#1e293b' }]}>
                <Text style={{ color: value ? '#f8fafc' : '#64748b', fontSize: 16 }}>
                    {value || 'Not provided'}
                </Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={styles.scrollContent}>

            <View style={styles.homeHeader}>
                <Text style={styles.title}>My Profile</Text>
                <Text style={styles.subtitle}>Your medical details (View Only)</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.formContainer}>

                    {/* Security Info Banner */}
                    <View style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: '#38bdf8' }}>
                        <Text style={{ color: '#38bdf8', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                            🔒 For your security and data accuracy, medical details can only be edited on the secure web dashboard.
                        </Text>
                    </View>

                    <ReadOnlyField label="Full Name" value={profile?.name} />
                    <ReadOnlyField label="Age" value={profile?.age?.toString()} />
                    <ReadOnlyField label="Blood Type" value={profile?.blood_type} />
                    <ReadOnlyField label="Organ Type" value={profile?.organ_type} />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                            <ReadOnlyField label="City" value={profile?.city} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ReadOnlyField label="State" value={profile?.state} />
                        </View>
                    </View>

                    <ReadOnlyField label="Medical Description" value={profile?.description} />

                </View>
            </View>

            {/* Logout Section */}
            <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: '#ef4444' }]}
                    onPress={onLogout}
                >
                    <Text style={[styles.secondaryButtonText, { color: '#ef4444' }]}>Sign Out</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}