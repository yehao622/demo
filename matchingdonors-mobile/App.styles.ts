import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
});