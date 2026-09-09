import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Menu, X, LogOut } from "lucide-react";
import Button from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import "../styles/TopNav.css";

export default function TopNav({ onAbout }) {
    const navigate = useNavigate();
    const { isAuthed, signOut: authSignOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const authed = isAuthed;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const go = (path) => { setOpen(false); navigate(path); };
    const handleAbout = () => { setOpen(false); onAbout ? onAbout() : navigate("/about"); };
    const signOut = async () => {
        setOpen(false);
        await authSignOut();
        navigate("/home");
    };

    const NavLinks = () => (
        <>
            <button className="topnav__link" onClick={() => go("/home")}>Home</button>
            <button className="topnav__link" onClick={handleAbout}>About Us</button>
            {authed && <button className="topnav__link" onClick={() => go("/dashboard")}>Dashboard</button>}
        </>
    );

    return (
        <header className={`topnav ${scrolled ? "is-scrolled" : ""}`}>
            <div className="topnav__inner">
                <button className="topnav__brand" onClick={() => go("/home")} aria-label="Home">
                    <span className="topnav__logo"><Navigation size={18} /></span>
                    <span className="topnav__name">Submersible Micro Robot</span>
                </button>

                <nav className="topnav__links">
                    <NavLinks />
                </nav>

                <div className="topnav__cta">
                    {authed ? (
                        <Button variant="secondary" size="sm" onClick={signOut} iconLeft={<LogOut size={15} />}>Sign Out</Button>
                    ) : (
                        <Button variant="primary" size="sm" onClick={() => go("/login")}>Sign In</Button>
                    )}
                </div>

                <button className="topnav__burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        className="topnav__mobile"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                        <div className="topnav__mobile-inner">
                            <NavLinks />
                            {authed ? (
                                <Button variant="secondary" size="md" onClick={signOut} iconLeft={<LogOut size={16} />}>Sign Out</Button>
                            ) : (
                                <Button variant="primary" size="md" onClick={() => go("/login")}>Sign In</Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
