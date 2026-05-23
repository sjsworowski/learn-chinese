import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const ResetPassword = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [token, setToken] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const passwordsMatch = newPassword === confirmPassword
    const showMatchMessage = confirmPassword.length > 0

    useEffect(() => {
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            toast.error('No password reset token found.')
            navigate('/login', { replace: true })
            return
        }
        setToken(tokenParam)
    }, [searchParams, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return
        if (!newPassword.trim() || !confirmPassword.trim()) {
            return toast.error('Please enter and confirm your new password.')
        }
        if (newPassword !== confirmPassword) {
            return toast.error('Passwords do not match.')
        }
        if (newPassword.length < 8) {
            return toast.error('Password should be at least 8 characters long.')
        }

        setLoading(true)
        try {
            await axios.post(`${API_BASE}/auth/reset-password`, {
                token,
                newPassword,
            })
            setSuccess(true)
            toast.success('Password reset successfully. You can now sign in.')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md mx-auto p-6">
                <div className="bg-white rounded-xl shadow-md p-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">Reset your password</h1>
                    {success ? (
                        <div className="space-y-4">
                            <p className="text-gray-700">Your password has been reset successfully.</p>
                            <Link
                                to="/login"
                                className="inline-flex w-full justify-center rounded-lg bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800"
                            >
                                Return to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <div className="relative mt-2">
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm pr-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                        placeholder="New password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-150 hover:text-gray-700"
                                        onMouseDown={() => setShowNewPassword(true)}
                                        onMouseUp={() => setShowNewPassword(false)}
                                        onMouseLeave={() => setShowNewPassword(false)}
                                        onTouchStart={() => setShowNewPassword(true)}
                                        onTouchEnd={() => setShowNewPassword(false)}
                                        aria-label="Show password while holding"
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5 transition-transform duration-150" /> : <Eye className="h-5 w-5 transition-transform duration-150" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm password
                                </label>
                                <div className="relative mt-2">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm pr-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                        placeholder="Confirm password"
                                        minLength={8}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-150 hover:text-gray-700"
                                        onMouseDown={() => setShowConfirmPassword(true)}
                                        onMouseUp={() => setShowConfirmPassword(false)}
                                        onMouseLeave={() => setShowConfirmPassword(false)}
                                        onTouchStart={() => setShowConfirmPassword(true)}
                                        onTouchEnd={() => setShowConfirmPassword(false)}
                                        aria-label="Show password while holding"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5 transition-transform duration-150" /> : <Eye className="h-5 w-5 transition-transform duration-150" />}
                                    </button>
                                </div>
                                {showMatchMessage && !passwordsMatch && (
                                    <p className="mt-2 text-sm text-rose-600">
                                        Passwords do not match.
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading || (confirmPassword.length > 0 && !passwordsMatch)}
                                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                {loading ? 'Resetting…' : 'Reset password'}
                            </button>
                            <div className="text-center text-sm text-gray-500">
                                <Link to="/login" className="text-primary-600 hover:underline">
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
