import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// Tiny dependency-free pub/sub so any module can raise a toast without prop-drilling.
let _id = 0;
const listeners = new Set();
function emit(toast) {
    const item = { id: ++_id, duration: 3500, ...toast };
    listeners.forEach((fn) => fn(item));
    return item.id;
}

export const toast = {
    success: (message, opts) => emit({ type: "success", message, ...opts }),
    error: (message, opts) => emit({ type: "error", message, ...opts }),
    warning: (message, opts) => emit({ type: "warning", message, ...opts }),
    info: (message, opts) => emit({ type: "info", message, ...opts }),
};

const STYLES = {
    success: { Icon: CheckCircle2, color: "#22c55e", tint: "rgba(34,197,94,0.12)" },
    error: { Icon: XCircle, color: "#ff4d6d", tint: "rgba(255,77,109,0.12)" },
    warning: { Icon: AlertTriangle, color: "#ffb703", tint: "rgba(255,183,3,0.12)" },
    info: { Icon: Info, color: "#22d3ee", tint: "rgba(18,211,224,0.12)" },
};

export default function ToastHost() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const add = (item) => {
            setItems((cur) => [...cur, item]);
            if (item.duration > 0) {
                setTimeout(() => {
                    setItems((cur) => cur.filter((t) => t.id !== item.id));
                }, item.duration);
            }
        };
        listeners.add(add);
        return () => listeners.delete(add);
    }, []);

    const dismiss = (id) => setItems((cur) => cur.filter((t) => t.id !== id));

    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: "min(92vw, 380px)",
                pointerEvents: "none",
            }}
        >
            <AnimatePresence>
                {items.map((t) => {
                    const s = STYLES[t.type] || STYLES.info;
                    const { Icon } = s;
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 60, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.96, transition: { duration: 0.18 } }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            style={{
                                pointerEvents: "auto",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 12,
                                padding: "14px 14px 14px 16px",
                                borderRadius: 14,
                                background: "rgba(10,26,43,0.86)",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                                border: "1px solid rgba(18,211,224,0.18)",
                                boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                                color: "#eaf4fb",
                            }}
                            role="status"
                        >
                            <span
                                style={{
                                    display: "grid",
                                    placeItems: "center",
                                    width: 34,
                                    height: 34,
                                    flexShrink: 0,
                                    borderRadius: 10,
                                    background: s.tint,
                                    color: s.color,
                                }}
                            >
                                <Icon size={19} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                                {t.title && (
                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.title}</div>
                                )}
                                <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#cfe3f2" }}>{t.message}</div>
                            </div>
                            <button
                                onClick={() => dismiss(t.id)}
                                aria-label="Dismiss"
                                style={{
                                    background: "transparent",
                                    color: "#7c93a6",
                                    padding: 2,
                                    marginTop: 2,
                                    flexShrink: 0,
                                }}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
