import React, { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const VerifyEmail = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { verifyEmail } = useAuth()
    const hasVerified = useRef(false)

    useEffect(() => {
        const token = searchParams.get('token')
        if (token && !hasVerified.current) {
            hasVerified.current = true
            verifyEmail(token)
                .then(() => navigate('/', { replace: true }))
                .catch((err: any) => {
                    const msg = err.response?.data?.message || 'Verification link expired or invalid.'
                    toast.error(msg)
                    navigate('/login', { replace: true })
                })
        } else if (!token) {
            toast.error('No verification token found')
            navigate('/login', { replace: true })
        }
    }, [searchParams, navigate, verifyEmail])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
                <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
        </div>
    )
}

export default VerifyEmail
