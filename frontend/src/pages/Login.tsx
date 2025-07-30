import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Mail } from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const { sendMagicLink } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await sendMagicLink(email);
            setEmailSent(true)
        } catch (error) {
            // Error is handled in AuthContext
        } finally {
            setIsLoading(false)
        }
    }

    if (emailSent) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                        <div className="text-center">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                                <Mail className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Check your email
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                We've sent a magic link to <strong>{email}</strong>
                            </p>
                            <p className="mt-4 text-center text-sm text-gray-500">
                                Click the link in your email to sign in to your account.
                            </p>
                            <button
                                type="button"
                                onClick={() => setEmailSent(false)}
                                className="mt-6 text-indigo-600 hover:text-indigo-500 text-sm"
                            >
                                ← Back to sign in
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md mx-auto p-6">
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    <div>
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
                            <BookOpen className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your email to receive a magic link
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                ) : (
                                    'Send magic link'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login 