/// <reference types="vite/client" />
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, Volume2, BookOpen } from 'lucide-react';

interface VocabWord {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    difficulty: string;
    isLearned: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const VocabBrowser = () => {
    const navigate = useNavigate();
    const [words, setWords] = useState<VocabWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchWords = async () => {
            try {
                const response = await axios.get(`${API_BASE}/vocabulary`);
                const learned = response.data.filter((w: VocabWord) => w.isLearned);
                setWords(learned);
            } catch (error) {
                toast.error('Failed to load vocabulary.');
            } finally {
                setLoading(false);
            }
        };
        fetchWords();
    }, []);

    const playAudio = async (word: VocabWord) => {
        if (playingId === word.id) return;
        setPlayingId(word.id);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await axios.post(`${API_BASE}/tts`, {
                text: word.chinese,
                language: 'zh-CN'
            }, {
                responseType: 'blob',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined
            });
            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.onended = () => setPlayingId(null);
                audioRef.current.play().catch(() => setPlayingId(null));
            }
        } catch (error) {
            toast.error('Failed to play audio.');
            setPlayingId(null);
        }
    };

    const filtered = words.filter(w => {
        const matchesFilter = filter === 'all' || w.difficulty === filter;
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            w.chinese.includes(q) ||
            w.pinyin.toLowerCase().includes(q) ||
            w.english.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const difficultyLabel = (d: string) => {
        if (d === 'beginner') return { label: 'Beginner', className: 'bg-gray-100 text-gray-600' };
        if (d === 'intermediate') return { label: 'Intermediate', className: 'bg-gray-200 text-gray-700' };
        if (d === 'advanced') return { label: 'Advanced', className: 'bg-gray-800 text-white' };
        return { label: d, className: 'bg-gray-100 text-gray-600' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-start py-8 px-4">
            <div className="w-full max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition text-gray-700"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <BookOpen className="w-6 h-6 text-gray-700" />
                        <h2 className="text-2xl font-bold text-gray-900">Vocabulary</h2>
                        <span className="text-sm text-gray-500 ml-1">{words.length} words learned</span>
                    </div>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Chinese, pinyin or English..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setFilter(level)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition capitalize ${
                                    filter === level
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                {search && (
                    <p className="text-sm text-gray-500 mb-4">
                        {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
                    </p>
                )}

                {/* Word grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No words found</p>
                        <p className="text-sm mt-1">Try a different search or filter</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map(word => {
                            const diff = difficultyLabel(word.difficulty);
                            return (
                                <div
                                    key={word.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-3xl leading-tight">{word.chinese}</span>
                                        <button
                                            onClick={() => playAudio(word)}
                                            className={`p-1.5 rounded-full transition-colors flex-shrink-0 mt-1 ${
                                                playingId === word.id
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                            }`}
                                            title="Play pronunciation"
                                        >
                                            <Volume2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500">{word.pinyin}</p>
                                    <p className="text-sm text-gray-900 font-medium">{word.english}</p>
                                    <div className="mt-auto pt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.className}`}>
                                            {diff.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
    );
};

export default VocabBrowser;