import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// Promise-based replacement for window.confirm(). Usage:
//   if (await confirmDialog({ title, message, confirmText, tone: 'danger' })) { ... }
let _resolver = null;
let _open = null;
export function confirmDialog(opts = {}) {
    return new Promise((resolve) => {
        _resolver = resolve;
        if (_open) _open(opts);
    });
}

export default function ConfirmHost() {
    const [state, setState] = useState(null);

    useEffect(() => {
        _open = (opts) => setState(opts);
        return () => { _open = null; };
    }, []);

    const close = (result) => {
        setState(null);
        if (_resolver) { _resolver(result); _resolver = null; }
    };

    const danger = state?.tone === "danger";
    const accent = danger ? "#ff4d6d" : "#22d3ee";

    return (
        <AnimatePresence>
            {state && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => close(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 10000,
                        display: "grid",
                        placeItems: "center",
                        padding: 20,
                        background: "rgba(3,8,14,0.6)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97, transition: { duration: 0.15 } }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        style={{
                            width: "min(94vw, 420px)",
                            background: "rgba(10,26,43,0.94)",
                            border: `1px solid ${danger ? "rgba(255,77,109,0.3)" : "rgba(18,211,224,0.22)"}`,
                            borderRadius: 18,
                            padding: 26,
                            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
                            color: "#eaf4fb",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <span
                                style={{
                                    display: "grid",
                                    placeItems: "center",
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background: danger ? "rgba(255,77,109,0.12)" : "rgba(18,211,224,0.12)",
                                    color: accent,
                                }}
                            >
                                <AlertTriangle size={22} />
                            </span>
                            <h3 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>
                                {state.title || "Are you sure?"}
                            </h3>
                        </div>
                        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#a9c2d4", margin: "0 0 22px" }}>
                            {state.message}
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button
                                onClick={() => close(false)}
                                style={{
                                    padding: "10px 18px",
                                    borderRadius: 11,
                                    background: "rgba(255,255,255,0.06)",
                                    color: "#cfe3f2",
                                    fontWeight: 600,
                                    fontSize: 14,
                                }}
                            >
                                {state.cancelText || "Cancel"}
                            </button>
                            <button
                                autoFocus
                                onClick={() => close(true)}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: 11,
                                    background: danger
                                        ? "linear-gradient(135deg,#ff4d6d,#c81e3f)"
                                        : "linear-gradient(135deg,#22d3ee,#0a6b78)",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    boxShadow: `0 6px 18px ${danger ? "rgba(255,77,109,0.35)" : "rgba(18,211,224,0.3)"}`,
                                }}
                            >
                                {state.confirmText || "Confirm"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
