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

            const response = await fetch(`${apiUrl}/api/mobile/matches`, {
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
        try {
            const token = await SecureStore.getItemAsync('user_token');
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

            const response = await fetch(`${apiUrl}/api/mobile/news`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setNews(data);
                } else if (data && Array.isArray(data.news)) {
                    setNews(data.news);
                } else {
                    console.warn("News data was not an array:", data);
                    setNews([]);
                }
            } else {
                console.error("Failed to fetch news. Status:", response.status);
            }
        } catch (error) {
            console.error("Error loading news:", error);
        }
    };

    // --- Interactions ---
    const handleMatchPress = (item: any) => {
        setReadMatches(prev => new Set(prev).add(item.id.toString()));
        Alert.alert("Coming Soon", `View full medical profile for ${item.name}`);
    };

    const handleNewsPress = (item: any) => {
        setReadNews(prev => new Set(prev).add(item.id.toString()));
        Linking.openURL(item.url).catch(err => console.error("Couldn't load page", err));
    };

    // --- Renderers ---
    const renderMatchCard = ({ item }: { item: any }) => {
        const isRead = readMatches.has(item.id.toString());

        return (
            <View style={[styles.card, styles.matchCardWrapper]}>
                <View style={styles.matchCardHeader}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, styles.matchCardTitle]} numberOfLines={1}>
                            {item.name}
                        </Text>
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
        const itemId = item?.id ? item.id.toString() : Math.random().toString();
        const isRead = readNews.has(item.id);

        return (
            <View style={[styles.card, styles.matchCardWrapper]}>
                <View style={styles.titleRow}>
                    {/* Extracted inline styles to styles.newsCardTitleFlex */}
                    <Text style={[styles.cardTitle, styles.newsCardTitleFlex]} numberOfLines={2}>
                        {item?.title || 'Untitled Article'}
                    </Text>
                    {!isRead && <View style={styles.unreadDot} />}
                </View>

                {/* Extracted inline styles to App.styles.ts */}
                <Text style={styles.newsCardSummary} numberOfLines={3}>
                    {item?.summary || 'No summary available.'}
                </Text>

                <Text style={styles.newsCardSource}>
                    Source: {item?.source || 'Unknown Publisher'}
                </Text>

                <TouchableOpacity
                    style={[styles.secondaryButton, styles.matchButton]}
                    onPress={() => item?.url && handleNewsPress(item)}
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
        // 🚀 FIXED: Extracted background color inline style
        <View style={styles.matchesScreenContainer}>

            {/* 🚀 FIXED: Extracted paddingBottom inline style */}
            <View style={[styles.homeHeader, styles.matchesHeaderPadding]}>
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
                news.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.cardText}>No news articles available.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={news}
                        keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                        renderItem={renderNewsCard}
                        showsVerticalScrollIndicator={false}
                    />
                )
            )}
        </View>
    );
}