import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    rotationSpeed: number;
    fallSpeed: number;
    color: string;
    size: number;
}

const Confetti: React.FC = () => {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Create confetti pieces
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const pieces: ConfettiPiece[] = [];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * 100,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                fallSpeed: 1 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 8 + Math.random() * 8
            });
        }

        setConfetti(pieces);

        // Animate confetti
        const interval = setInterval(() => {
            setConfetti(prev =>
                prev.map(piece => ({
                    ...piece,
                    y: piece.y + piece.fallSpeed,
                    rotation: piece.rotation + piece.rotationSpeed,
                    x: piece.x + (Math.random() - 0.5) * 2 // Slight horizontal movement
                }))
            );
        }, 50);

        // Start fade out after 5 seconds
        const fadeTimeout = setTimeout(() => {
            setIsFading(true);
        }, 5000);

        // Clean up after fade animation completes (1 second fade + 5 seconds = 6 seconds total)
        const cleanupTimeout = setTimeout(() => {
            clearInterval(interval);
            setConfetti([]);
            setIsFading(false);
        }, 6000);

        return () => {
            clearInterval(interval);
            clearTimeout(fadeTimeout);
            clearTimeout(cleanupTimeout);
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {confetti.map(piece => (
                <div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: piece.x,
                        top: piece.y,
                        transform: `rotate(${piece.rotation}deg)`,
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        borderRadius: '2px',
                        opacity: piece.y > window.innerHeight ? 0 : 1
                    }}
                />
            ))}
        </div>
    );
};

export default Confetti;