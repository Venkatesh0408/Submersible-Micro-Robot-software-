import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const GUEST_KEY = "token"; // reuses the existing guest-token key
const readGuest = () => {
    const t = localStorage.getItem(GUEST_KEY);
    return typeof t === "string" && t.startsWith("guest-");
};

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [guest, setGuest] = useState(readGuest());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        if (!supabase) {
            setLoading(false);
            return;
        }
        supabase.auth.getSession().then(({ data }) => {
            if (!active) return;
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setLoading(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s) {
                // A real session supersedes a guest session.
                localStorage.removeItem(GUEST_KEY);
                setGuest(false);
            }
        });
        return () => {
            active = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    // No-auth path into the dashboard.
    const enterAsGuest = () => {
        localStorage.setItem(GUEST_KEY, "guest-" + Date.now());
        localStorage.setItem("user", JSON.stringify({ username: "Guest Operator", role: "guest" }));
        setGuest(true);
    };

    const signOut = async () => {
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn("signOut error", e);
            }
        }
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem("user");
        setSession(null);
        setUser(null);
        setGuest(false);
    };

    const value = {
        supabase,
        isSupabaseConfigured,
        session,
        user,
        guest,
        isAuthed: Boolean(session) || guest,
        loading,
        enterAsGuest,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
