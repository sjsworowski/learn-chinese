import React from 'react';

interface TestProgressBarProps {
    current: number;  // 0-indexed current question
    total: number;
}

const TestProgressBar: React.FC<TestProgressBarProps> = ({ current, total }) => {
    return (
        <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        i < current
                            ? 'bg-gray-900'
                            : i === current
                            ? 'bg-gray-400'
                            : 'bg-gray-200'
                    }`}
                />
            ))}
        </div>
    );
};

export default TestProgressBar;