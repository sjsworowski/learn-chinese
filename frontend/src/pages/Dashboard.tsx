import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, ArrowRight, LogOut, TrendingUp, Clock, User, Menu, Zap, Brain, Type, Languages, Volume2, Lock, BookOpen, Flame, Headphones, AlertCircle, GraduationCap } from 'lucide-react';
import axios from 'axios'
import toast from 'react-hot-toast'
/// <reference types="vite/client" />

interface LearningStats {
    totalWords: number;
    learnedWords: number;
    currentStreak: number;
    totalStudyTime: number;
    testsCompleted?: number;
    speedChallengeHighScore?: number;
    difficultyCounts?: {
        beginner: { total: number, learned: number },
        intermediate: { total: number, learned: number },
        advanced: { total: number, learned: number }
    }
}

const stripParens = (str: string) => str.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

const learningSteps = [
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Recent Test', description: 'Complete test of recently learned words', color: 'bg-gray-700', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Recent Pinyin', description: 'Complete pinyin test of recently learned words', color: 'bg-gray-700', icon: <Languages className="w-5 h-5 text-white" /> },
    { label: 'Listen', description: 'Complete listening test', color: 'bg-gray-700', icon: <Volume2 className="w-5 h-5 text-white" /> },
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Recent Test', description: 'Complete test of recently learned words', color: 'bg-gray-700', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Recent Pinyin', description: 'Complete pinyin test of recently learned words', color: 'bg-gray-700', icon: <Languages className="w-5 h-5 text-white" /> },
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', description: 'Study 10 new vocab words', color: 'bg-gray-600', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Test', description: 'Complete test of all the words you\'ve learned', color: 'bg-gray-800', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Pinyin Test', description: 'Complete pinyin test of all the words you\'ve learned', color: 'bg-gray-800', icon: <Languages className="w-5 h-5 text-white" /> },
    { label: 'Mistakes', description: 'Practice words you got wrong', color: 'bg-gray-800', icon: <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> },
];

// Helper to get route for a learning step
const getStepRoute = (stepIndex: number) => {
    if (stepIndex === 0 || stepIndex === 1 || stepIndex === 5 || stepIndex === 6 || stepIndex === 9 || stepIndex === 10) {
        return '/study';
    }
    if (stepIndex === 2 || stepIndex === 7) {
        // Recent Test
        return '/test?recent=true';
    }
    if (stepIndex === 11) {
        // Full Test
        return '/test';
    }
    if (stepIndex === 3 || stepIndex === 8) {
        // Recent Pinyin Test
        return '/pinyin-test?recent=true';
    }
    if (stepIndex === 12) {
        // Full Pinyin Test
        return '/pinyin-test';
    }
    if (stepIndex === 4) {
        return '/listen-test';
    }
    if (stepIndex === 13) {
        return '/mistake-test';
    }
    return '/study';
};

const Dashboard = () => {
    const { user, logout, isLoading } = useAuth()
    const [stats, setStats] = useState<LearningStats>({
        totalWords: 0,
        learnedWords: 0,
        currentStreak: 0,
        totalStudyTime: 0,
        testsCompleted: 0,
        speedChallengeHighScore: 0,
        difficultyCounts: {
            beginner: { total: 0, learned: 0 },
            intermediate: { total: 0, learned: 0 },
            advanced: { total: 0, learned: 0 }
        }
    });
    const [mistakeCount, setMistakeCount] = useState(0);
    const [streakDetails, setStreakDetails] = useState({
        currentStreak: 0,
        longestStreak: 0,
        last30Days: [] as { date: string; hasActivity: boolean }[]
    });
    const [sessionProgress, setSessionProgress] = useState({
        currentSession: 0,
        totalSessions: 0,
        hasProgress: false
    })
    const currentStep = sessionProgress?.currentSession || 0;
    const cycleStep = currentStep % 14;
    const unitNumber = 1 + Math.floor(currentStep / 14);

    // Daily Challenges state - based on day number
    const getTodayKey = () => new Date().toISOString().split('T')[0];
    const getDayNumber = () => {
        const epoch = new Date('2024-01-01');
        const today = new Date();
        const diffTime = today.getTime() - epoch.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const dayNumber = getDayNumber();
    // Calculate which 4 steps are today's challenges (cycles through all 14 steps)
    // Memoize to prevent infinite loops
    const { todayChallenges, todayStepIndices } = useMemo(() => {
        const startStepIndex = (dayNumber * 4) % 14;
        const challenges = [
            learningSteps[startStepIndex],
            learningSteps[(startStepIndex + 1) % 14],
            learningSteps[(startStepIndex + 2) % 14],
            learningSteps[(startStepIndex + 3) % 14]
        ];
        const indices = [
            startStepIndex,
            (startStepIndex + 1) % 14,
            (startStepIndex + 2) % 14,
            (startStepIndex + 3) % 14
        ];
        return { todayChallenges: challenges, todayStepIndices: indices };
    }, [dayNumber]);

    const [dailyChallenges, setDailyChallenges] = useState<{ [key: number]: boolean }>(() => {
        const today = getTodayKey();
        const stored = localStorage.getItem(`dailyChallenges_${today}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert string keys to numbers
            const result: { [key: number]: boolean } = {};
            Object.keys(parsed).forEach(key => {
                result[parseInt(key)] = parsed[key];
            });
            return result;
        }
        return {};
    });
    const [lastDate, setLastDate] = useState(() => getTodayKey());

    // Reset challenges if it's a new day
    useEffect(() => {
        const today = getTodayKey();
        if (today !== lastDate) {
            setDailyChallenges({});
            setLastDate(today);
        }
    }, [lastDate]);

    useEffect(() => {
        const today = getTodayKey();
        localStorage.setItem(`dailyChallenges_${today}`, JSON.stringify(dailyChallenges));
    }, [dailyChallenges]);

    const completedCount = todayStepIndices.filter(idx => dailyChallenges[idx]).length;
    const allCompleted = completedCount === 4;

    // Find first uncompleted challenge index
    const firstUncompletedIndex = todayStepIndices.findIndex(idx => !dailyChallenges[idx]);
    const canStartChallenge = (challengeIndex: number) => {
        // First challenge is always available, or if all previous are completed
        if (challengeIndex === 0) return true;
        const previousIndices = todayStepIndices.slice(0, challengeIndex);
        const allPreviousCompleted = previousIndices.every(idx => dailyChallenges[idx]);
        console.log(`🔓 Challenge ${challengeIndex} unlock check:`, {
            previousIndices,
            previousCompleted: previousIndices.map(idx => ({ idx, completed: dailyChallenges[idx] })),
            allPreviousCompleted,
            dailyChallenges
        });
        return allPreviousCompleted;
    };
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [allWords, setAllWords] = useState<any[]>([])
    const [userProgress, setUserProgress] = useState<any[]>([])
    const roadmapRef = useRef<HTMLDivElement>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuDropdownRef = useRef<HTMLDivElement>(null);
    const [activeTooltipIdx, setActiveTooltipIdx] = useState<number | null>(null);
    const [hoveredStepIdx, setHoveredStepIdx] = useState<number | null>(null);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tooltipRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [clickedStepIdx, setClickedStepIdx] = useState<number | null>(null);
    const ignoreNextOutsideClick = useRef(false);

    // Responsive window size
    const windowSize = isMobile ? 3 : 5;
    let start = Math.max(0, cycleStep - Math.floor(windowSize / 2));
    let end = start + windowSize;
    if (end > learningSteps.length) {
        end = learningSteps.length;
        start = Math.max(0, end - windowSize);
    }
    const visibleSteps = learningSteps.slice(start, end);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleClick = (e: MouseEvent) => {
            const menuBtn = menuButtonRef.current;
            const menuDropdown = menuDropdownRef.current;
            if (
                menuDropdown &&
                !menuDropdown.contains(e.target as Node) &&
                menuBtn &&
                !menuBtn.contains(e.target as Node)
            ) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [mobileMenuOpen]);

    const API_BASE = import.meta.env.VITE_API_URL || '/api';

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/stats`)
            const statsData = response.data

            // Fetch speed challenge high score
            try {
                const highScoreResponse = await axios.get(`${API_BASE}/stats/speed-challenge/high-score`)
                statsData.speedChallengeHighScore = highScoreResponse.data.highScore
            } catch (error) {
                console.error('Failed to fetch speed challenge high score:', error)
                statsData.speedChallengeHighScore = 0
            }

            // Fetch mistake count
            try {
                const mistakeResponse = await axios.get(`${API_BASE}/mistakes/count`);
                setMistakeCount(mistakeResponse.data.count || 0);
            } catch (error) {
                console.error('Failed to fetch mistake count:', error);
            }

            setStats(statsData)
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

        // no longer needed, handled by AuthContext
    }, [API_BASE])

    const fetchVocabAndProgress = useCallback(async () => {
        try {
            const vocabResponse = await axios.get(`${API_BASE}/vocabulary`)
            setAllWords(vocabResponse.data)
            // userProgress is embedded in vocabResponse.data as isLearned, or you may need to fetch separately
        } catch (error) {
            console.error('Failed to fetch vocabulary:', error)
            toast.error('Failed to fetch vocabulary from backend. Please try again later.')
        }
    }, [API_BASE])

    const fetchStreakDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/stats/streak-details`);
            console.log('streak details', response.data);
            setStreakDetails(response.data);
        } catch (error) {
            console.error('Failed to fetch streak details:', error);
        }
    }, [API_BASE])

    // Mark challenge as complete
    const markChallengeComplete = (stepIndex: number) => {
        setDailyChallenges(prev => ({
            ...prev,
            [stepIndex]: true
        }));
    };

    // Handle challenge start
    const handleChallengeStart = (stepIndex: number, challengeIndex: number) => {
        if (canStartChallenge(challengeIndex)) {
            const route = getStepRoute(stepIndex);
            // Store which challenge is being started in localStorage so we can mark it complete on return
            const today = getTodayKey();
            localStorage.setItem(`activeChallenge_${today}`, JSON.stringify({ stepIndex, challengeIndex }));
            navigate(route, { state: { from: 'daily-challenge', challengeStepIndex: stepIndex } });
        }
    };

    useEffect(() => {
        fetchStats()
        fetchVocabAndProgress()
        fetchStreakDetails()
    }, [fetchStats, fetchVocabAndProgress, fetchStreakDetails])

    useEffect(() => {
        const fromState = location.state?.from;
        if (fromState === 'study' || fromState === 'test' || fromState === 'daily-challenge') {
            fetchStats();
            fetchStreakDetails();

            // Check if this was from a daily challenge
            const challengeStepIndex = location.state?.challengeStepIndex;
            const today = getTodayKey();

            if (challengeStepIndex !== undefined && todayStepIndices.includes(challengeStepIndex)) {
                // Mark the specific challenge as complete
                console.log('✅ Marking challenge complete:', challengeStepIndex);
                setDailyChallenges(prev => {
                    if (!prev[challengeStepIndex]) {
                        console.log('✅ Challenge marked as complete:', challengeStepIndex);
                        return { ...prev, [challengeStepIndex]: true };
                    }
                    console.log('⚠️ Challenge already marked as complete:', challengeStepIndex);
                    return prev;
                });
                // Clear the active challenge tracking
                localStorage.removeItem(`activeChallenge_${today}`);
            } else if (fromState === 'study' || fromState === 'test') {
                // Fallback: try to get from localStorage if state wasn't passed
                const activeChallengeStr = localStorage.getItem(`activeChallenge_${today}`);
                if (activeChallengeStr) {
                    try {
                        const activeChallenge = JSON.parse(activeChallengeStr);
                        console.log('📋 Found active challenge in localStorage:', activeChallenge);
                        if (activeChallenge.stepIndex !== undefined && todayStepIndices.includes(activeChallenge.stepIndex)) {
                            console.log('✅ Marking challenge complete from localStorage:', activeChallenge.stepIndex);
                            setDailyChallenges(prev => {
                                if (!prev[activeChallenge.stepIndex]) {
                                    return { ...prev, [activeChallenge.stepIndex]: true };
                                }
                                return prev;
                            });
                            localStorage.removeItem(`activeChallenge_${today}`);
                        } else {
                            console.log('⚠️ Challenge stepIndex not in todayStepIndices:', activeChallenge.stepIndex, 'todayStepIndices:', todayStepIndices);
                        }
                    } catch (e) {
                        console.error('Failed to parse active challenge:', e);
                    }
                } else {
                    console.log('ℹ️ No active challenge found in localStorage');
                }
            }
        }
    }, [location.state?.from, location.state?.challengeStepIndex, todayStepIndices, fetchStats, fetchStreakDetails]);

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

    // Helper to get button label and handler for current step
    const getStartLearningButton = () => {
        const step = currentStep % 14;
        if (step === 0) {
            return { label: 'Start Study', onClick: startStudy };
        }
        if (step === 1) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 2) {
            return { label: 'Recent Test', onClick: () => navigate('/test?recent=true') };
        }
        if (step === 3) {
            return { label: 'Recent Pinyin Test', onClick: () => navigate('/pinyin-test?recent=true') };
        }
        if (step === 4) {
            return { label: 'Listen Test', onClick: () => navigate('/listen-test') };
        }
        if (step === 5) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 6) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 7) {
            return { label: 'Recent Test', onClick: () => navigate('/test?recent=true') };
        }
        if (step === 8) {
            return { label: 'Recent Pinyin Test', onClick: () => navigate('/pinyin-test?recent=true') };
        }
        if (step === 9) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 10) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 11) {
            return { label: 'Test', onClick: () => navigate('/test') };
        }
        if (step === 12) {
            return { label: 'Pinyin Test', onClick: () => navigate('/pinyin-test') };
        }
        if (step === 13) {
            return { label: 'Mistake Test', onClick: () => navigate('/mistake-test') };
        }
        // Default fallback (should not be reached)
        return { label: 'Start', onClick: startStudy };
    };

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    const { label: mobileBtnLabel, onClick: mobileBtnClick } = getStartLearningButton();
    const { label: desktopBtnLabel, onClick: desktopBtnClick } = getStartLearningButton();

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="p-0 md:p-4 w-full">
                    {/* Dashboard content starts here */}
                    <div className="mb-6">
                        {/* Mobile Layout */}
                        <div className="md:hidden">
                            {/* Row 1: Menu button and title */}
                            <div className="flex flex-row items-center relative">
                                <button ref={menuButtonRef} onClick={() => setMobileMenuOpen(v => !v)} className="rounded-full p-2 hover:bg-gray-100 transition mr-2" title="Menu">
                                    <Menu className="w-6 h-6 text-gray-900" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xl font-semibold" style={{ fontFamily: 'serif, "Noto Serif SC", "SimSun", serif' }}>中</span>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900">Learn Chinese</h1>
                                </div>
                                {mobileMenuOpen && (
                                    <div ref={menuDropdownRef} className="absolute left-0 right-0 mx-auto top-14 z-50 bg-white rounded-xl shadow-lg py-2 w-full max-w-s border border-gray-200 flex flex-col">
                                        <button onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-left">
                                            <User className="w-5 h-5 text-gray-900" /> Profile
                                        </button>
                                        <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-left">
                                            <LogOut className="w-5 h-5 text-gray-900" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Row 2: Stats indicators */}
                            <div className="flex items-center justify-between w-full mt-6">
                                <div className="relative group flex-1 flex justify-center">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                        <GraduationCap className="w-4 h-4 text-gray-700" />
                                        <span className="text-sm font-semibold text-gray-900">{stats.learnedWords}</span>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Words
                                    </div>
                                </div>
                                <div className="relative group flex-1 flex justify-center">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-gray-700" />
                                        <span className="text-sm font-semibold text-gray-900">{stats.testsCompleted ?? 0}</span>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Tests
                                    </div>
                                </div>
                                <div className="relative group flex-1 flex justify-center">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                        <Flame className="w-4 h-4 text-gray-700" />
                                        <span className="text-sm font-semibold text-gray-900">{stats.currentStreak}</span>
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Streak
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Desktop Layout */}
                        <div className="hidden md:flex md:flex-row md:justify-between md:items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xl font-semibold" style={{ fontFamily: 'serif, "Noto Serif SC", "SimSun", serif' }}>中</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">Learn Chinese</h1>
                            </div>
                            <div className="flex items-center gap-12">
                                {/* Desktop stats indicators */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                            <GraduationCap className="w-4 h-4 text-gray-700" />
                                            <span className="text-sm font-semibold text-gray-900">{stats.learnedWords}</span>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            Words
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                            <BookOpen className="w-4 h-4 text-gray-700" />
                                            <span className="text-sm font-semibold text-gray-900">{stats.testsCompleted ?? 0}</span>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            Tests
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg">
                                            <Flame className="w-4 h-4 text-gray-700" />
                                            <span className="text-sm font-semibold text-gray-900">{stats.currentStreak}</span>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            Streak
                                        </div>
                                    </div>
                                </div>
                                {/* Desktop buttons */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => navigate('/profile')} className="rounded-full p-2 hover:bg-gray-100 transition" title="Profile">
                                        <User className="w-5 h-5 text-gray-900" />
                                    </button>
                                    <button onClick={handleLogout} className="rounded-full p-2 hover:bg-gray-100 transition"><LogOut className="w-5 h-5 text-gray-900" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout: 2 Columns (70% | 30%) with rows inside each */}
                    <div className="hidden md:grid md:grid-cols-10 gap-6 mb-6">
                        {/* Left Column - 70% width (7/10 columns) */}
                        <div className="col-span-7 flex flex-col gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="text-lg font-semibold text-gray-900">Daily challenges</div>
                                    <div className="text-sm text-gray-600">{completedCount}/4</div>
                                </div>
                                {allCompleted && (
                                    <div className="text-center py-2 mb-3 text-gray-500 bg-gray-50 rounded-lg">
                                        <p className="text-sm">100% complete</p>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {todayChallenges.map((challenge, challengeIndex) => {
                                        const stepIndex = todayStepIndices[challengeIndex];
                                        const isCompleted = dailyChallenges[stepIndex];
                                        const isUnlocked = canStartChallenge(challengeIndex);
                                        return (
                                            <div key={challengeIndex} className={`flex items-center gap-3 p-3 border rounded-lg ${isCompleted ? 'bg-gray-100 border-gray-200' : 'border-gray-200'}`}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-gray-300 border-gray-300' : 'border-gray-300'
                                                    }`}>
                                                    {isCompleted && <CheckCircle className="w-3 h-3 text-gray-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`font-semibold ${isCompleted ? 'text-gray-500' : isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {challenge.label}
                                                    </div>
                                                    {challenge.description && (
                                                        <div className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {challenge.description}
                                                        </div>
                                                    )}
                                                </div>
                                                {!isCompleted && isUnlocked && (
                                                    <button
                                                        onClick={() => handleChallengeStart(stepIndex, challengeIndex)}
                                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Row 2: Practice */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                <div className="text-lg font-semibold text-gray-900 mb-6">Practice</div>
                                {/* Main 2x2 grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Study Session */}
                                    <button
                                        onClick={() => navigate('/study')}
                                        className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                    >
                                        <GraduationCap className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">Study Session</span>
                                            <span className="text-sm text-gray-500">Spaced repetition</span>
                                        </div>
                                    </button>

                                    {/* Pinyin */}
                                    <button
                                        onClick={() => navigate('/pinyin-test')}
                                        className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                            <span className="text-3xl text-gray-400" style={{ fontFamily: 'serif, "Noto Serif SC", "SimSun", serif' }}>拼</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">Pinyin Test</span>
                                            <span className="text-sm text-gray-500">Enter the Pinyin translation</span>
                                        </div>
                                    </button>

                                    {/* Listening Test */}
                                    <button
                                        onClick={() => navigate('/listen-test')}
                                        className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                    >
                                        <Headphones className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">Listening Test</span>
                                            <span className="text-sm text-gray-500">Audio recognition</span>
                                        </div>
                                    </button>

                                    {/* Translation Test */}
                                    <button
                                        onClick={() => navigate('/test')}
                                        className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                            <span className="text-3xl text-gray-400" style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 400 }}>A</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">Translation Test</span>
                                            <span className="text-sm text-gray-500">Enter the English translation</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Speed Challenge and Mistake Test */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => navigate('/speed-challenge')}
                                        disabled={stats.learnedWords < 60}
                                        className={`w-full p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 flex flex-row items-center text-left gap-4 ${stats.learnedWords >= 60
                                            ? 'bg-white hover:shadow-md'
                                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        <Zap className={`w-8 h-8 flex-shrink-0 ${stats.learnedWords >= 60 ? 'text-gray-400' : 'text-gray-300'}`} />
                                        <div className="flex flex-col">
                                            <span className={`font-semibold ${stats.learnedWords >= 60 ? 'text-gray-900' : 'text-gray-400'}`}>Speed Challenge</span>
                                            {stats.learnedWords >= 60 ? (
                                                <span className="text-sm text-gray-500">High Score: {stats.speedChallengeHighScore ?? 0}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Need {60 - stats.learnedWords} more words</span>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/mistake-test')}
                                        disabled={mistakeCount < 10}
                                        className={`w-full p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 flex flex-row items-center text-left gap-4 ${mistakeCount >= 10
                                            ? 'bg-white hover:shadow-md'
                                            : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        <AlertCircle className={`w-8 h-8 flex-shrink-0 ${mistakeCount >= 10 ? 'text-gray-400' : 'text-gray-300'}`} />
                                        <div className="flex flex-col">
                                            <span className={`font-semibold ${mistakeCount >= 10 ? 'text-gray-900' : 'text-gray-400'}`}>Mistake Test</span>
                                            {mistakeCount >= 10 ? (
                                                <span className="text-sm text-gray-500">{mistakeCount} Mistakes</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">Need {10 - mistakeCount} more mistakes</span>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Right Column - 30% width (3/10 columns) */}
                        <div className="col-span-3 flex flex-col gap-6">
                            {/* Row 1: Streak */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">Streak</h3>
                                </div>
                                <div className="border-t border-gray-200 pt-4 mb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-sm text-gray-600 mb-1">Current</div>
                                            <div className="text-lg text-gray-900">{streakDetails.currentStreak} days</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600 mb-1">Longest</div>
                                            <div className="text-lg text-gray-900">{streakDetails.longestStreak} days</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="text-sm text-gray-600 mb-3">Last 30 days</div>
                                    <div className="grid grid-cols-10 gap-1.5">
                                        {streakDetails.last30Days && streakDetails.last30Days.length > 0 ? (
                                            streakDetails.last30Days.map((day, index) => {
                                                const today = new Date().toISOString().split('T')[0];
                                                const isToday = day.date === today;
                                                const intensity = day.hasActivity
                                                    ? (isToday ? 'bg-gray-900' : 'bg-gray-400')
                                                    : 'bg-gray-100';
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`aspect-square rounded-md ${intensity}`}
                                                        title={day.date}
                                                    />
                                                );
                                            })
                                        ) : (
                                            // Fallback: show 30 empty squares if no data
                                            Array.from({ length: 30 }).map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="aspect-square rounded-md bg-gray-100"
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Row 2: Progress */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                                {/* Per-difficulty progress */}
                                <div className="flex flex-col gap-4 w-full">
                                    {['beginner', 'intermediate', 'advanced'].map((level) => {
                                        const label = level.charAt(0).toUpperCase() + level.slice(1);
                                        const wordsOfLevel = allWords.filter(w => w.difficulty === level);
                                        const learnedOfLevel = wordsOfLevel.filter(w => w.isLearned);
                                        const percentage = wordsOfLevel.length > 0 ? Math.round((learnedOfLevel.length / wordsOfLevel.length) * 100) : 0;
                                        return (
                                            <div key={level} className="w-full">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-gray-900">{label}</span>
                                                    <span className="text-sm text-gray-600">{percentage}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-2 bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout: Stacked vertically in order */}
                    <div className="block md:hidden space-y-6">
                        {/* 1. Daily Challenge */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-lg font-semibold text-gray-900">Daily challenges</div>
                                <div className="text-sm text-gray-600">{completedCount}/4</div>
                            </div>
                            {allCompleted && (
                                <div className="text-center py-2 mb-3 text-gray-500 bg-gray-50 rounded-lg">
                                    <p className="text-sm">100% complete</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                {todayChallenges.map((challenge, challengeIndex) => {
                                    const stepIndex = todayStepIndices[challengeIndex];
                                    const isCompleted = dailyChallenges[stepIndex];
                                    const isUnlocked = canStartChallenge(challengeIndex);
                                    return (
                                        <div key={challengeIndex} className={`flex items-center gap-3 p-3 border rounded-lg ${isCompleted ? 'bg-gray-100 border-gray-200' : 'border-gray-200'}`}>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-gray-300 border-gray-300' : 'border-gray-300'
                                                }`}>
                                                {isCompleted && <CheckCircle className="w-3 h-3 text-gray-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold ${isCompleted ? 'text-gray-500' : isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {challenge.label}
                                                </div>
                                                {challenge.description && (
                                                    <div className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {challenge.description}
                                                    </div>
                                                )}
                                            </div>
                                            {!isCompleted && isUnlocked && (
                                                <button
                                                    onClick={() => handleChallengeStart(stepIndex, challengeIndex)}
                                                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
                                                >
                                                    Start
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Practice */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <div className="text-lg font-semibold text-gray-900 mb-6">Practice</div>
                            {/* Main 2x2 grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Study Session */}
                                <button
                                    onClick={() => navigate('/study')}
                                    className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                >
                                    <GraduationCap className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">Study Session</span>
                                        <span className="text-sm text-gray-500">Spaced repetition</span>
                                    </div>
                                </button>

                                {/* Pinyin */}
                                <button
                                    onClick={() => navigate('/pinyin-test')}
                                    className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl text-gray-400" style={{ fontFamily: 'serif, "Noto Serif SC", "SimSun", serif' }}>拼</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">Pinyin Test</span>
                                        <span className="text-sm text-gray-500">Enter the Pinyin translation</span>
                                    </div>
                                </button>

                                {/* Listening Test */}
                                <button
                                    onClick={() => navigate('/listen-test')}
                                    className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                >
                                    <Headphones className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">Listening Test</span>
                                        <span className="text-sm text-gray-500">Audio recognition</span>
                                    </div>
                                </button>

                                {/* Translation Test */}
                                <button
                                    onClick={() => navigate('/test')}
                                    className="p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-row items-center text-left gap-4"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                        <span className="text-3xl text-gray-400" style={{ fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: 400 }}>A</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">Translation Test</span>
                                        <span className="text-sm text-gray-500">Enter the English translation</span>
                                    </div>
                                </button>
                            </div>

                            {/* Speed Challenge and Mistake Test */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/speed-challenge')}
                                    disabled={stats.learnedWords < 60}
                                    className={`w-full p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 flex flex-row items-center text-left gap-4 ${stats.learnedWords >= 60
                                        ? 'bg-white hover:shadow-md'
                                        : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <Zap className={`w-8 h-8 flex-shrink-0 ${stats.learnedWords >= 60 ? 'text-gray-400' : 'text-gray-300'}`} />
                                    <div className="flex flex-col">
                                        <span className={`font-semibold ${stats.learnedWords >= 60 ? 'text-gray-900' : 'text-gray-400'}`}>Speed Challenge</span>
                                        {stats.learnedWords >= 60 ? (
                                            <span className="text-sm text-gray-500">High Score: {stats.speedChallengeHighScore ?? 0}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Need {60 - stats.learnedWords} more words</span>
                                        )}
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/mistake-test')}
                                    disabled={mistakeCount < 10}
                                    className={`w-full p-6 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 flex flex-row items-center text-left gap-4 ${mistakeCount >= 10
                                        ? 'bg-white hover:shadow-md'
                                        : 'bg-gray-50 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <AlertCircle className={`w-8 h-8 flex-shrink-0 ${mistakeCount >= 10 ? 'text-gray-400' : 'text-gray-300'}`} />
                                    <div className="flex flex-col">
                                        <span className={`font-semibold ${mistakeCount >= 10 ? 'text-gray-900' : 'text-gray-400'}`}>Mistake Test</span>
                                        {mistakeCount >= 10 ? (
                                            <span className="text-sm text-gray-500">{mistakeCount} Mistakes</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">Need {10 - mistakeCount} more mistakes</span>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 3. Streak */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Flame className="w-5 h-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Streak</h3>
                            </div>
                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Current</div>
                                        <div className="text-lg font-bold text-gray-900">{streakDetails.currentStreak} days</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600 mb-1">Longest</div>
                                        <div className="text-lg font-bold text-gray-900">{streakDetails.longestStreak} days</div>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <div className="text-sm text-gray-600 mb-3">Last 30 days</div>
                                <div className="grid grid-cols-10 gap-1.5">
                                    {streakDetails.last30Days && streakDetails.last30Days.length > 0 ? (
                                        streakDetails.last30Days.map((day, index) => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const isToday = day.date === today;
                                            const intensity = day.hasActivity
                                                ? (isToday ? 'bg-gray-900' : 'bg-gray-400')
                                                : 'bg-gray-100';
                                            return (
                                                <div
                                                    key={index}
                                                    className={`aspect-square rounded-md ${intensity}`}
                                                    title={day.date}
                                                />
                                            );
                                        })
                                    ) : (
                                        // Fallback: show 30 empty squares if no data
                                        Array.from({ length: 30 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="aspect-square rounded-md bg-gray-100"
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Progress */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                            {/* Per-difficulty progress */}
                            <div className="flex flex-col gap-4 w-full">
                                {['beginner', 'intermediate', 'advanced'].map((level) => {
                                    const label = level.charAt(0).toUpperCase() + level.slice(1);
                                    const wordsOfLevel = allWords.filter(w => w.difficulty === level);
                                    const learnedOfLevel = wordsOfLevel.filter(w => w.isLearned);
                                    const percentage = wordsOfLevel.length > 0 ? Math.round((learnedOfLevel.length / wordsOfLevel.length) * 100) : 0;
                                    return (
                                        <div key={level} className="w-full">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-900">{label}</span>
                                                <span className="text-sm text-gray-600">{percentage}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-2 bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard 