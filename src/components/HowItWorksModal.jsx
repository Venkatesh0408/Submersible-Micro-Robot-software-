import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Workflow, Plug } from "lucide-react";
import "../styles/HowItWorks.css";

const FLOW = [
    "The submersible robot is placed in the water body to be inspected.",
    "You mark the area to scan on the dashboard; the system plans an automatic back-and-forth coverage path (like a lawnmower) so the whole area is covered.",
    "The robot moves along that path on its own, while its sensors continuously measure water quality — pH, temperature and depth.",
    "Its camera streams images to the software, where an AI model automatically spots problems like debris, pollution or defects and flags them.",
    "Everything — the path, the sensor readings and the flagged images — shows live on the dashboard and is saved.",
    "When the mission ends, you download a PDF report with the findings in one click.",
];

const SETUP = [
    "Power on the robot and wait for its status light to show ready.",
    "Connect to the robot's Wi-Fi network (or the tether), then open this dashboard.",
    "Sign in, open Mission Control, and confirm the robot shows as \"Connected / Online\".",
    "Pick or draw the area to inspect and press Start — the robot begins the mission.",
    "Watch live telemetry and alerts on the dashboard; press Return Home or Stop any time.",
];

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const step = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function HowItWorksModal({ open, onClose }) {
    const [tab, setTab] = useState("flow");

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

    const steps = tab === "flow" ? FLOW : SETUP;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="hiw-overlay"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="hiw-modal"
                        role="dialog" aria-modal="true" aria-label="How it works"
                        initial={{ opacity: 0, y: 26, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="hiw-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

                        <h2 className="hiw-title">How It Works</h2>
                        <p className="hiw-lede">
                            A submersible robot that inspects water bodies on its own — mapping a route,
                            measuring water quality, and using AI to flag defects and pollution, so a full
                            inspection takes minutes instead of a manual survey.
                        </p>

                        <div className="hiw-tabs" role="tablist">
                            <button role="tab" aria-selected={tab === "flow"} className={`hiw-tab ${tab === "flow" ? "is-active" : ""}`} onClick={() => setTab("flow")}>
                                <Workflow size={16} /> How the project works
                            </button>
                            <button role="tab" aria-selected={tab === "setup"} className={`hiw-tab ${tab === "setup" ? "is-active" : ""}`} onClick={() => setTab("setup")}>
                                <Plug size={16} /> How to connect it
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.ol
                                key={tab}
                                className="hiw-steps"
                                variants={list} initial="hidden" animate="show"
                            >
                                {steps.map((s, i) => (
                                    <motion.li key={i} variants={step} className="hiw-step">
                                        <span className="hiw-num">{i + 1}</span>
                                        <span className="hiw-text">{s}</span>
                                    </motion.li>
                                ))}
                            </motion.ol>
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
