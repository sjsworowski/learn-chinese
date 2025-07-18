/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Volume2 } from 'lucide-react';

interface VocabWord {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    isLearned: boolean;
}

const pickRandom = (arr: any[], n: number) => {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};

const stripParens = (str: string) => str.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const Test = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [words, setWords] = useState<VocabWord[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testStartTime] = useState(Date.now());
    const [testDuration, setTestDuration] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!completed && !loading) {
            timer = setInterval(() => {
                setTestDuration(Math.floor((Date.now() - testStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [completed, loading, testStartTime]);

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
                // Only include learned words with at least one non-parenthetical translation
                const learned = vocabRes.data.filter((w: VocabWord) => {
                    if (!w.isLearned) return false;
                    const hasRealAnswer = w.english.split(';').some(ans => stripParens(ans).trim().length > 0);
                    return hasRealAnswer;
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
        const possibleAnswers = words[currentIdx].english
            .split(';')
            .map(s => stripParens(s).trim().toLowerCase())
            .filter(Boolean);
        const userAnswer = stripParens(answer).toLowerCase();
        const correct = possibleAnswers.includes(userAnswer);
        if (correct) {
            setFeedback('correct');
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
                } else {
                    setCurrentIdx(idx => idx + 1);
                }
            }, 800);
        } else {
            setFeedback('incorrect');
        }
    };

    // Clear feedback on input change if previously incorrect
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (feedback === 'incorrect') setFeedback(null);
        setAnswer(e.target.value);
    };

    const playAudio = () => {
        if (word && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word.chinese);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        } else {
            toast.error('Speech synthesis not supported in this browser');
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
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #ddeaff 0%, #f6e3fa 35%, #e6e3fa 70%, #fbeafd 100%)' }}>
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎉 Test Complete!</h2>
                        <p className="mb-6">You answered all 10 words correctly. Great job!</p>
                        <button className="w-full py-3 rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition" onClick={() => navigate('/')}>Return to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    const word = words[currentIdx];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #ddeaff 0%, #f6e3fa 35%, #e6e3fa 70%, #fbeafd 100%)' }}>
            <div className="w-full max-w-2xl mx-auto p-6">
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    {/* Improved Timer at the top */}
                    <div className="mb-4 flex justify-center">
                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-500 rounded-full px-3 py-0.5 font-mono text-base font-normal shadow-sm" style={{ letterSpacing: '0.05em' }}>
                            <Clock className="w-4 h-4 opacity-70" />
                            {formatTime(testDuration)}
                        </span>
                    </div>
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-bold mb-2">Test Your Knowledge</h2>
                        <div className="text-gray-600 mb-1">Word {currentIdx + 1} of {words.length}</div>
                    </div>
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-4xl">{word.chinese}</span>
                            <button
                                onClick={playAudio}
                                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                                title="Listen to pronunciation"
                            >
                                <Volume2 className="w-6 h-6 text-blue-600" />
                            </button>
                        </div>
                        <span className="text-lg text-gray-500">{word.pinyin}</span>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 mb-2"
                            placeholder="Enter English translation"
                            value={answer}
                            onChange={handleInputChange}
                            disabled={feedback === 'correct'}
                            autoFocus
                        />
                        {feedback === 'correct' && <div className="text-green-600 mb-2">Correct!</div>}
                        {feedback === 'incorrect' && (
                            <div className="text-red-600 mb-2">Incorrect. Try again.</div>
                        )}
                        <button type="submit" className="rounded-xl bg-indigo-200 text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-300 transition px-8 py-2 w-full" disabled={!!feedback || !answer.trim()}>
                            {currentIdx === words.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Test; 