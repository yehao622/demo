// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios globally
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            interceptors: {
                request: { use: jest.fn(), eject: jest.fn() },
                response: { use: jest.fn(), eject: jest.fn() },
            },
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
        })),
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    },
}));

// Mock AuthService
jest.mock('./services/auth.service', () => ({
    AuthService: {
        register: jest.fn(),
        login: jest.fn(),
        getCurrentUser: jest.fn(),
        forgotPassword: jest.fn(),
        verifyResetCode: jest.fn(),
        resetPassword: jest.fn(),
        storeAuthData: jest.fn(),
        getStoredAuthData: jest.fn(() => ({ token: null, user: null })),
        clearAuthData: jest.fn(),
    },
}));