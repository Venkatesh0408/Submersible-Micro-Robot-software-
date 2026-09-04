import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';

export default function Splash() {
    const navigate = useNavigate();
    const reduce = useReducedMotion();
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        // Returning visitor within the tab session skips straight to /home.
        if (sessionStorage.getItem('splashSeen')) {
            navigate('/home', { replace: true });
            return;
        }
        // Fade out smoothly, then route — capped at 900ms, no stalling counter.
        const fade = setTimeout(() => setLeaving(true), 650);
        const go = setTimeout(() => {
            sessionStorage.setItem('splashSeen', '1');
            navigate('/home', { replace: true });
        }, 900);
        return () => { clearTimeout(fade); clearTimeout(go); };
    }, [navigate]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6"
            style={{ background: '#070b14' }}
            animate={{ opacity: leaving ? 0 : 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            {/* Concentric sonar rings + submarine mark */}
            <div className="relative flex items-center justify-center mb-12" style={{ width: 200, height: 200 }}>
                {!reduce && [0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="absolute rounded-full"
                        style={{ width: 68, height: 68, border: '1px solid rgba(18,211,224,0.5)' }}
                        animate={{ scale: [1, 2.7], opacity: [0.55, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: i * 0.8 }}
                    />
                ))}
                <div
                    className="relative grid place-items-center"
                    style={{
                        width: 82, height: 82, borderRadius: 22,
                        background: 'linear-gradient(145deg, rgba(18,211,224,0.16), rgba(10,26,43,0.92))',
                        border: '1px solid rgba(18,211,224,0.45)',
                        boxShadow: '0 0 44px rgba(18,211,224,0.4)',
                    }}
                >
                    <Navigation style={{ width: 36, height: 36, color: '#7fe9f0' }} />
                </div>
            </div>

            <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-3xl md:text-5xl font-black text-center uppercase"
                style={{
                    fontFamily: '"Orbitron", sans-serif',
                    letterSpacing: '0.12em',
                    lineHeight: 1.1,
                    background: 'linear-gradient(180deg,#eaf6ff 0%,#22d3ee 55%,#4f7bff 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                }}
            >
                Submersible<br />Micro Robot
            </motion.h1>

            <motion.p
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-5 text-[11px] md:text-sm uppercase text-center"
                style={{ color: 'var(--text-dim)', letterSpacing: '0.36em' }}
            >
                AI-Powered Underwater Inspection System
            </motion.p>

            {/* Slim indeterminate progress line */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: 'rgba(18,211,224,0.1)', overflow: 'hidden' }}>
                {!reduce && (
                    <motion.div
                        style={{ height: '100%', width: '30%', background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)' }}
                        animate={{ x: ['-100%', '430%'] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}
            </div>
        </motion.div>
    );
}
