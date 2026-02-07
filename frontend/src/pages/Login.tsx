import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [unverifiedMessage, setUnverifiedMessage] = useState<string | null>(null)
    const [resendLoading, setResendLoading] = useState(false)
    const { login, resendVerificationEmail } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        const verified = searchParams.get('verified')
        const emailFromUrl = searchParams.get('email')
        if (verified === '1') {
            toast.success('Your email is verified. Sign in to continue.')
            if (emailFromUrl && !email) setEmail(decodeURIComponent(emailFromUrl))
            setSearchParams({}, { replace: true })
        }
    }, [searchParams, setSearchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setUnverifiedMessage(null)
        setIsLoading(true)
        try {
            await login(email, password, rememberMe)
            navigate('/')
        } catch (error: any) {
            const msg = error.response?.data?.message || error.response?.data?.error || 'Invalid email or password'
            const isUnverified = typeof msg === 'string' && msg.toLowerCase().includes('verify your email')
            if (isUnverified) {
                setUnverifiedMessage(msg)
            } else {
                toast.error(msg)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendVerification = async () => {
        if (!email) return
        setResendLoading(true)
        try {
            await resendVerificationEmail(email)
            setUnverifiedMessage(null)
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resend email')
        } finally {
            setResendLoading(false)
        }
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
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your email and password
                        </p>
                    </div>
                    {unverifiedMessage && (
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">{unverifiedMessage}</p>
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                                className="mt-3 text-sm font-medium text-amber-800 underline hover:no-underline disabled:opacity-50"
                            >
                                {resendLoading ? 'Sending…' : 'Resend verification email'}
                            </button>
                        </div>
                    )}
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
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
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
                                    'Sign in'
                                )}
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
