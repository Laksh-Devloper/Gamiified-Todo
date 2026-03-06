'use client';
import { useEffect, useState } from 'react';

const PETALS = ['🌸', '✿', '❀', '🌸', '✿', '🌸', '❀', '✿', '🌸', '✿', '❀', '🌸', '✿', '🌸', '❀'];

const CONFIGS = [
    { left: '5%', dur: 9, delay: 0, size: 1.0 },
    { left: '12%', dur: 14, delay: 2, size: 0.8 },
    { left: '22%', dur: 10, delay: 5, size: 1.2 },
    { left: '33%', dur: 12, delay: 1, size: 0.9 },
    { left: '45%', dur: 8, delay: 7, size: 1.1 },
    { left: '55%', dur: 15, delay: 3, size: 0.7 },
    { left: '63%', dur: 11, delay: 9, size: 1.0 },
    { left: '72%', dur: 13, delay: 4, size: 0.85 },
    { left: '80%', dur: 9, delay: 6, size: 1.3 },
    { left: '88%', dur: 12, delay: 0.5, size: 0.9 },
    { left: '93%', dur: 10, delay: 8, size: 1.0 },
    { left: '18%', dur: 16, delay: 11, size: 0.75 },
    { left: '40%', dur: 9, delay: 13, size: 1.1 },
    { left: '68%', dur: 11, delay: 10, size: 0.8 },
    { left: '96%', dur: 14, delay: 2.5, size: 0.9 },
];

export default function SakuraPetals() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="sakura-container" aria-hidden="true">
            {CONFIGS.map((cfg, i) => (
                <span
                    key={i}
                    className="sakura-petal"
                    style={{
                        left: cfg.left,
                        animationDuration: `${cfg.dur}s`,
                        animationDelay: `${cfg.delay}s`,
                        fontSize: `${cfg.size}rem`,
                    }}
                >
                    {PETALS[i % PETALS.length]}
                </span>
            ))}
        </div>
    );
}
