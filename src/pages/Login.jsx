import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ArrowLeft, UserCheck, Eye, EyeOff, ShieldCheck, Phone, Mail, Loader2, Activity, Database, Cpu } from 'lucide-react';
import { toast } from '../components/Toast';
import { supabase, authRedirectTo } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

// --- brand marks (lucide has no brand logos) ---
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.5 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.4 36.2 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
);
const MicrosoftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
        <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
);

export default function Login() {
    const navigate = useNavigate();
    const reduce = useReducedMotion();
    const { enterAsGuest } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [busy, setBusy] = useState(null); // 'google' | 'microsoft' | 'phone' | 'magic'
    const [view, setView] = useState('default'); // 'default' | 'phone'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const needsSupabase = () => {
        if (!supabase) {
            toast.error('Sign-in provider not configured yet. Add your Supabase keys to enable it.', { title: 'Not configured' });
            return false;
        }
        return true;
    };

    // --- OAuth: Google / Microsoft ---
    const oauth = async (provider, key) => {
        if (!needsSupabase()) return;
        setBusy(key);
        try {
            const { error: err } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: authRedirectTo, scopes: provider === 'azure' ? 'email openid profile' : undefined },
            });
            if (err) throw err;
            // Browser redirects to the provider; nothing else to do here.
        } catch (err) {
            console.error(`${provider} sign-in error`, err);
            toast.error(err.message || `Could not start ${key} sign-in.`, { title: 'Sign-in failed' });
            setBusy(null);
        }
    };
    const signInWithGoogle = () => oauth('google', 'google');
    const signInWithMicrosoft = () => oauth('azure', 'microsoft');

    // --- Phone SMS OTP ---
    const sendPhoneOtp = async () => {
        if (!needsSupabase()) return;
        if (!phone.trim()) { toast.warning('Enter your phone number in international format (e.g. +14155551234).'); return; }
        setBusy('phone');
        try {
            const { error: err } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
            if (err) throw err;
            setOtpSent(true);
            toast.success('Verification code sent by SMS.', { title: 'Code sent' });
        } catch (err) {
            console.error('phone OTP error', err);
            toast.error(err.message || 'Could not send the SMS code.', { title: 'Sign-in failed' });
        } finally {
            setBusy(null);
        }
    };
    const verifyPhoneOtp = async () => {
        if (!needsSupabase()) return;
        if (!otp.trim()) { toast.warning('Enter the 6-digit code you received.'); return; }
        setBusy('phone');
        try {
            const { error: err } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: 'sms' });
            if (err) throw err;
            toast.success('Signed in.', { title: 'Welcome' });
            navigate('/dashboard');
        } catch (err) {
            console.error('phone verify error', err);
            toast.error(err.message || 'Invalid or expired code.', { title: 'Verification failed' });
        } finally {
            setBusy(null);
        }
    };

    // --- Email magic-link ---
    const sendMagicLink = async () => {
        if (!needsSupabase()) return;
        const email = username.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.warning('Enter your email address in the username field first.');
            return;
        }
        setBusy('magic');
        try {
            const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: authRedirectTo } });
            if (err) throw err;
            toast.success(`Magic sign-in link sent to ${email}.`, { title: 'Check your inbox' });
        } catch (err) {
            console.error('magic link error', err);
            toast.error(err.message || 'Could not send the magic link.', { title: 'Sign-in failed' });
        } finally {
            setBusy(null);
        }
    };

    // Guest — no-auth path (kept working regardless of Supabase config)
    const handleGuest = () => {
        enterAsGuest();
        navigate('/dashboard');
    };

    // --- existing email/password auth (backend unchanged) ---
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch(window.location.origin + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) { setError(`Server returned error (${response.status})`); return; }
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) { setError('Invalid server response format'); return; }
            const text = await response.text();
            if (!text || text.trim().startsWith("<")) { setError('Received HTML instead of JSON'); return; }
            const data = JSON.parse(text);
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error', err);
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const Spinner = () => <Loader2 size={16} className="signin-spin" />;

    return (
        <div className="signin-page">
            <button type="button" className="signin-back" onClick={() => (view === 'phone' ? setView('default') : navigate('/home'))}>
                <ArrowLeft size={16} /> Back
            </button>

            <div className="signin-shell">
                <motion.div
                    className="signin-card"
                    initial={reduce ? false : { opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <div className="signin-head">
                        <span className="signin-badge"><ShieldCheck size={26} /></span>
                        <h2>Welcome Back</h2>
                        <p>{view === 'phone' ? 'Sign in with your phone number' : 'Sign in to access Mission Control'}</p>
                    </div>

                    {view === 'phone' ? (
                        /* ---------- Phone OTP flow ---------- */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="signin-field">
                                <span className="signin-field__icon"><Phone size={18} /></span>
                                <input
                                    className="signin-input"
                                    type="tel"
                                    placeholder="Phone (e.g. +14155551234)"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoComplete="tel"
                                    disabled={otpSent}
                                />
                            </div>
                            {otpSent && (
                                <div className="signin-field">
                                    <span className="signin-field__icon"><Lock size={18} /></span>
                                    <input
                                        className="signin-input"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        autoComplete="one-time-code"
                                    />
                                </div>
                            )}
                            <button type="button" className="signin-primary" onClick={otpSent ? verifyPhoneOtp : sendPhoneOtp} disabled={busy === 'phone'}>
                                {busy === 'phone' ? <Spinner /> : null}
                                {otpSent ? 'Verify & Sign In' : 'Send Code'}
                            </button>
                            {otpSent && (
                                <button type="button" className="signin-forgot" style={{ alignSelf: 'center' }} onClick={() => { setOtpSent(false); setOtp(''); }}>
                                    Use a different number
                                </button>
                            )}
                        </div>
                    ) : (
                        /* ---------- Default: social + email/password ---------- */
                        <>
                            <div className="signin-social">
                                <button type="button" className="signin-social__btn" onClick={signInWithGoogle} disabled={busy === 'google'} aria-label="Sign in with Google">
                                    {busy === 'google' ? <Spinner /> : <GoogleIcon />} Google
                                </button>
                                <button type="button" className="signin-social__btn" onClick={signInWithMicrosoft} disabled={busy === 'microsoft'} aria-label="Sign in with Microsoft">
                                    {busy === 'microsoft' ? <Spinner /> : <MicrosoftIcon />} Outlook
                                </button>
                                <button type="button" className="signin-social__btn" onClick={() => setView('phone')} aria-label="Sign in with phone">
                                    <Phone size={16} /> Phone
                                </button>
                            </div>

                            <div className="signin-divider"><span>or continue with email</span></div>

                            {error && (
                                <motion.div className="signin-error" initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                                    {error}
                                </motion.div>
                            )}

                            <form className="signin-form" onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="signin-field">
                                    <span className="signin-field__icon"><User size={18} /></span>
                                    <input id="username-input" className="signin-input" type="text" placeholder="Username or email"
                                        value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
                                </div>

                                <div className="signin-field">
                                    <span className="signin-field__icon"><Lock size={18} /></span>
                                    <input id="password-input" className="signin-input signin-input--pw" type={showPassword ? 'text' : 'password'} placeholder="Password"
                                        value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                                    <button type="button" className="signin-pw-toggle" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="signin-options">
                                    <label className="signin-remember"><input type="checkbox" /> Remember me</label>
                                    <button type="button" className="signin-forgot">Forgot password?</button>
                                </div>

                                <button type="submit" className="signin-primary" disabled={isLoading}>
                                    {isLoading ? <Spinner /> : null}
                                    {isLoading ? 'Authenticating…' : 'Sign In'} {!isLoading && <ArrowRight size={18} />}
                                </button>
                            </form>

                            <button type="button" className="signin-magic" onClick={sendMagicLink} disabled={busy === 'magic'}>
                                {busy === 'magic' ? <Spinner /> : <Mail size={16} />} Email me a magic sign-in link
                            </button>

                            <div className="signin-divider"><span>or</span></div>

                            <button type="button" className="signin-guest" onClick={handleGuest}>
                                <UserCheck size={17} /> Continue as Guest
                            </button>
                            <p className="signin-hint">Sign-in is optional — explore the full dashboard as a guest.</p>
                        </>
                    )}
                </motion.div>

                <div className="signin-status">
                    <span><Activity size={13} style={{ color: '#22c55e' }} /> Status: Online</span>
                    <span className="dot">·</span>
                    <span><Database size={13} style={{ color: '#22c55e' }} /> Secure</span>
                    <span className="dot">·</span>
                    <span><Cpu size={13} style={{ color: 'var(--primary)' }} /> v2.4.1</span>
                </div>
            </div>
        </div>
    );
}
