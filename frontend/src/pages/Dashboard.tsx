import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, Lock, ArrowRight, BookOpen, LogOut, TrendingUp, Target, User } from 'lucide-react';
import axios from 'axios'
import toast from 'react-hot-toast'
/// <reference types="vite/client" />

interface LearningStats {
    totalWords: number;
    learnedWords: number;
    currentStreak: number;
    totalStudyTime: number;
    testsCompleted?: number;
    difficultyCounts?: {
        beginner: { total: number, learned: number },
        intermediate: { total: number, learned: number },
        advanced: { total: number, learned: number }
    }
}

const stripParens = (str: string) => str.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

const learningSteps = [
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Recent Test', color: 'bg-indigo-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Recent Pinyin', color: 'bg-emerald-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Recent Test', color: 'bg-indigo-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Recent Pinyin', color: 'bg-emerald-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Test', color: 'bg-pink-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Pinyin Test', color: 'bg-green-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
];

const Dashboard = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [stats, setStats] = useState<LearningStats>({
        totalWords: 0,
        learnedWords: 0,
        currentStreak: 0,
        totalStudyTime: 0,
        testsCompleted: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [sessionProgress, setSessionProgress] = useState({
        currentSession: 0,
        totalSessions: 0,
        hasProgress: false
    })
    const [allWords, setAllWords] = useState<any[]>([])
    const [userProgress, setUserProgress] = useState<any[]>([])
    const roadmapRef = useRef<HTMLDivElement>(null);

    const API_BASE = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        fetchStats()
        fetchVocabAndProgress()
    }, [])

    useEffect(() => {
        if (location.state?.from === 'study' || location.state?.from === 'test') {
            fetchStats();
        }
    }, [location]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/stats`)
            setStats(response.data)
        } catch (error) {
            console.error('Failed to fetch stats from backend:', error)
            toast.error('Failed to fetch stats from backend. Please try again later.')
        }

        // Get session progress from backend only
        try {
            const sessionResponse = await axios.get(`${API_BASE}/session-progress`)
            const sessionData = sessionResponse.data

            setSessionProgress({
                currentSession: sessionData.currentSession,
                totalSessions: sessionData.totalSessions,
                hasProgress: sessionData.currentSession > 0
            })
        } catch (error) {
            console.error('Failed to fetch session progress from backend:', error)
            toast.error('Failed to fetch session progress from backend. Please try again later.')
        }

        setIsLoading(false)
    }

    const fetchVocabAndProgress = async () => {
        try {
            const vocabResponse = await axios.get(`${API_BASE}/vocabulary`)
            setAllWords(vocabResponse.data)
            // userProgress is embedded in vocabResponse.data as isLearned, or you may need to fetch separately
        } catch (error) {
            console.error('Failed to fetch vocabulary:', error)
            toast.error('Failed to fetch vocabulary from backend. Please try again later.')
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const startStudy = () => {
        navigate('/study')
    }

    const resetProgress = async () => {
        const confirmed = window.confirm('Are you sure you want to reset all your progress? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        try {
            // Clear backend progress
            await axios.post(`${API_BASE}/vocabulary/reset`)
            await axios.post(`${API_BASE}/session-progress/reset`)

            // Refresh stats
            await fetchStats()

            toast.success('Progress reset successfully!')
        } catch (error) {
            console.error('Failed to reset progress:', error)
            toast.error('Failed to reset progress!')
        }
    }

    const currentStep = sessionProgress.currentSession;
    const cycleStep = currentStep % 10;

    // Helper to get button label and handler for current step
    const getStartLearningButton = () => {
        const step = currentStep % 10;
        if (step === 0) {
            return { label: 'Start Study Session', onClick: startStudy };
        }
        if (step === 1) {
            return { label: 'Continue Study Session', onClick: startStudy };
        }
        if (step === 2) {
            return { label: 'Recently Learned Test', onClick: () => navigate('/test?recent=true') };
        }
        if (step === 3) {
            return { label: 'Recently Learned Pinyin Test', onClick: () => navigate('/pinyin-test?recent=true') };
        }
        if (step === 4) {
            return { label: 'Continue Study Session', onClick: startStudy };
        }
        if (step === 5) {
            return { label: 'Continue Study Session', onClick: startStudy };
        }
        if (step === 6) {
            return { label: 'Recently Learned Test', onClick: () => navigate('/test?recent=true') };
        }
        if (step === 7) {
            return { label: 'Recently Learned Pinyin Test', onClick: () => navigate('/pinyin-test?recent=true') };
        }
        if (step === 8) {
            return { label: 'Take Test', onClick: () => navigate('/test') };
        }
        if (step === 9) {
            return { label: 'Pinyin Test', onClick: () => navigate('/pinyin-test') };
        }
        // Default fallback (should not be reached)
        return { label: 'Start Study Session', onClick: startStudy };
    };

    // Responsive window size
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const windowSize = isMobile ? 3 : 5;
    let start = Math.max(0, cycleStep - Math.floor(windowSize / 2));
    let end = start + windowSize;
    if (end > learningSteps.length) {
        end = learningSteps.length;
        start = Math.max(0, end - windowSize);
    }
    const visibleSteps = learningSteps.slice(start, end);

    // Scroll to center current step on mount/update
    useEffect(() => {
        if (roadmapRef.current) {
            const node = roadmapRef.current.querySelector('[data-current-step="true"]') as HTMLElement;
            if (node && roadmapRef.current) {
                node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    }, [cycleStep, isMobile]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    const { label: mobileBtnLabel, onClick: mobileBtnClick } = getStartLearningButton();
    const { label: desktopBtnLabel, onClick: desktopBtnClick } = getStartLearningButton();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #ddeaff 0%, #f6e3fa 35%, #e6e3fa 70%, #fbeafd 100%)' }}>
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="backdrop-blur-md bg-white/20 border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    {/* Dashboard content starts here */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Learn Chinese</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-lg text-gray-500">Hi, {user?.username}</span>
                            <button onClick={() => navigate('/profile')} className="rounded-full p-2 hover:bg-gray-100 transition" title="Profile">
                                <User className="w-5 h-5 text-indigo-500" />
                            </button>
                            <button onClick={handleLogout} className="rounded-full p-2 hover:bg-gray-100 transition"><LogOut className="w-5 h-5 text-indigo-500" /></button>
                        </div>
                    </div>
                    {/* Start Learning at top on mobile only */}
                    <div className="block md:hidden mb-6">
                        <div className="bg-white/30 rounded-2xl shadow p-6 mb-4">
                            <div className="mb-4">
                                <div className="text-lg font-semibold text-gray-900 mb-2">Start Learning</div>
                                <div className="flex flex-col items-center gap-0 mb-6">
                                    {visibleSteps.map((step, idx) => {
                                        const globalIdx = start + idx;
                                        const isCompleted = globalIdx < cycleStep;
                                        const isCurrent = globalIdx === cycleStep;
                                        return (
                                            <React.Fragment key={globalIdx}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-indigo-100' : 'bg-gray-100'} border-2 ${isCompleted ? 'border-green-300' : isCurrent ? 'border-indigo-300' : 'border-gray-200'}`}>
                                                        {isCompleted ? <CheckCircle className="w-6 h-6 text-green-500" /> : isCurrent ? <ArrowRight className="w-6 h-6 text-indigo-500" /> : <Lock className="w-6 h-6 text-gray-300" />}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mb-2">{step.label}</span>
                                                </div>
                                                {idx < visibleSteps.length - 1 && (
                                                    <div className="w-1 h-8 bg-gray-200 rounded-full my-1" />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                {/* Start Learning button for mobile */}
                                <button onClick={mobileBtnClick} className="w-full py-3 rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition">{mobileBtnLabel}</button>
                            </div>
                        </div>
                    </div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/30 rounded-2xl shadow p-4 flex items-center gap-3">
                            <div className="bg-green-100 rounded-xl p-2 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                            <div>
                                <div className="text-gray-900 text-m">Words Learned</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.learnedWords}</div>
                            </div>
                        </div>
                        <div className="bg-white/30 rounded-2xl shadow p-4 flex items-center gap-3">
                            <div className="bg-indigo-100 rounded-xl p-2 flex items-center justify-center"><BookOpen className="w-6 h-6 text-indigo-500" /></div>
                            <div>
                                <div className="text-gray-900 text-m">Tests Completed</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.testsCompleted ?? 0}</div>
                            </div>
                        </div>
                        <div className="bg-white/30 rounded-2xl shadow p-4 flex items-center gap-3">
                            <div className="bg-orange-100 rounded-xl p-2 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-orange-400" /></div>
                            <div>
                                <div className="text-gray-900 text-m">Current Streak</div>
                                <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
                            </div>
                        </div>
                        <div className="bg-white/30 rounded-2xl shadow p-4 flex items-center gap-3">
                            <div className="bg-purple-100 rounded-xl p-2 flex items-center justify-center"><Target className="w-6 h-6 text-purple-400" /></div>
                            <div>
                                <div className="text-gray-900 text-m">Study Time</div>
                                <div className="text-2xl font-bold text-gray-900">{Math.round(stats.totalStudyTime / 60)} min</div>
                            </div>
                        </div>
                    </div>
                    {/* Main Card */}
                    <div className="bg-white/30 rounded-2xl shadow p-6 flex flex-col md:flex-row gap-6 items-center mb-6">
                        {/* Start Learning Section (desktop only) */}
                        <div className="hidden md:block flex-1 w-full">
                            <div className="mb-4">
                                <div className="text-lg font-semibold text-gray-900 mb-2">Start Learning</div>
                                <div className="flex flex-row items-center justify-between gap-2 mb-6">
                                    {visibleSteps.map((step, idx) => {
                                        const globalIdx = start + idx;
                                        const isCompleted = globalIdx < cycleStep;
                                        const isCurrent = globalIdx === cycleStep;
                                        return (
                                            <React.Fragment key={globalIdx}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-indigo-100' : 'bg-gray-100'} border-2 ${isCompleted ? 'border-green-300' : isCurrent ? 'border-indigo-300' : 'border-gray-200'}`}>
                                                        {isCompleted ? <CheckCircle className="w-6 h-6 text-green-500" /> : isCurrent ? <ArrowRight className="w-6 h-6 text-indigo-500" /> : <Lock className="w-6 h-6 text-gray-300" />}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-2">{step.label}</span>
                                                </div>
                                                {idx < visibleSteps.length - 1 && (
                                                    <div className="flex-1 h-1 bg-gray-200 mx-1 rounded-full" style={{ minWidth: 16, maxWidth: 32 }} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                                {/* Start Learning button for desktop */}
                                <button onClick={desktopBtnClick} className="w-full py-3 rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition">{desktopBtnLabel}</button>
                            </div>
                        </div>
                        {/* Progress Section */}
                        <div className="flex-1 w-full flex flex-col items-center justify-center">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-gray-900">{Math.round((stats.learnedWords / stats.totalWords) * 100)}%</span>
                                <span className="text-sm text-gray-600 ml-1">complete</span>
                            </div>
                            <div className="flex justify-between items-center w-full mb-1">
                                <span className="text-sm font-medium text-gray-900">Progress</span>
                                <div className="text-xs text-gray-400 w-full text-right">{stats.learnedWords} / {stats.totalWords} words</div>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-1">
                                <div className="h-2 bg-gradient-to-r from-indigo-200 to-green-200 rounded-full transition-all duration-500" style={{ width: `${(stats.learnedWords / stats.totalWords) * 100}%` }}></div>
                            </div>
                            {/* Per-difficulty progress */}
                            <div className="flex flex-col gap-1 mt-6 text-sm w-full">
                                {['beginner', 'intermediate', 'advanced'].map((level) => {
                                    const label = level.charAt(0).toUpperCase() + level.slice(1);
                                    const wordsOfLevel = allWords.filter(w => w.difficulty === level);
                                    const learnedOfLevel = wordsOfLevel.filter(w => w.isLearned);
                                    // Debugging output
                                    if (wordsOfLevel.length === 0) {
                                        console.log(`No words found for difficulty: ${level}`);
                                    } else {
                                        console.log(`${label}: Learned ${learnedOfLevel.length} / ${wordsOfLevel.length}`);
                                    }
                                    return (
                                        <div key={level} className="flex items-center justify-between w-full py-1">
                                            <span className="text-gray-700">{label}</span>
                                            <span className="text-gray-900 font-semibold">{learnedOfLevel.length} / {wordsOfLevel.length}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* End per-difficulty progress */}

                            {/* Day Streak Milestones */}
                            <div className="mt-4">
                                <div className="mt-2 text-center text-sm text-blue-800">
                                    {stats.currentStreak < 10 && ` Next milestone: 10 days`}
                                    {stats.currentStreak >= 10 && stats.currentStreak < 50 && `🎯 Next milestone: 50 days`}
                                    {stats.currentStreak >= 50 && stats.currentStreak < 100 && `🎯 Next milestone: 100 days`}
                                    {stats.currentStreak >= 100 && `🏆 All streak milestones achieved!`}
                                </div>
                            </div>
                            {/* End Day Streak Milestones */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard 