import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Compass, Radar, ScanSearch, FileText, GraduationCap, Users } from "lucide-react";
import { PROJECT, INSTITUTION, GUIDE, TEAM } from "../data/project";
import "../styles/AboutModal.css";

const HIGHLIGHTS = [
    { icon: Compass, title: "Autonomous Navigation", text: "Boustrophedon survey paths with auto-turn and hardware thruster timing." },
    { icon: Radar, title: "Live Telemetry", text: "Real-time depth, turbidity, pH, battery and GPS at a 1-second refresh." },
    { icon: ScanSearch, title: "AI Defect Detection", text: "On-board image analysis for cracks, corrosion, algae and pollution." },
    { icon: FileText, title: "Mission Reports", text: "Full inspection history with one-click PDF report generation." },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

export default function AboutModal({ open, onClose }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="about-overlay"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="about-modal"
                        role="dialog" aria-modal="true" aria-label="About the project"
                        initial={{ opacity: 0, y: 26, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="about-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

                        <motion.div variants={container} initial="hidden" animate="show" className="about-body">
                            <motion.div variants={item} className="about-head">
                                <span className="about-kicker">{PROJECT.phase}</span>
                                <h2>About the Project</h2>
                                <p className="about-lede">{PROJECT.description}</p>
                            </motion.div>

                            <motion.div variants={item} className="about-grid">
                                {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                                    <div key={title} className="about-tile">
                                        <span className="about-tile__icon"><Icon size={20} /></span>
                                        <div>
                                            <h4>{title}</h4>
                                            <p>{text}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div variants={item} className="about-section">
                                <h3><Users size={16} /> The Team</h3>
                                <div className="about-team">
                                    {TEAM.map((m) => (
                                        <div key={m.usn} className="about-team__row">
                                            <span className="about-team__name">
                                                {m.name}
                                                {m.isLeader && <span className="about-chip">Leader</span>}
                                            </span>
                                            <span className="about-team__usn">{m.usn}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div variants={item} className="about-section about-guide">
                                <h3><GraduationCap size={16} /> Guided By</h3>
                                <p className="about-guide__name">{GUIDE.name} <span>· {GUIDE.title}</span></p>
                                <p className="about-guide__dept">{INSTITUTION.college}</p>
                                <p className="about-guide__meta">{INSTITUTION.department} · {PROJECT.academicYear}</p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
