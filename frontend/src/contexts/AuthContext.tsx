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
    register: (email: string, username: string, password: string, rememberMe?: boolean) => Promise<void>
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

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            checkAuth()
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkAuth = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL;
            const response = await axios.get(`${API_BASE}/auth/me`)
            setUser(response.data)
        } catch (error) {
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string, rememberMe?: boolean) => {
        try {
            console.log('Attempting login with:', email)
            const API_BASE = import.meta.env.VITE_API_URL;
            const response = await axios.post(`${API_BASE}/auth/login`, { email, password, rememberMe });
            const { access_token, user } = response.data;

            setStoredToken(access_token, rememberMe ?? true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            await checkAuth();
            toast.success('Login successful!');
        } catch (error: any) {
            console.log('Login error:', error)
            toast.error(error.response?.data?.message || 'Login failed')
            throw error
        }
    }

    const register = async (email: string, username: string, password: string, rememberMe?: boolean) => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL;
            const response = await axios.post(`${API_BASE}/auth/register`, { email, username, password, rememberMe });
            const { access_token, user } = response.data;
            setStoredToken(access_token, rememberMe ?? true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            setUser(user);
            toast.success('Registration successful!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
            throw error;
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        toast.success('Logged out successfully')
    }

    const value = {
        user,
        login,
        register,
        logout,
        isLoading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 