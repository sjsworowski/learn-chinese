/// <reference types="vite/client" />
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
    id: string
    email: string
    username: string
}

interface AuthContextType {
    user: User | null
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
    register: (email: string, password: string, username?: string) => Promise<{ needsVerification: boolean; email?: string }>
    verifyEmail: (token: string) => Promise<void>
    resendVerificationEmail: (email: string) => Promise<void>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

const setStoredToken = (token: string, remember: boolean) => {
    if (remember) {
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token');
    } else {
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token');
    }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const checkAuth = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL;
            const response = await axios.get(`${API_BASE}/auth/me`)
            setUser(response.data)
        } catch (error) {
            localStorage.removeItem('token')
            sessionStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
        } finally {
            setIsLoading(false)
        }
    }

    // Initial auth check
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            checkAuth()
        } else {
            setIsLoading(false)
        }
    }, [])

    // When user verifies in another tab, that tab sets the token; this tab gets a storage event — go to dashboard (reload will pick up token)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'token' && e.newValue) {
                window.location.replace('/')
            }
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [])

    const login = async (email: string, password: string, rememberMe = true) => {
        const API_BASE = import.meta.env.VITE_API_URL;
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password, rememberMe });
        const { access_token, user: userData } = response.data;
        setStoredToken(access_token, rememberMe);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(userData);
        toast.success('Signed in successfully');
    }

    const register = async (email: string, password: string, username?: string): Promise<{ needsVerification: boolean; email?: string }> => {
        const API_BASE = import.meta.env.VITE_API_URL;
        const response = await axios.post(`${API_BASE}/auth/register`, { email, password, username });
        const data = response.data;
        // Never log in from register — verification is required. Clear any existing session so user isn't "logged in" from before.
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        toast.success(data.message || 'Check your email to verify your account.');
        return { needsVerification: true, email: data.email ?? email };
    }

    const resendVerificationEmail = async (email: string) => {
        const API_BASE = import.meta.env.VITE_API_URL;
        try {
            await axios.post(`${API_BASE}/auth/resend-verification`, { email });
            toast.success('Verification email sent. Check your inbox.');
        } catch (err: any) {
            if (err.response?.status === 404) {
                toast.error('Resend isn\'t available on this server. Use the link from the email we sent when you signed up, or try again later.');
                return;
            }
            throw err;
        }
    }

    const verifyEmail = async (token: string) => {
        const API_BASE = import.meta.env.VITE_API_URL;
        const response = await axios.post(`${API_BASE}/auth/verify-email`, { token });
        const { access_token, user: userData } = response.data;
        setStoredToken(access_token, true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(userData);
        toast.success('Email verified. You\'re signed in!');
    }

    const logout = () => {
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        toast.success('Logged out successfully')
    }

    const value = {
        user,
        login,
        register,
        verifyEmail,
        resendVerificationEmail,
        logout,
        isLoading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
