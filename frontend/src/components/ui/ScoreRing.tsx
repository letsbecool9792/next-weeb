import { motion } from 'motion/react';

/** Circular gauge for a 0-10 score that draws itself in. */
const ScoreRing = ({ score, size = 88, label = 'MAL' }: { score: number | null | undefined; size?: number; label?: string }) => {
    const stroke = 7;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const fraction = score ? Math.min(score / 10, 1) : 0;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id="score-ring" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgb(255 255 255 / 0.1)" strokeWidth={stroke} fill="none" />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#score-ring)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - fraction) }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold leading-none">{score ? score.toFixed(2) : '–'}</span>
                <span className="mt-1 text-[10px] uppercase tracking-widest text-purple-300/70">{label}</span>
            </div>
        </div>
    );
};

export default ScoreRing;
