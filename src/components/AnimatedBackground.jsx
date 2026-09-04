import { useEffect, useState } from "react";
import "../styles/AnimatedBackground.css";

// Deep-ocean ambient background, tuned for smoothness: soft radial gradients
// (no blur filters), no blend modes, only transform/opacity animate. Layers sit
// behind content (z-index -10, pointer-events none) and freeze on reduced-motion.
export default function AnimatedBackground() {
    const [motes, setMotes] = useState([]);
    const [paused, setPaused] = useState(false);

    // Pause the ambient animations while the tab is hidden — no wasted CPU/GPU.
    useEffect(() => {
        const onVis = () => setPaused(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    useEffect(() => {
        const arr = Array.from({ length: 16 }).map((_, i) => {
            const depth = Math.random(); // 0 = far/small/dim, 1 = near/big/bright
            return {
                id: i,
                left: Math.random() * 100,
                size: 2 + depth * 4,
                opacity: 0.08 + depth * 0.28,
                duration: 26 + Math.random() * 22,
                delay: -Math.random() * 46, // negative → start mid-flight
                drift: (Math.random() - 0.5) * 64,
            };
        });
        setMotes(arr);
    }, []);

    return (
        <div className={`aqua-bg${paused ? " is-paused" : ""}`} aria-hidden>
            <div className="aqua-bg__depth" />
            <div className="aqua-bg__caustic aqua-bg__caustic--1" />
            <div className="aqua-bg__caustic aqua-bg__caustic--2" />
            <div className="aqua-bg__caustic aqua-bg__caustic--3" />
            <div className="aqua-bg__rays" />
            <div className="aqua-bg__motes">
                {motes.map((m) => (
                    <span
                        key={m.id}
                        className="aqua-mote"
                        style={{
                            left: `${m.left}%`,
                            width: m.size,
                            height: m.size,
                            opacity: m.opacity,
                            animationDuration: `${m.duration}s`,
                            animationDelay: `${m.delay}s`,
                            "--drift": `${m.drift}px`,
                        }}
                    />
                ))}
            </div>
            <div className="aqua-bg__vignette" />
        </div>
    );
}
