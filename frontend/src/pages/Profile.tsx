/// <reference types="vite/client" />
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, RefreshCcw, ArrowLeft, Bell, BellOff, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [emailRemindersEnabled, setEmailRemindersEnabled] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [testEmailLoading, setTestEmailLoading] = React.useState(false);

    React.useEffect(() => {
        fetchReminderSettings();
    }, []);

    const fetchReminderSettings = async () => {
        try {
            const response = await axios.get(`${API_BASE}/email-reminders/settings`);
            setEmailRemindersEnabled(response.data.enabled);
        } catch (error) {
            console.error('Failed to fetch reminder settings:', error);
        }
    };

    const toggleEmailReminders = async () => {
        setLoading(true);
        try {
            await axios.put(`${API_BASE}/email-reminders/settings`, {
                enabled: !emailRemindersEnabled
            });
            setEmailRemindersEnabled(!emailRemindersEnabled);
            toast.success('Email reminder settings updated!');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const sendTestEmail = async () => {
        setTestEmailLoading(true);
        try {
            const response = await axios.post(`${API_BASE}/email-reminders/send-test-email`);
            toast.success(response.data.message || 'Test email sent successfully!');
        } catch (error) {
            toast.error('Failed to send test email');
            console.error('Test email error:', error);
        } finally {
            setTestEmailLoading(false);
        }
    };

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
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 w-full text-center relative">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/')}
                        className="absolute left-4 top-4 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className="rounded-full bg-gray-100 p-4 mb-2">
                            <User className="w-10 h-10 text-gray-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile</h2>
                        <p className="text-sm text-gray-600">View and manage your account</p>
                    </div>
                    <div className="mb-6 text-left">
                        <div className="mb-2"><span className="font-semibold text-gray-700">Username:</span> <span className="text-gray-900">{user?.username}</span></div>
                        <div className="mb-2"><span className="font-semibold text-gray-700">Email:</span> <span className="text-gray-900">{user?.email}</span></div>
                    </div>

                    {/* Email Reminders Section */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            {emailRemindersEnabled ? <Bell className="w-5 h-5 text-gray-700" /> : <BellOff className="w-5 h-5 text-gray-500" />}
                            Daily Streak Reminders
                        </h3>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 text-left">
                                <p className="text-gray-700 text-sm mb-1">Get notified at 7pm if you haven&apos;t studied today</p>
                                <p className="text-gray-500 text-xs">Help maintain your learning streak</p>
                            </div>
                            <button
                                onClick={toggleEmailReminders}
                                disabled={loading}
                                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${emailRemindersEnabled
                                    ? 'btn-primary'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Updating...' : (emailRemindersEnabled ? 'Enabled' : 'Disabled')}
                            </button>
                        </div>
                    </div>

                    {/* Test Email Button */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-700" />
                            Test Reminder Email
                        </h3>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 text-left">
                                <p className="text-gray-700 text-sm mb-1">Send yourself a test reminder email</p>
                                <p className="text-gray-500 text-xs">See what the daily reminder emails look like</p>
                            </div>
                            <button
                                onClick={sendTestEmail}
                                disabled={testEmailLoading || !emailRemindersEnabled}
                                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${emailRemindersEnabled && !testEmailLoading
                                    ? 'btn-primary'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    } ${testEmailLoading ? 'opacity-50' : ''}`}
                            >
                                {testEmailLoading ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleResetProgress}
                        className="w-full py-3 rounded-lg bg-gray-100 text-gray-800 font-semibold text-base border border-gray-200 hover:bg-gray-200 transition flex items-center justify-center gap-2 mb-4"
                    >
                        <RefreshCcw className="w-5 h-5" /> Reset Progress
                    </button>
                    <button
                        onClick={logout}
                        className="w-full py-3 rounded-lg btn-secondary"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
