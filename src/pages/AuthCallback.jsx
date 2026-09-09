import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingAnimation from "../components/LoadingAnimation";

// OAuth / magic-link land here. Supabase (detectSessionInUrl) parses the token
// from the URL on load; once a session resolves we forward to the dashboard.
export default function AuthCallback() {
    const navigate = useNavigate();
    const { session } = useAuth();

    useEffect(() => {
        if (session) {
            navigate("/dashboard", { replace: true });
            return;
        }
        // Fallback if no session shows up (e.g. an error or cancelled flow).
        const t = setTimeout(() => {
            navigate(session ? "/dashboard" : "/login", { replace: true });
        }, 3000);
        return () => clearTimeout(t);
    }, [session, navigate]);

    return <LoadingAnimation />;
}
