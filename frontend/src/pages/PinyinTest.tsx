/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Check, X, Lightbulb } from 'lucide-react';
import Confetti from '../components/Confetti';

interface VocabWord {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    isLearned: boolean;
}

const pickRandom = (arr: any[], n: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

const stripParens = (str: string) => str.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

const normalizePinyin = (pinyin: string) => {
    return pinyin
        .toLowerCase()
        .replace(/[āáǎà]/g, 'a')
        .replace(/[ēéěè]/g, 'e')
        .replace(/[īíǐì]/g, 'i')
        .replace(/[ōóǒò]/g, 'o')
        .replace(/[ūúǔù]/g, 'u')
        .replace(/[ǖǘǚǜ]/g, 'u')
        .replace(/[ńň]/g, 'n')
        .replace(/[ḿ]/g, 'm')
        .replace(/\s+/g, '') // Remove all spaces
};

// Add this function to create hint text for pinyin
const createPinyinHint = (pinyin: string) => {
    const normalized = normalizePinyin(pinyin);
    if (normalized.length <= 1) return normalized;
    return normalized.charAt(0) + '•'.repeat(normalized.length - 1);
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const PinyinTest = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [words, setWords] = useState<VocabWord[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [feedbackOpacity, setFeedbackOpacity] = useState(1);
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testStartTime] = useState(Date.now());
    const [testDuration, setTestDuration] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Add hint-related state
    const [incorrectAttempts, setIncorrectAttempts] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintText, setHintText] = useState('');

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!completed && !loading) {
            timer = setInterval(() => {
                setTestDuration(Math.floor((Date.now() - testStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [completed, loading, testStartTime]);

    // Add auto-focus when test starts
    useEffect(() => {
        if (!loading && !completed && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [loading, completed]);

    // Add auto-focus when moving to next question
    useEffect(() => {
        if (!loading && !completed && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [currentIdx, loading, completed]);

    // Reset hint state when moving to next question
    useEffect(() => {
        setIncorrectAttempts(0);
        setShowHint(false);
        setHintText('');
    }, [currentIdx]);

    const logTestTime = async () => {
        try {
            await axios.post(`${API_BASE}/vocabulary/log-activity`, {
                type: 'test',
                duration: testDuration
            });
        } catch (error) {
            console.error('Failed to log test time:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check session progress
                const sessionRes = await axios.get(`${API_BASE}/session-progress`);
                if (!sessionRes.data || sessionRes.data.currentSession < 1) {
                    toast.error('Complete at least 1 session before taking the test.');
                    navigate('/');
                    return;
                }
                // Check for recent test mode
                const params = new URLSearchParams(location.search);
                const isRecent = params.get('recent') === 'true';
                // Fetch vocab
                const vocabRes = await axios.get(isRecent ? `${API_BASE}/vocabulary/recently-learned` : `${API_BASE}/vocabulary`);
                // Only include learned words with pinyin
                const learned = vocabRes.data.filter((w: VocabWord) => {
                    if (!w.isLearned) return false;
                    const hasPinyin = w.pinyin && w.pinyin.trim().length > 0;
                    return hasPinyin;
                });
                if (learned.length < 10) {
                    toast.error('You need at least 10 learned words to take the test.');
                    navigate('/');
                    return;
                }
                const selected = pickRandom(learned, 10);
                setWords(selected);
                setLoading(false);
            } catch (error) {
                toast.error('Failed to load test data.');
                navigate('/');
            }
        };
        fetchData();
    }, [navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const correctPinyin = normalizePinyin(words[currentIdx].pinyin);
        const userAnswer = normalizePinyin(answer);
        const correct = correctPinyin === userAnswer;

        if (correct) {
            setFeedback('correct');
            setFeedbackOpacity(1);
            setTimeout(async () => {
                setFeedback(null);
                setAnswer('');
                if (currentIdx === words.length - 1) {
                    try {
                        await axios.post(`${API_BASE}/stats/test-completed`);
                        await logTestTime();
                    } catch (e) {
                        console.error('Failed to record test completion or log test time', e);
                    }
                    setCompleted(true);
                    setShowConfetti(true);
                } else {
                    setCurrentIdx(idx => idx + 1);
                }
            }, 800);
        } else {
            setFeedback('incorrect');
            setFeedbackOpacity(1);
            setIncorrectAttempts(prev => prev + 1);

            // Record mistake
            try {
                await axios.post(`${API_BASE}/mistakes/record`, {
                    wordId: words[currentIdx].id,
                    testType: 'pinyin-test'
                });
            } catch (error) {
                console.error('Failed to record mistake:', error);
                // Don't show error to user as this is not critical
            }

            // Show hint after 3 incorrect attempts
            if (incorrectAttempts === 2) { // This will be the 3rd attempt
                setHintText(createPinyinHint(words[currentIdx].pinyin));
            }

            setTimeout(() => {
                setFeedbackOpacity(0);
                setTimeout(() => {
                    setFeedback(null);
                }, 300);
            }, 700);
        }
    };

    // Clear feedback on input change if previously incorrect
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (feedback === 'incorrect') setFeedback(null);
        setAnswer(e.target.value);
    };

    const handleShowHint = () => {
        setShowHint(true);
    };

    // Helper to format seconds as mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (completed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                {showConfetti && <Confetti />}
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎉 Pinyin Test Complete!</h2>
                        <p className="mb-6">You answered all 10 pinyin questions correctly. Great job!</p>
                        <button className="w-full py-3 rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition" onClick={() => navigate('/')}>Return to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    const word = words[currentIdx];

    return (
        <div className="min-h-screen flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl mx-auto p-6">
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl text-gray-600 mb-2">Pinyin Test</h2>
                    </div>
                    <div className="flex flex-col items-center mb-6">
                        <span className="text-4xl mb-2">{word.chinese}</span>
                        <span className="text-lg text-gray-500">{word.english}</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full border rounded px-3 py-2 mb-2"
                            placeholder="Enter pinyin"
                            value={answer}
                            onChange={handleInputChange}
                            disabled={feedback === 'correct'}
                            autoFocus
                            autoComplete="off"
                            spellCheck="false"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                        <button type="submit" className="rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition px-8 py-2 w-full" disabled={!!feedback || !answer.trim()}>
                            {currentIdx === words.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </form>
                    {/* Hint Section */}
                    {incorrectAttempts >= 3 && !showHint && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleShowHint}
                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                            >
                                <Lightbulb className="w-4 h-4" />
                                <span>Need a hint?</span>
                            </button>
                        </div>
                    )}

                    {showHint && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <p className="text-sm text-blue-600 mb-1">Hint:</p>
                            <p className="text-lg font-mono text-blue-800">{hintText}</p>
                        </div>
                    )}
                    <div className="mt-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${((currentIdx + 1) / words.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Centered Feedback Overlay */}
            {feedback && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className={`transform ${feedback === 'correct' ? 'scale-100 opacity-100' : `scale-100 opacity-${feedbackOpacity * 100} transition-all duration-500 ease-out`
                        }`}>
                        {feedback === 'correct' && (
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                                <Check className="w-12 h-12 text-green-600" />
                            </div>
                        )}
                        {feedback === 'incorrect' && (
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                                <X className="w-12 h-12 text-red-600" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PinyinTest; 