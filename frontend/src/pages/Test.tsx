/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Volume2, Check, X, Lightbulb } from 'lucide-react';
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

// Add this function to normalize apostrophes and quotes
const normalizeQuotes = (str: string) => {
    return str
        .replace(/[''′]/g, "'") // Replace smart quotes with regular apostrophe
        .replace(/[""″]/g, '"') // Replace smart quotes with regular quote
        .replace(/\u2019/g, "'") // Right single quotation mark
        .replace(/\u2018/g, "'") // Left single quotation mark
        .replace(/\u201D/g, '"') // Right double quotation mark
        .replace(/\u201C/g, '"'); // Left double quotation mark
};

// Add this function to strip special characters
const stripSpecialChars = (str: string) => {
    return str
        .replace(/[?!.,;:']/g, '') // Remove common punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim(); // This already removes leading/trailing spaces
};

// Add this function to create hint text
const createHint = (text: string) => {
    const words = text.split(' ');
    return words.map(word => {
        if (word.length <= 1) return word;
        return word.charAt(0) + '•'.repeat(word.length - 1);
    }).join(' ');
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Test = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Helper to get navigation state with challenge info preserved
    const getNavState = () => {
        const today = new Date().toISOString().split('T')[0];
        const activeChallengeStr = localStorage.getItem(`activeChallenge_${today}`);
        let navState: any = { from: 'test' };
        if (activeChallengeStr) {
            try {
                const activeChallenge = JSON.parse(activeChallengeStr);
                navState.challengeStepIndex = activeChallenge.stepIndex;
                navState.from = 'daily-challenge';
            } catch (e) {
                // If parsing fails, just use 'test'
            }
        }
        return navState;
    };
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
            const response = await axios.post(`${API_BASE}/vocabulary/log-activity`, {
                type: 'test',
                duration: testDuration
            });
            console.log('Test activity logged successfully:', response.data);
        } catch (error: any) {
            console.error('Failed to log test time:', error);
            console.error('Error details:', error.response?.data || error.message);
            toast.error('Failed to log test activity');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check session progress
                const sessionRes = await axios.get(`${API_BASE}/session-progress`);
                if (!sessionRes.data || sessionRes.data.currentSession < 1) {
                    toast.error('Complete at least 1 session before taking the test.');
                    navigate('/', { state: getNavState() });
                    return;
                }
                // Check for recent test mode
                const params = new URLSearchParams(location.search);
                const isRecent = params.get('recent') === 'true';
                // Fetch vocab
                const vocabRes = await axios.get(isRecent ? `${API_BASE}/vocabulary/recently-learned` : `${API_BASE}/vocabulary`);
                // Only include learned words with at least one non-parenthetical translation
                const learned = vocabRes.data.filter((w: VocabWord) => {
                    if (!w.isLearned) return false;
                    const hasRealAnswer = w.english.split(';').some(ans => stripParens(ans).trim().length > 0);
                    return hasRealAnswer;
                });
                if (learned.length < 10) {
                    toast.error('You need at least 10 learned words to take the test.');
                    navigate('/', { state: getNavState() });
                    return;
                }
                const selected = pickRandom(learned, 10);
                setWords(selected);
                setLoading(false);
            } catch (error) {
                toast.error('Failed to load test data.');
                navigate('/', { state: getNavState() });
            }
        };
        fetchData();
    }, [navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const possibleAnswers = words[currentIdx].english
            .split(';')
            .map(s => normalizeQuotes(stripSpecialChars(stripParens(s).trim())).toLowerCase())
            .filter(Boolean);
        const userAnswer = normalizeQuotes(stripSpecialChars(stripParens(answer).trim())).toLowerCase();
        const correct = possibleAnswers.includes(userAnswer);

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
                    testType: 'test'
                });
            } catch (error) {
                console.error('Failed to record mistake:', error);
                // Don't show error to user as this is not critical
            }

            // Show hint after 3 incorrect attempts
            if (incorrectAttempts === 2) { // This will be the 3rd attempt
                const firstAnswer = possibleAnswers[0]; // Use the first answer for hint
                setHintText(createHint(firstAnswer));
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
        const normalizedValue = normalizeQuotes(e.target.value);
        setAnswer(normalizedValue);
    };

    const handleShowHint = () => {
        setShowHint(true);
    };

    const playAudio = async () => {
        if (!word) return;
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE}/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: word.chinese }),
            });
            if (!response.ok) throw new Error('Failed to fetch audio');
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new window.Audio(audioUrl);
            audio.play();
        } catch (error) {
            toast.error('Failed to play audio. Please try again.');
        }
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
                    <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎉 Test Complete!</h2>
                        <p className="mb-6">You answered all 10 words correctly. Great job!</p>
                        <button className="w-full py-3 rounded-lg bg-gray-900 text-white font-medium text-base shadow-sm hover:bg-gray-800 transition" onClick={() => navigate('/', { state: getNavState() })}>Return to Dashboard</button>
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
                        <h2 className="text-xl text-gray-600 mb-2">Test Your Knowledge</h2>
                    </div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-4xl">{word.chinese}</span>
                            <button
                                onClick={playAudio}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                title="Listen to pronunciation"
                            >
                                <Volume2 className="w-6 h-6 text-gray-700" />
                            </button>
                        </div>
                        <span className="text-lg text-gray-500">{word.pinyin}</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full border rounded px-3 py-2 mb-2"
                            placeholder="Enter English translation"
                            value={answer}
                            onChange={handleInputChange}
                            disabled={feedback === 'correct'}
                            autoFocus
                            autoComplete="off"
                            spellCheck="false"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                        <button type="submit" className="rounded-lg bg-gray-900 text-white font-medium text-base shadow-sm hover:bg-gray-800 transition px-8 py-2 w-full" disabled={!!feedback || !answer.trim()}>
                            {currentIdx === words.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </form>
                    {/* Hint Section */}
                    {incorrectAttempts >= 3 && !showHint && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleShowHint}
                                className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Lightbulb className="w-4 h-4" />
                                <span>Need a hint?</span>
                            </button>
                        </div>
                    )}

                    {showHint && (
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <p className="text-sm text-gray-600 mb-1">Hint:</p>
                            <p className="text-lg font-mono text-gray-900">{hintText}</p>
                        </div>
                    )}
                    <div className="mt-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gray-900 h-2 rounded-full transition-all duration-300 ease-out"
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
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <Check className="w-12 h-12 text-gray-700" />
                            </div>
                        )}
                        {feedback === 'incorrect' && (
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <X className="w-12 h-12 text-gray-700" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Test; 