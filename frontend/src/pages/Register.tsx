import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

const POLL_INTERVAL_MS = 2000

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const { register, resendVerificationEmail } = useAuth()

    // When user verifies (same or different tab/browser), redirect to dashboard. Poll: (1) localStorage for same browser, (2) API for different browser/tab.
    useEffect(() => {
        if (!emailSent || !email) return
        const API_BASE = import.meta.env.VITE_API_URL
        const id = setInterval(async () => {
            if (localStorage.getItem('token')) {
                window.location.replace('/')
                return
            }
            try {
                const res = await fetch(`${API_BASE}/auth/verification-status?email=${encodeURIComponent(email)}`)
                const data = await res.json()
                if (data.verified) {
                    // Different browser/tab: no token here, so send to login with message
                    window.location.replace(`/login?verified=1&email=${encodeURIComponent(email)}`)
                }
            } catch {
                // ignore
            }
        }, POLL_INTERVAL_MS)
        return () => clearInterval(id)
    }, [emailSent, email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        setIsLoading(true)
        try {
            const result = await register(email, password, username.trim() || undefined)
            // Always show "check your email" after signup — never navigate to dashboard until they verify
            setEmailSent(true)
        } catch (error: any) {
            const msg = error.response?.data?.message || error.response?.data?.error || 'Registration failed'
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    if (emailSent) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 w-full text-center">
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                            <Mail className="h-8 w-8 text-gray-700 mx-auto" />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h2>
                        <p className="mt-2 text-gray-600">
                            We sent a verification link to <strong>{email}</strong>
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            Click the link in the email to verify your account, then you can sign in.
                        </p>
                        <button
                            type="button"
                            onClick={async () => {
                                setResendLoading(true)
                                try {
                                    await resendVerificationEmail(email)
                                } catch (e: any) {
                                    toast.error(e.response?.data?.message || 'Failed to resend')
                                } finally {
                                    setResendLoading(false)
                                }
                            }}
                            disabled={resendLoading}
                            className="mt-4 text-sm font-medium text-gray-700 hover:underline disabled:opacity-50"
                        >
                            {resendLoading ? 'Sending…' : 'Resend verification email'}
                        </button>
                        <Link to="/login" className="mt-10 block text-sm font-medium text-gray-900 hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md mx-auto p-6">
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 w-full">
                    <div>
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                            <BookOpen className="h-8 w-8 text-gray-700" />
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Sign up with email and password
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username (optional)
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Username (optional)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Password (min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto"></div>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register
