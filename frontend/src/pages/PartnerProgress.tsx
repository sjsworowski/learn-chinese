/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Flame, GraduationCap, BookOpen, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface PublicProgress {
    username: string;
    learnedWords: number;
    currentStreak: number;
    longestStreak: number;
    testsCompleted: number;
    lastActive: string | null;
    recentWords: { chinese: string; pinyin: string; english: string }[];
}

const PartnerProgress = () => {
    const { userId } = useParams<{ userId: string }>();
    const [progress, setProgress] = useState<PublicProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!userId) {
            setError(true);
            setLoading(false);
            return;
        }
        const fetch = async () => {
            try {
                const response = await axios.get(`${API_BASE}/public/progress/${userId}`);
                setProgress(response.data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [userId]);

    const daysSinceActive = (lastActive: string | null) => {
        if (!lastActive) return null;
        const diff = Date.now() - new Date(lastActive).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Progress not found</p>
                    <p className="text-sm mt-1">This link may be invalid.</p>
                </div>
            </div>
        );
    }

    const lastActiveText = daysSinceActive(progress.lastActive);
    const isActiveToday = lastActiveText === 'today';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
            <div className="w-full max-w-md mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl font-semibold" style={{ fontFamily: 'serif' }}>中</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{progress.username} is learning Mandarin</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Last studied {lastActiveText}
                        {isActiveToday && ' ✓'}
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <GraduationCap className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{progress.learnedWords}</div>
                        <div className="text-sm text-gray-500 mt-1">Words learned</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Flame className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{progress.currentStreak}</div>
                        <div className="text-sm text-gray-500 mt-1">Day streak</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <BookOpen className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{progress.testsCompleted}</div>
                        <div className="text-sm text-gray-500 mt-1">Tests completed</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Calendar className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{progress.longestStreak}</div>
                        <div className="text-sm text-gray-500 mt-1">Longest streak</div>
                    </div>
                </div>

                {/* Recently learned words */}
                {progress.recentWords.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                            Recently learned
                        </h3>
                        <div className="space-y-3">
                            {progress.recentWords.map((word, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{word.chinese}</span>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{word.english}</div>
                                            <div className="text-xs text-gray-500">{word.pinyin}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">
                    Learning Chinese for someone special 🇨🇳
                </p>
            </div>
        </div>
    );
};

export default PartnerProgress;