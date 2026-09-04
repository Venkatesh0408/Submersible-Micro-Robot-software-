import { useEffect } from "react";
import { toast } from "./Toast";

const playAlertSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // Drop to lower pitch
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export default function NotificationListener() {
    useEffect(() => {
        // Request notification permission
        if ("Notification" in window) {
            Notification.requestPermission();
        }

        const eventSource = new EventSource("/api/notifications");

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "CRITICAL_DETECTION") {
                    playAlertSound();
                    
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification(data.title, {
                            body: data.body,
                            icon: "/icon.png" // Fallback icon
                        });
                    } else {
                        // In-app toast if OS notification permission isn't granted
                        toast.error(data.body, { title: data.title, duration: 6000 });
                    }
                } else if (data.type === "LOGO_UPDATED") {
                    window.dispatchEvent(new CustomEvent('logoUpdated', { detail: data }));
                }
            } catch (error) {
                console.error("Error parsing notification data:", error);
            }
        };

        eventSource.onerror = (error) => {
            // Suppress the console error as EventSource auto-reconnects on timeout
            // console.error("SSE connection error:", error);
            // Removed eventSource.close() to allow auto-reconnect
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return null; // This component does not render anything visible
}
