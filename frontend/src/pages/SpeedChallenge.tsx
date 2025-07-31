import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Check, X, Play, Pause, RotateCcw } from 'lucide-react';
import Confetti from '../components/Confetti';
import { useAuth } from '../contexts/AuthContext';

interface VocabWord {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    isLearned: boolean;
}

interface Question {
    word: VocabWord;
    type: 'english-to-pinyin' | 'pinyin-to-english';
    question: string;
    answer: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
        .replace(/\s+/g, ''); // Remove all spaces
};

const SpeedChallenge = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Add this line to get authenticated context
    const [words, setWords] = useState<VocabWord[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answer, setAnswer] = useState('');
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [highScore, setHighScore] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const correctAnswersRef = useRef(0); // Add this ref to track current score

    // Add feedback state
    const [feedback, setFeedback] = useState<string | null>(null);
    const [feedbackOpacity, setFeedbackOpacity] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user has enough learned words using stats endpoint (same as Dashboard)
                const statsRes = await axios.get(`${API_BASE}/stats`);
                const learnedWordsCount = statsRes.data.learnedWords;

                if (learnedWordsCount < 60) {
                    toast.error('You need at least 60 learned words to play Speed Challenge.');
                    navigate('/');
                    return;
                }

                // Get vocabulary for the game
                const vocabRes = await axios.get(`${API_BASE}/vocabulary`);
                // Only include learned words with at least one non-parenthetical translation
                const learned = vocabRes.data.filter((w: VocabWord) => {
                    if (!w.isLearned) return false;
                    const hasRealAnswer = w.english.split(';').some(ans => stripParens(ans).trim().length > 0);
                    return hasRealAnswer;
                });

                setWords(learned);

                // Load high score from backend
                try {
                    const highScoreRes = await axios.get(`${API_BASE}/stats/speed-challenge/high-score`);
                    setHighScore(highScoreRes.data.highScore);
                } catch (error) {
                    console.error('Failed to load high score:', error);
                    // Continue without high score if it fails
                }

                setLoading(false);
            } catch (error) {
                toast.error('Failed to load data.');
                navigate('/');
            }
        };
        fetchData();
    }, [navigate]);

    const generateQuestions = () => {
        const selectedWords = words.sort(() => 0.5 - Math.random()).slice(0, 50); // Get 50 random words
        const newQuestions: Question[] = [];

        selectedWords.forEach(word => {
            // English to Pinyin question
            newQuestions.push({
                word,
                type: 'english-to-pinyin',
                question: word.english.split(';')[0].trim(), // Use first English translation
                answer: word.pinyin
            });

            // Pinyin to English question - filter out answers that are only in brackets
            const englishAnswers = word.english.split(';').map(s => s.trim()).filter(Boolean);
            const validAnswers = englishAnswers.filter(answer => {
                // Remove parentheses and check if there's content outside brackets
                const withoutParens = answer.replace(/\([^)]*\)/g, '').trim();
                return withoutParens.length > 0;
            });

            // Only add pinyin-to-english question if there are valid answers
            if (validAnswers.length > 0) {
                newQuestions.push({
                    word,
                    type: 'pinyin-to-english',
                    question: word.pinyin,
                    answer: validAnswers[0] // Use first valid answer
                });
            }
        });

        // Shuffle questions and take first 30
        return newQuestions.sort(() => 0.5 - Math.random()).slice(0, 30);
    };

    const startGame = () => {
        const gameQuestions = generateQuestions();
        setQuestions(gameQuestions);
        setCurrentQuestion(0);
        setCorrectAnswers(0);
        correctAnswersRef.current = 0; // Reset the ref
        setTimeLeft(60);
        setIsActive(true);
        setIsFinished(false);
        setAnswer('');
        setShowConfetti(false);

        console.log('🔍 Game started - initial correctAnswers set to 0');

        // Start countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Auto-focus input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const endGame = async () => {
        setIsActive(false);
        setIsFinished(true);

        const finalScore = correctAnswersRef.current; // Use the ref value
        console.log('🔍 endGame called with correctAnswers:', finalScore);
        console.log('🔍 timeLeft:', timeLeft);

        // Save score to backend
        try {
            const scoreData = {
                score: finalScore,
                timeUsed: 60 - timeLeft
            };
            console.log('🔍 Sending score data to backend:', scoreData);

            await axios.post(`${API_BASE}/stats/speed-challenge`, scoreData);

            // Check if this is a new high score
            if (finalScore > highScore) {
                setHighScore(finalScore);
                setShowConfetti(true);
            }
        } catch (error) {
            console.error('Failed to save speed challenge score:', error);
            // Still update local high score if save fails
            if (finalScore > highScore) {
                setHighScore(finalScore);
                setShowConfetti(true);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isActive || isFinished) return;

        const currentQ = questions[currentQuestion];
        let userAnswer = answer.trim();

        // Normalize answers based on question type
        if (currentQ.type === 'english-to-pinyin') {
            // For English to Pinyin, normalize the user's pinyin input
            userAnswer = normalizePinyin(userAnswer);
            const correctAnswer = normalizePinyin(currentQ.answer);

            const isCorrect = userAnswer === correctAnswer;

            if (isCorrect) {
                setCorrectAnswers(prev => {
                    const newScore = prev + 1;
                    correctAnswersRef.current = newScore; // Update the ref
                    console.log('🔍 Correct answer! Score incremented from', prev, 'to', newScore);
                    return newScore;
                });
                setFeedback('correct');
                setFeedbackOpacity(1);

                // Clear answer
                setAnswer('');

                // Clear feedback after 0.5 seconds and move to next question
                setTimeout(() => {
                    setFeedbackOpacity(0);
                    setTimeout(() => {
                        setFeedback(null);
                        moveToNextQuestion();
                    }, 300);
                }, 500);
            } else {
                setFeedback('incorrect');
                setFeedbackOpacity(1);

                // Clear answer but don't move to next question automatically
                setAnswer('');

                // Clear feedback after 0.5 seconds
                setTimeout(() => {
                    setFeedbackOpacity(0);
                    setTimeout(() => {
                        setFeedback(null);
                    }, 300);
                }, 500);

                // Auto-focus for next input
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        } else {
            // For Pinyin to English, check against all possible English answers
            const possibleAnswers = currentQ.word.english
                .split(';')
                .map(s => normalizeQuotes(stripSpecialChars(stripParens(s).trim())).toLowerCase())
                .filter(Boolean);

            const userAnswerNormalized = normalizeQuotes(stripSpecialChars(stripParens(userAnswer).trim())).toLowerCase();
            const isCorrect = possibleAnswers.includes(userAnswerNormalized);

            if (isCorrect) {
                setCorrectAnswers(prev => {
                    const newScore = prev + 1;
                    correctAnswersRef.current = newScore; // Update the ref
                    console.log('🔍 Correct answer! Score incremented from', prev, 'to', newScore);
                    return newScore;
                });
                setFeedback('correct');
                setFeedbackOpacity(1);

                // Clear answer
                setAnswer('');

                // Clear feedback after 0.5 seconds and move to next question
                setTimeout(() => {
                    setFeedbackOpacity(0);
                    setTimeout(() => {
                        setFeedback(null);
                        moveToNextQuestion();
                    }, 300);
                }, 500);
            } else {
                setFeedback('incorrect');
                setFeedbackOpacity(1);

                // Clear answer but don't move to next question automatically
                setAnswer('');

                // Clear feedback after 0.5 seconds
                setTimeout(() => {
                    setFeedbackOpacity(0);
                    setTimeout(() => {
                        setFeedback(null);
                    }, 300);
                }, 500);

                // Auto-focus for next input
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        }
    };

    const moveToNextQuestion = () => {
        setFeedback(null);
        setFeedbackOpacity(1);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            // If we run out of questions, end game
            endGame();
        }

        // Auto-focus for next question
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(e.target.value);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isFinished) {
        const finalScore = correctAnswersRef.current; // Use the ref value for display
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                {showConfetti && <Confetti />}
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎯 Speed Challenge Complete!</h2>
                        <div className="mb-6 space-y-2">
                            <p className="text-lg">You got <span className="font-bold text-indigo-600">{finalScore}</span> correct!</p>
                            <p className="text-sm text-gray-600">Time used: {formatTime(60 - timeLeft)}</p>
                            {finalScore > highScore && (
                                <p className="text-green-600 font-semibold">🏆 New High Score!</p>
                            )}
                        </div>
                        <div className="space-y-3">
                            <button
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-lg shadow hover:bg-indigo-700 transition"
                                onClick={startGame}
                            >
                                Play Again
                            </button>
                            <button
                                className="w-full py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold text-lg shadow hover:bg-gray-300 transition"
                                onClick={() => navigate('/')}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-3xl font-bold mb-4">⚡ Speed Challenge</h2>
                        <p className="text-gray-600 mb-6">
                            You have 60 seconds to answer as many questions as possible!
                            Mix of English→Pinyin and Pinyin→English questions.
                        </p>
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600 mb-2">High Score: <span className="font-bold">{highScore}</span></p>
                            <p className="text-xs text-blue-500">Words needed: 60+ learned</p>
                        </div>
                        <button
                            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold text-xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                            onClick={startGame}
                        >
                            <Play className="w-6 h-6" />
                            Start Challenge
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl mx-auto p-6">
                {/* Header */}
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-6 h-6 text-red-500" />
                            <span className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Score</div>
                            <div className="text-2xl font-bold text-indigo-600">{correctAnswers}</div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${((60 - timeLeft) / 60) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    <div className="text-center mb-6">
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                {currentQ.type === 'english-to-pinyin' ? 'English → Pinyin' : 'Pinyin → English'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentQ.question}</h2>
                        {currentQ.type === 'english-to-pinyin' && (
                            <span className="text-lg text-gray-500">{currentQ.word.chinese}</span>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg mb-4"
                            placeholder={currentQ.type === 'english-to-pinyin' ? 'Enter pinyin...' : 'Enter English...'}
                            value={answer}
                            onChange={handleInputChange}
                            autoFocus
                            autoComplete="off"
                            spellCheck="false"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-indigo-600 text-white font-semibold text-lg rounded-xl hover:bg-indigo-700 transition shadow-lg"
                                disabled={!answer.trim()}
                            >
                                Submit
                            </button>
                            <button
                                type="button"
                                onClick={moveToNextQuestion}
                                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold text-lg rounded-xl hover:bg-gray-300 transition shadow-lg"
                            >
                                Skip
                            </button>
                        </div>
                    </form>
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

export default SpeedChallenge; 