import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, Lock, ArrowRight, BookOpen, LogOut, TrendingUp, Clock, User, Menu } from 'lucide-react';
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
    { label: 'Test', color: 'bg-indigo-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Pinyin', color: 'bg-emerald-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Study', color: 'bg-blue-500', icon: <BookOpen className="w-5 h-5 text-white" /> },
    { label: 'Test', color: 'bg-indigo-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Pinyin', color: 'bg-emerald-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Test', color: 'bg-pink-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
    { label: 'Test', color: 'bg-green-500', icon: <CheckCircle className="w-5 h-5 text-white" /> },
];

const Dashboard = () => {
    const { user, logout, isLoading } = useAuth()
    const [stats, setStats] = useState<LearningStats>({
        totalWords: 0,
        learnedWords: 0,
        currentStreak: 0,
        totalStudyTime: 0,
        testsCompleted: 0
    })
    const [sessionProgress, setSessionProgress] = useState({
        currentSession: 0,
        totalSessions: 0,
        hasProgress: false
    })
    const currentStep = sessionProgress?.currentSession || 0;
    const cycleStep = currentStep % 10;
    const unitNumber = 1 + Math.floor(currentStep / 10);
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

        // no longer needed, handled by AuthContext
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

    // Helper to get button label and handler for current step
    const getStartLearningButton = () => {
        const step = currentStep % 10;
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
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 5) {
            return { label: 'Continue Study', onClick: startStudy };
        }
        if (step === 6) {
            return { label: 'Recent Test', onClick: () => navigate('/test?recent=true') };
        }
        if (step === 7) {
            return { label: 'Recent Pinyin Test', onClick: () => navigate('/pinyin-test?recent=true') };
        }
        if (step === 8) {
            return { label: 'Test', onClick: () => navigate('/test') };
        }
        if (step === 9) {
            return { label: 'Pinyin Test', onClick: () => navigate('/pinyin-test') };
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    const { label: mobileBtnLabel, onClick: mobileBtnClick } = getStartLearningButton();
    const { label: desktopBtnLabel, onClick: desktopBtnClick } = getStartLearningButton();

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-6xl mx-auto p-8">
                <div className="backdrop-blur-md bg-white/20 border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    {/* Dashboard content starts here */}
                    <div className="flex flex-row md:flex-row md:justify-between md:items-center mb-6 gap-2 md:gap-0 relative items-center">
                        {/* Mobile: menu button and title */}
                        <div className="flex flex-row items-center md:hidden flex-1">
                            <button ref={menuButtonRef} onClick={() => setMobileMenuOpen(v => !v)} className="rounded-full p-2 hover:bg-gray-100 transition mr-2" title="Menu">
                                <Menu className="w-6 h-6 text-indigo-500" />
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Learn Chinese</h1>
                            {mobileMenuOpen && (
                                <div ref={menuDropdownRef} className="absolute left-0 right-0 mx-auto top-14 z-50 bg-white rounded-xl shadow-lg py-2 w-full max-w-s border border-gray-200 flex flex-col">
                                    <button onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-left">
                                        <User className="w-5 h-5 text-indigo-500" /> Profile
                                    </button>
                                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900 text-left">
                                        <LogOut className="w-5 h-5 text-indigo-500" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Desktop buttons and title */}
                        <h1 className="hidden md:block text-3xl font-bold text-gray-900">Learn Chinese</h1>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-m text-gray-500">{!isLoading && user?.username}</span>
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
                                <div className="text-lg font-semibold text-gray-900 mb-2">Unit {unitNumber}</div>
                                <div className="flex flex-col items-center gap-0 mb-6 relative">
                                    {visibleSteps.map((step, idx) => {
                                        const globalIdx = start + idx;
                                        const isCompleted = globalIdx < cycleStep;
                                        const isCurrent = globalIdx === cycleStep;
                                        return (
                                            <React.Fragment key={globalIdx}>
                                                <div className="flex flex-col items-center relative">
                                                    <div
                                                        ref={el => stepRefs.current[globalIdx] = el}
                                                        className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-all duration-200 shadow-lg border-4
                                                         ${isCompleted ? 'bg-green-100 border-green-400' :
                                                                isCurrent ? 'bg-indigo-100 border-indigo-400 cursor-pointer hover:bg-indigo-200 hover:shadow-2xl hover:scale-110 ring-4 ring-indigo-200 w-20 h-20 animate-pulse-grow' :
                                                                    'bg-gray-100 border-gray-300'}
                                                         `}

                                                        onMouseEnter={!isMobile ? () => {
                                                            if (isCurrent) {
                                                                setActiveTooltipIdx(globalIdx);
                                                                setHoveredStepIdx(globalIdx);
                                                            }
                                                        } : undefined}
                                                        onMouseLeave={!isMobile ? () => {
                                                            if (isCurrent) {
                                                                setActiveTooltipIdx(null);
                                                                setTimeout(() => setHoveredStepIdx(null), 50);
                                                            }
                                                        } : undefined}
                                                        onClick={() => {
                                                            if (isCurrent) {
                                                                setClickedStepIdx(globalIdx);
                                                                if (isMobile) {
                                                                    setActiveTooltipIdx(activeTooltipIdx === globalIdx ? null : globalIdx);
                                                                } else {
                                                                    setActiveTooltipIdx(globalIdx);
                                                                }
                                                            }
                                                        }}
                                                        tabIndex={isCurrent ? 0 : -1}
                                                        aria-label={isCurrent ? `Show action for ${step.label}` : undefined}
                                                        style={isCurrent ? { outline: 'none' } : {}}
                                                    >
                                                        {isCompleted ? <CheckCircle className="w-8 h-8 text-green-500" /> : isCurrent ? <ArrowRight className="w-12 h-12 text-indigo-500" /> : <Lock className="w-8 h-8 text-gray-300" />}
                                                        {/* Tooltip for active step */}
                                                        {(isCurrent && ((isMobile && activeTooltipIdx === globalIdx) || (!isMobile && (activeTooltipIdx === globalIdx || hoveredStepIdx === globalIdx)))) && (
                                                            <div
                                                                ref={el => tooltipRefs.current[globalIdx] = el}
                                                                className="absolute z-50 -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center"
                                                                onMouseEnter={() => setHoveredStepIdx(globalIdx)}
                                                                onMouseLeave={() => setHoveredStepIdx(null)}
                                                            >
                                                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-15 py-3 flex flex-col items-center min-w-[180px] relative">
                                                                    <button
                                                                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
                                                                        onClick={e => {
                                                                            ignoreNextOutsideClick.current = true;
                                                                            setHoveredStepIdx(null);
                                                                            const btn = getStartLearningButton();
                                                                            btn.onClick();
                                                                        }}
                                                                    >
                                                                        {getStartLearningButton().label}
                                                                    </button>
                                                                </div>
                                                                {/* Triangle caret */}
                                                                <div className="w-4 h-4 bg-white rotate-45 -mt-2 shadow-lg"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-base text-gray-700 mb-2">{step.label}</span>
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
                            <div className="bg-purple-100 rounded-xl p-2 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-400" /></div>
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
                                <div className="text-lg font-semibold text-gray-900 mb-2">Unit {unitNumber}</div>
                                <div className="flex flex-row items-center justify-between gap-2 mb-6 relative">
                                    {visibleSteps.map((step, idx) => {
                                        const globalIdx = start + idx;
                                        const isCompleted = globalIdx < cycleStep;
                                        const isCurrent = globalIdx === cycleStep;
                                        return (
                                            <React.Fragment key={globalIdx}>
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        ref={el => stepRefs.current[globalIdx] = el}
                                                        className={`rounded-full flex items-center justify-center mb-2 transition-all duration-200 shadow-lg border-4
                                                         ${isCurrent
                                                                ? `bg-indigo-100 border-indigo-400 cursor-pointer ring-4 ring-indigo-200 w-20 h-20 hover:bg-indigo-200 hover:shadow-2xl hover:scale-110 animate-pulse-grow ${isMobile ? (clickedStepIdx === globalIdx ? 'shadow-2xl scale-110' : ''): (activeTooltipIdx === globalIdx ? 'shadow-2xl scale-110' : '')}`
                                                                : isCompleted
                                                                    ? 'bg-green-100 border-green-400 w-14 h-14'
                                                                    : 'bg-gray-100 border-gray-300 w-14 h-14'}
                                                          `}
                                                        onMouseEnter={() => {
                                                            if (isCurrent) {
                                                                setActiveTooltipIdx(globalIdx);
                                                                setHoveredStepIdx(globalIdx);
                                                            }
                                                        }}
                                                        onMouseLeave={() => {
                                                            if (isCurrent) {
                                                                setActiveTooltipIdx(null);
                                                                setTimeout(() => setHoveredStepIdx(null), 50);
                                                            }
                                                        }}
                                                        onClick={() => isCurrent && setActiveTooltipIdx(activeTooltipIdx === globalIdx ? null : globalIdx)}
                                                        tabIndex={isCurrent ? 0 : -1}
                                                        aria-label={isCurrent ? `Show action for ${step.label}` : undefined}
                                                        style={isCurrent ? { outline: 'none' } : {}}
                                                    >
                                                        {isCompleted && !isCurrent ? <CheckCircle className="w-8 h-8 text-green-500" /> : isCurrent ? <ArrowRight className="w-12 h-12 text-indigo-500" /> : <Lock className="w-8 h-8 text-gray-300" />}
                                                        {/* Tooltip for active step */}
                                                        {(isCurrent && (activeTooltipIdx === globalIdx || hoveredStepIdx === globalIdx)) && (
                                                            <div
                                                                ref={el => tooltipRefs.current[globalIdx] = el}
                                                                className="absolute z-50 -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center"
                                                                onMouseEnter={() => setHoveredStepIdx(globalIdx)}
                                                                onMouseLeave={() => setHoveredStepIdx(null)}
                                                            >
                                                                <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex flex-col items-center min-w-[180px] relative">
                                                                    <button
                                                                        className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
                                                                        onClick={e => {
                                                                            ignoreNextOutsideClick.current = true;
                                                                            setHoveredStepIdx(null);
                                                                            const btn = getStartLearningButton();
                                                                            btn.onClick();
                                                                        }}
                                                                    >
                                                                        {getStartLearningButton().label}
                                                                    </button>
                                                                </div>
                                                                {/* Triangle caret */}
                                                                <div className="w-4 h-4 bg-white rotate-45 -mt-2 shadow-lg"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-700 mt-2">{step.label}</span>
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