import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Volume2, RotateCcw, Check, X, Lightbulb } from 'lucide-react';
import Confetti from '../components/Confetti';

interface VocabWord {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    isLearned: boolean;
}

interface Question {
    word: VocabWord;
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

const ListenTest = () => {
    const navigate = useNavigate();
    const [words, setWords] = useState<VocabWord[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answer, setAnswer] = useState('');
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const questionsGeneratedRef = useRef(false);

    // Add feedback state
    const [feedback, setFeedback] = useState<string | null>(null);
    const [feedbackOpacity, setFeedbackOpacity] = useState(1);

    // Add hint state
    const [incorrectAttempts, setIncorrectAttempts] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [hintText, setHintText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE}/vocabulary`);
                const learned = response.data.filter((w: VocabWord) => w.isLearned);
                setWords(learned);
                setLoading(false);

                // Start test immediately if there are learned words
                if (learned.length > 0 && !questionsGeneratedRef.current) {
                    questionsGeneratedRef.current = true;
                    const testQuestions = generateQuestions(learned);
                    setQuestions(testQuestions);
                    setTotalQuestions(testQuestions.length);
                    setCurrentQuestion(0);
                    setCorrectAnswers(0);
                    setIsFinished(false);
                    setAnswer('');
                    setShowConfetti(false);
                    setIncorrectAttempts(0);
                    setShowHint(false);
                    setHintText('');

                    // Auto-focus input
                    setTimeout(() => {
                        inputRef.current?.focus();
                    }, 100);

                    // Play audio for first question
                    setTimeout(() => {
                        playAudio(testQuestions[0]);
                    }, 500);
                }
            } catch (error) {
                toast.error('Failed to load vocabulary.');
                navigate('/');
            }
        };
        fetchData();
    }, [navigate]);

    const generateQuestions = (wordList: VocabWord[]) => {
        const selectedWords = wordList.sort(() => 0.5 - Math.random()).slice(0, 10);
        const newQuestions: Question[] = selectedWords.map(word => ({
            word,
            question: `Listen to the audio and write the pinyin`,
            answer: word.pinyin
        }));
        return newQuestions;
    };

    const startTest = () => {
        questionsGeneratedRef.current = false;
        const testQuestions = generateQuestions(words);
        setQuestions(testQuestions);
        setTotalQuestions(testQuestions.length);
        setCurrentQuestion(0);
        setCorrectAnswers(0);
        setIsFinished(false);
        setAnswer('');
        setShowConfetti(false);
        setIncorrectAttempts(0);
        setShowHint(false);
        setHintText('');

        // Auto-focus input
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        // Play audio for first question
        setTimeout(() => {
            playAudio(testQuestions[0]);
        }, 500);
    };

    const playAudio = async (question?: Question) => {
        const currentQ = question || questions[currentQuestion];
        if (!currentQ) return;

        const currentWord = currentQ.word;
        try {
            const response = await axios.post(`${API_BASE}/tts`, {
                text: currentWord.chinese,
                language: 'zh-CN'
            }, {
                responseType: 'blob'
            });

            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(error => {
                    console.error('Failed to play audio:', error);
                    toast.error('Failed to play audio. Please try again.');
                });
            }
        } catch (error) {
            console.error('Failed to generate audio:', error);
            toast.error('Failed to generate audio. Please try again.');
        }
    };

    const createHint = (pinyin: string) => {
        if (pinyin.length === 0) return '';
        const firstChar = pinyin.charAt(0);
        const rest = pinyin.slice(1).replace(/./g, '•');
        return firstChar + rest;
    };

    const handleShowHint = () => {
        const currentQ = questions[currentQuestion];
        setHintText(createHint(currentQ.answer));
        setShowHint(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isFinished) return;

        const currentQ = questions[currentQuestion];
        let userAnswer = answer.trim();

        // Normalize the user's pinyin input
        userAnswer = normalizePinyin(userAnswer);
        const correctAnswer = normalizePinyin(currentQ.answer);

        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
            setFeedback('correct');
            setFeedbackOpacity(1);
            setIncorrectAttempts(0);
            setShowHint(false);
            setHintText('');

            // Clear answer
            setAnswer('');

            // Clear feedback after 1 second and move to next question
            setTimeout(() => {
                setFeedbackOpacity(0);
                setTimeout(() => {
                    setFeedback(null);
                    moveToNextQuestion();
                }, 300);
            }, 1000);
        } else {
            setFeedback('incorrect');
            setFeedbackOpacity(1);
            setIncorrectAttempts(prev => prev + 1);

            // Clear answer but don't move to next question automatically
            setAnswer('');

            // Clear feedback after 1 second
            setTimeout(() => {
                setFeedbackOpacity(0);
                setTimeout(() => {
                    setFeedback(null);
                }, 300);
            }, 1000);

            // Auto-focus for next input
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const moveToNextQuestion = async () => {
        setFeedback(null);
        setFeedbackOpacity(1);
        setIncorrectAttempts(0);
        setShowHint(false);
        setHintText('');

        if (currentQuestion < questions.length - 1) {
            const nextQuestionIndex = currentQuestion + 1;
            const nextQuestion = questions[nextQuestionIndex];
            setCurrentQuestion(nextQuestionIndex);

            // Play audio for next question
            setTimeout(() => {
                playAudio(nextQuestion);
            }, 300);
        } else {
            // Test is finished
            setIsFinished(true);
            setShowConfetti(true);

            // Record test completion
            try {
                await axios.post(`${API_BASE}/stats/test-completed`);
            } catch (error) {
                console.error('Failed to record test completion:', error);
                // Don't show error to user as this is not critical
            }
        }

        // Auto-focus for next question
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAnswer(e.target.value);
    };

    // Reset hint state when question changes
    useEffect(() => {
        setIncorrectAttempts(0);
        setShowHint(false);
        setHintText('');
    }, [currentQuestion]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                {showConfetti && <Confetti />}
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">🎧 Listen Test Complete!</h2>
                        <div className="mb-6 space-y-2">
                            <p className="text-lg">You got <span className="font-bold text-indigo-600">{correctAnswers}</span> out of <span className="font-bold text-indigo-600">{totalQuestions}</span> correct!</p>
                        </div>
                        <div className="space-y-3">
                            <button
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-lg shadow hover:bg-indigo-700 transition"
                                onClick={startTest}
                            >
                                Try Again
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

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="w-full max-w-md mx-auto p-6">
                    <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full text-center">
                        <h2 className="text-3xl font-bold mb-4">🎧 Listen Test</h2>
                        <p className="text-gray-600 mb-6">
                            You need at least one learned word to start the Listen Test.
                        </p>
                        <button
                            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold text-xl shadow-lg hover:bg-indigo-700 transition"
                            onClick={() => navigate('/')}
                        >
                            Back to Dashboard
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

                {/* Question Card */}
                <div className="backdrop-blur-md bg-white border border-white/30 shadow-xl rounded-3xl p-8 w-full">
                    <div className="text-center mb-6">
                        <h2 className="text-xl text-gray-600 mb-2">Listen to the audio</h2>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex justify-center mb-6">
                        <button
                            onClick={() => playAudio()}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                        >
                            <Volume2 className="w-5 h-5" />
                            <span>Play Audio</span>
                        </button>
                    </div>

                    {/* Hanzi Display */}
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-2">{currentQ.word.chinese}</div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg mb-4"
                            placeholder="Enter pinyin..."
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
                                className="w-full py-3 bg-indigo-600 text-white font-semibold text-lg rounded-xl hover:bg-indigo-700 transition shadow-lg"
                                disabled={!answer.trim()}
                            >
                                Submit
                            </button>
                        </div>
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
                                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden audio element */}
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Centered Feedback Overlay */}
            {feedback && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className={`transform ${feedback === 'correct' ? 'scale-100 opacity-100' : `scale-100 opacity-${feedbackOpacity * 100} transition-all duration-500 ease-out`}`}>
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

export default ListenTest; 