/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Volume2, Check, Trophy, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface VocabularyWord {
    id: string
    chinese: string
    pinyin: string
    english: string
    imageUrl: string
    isLearned: boolean
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Study = () => {
    const navigate = useNavigate()
    const [words, setWords] = useState<VocabularyWord[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [sessionComplete, setSessionComplete] = useState(false)
    const [currentSession, setCurrentSession] = useState(0)
    const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([])
    const [sessionFinished, setSessionFinished] = useState(false)
    const [studySession, setStudySession] = useState({
        startTime: Date.now(),
        wordsStudied: 0,
        wordsLearned: 0,
        sessionTime: 0,
        completed: false
    })

    useEffect(() => {
        fetchWords()
    }, [])

    useEffect(() => {
        if (sessionWords.length > 0) {
            const timer = setInterval(() => {
                setStudySession(prev => ({
                    ...prev,
                    sessionTime: Math.floor((Date.now() - prev.startTime) / 1000)
                }))
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [sessionWords])

    const fetchWords = async () => {
        try {
            const response = await axios.get(`${API_BASE}/vocabulary`)
            const allWords = response.data
            setWords(allWords)

            // Get session progress from backend only
            let startSession = 0;
            try {
                const sessionResponse = await axios.get(`${API_BASE}/session-progress`)
                const sessionData = sessionResponse.data
                startSession = Math.min(sessionData.currentSession, Math.floor(allWords.length / 10))
            } catch (error) {
                console.error('Failed to fetch session progress from backend:', error)
                toast.error('Failed to fetch session progress from backend. Please try again later.')
            }

            // Initialize session
            const sessionWords = allWords.slice(startSession * 10, (startSession + 1) * 10)
            setSessionWords(sessionWords)
            setCurrentSession(startSession)
            setCurrentIndex(0)
            setIsLoading(false)
        } catch (error) {
            console.error('Failed to fetch words:', error)
            toast.error('Failed to fetch vocabulary from backend. Please try again later.')
            setIsLoading(false)
        }
    }

    const getCurrentSessionWords = () => {
        const startIndex = currentSession * 10
        return words.slice(startIndex, startIndex + 10)
    }

    const moveToNextSession = () => {
        const nextSession = currentSession + 1
        const nextSessionWords = getCurrentSessionWords()

        if (nextSessionWords.length === 0) {
            // All sessions completed
            setSessionComplete(true)
            setStudySession(prev => ({ ...prev, completed: true }))
            return
        }

        setCurrentSession(nextSession)
        setSessionWords(nextSessionWords)
        setCurrentIndex(0)
    }

    const checkSessionComplete = () => {
        const allLearned = sessionWords.every(word => word.isLearned)
        if (allLearned && sessionWords.length > 0) {
            moveToNextSession()
        }
    }

    const markWordAsLearned = async (wordId: string) => {
        try {
            await axios.post(`${API_BASE}/vocabulary/${wordId}/learn`);
            setWords(prev => prev.map(word =>
                word.id === wordId ? { ...word, isLearned: true } : word
            ));
            setSessionWords(prev => prev.map(word =>
                word.id === wordId ? { ...word, isLearned: true } : word
            ));
            setStudySession(prev => ({ ...prev, wordsLearned: prev.wordsLearned + 1 }));
        } catch (error: any) {
            toast.error('Failed to mark word as learned. Please try again later.')
        }
    };

    const handleNext = async () => {
        // Mark current word as learned
        if (currentWord) {
            await markWordAsLearned(currentWord.id);
        }

        if (currentIndex < sessionWords.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setStudySession(prev => ({ ...prev, wordsStudied: prev.wordsStudied + 1 }));
        } else {
            // We're on the last word of the session
            // Check if all words in the session are learned (including the current word which was just marked)
            const allLearned = sessionWords.every(word =>
                word.id === currentWord?.id ? true : word.isLearned
            );

            if (allLearned) {
                // Session completed, show intermediate screen
                setSessionFinished(true);
                setStudySession(prev => ({ ...prev, wordsStudied: prev.wordsStudied + 1 }));
            } else {
                // Session not complete, stay on last word
                setStudySession(prev => ({ ...prev, wordsStudied: prev.wordsStudied + 1 }));
            }
        }
    };

    const handleContinueSession = async () => {
        const nextSession = currentSession + 1;
        const nextSessionWords = words.slice(nextSession * 10, (nextSession + 1) * 10);

        if (nextSessionWords.length === 0) {
            // All sessions completed
            setSessionComplete(true);
            setStudySession(prev => ({ ...prev, completed: true }));
        } else {
            // Move to next session
            setCurrentSession(nextSession);
            setSessionWords(nextSessionWords);
            setCurrentIndex(0);
            setSessionFinished(false);

            // Save to backend only
            try {
                await axios.put(`${API_BASE}/session-progress`, {
                    currentSession: nextSession,
                    wordsStudied: studySession.wordsStudied,
                    wordsLearned: studySession.wordsLearned,
                    totalStudyTime: studySession.sessionTime
                });
            } catch (error) {
                toast.error('Failed to save session progress to backend. Please try again later.');
            }
        }
    };

    const logStudyTime = async () => {
        try {
            await axios.post(`${API_BASE}/vocabulary/log-activity`, {
                type: 'study',
                duration: studySession.sessionTime
            });
        } catch (error) {
            console.error('Failed to log study time:', error);
        }
    };

    const handleReturnToDashboard = async () => {
        // Save completed session progress to backend only
        const nextSession = currentSession + 1;
        try {
            await axios.put(`${API_BASE}/session-progress`, {
                currentSession: nextSession,
                wordsStudied: studySession.wordsStudied,
                wordsLearned: studySession.wordsLearned,
                totalStudyTime: studySession.sessionTime
            });
            await logStudyTime();
        } catch (error) {
            toast.error('Failed to save session progress to backend. Please try again later.');
        }

        navigate('/', { state: { from: 'study' } });
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    const handleRestart = () => {
        setCurrentIndex(0)
        setCurrentSession(0)
        setSessionComplete(false)
        setSessionFinished(false)
        setStudySession({
            startTime: Date.now(),
            wordsStudied: 0,
            wordsLearned: 0,
            sessionTime: 0,
            completed: false
        })
        // Reset to first session
        const firstSessionWords = words.slice(0, 10)
        setSessionWords(firstSessionWords)
    }

    const handleIntermediateSessionComplete = async () => {
        // Save current session progress before completing
        try {
            await axios.put(`${API_BASE}/session-progress`, {
                currentSession: currentSession,
                wordsStudied: studySession.wordsStudied,
                wordsLearned: studySession.wordsLearned,
                totalStudyTime: studySession.sessionTime
            });
            await logStudyTime();
        } catch (error) {
            toast.error('Failed to save session progress to backend. Please try again later.');
        }

        // Navigate to dashboard
        navigate('/', { state: { from: 'study' } });
    };

    const handleCompleteSession = async () => {
        // Check if this is the final session
        const totalSessions = Math.ceil(words.length / 10);
        const isFinalSession = currentSession + 1 >= totalSessions;

        // Save current session progress before completing
        try {
            await axios.put(`${API_BASE}/session-progress`, {
                currentSession: currentSession,
                wordsStudied: studySession.wordsStudied,
                wordsLearned: studySession.wordsLearned,
                totalStudyTime: studySession.sessionTime
            });
            await logStudyTime();
        } catch (error) {
            toast.error('Failed to save session progress to backend. Please try again later.');
        }

        // Clear session tracking if this is the final session
        if (isFinalSession) {
            try {
                await axios.post(`${API_BASE}/session-progress/reset`);
            } catch (error) {
                console.error('Failed to reset session progress in backend:', error);
            }
        }

        try {
            await axios.post(`${API_BASE}/stats/session`, {
                sessionTime: studySession.sessionTime,
                wordsStudied: studySession.wordsStudied,
                wordsLearned: studySession.wordsLearned
            })
            toast.success('Session completed! Progress saved.')
            navigate('/', { state: { from: 'study' } })
        } catch (error) {
            toast.success('Session completed! (offline mode)')
            navigate('/', { state: { from: 'study' } })
        }
    }

    const playAudio = async () => {
        if (!currentWord) return;
        try {
            const response = await fetch(`${API_BASE}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: currentWord.chinese }),
            });
            if (!response.ok) throw new Error('Failed to fetch audio');
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new window.Audio(audioUrl);
            audio.play();
        } catch (error) {
            toast.error('Failed to play audio. Please try again.');
        }
    }

    // Helper to format seconds as mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    const currentWord = sessionWords[currentIndex]
    const progress = ((currentIndex + 1) / sessionWords.length) * 100
    const isLastWord = currentIndex === sessionWords.length - 1

    if (sessionComplete) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎉 Study Complete!</h2>
                        <p className="mb-6">You finished all study sessions. Great job!</p>
                        <button className="w-full py-3 rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition" onClick={handleReturnToDashboard}>Return to Dashboard</button>
                    </div>
                </div>
            </div>
        )
    }

    if (sessionFinished) {
        const nextSession = currentSession + 1;
        const cycleStep = nextSession % 10;

        // Check if we just completed 2 study sessions in a row
        const isAfterTwoStudySessions = cycleStep === 2 || cycleStep === 6;

        // Determine the next step in the learning cycle
        let nextStepText = '';
        let nextStepAction = () => { };

        if (isAfterTwoStudySessions) {
            // After 2 study sessions, only show return to dashboard
            nextStepText = 'Return to Dashboard';
            nextStepAction = handleReturnToDashboard;
        } else if (cycleStep === 0 || cycleStep === 1 || cycleStep === 4 || cycleStep === 5) {
            // Next step is a study session
            nextStepText = `Continue to Session ${nextSession + 1}`;
            nextStepAction = handleContinueSession;
        } else if (cycleStep === 3) {
            // Next step is Recently Learned Pinyin Test
            nextStepText = 'Take Recently Learned Pinyin Test';
            nextStepAction = () => navigate('/pinyin-test?recent=true');
        } else if (cycleStep === 7) {
            // Next step is Recently Learned Pinyin Test
            nextStepText = 'Take Recently Learned Pinyin Test';
            nextStepAction = () => navigate('/pinyin-test?recent=true');
        } else if (cycleStep === 8) {
            // Next step is Take Test (all words)
            nextStepText = 'Take Test (All Words)';
            nextStepAction = () => navigate('/test');
        } else if (cycleStep === 9) {
            // Next step is Pinyin Test (all words)
            nextStepText = 'Take Pinyin Test (All Words)';
            nextStepAction = () => navigate('/pinyin-test');
        }

        return (
            <div className="min-h-screen flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Session {currentSession + 1} Complete!</h2>
                            <p className="text-gray-600">Great job! You've completed session {currentSession + 1}.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{sessionWords.filter(w => w.isLearned).length}</div>
                                <div className="text-sm text-gray-600">Words Learned</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={nextStepAction}
                                className="btn-primary w-full"
                            >
                                {nextStepText}
                            </button>
                            {!isAfterTwoStudySessions && (
                                <button
                                    onClick={handleReturnToDashboard}
                                    className="btn-secondary w-full"
                                >
                                    Return to Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl mx-auto p-6">
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    {/* Word display without image */}
                    {currentWord && (
                        <div className="flex flex-col items-center mb-10">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-6xl">{currentWord.chinese}</span>
                                <button
                                    onClick={playAudio}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                                    title="Listen to pronunciation"
                                >
                                    <Volume2 className="w-6 h-6 text-blue-600" />
                                </button>
                            </div>
                            <span className="text-3xl font-bold text-blue-700 mb-2">{currentWord.pinyin}</span>
                            <span className="text-2xl text-gray-800 mb-6">{currentWord.english}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-10">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            <ArrowLeft className="w-5 h-5 mr-1" />
                            Previous
                        </button>

                        <button
                            onClick={handleNext}
                            className="rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition px-4 py-2"
                        >
                            {isLastWord ? 'Complete' : 'Next'}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${((currentIndex + 1) / sessionWords.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const sampleWords: VocabularyWord[] = [
    {
        id: '1',
        chinese: '苹果',
        pinyin: 'píngguǒ',
        english: 'Apple',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop',
        isLearned: false
    },
    {
        id: '2',
        chinese: '猫',
        pinyin: 'māo',
        english: 'Cat',
        imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop',
        isLearned: false
    },
    {
        id: '3',
        chinese: '书',
        pinyin: 'shū',
        english: 'Book',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
        isLearned: false
    },
    {
        id: '4',
        chinese: '水',
        pinyin: 'shuǐ',
        english: 'Water',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
        isLearned: false
    },
    {
        id: '5',
        chinese: '太阳',
        pinyin: 'tàiyáng',
        english: 'Sun',
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        isLearned: false
    }
]

export default Study
