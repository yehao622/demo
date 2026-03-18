import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    // --- Existing Shared Styles ---
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#38bdf8',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 10,
        padding: 4,
        marginBottom: 30,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeRole: {
        backgroundColor: '#38bdf8',
    },
    roleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    activeRoleText: {
        color: '#0f172a',
    },
    formContainer: {
        width: '100%',
    },
    input: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    loginButton: {
        backgroundColor: '#38bdf8',
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    loginButtonText: {
        color: '#0f172a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    cardText: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 2,
    },

    // --- New Home Dashboard Styles ---
    scrollContent: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a'
    },
    loadingText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 16,
    },
    homeHeader: {
        padding: 24,
        paddingTop: 48,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#334155'
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12
    },
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#334155',
        marginHorizontal: 10,
    },
    statNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#38bdf8'
    },
    statLabel: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 6,
        fontWeight: '500'
    },
    actionSection: {
        padding: 16,
        marginTop: 8
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#f8fafc',
        marginLeft: 4
    },
    primaryButton: {
        backgroundColor: '#38bdf8',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: 'bold'
    },
    secondaryButton: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155'
    },
    secondaryButtonText: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 'bold'
    },

    // --- Matches Screen Specific Styles ---
    matchCardWrapper: {
        marginHorizontal: 16,
        marginBottom: 12
    },
    matchCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    matchCardTitle: {
        flex: 1
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 6
    },
    primaryBadge: {
        backgroundColor: '#0284C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    successBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    badgeText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13
    },
    matchLocationText: {
        marginBottom: 12
    },
    matchButton: {
        padding: 12,
        marginBottom: 0
    },

    topTabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 8,
        padding: 4,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    topTabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    topTabActive: {
        backgroundColor: '#38bdf8',
    },
    topTabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#94a3b8',
    },
    topTabTextActive: {
        color: '#0f172a',
    },

    // --- Unread Badge & News Styles ---
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444', // Red alert color
        marginLeft: 8,
        // Glowing effect
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
    },
    newsKeywordsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
        marginTop: 4,
    },
    newsKeywordBadge: {
        backgroundColor: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    newsKeywordText: {
        color: '#94a3b8',
        fontSize: 12,
    }
});