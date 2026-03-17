import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../App.styles';

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>Manage your account securely</Text>

            <TouchableOpacity style={styles.loginButton} onPress={onLogout}>
                <Text style={styles.loginButtonText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}