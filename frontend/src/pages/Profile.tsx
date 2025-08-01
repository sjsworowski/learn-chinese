/// <reference types="vite/client" />
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, RefreshCcw, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleResetProgress = async () => {
        const confirmed = window.confirm('Are you sure you want to reset all your progress? This action cannot be undone.');
        if (!confirmed) return;
        try {
            await axios.post(`${API_BASE}/vocabulary/reset-progress`);
            await axios.delete(`${API_BASE}/session-progress`);
            await axios.delete(`${API_BASE}/mistakes`);
            await axios.delete(`${API_BASE}/stats/speed-challenge`);
            toast.success('Progress reset successfully!');
            navigate('/');
        } catch (error) {
            toast.error('Failed to reset progress!');
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-md mx-auto p-6">
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center relative">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/')}
                        className="absolute left-4 top-4 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 text-indigo-500" />
                    </button>
                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className="rounded-full bg-indigo-100 p-4 mb-2">
                            <User className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile</h2>
                        <p className="text-gray-500">View and manage your account</p>
                    </div>
                    <div className="mb-6 text-left">
                        <div className="mb-2"><span className="font-semibold text-gray-700">Username:</span> <span className="text-gray-900">{user?.username}</span></div>
                        <div className="mb-2"><span className="font-semibold text-gray-700">Email:</span> <span className="text-gray-900">{user?.email}</span></div>
                        {/* Add more profile details here if available, e.g. registration date */}
                    </div>
                    <button
                        onClick={handleResetProgress}
                        className="w-full py-3 rounded-xl bg-pink-100 text-pink-700 font-semibold text-lg shadow hover:bg-pink-200 transition flex items-center justify-center gap-2 mb-4"
                    >
                        <RefreshCcw className="w-5 h-5 mr-1" /> Reset Progress
                    </button>
                    <button
                        onClick={logout}
                        className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-lg shadow hover:bg-gray-200 transition"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile; 