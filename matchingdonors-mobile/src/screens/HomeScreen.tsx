import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../../App.styles';

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home</Text>
            <Text style={styles.subtitle}>Welcome to the Donor Network</Text>
        </View>
    );
}