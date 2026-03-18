import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Linking
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from '../../App.styles';

export default function MatchesScreen({ navigation }: any) {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'roles' | 'news'>('roles');
    const [matches, setMatches] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [readMatches, setReadMatches] = useState<Set<string>>(new Set());
    const [readNews, setReadNews] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Refresh the match list every time the user opens this tab
        const unsubscribe = navigation.addListener('focus', () => {
            loadMatches();
            loadNews();
        });
        loadMatches();
        loadNews();
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

    const loadNews = async () => {
        // Mocking AI-Matched News. We will replace this with a real fetch later!
        const dummyNews = [
            {
                id: 'n1',
                title: 'Breakthrough in Anti-Rejection Medication Trials',
                keywords: ['Medication', 'Research', 'Post-Op'],
                url: 'https://www.webmd.com/'
            },
            {
                id: 'n2',
                title: 'Dietary Guidelines for Kidney Health',
                keywords: ['Diet', 'Kidney', 'Wellness'],
                url: 'https://www.kidney.org/'
            }
        ];
        setNews(dummyNews);
    };

    // --- Interactions ---
    const handleMatchPress = (item: any) => {
        // Mark as read to remove the red dot
        setReadMatches(prev => new Set(prev).add(item.id.toString()));
        Alert.alert("Coming Soon", `View full medical profile for ${item.name}`);
    };

    const handleNewsPress = (item: any) => {
        // Mark as read
        setReadNews(prev => new Set(prev).add(item.id.toString()));
        // Open device's default web browser!
        Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err));
    };

    // This function designs how a single match card looks
    const renderMatchCard = ({ item }: { item: any }) => {
        const isRead = readMatches.has(item.id.toString());

        return (
            <View style={[styles.card, styles.matchCardWrapper]}>
                <View style={styles.matchCardHeader}>

                    <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, styles.matchCardTitle]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        {/* UNREAD RED DOT */}
                        {!isRead && <View style={styles.unreadDot} />}
                    </View>

                    <View style={styles.badgeContainer}>
                        <View style={styles.primaryBadge}>
                            <Text style={styles.badgeText}>{item.bloodType}</Text>
                        </View>
                        {item.similarity ? (
                            <View style={styles.successBadge}>
                                <Text style={styles.badgeText}>{item.similarity}% Match</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <Text style={[styles.cardText, styles.matchLocationText]}>📍 {item.location}</Text>

                <TouchableOpacity
                    style={[styles.primaryButton, styles.matchButton]}
                    onPress={() => handleMatchPress(item)}
                >
                    <Text style={styles.primaryButtonText}>View Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderNewsCard = ({ item }: { item: any }) => {
        const isRead = readNews.has(item.id.toString());

        return (
            <View style={[styles.card, styles.matchCardWrapper]}>
                <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    {/* UNREAD RED DOT */}
                    {!isRead && <View style={styles.unreadDot} />}
                </View>

                {/* Tags/Keywords */}
                <View style={styles.newsKeywordsRow}>
                    {item.keywords.map((kw: string, idx: number) => (
                        <View key={idx} style={styles.newsKeywordBadge}>
                            <Text style={styles.newsKeywordText}>#{kw}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.secondaryButton, styles.matchButton]}
                    onPress={() => handleNewsPress(item)}
                >
                    <Text style={styles.secondaryButtonText}>Read Article</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Loading feed...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>

            <View style={[styles.homeHeader, { paddingBottom: 16 }]}>
                <Text style={styles.title}>Your Feed</Text>
                <Text style={styles.subtitle}>Compatible profiles and tailored news</Text>
            </View>

            {/* TOP TAB TOGGLES */}
            <View style={styles.topTabContainer}>
                <TouchableOpacity
                    style={[styles.topTabButton, activeTab === 'roles' && styles.topTabActive]}
                    onPress={() => setActiveTab('roles')}
                >
                    <Text style={[styles.topTabText, activeTab === 'roles' && styles.topTabTextActive]}>
                        Matched Roles
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.topTabButton, activeTab === 'news' && styles.topTabActive]}
                    onPress={() => setActiveTab('news')}
                >
                    <Text style={[styles.topTabText, activeTab === 'news' && styles.topTabTextActive]}>
                        Matched News
                    </Text>
                </TouchableOpacity>
            </View>

            {/* LIST CONTENT */}
            {activeTab === 'roles' ? (
                matches.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.cardText}>No matches found yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={matches}
                        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                        renderItem={renderMatchCard}
                        showsVerticalScrollIndicator={false}
                    />
                )
            ) : (
                <FlatList
                    data={news}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNewsCard}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}