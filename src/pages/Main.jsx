import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, GraduationCap, Compass, Radar, ScanSearch, FileText, Rocket, Info, BookOpen, Box } from "lucide-react";
import { PROJECT, INSTITUTION, GUIDE, TEAM } from "../data/project";
import TopNav from "../components/TopNav";
import AboutModal from "../components/AboutModal";
import HowItWorksModal from "../components/HowItWorksModal";
import Button from "../components/ui/Button";
import "../styles/Home.css";

const FEATURES = [
    { icon: Compass, title: "Autonomous Navigation", text: "Boustrophedon survey paths with auto-turn & hardware thruster timing." },
    { icon: Radar, title: "Live Telemetry", text: "Depth, turbidity, pH, battery & GPS at a 1-second refresh." },
    { icon: ScanSearch, title: "AI Detection", text: "Cracks, corrosion, algae & pollution from on-board imagery." },
    { icon: FileText, title: "PDF Reports", text: "Full mission history with one-click inspection reports." },
];

const reveal = {
    hidden: { opacity: 0, y: 26 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function Main() {
    const navigate = useNavigate();
    const [aboutOpen, setAboutOpen] = useState(false);
    const [howOpen, setHowOpen] = useState(false);
    const [memberPhotos, setMemberPhotos] = useState({});
    const [guidePhoto, setGuidePhoto] = useState(null);

    useEffect(() => {
        try {
            const p = localStorage.getItem("teamPhotos");
            if (p) setMemberPhotos(JSON.parse(p));
        } catch (e) { console.warn("team photos load failed", e); }
        const g = localStorage.getItem("guidePhoto");
        if (g) setGuidePhoto(g);
    }, []);

    const handlePhotoUpload = (e, usn) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const next = { ...memberPhotos, [usn]: reader.result };
            setMemberPhotos(next);
            try { localStorage.setItem("teamPhotos", JSON.stringify(next)); } catch (err) { console.warn(err); }
        };
        reader.readAsDataURL(file);
    };

    const handleGuideUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setGuidePhoto(reader.result);
            try { localStorage.setItem("guidePhoto", reader.result); } catch (err) { console.warn(err); }
        };
        reader.readAsDataURL(file);
    };

    // Enter stays as a bonus shortcut to the console.
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Enter") navigate("/login"); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [navigate]);

    return (
        <div className="home-page">
            <TopNav onAbout={() => setAboutOpen(true)} />

            {/* ---------------- HERO ---------------- */}
            <section className="home-hero">
                <div className="home-hero__inner">
                    <motion.div
                        className="home-banner"
                        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="home-banner__logo">
                            <img src="/rrce-logo.jpg" alt="College logo" />
                        </div>
                        <div className="home-banner__text">
                            <h2>{INSTITUTION.college}</h2>
                            <p className="home-banner__dept">{INSTITUTION.department}</p>
                            <p className="home-banner__meta">{INSTITUTION.affiliation} · {INSTITUTION.city}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="home-hero__content"
                        initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    >
                        <span className="home-wordmark">{PROJECT.phase}</span>
                        <h1 className="home-title">{PROJECT.name}</h1>
                        <p className="home-tagline">{PROJECT.tagline}</p>
                        <p className="home-desc">{PROJECT.description}</p>
                        <div className="home-cta">
                            <Button variant="primary" size="lg" iconLeft={<Rocket size={18} />} onClick={() => navigate("/login")}>
                                Launch Mission Control
                            </Button>
                            <Button variant="secondary" size="lg" iconLeft={<Info size={18} />} onClick={() => setAboutOpen(true)}>
                                About the Project
                            </Button>
                            <Button as="a" href="/model" target="_blank" rel="noopener noreferrer" variant="secondary" size="lg" iconLeft={<Box size={18} />}>
                                View 3D Model
                            </Button>
                        </div>
                        <span className="home-hint">or press <kbd>Enter</kbd></span>
                    </motion.div>
                </div>
            </section>

            {/* ---------------- FEATURES ---------------- */}
            <motion.section
                className="home-section"
                variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
            >
                <div className="home-section__head">
                    <span className="home-section__kicker">Capabilities</span>
                    <h3 className="home-section__title">What it does</h3>
                    <p className="home-section__sub">Four systems working together to turn a manual underwater survey into an autonomous, AI-assisted inspection.</p>
                </div>
                <motion.div className="home-features" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                    {FEATURES.map(({ icon: Icon, title, text }) => (
                        <motion.div key={title} className="feature-tile" variants={reveal}>
                            <span className="feature-tile__icon"><Icon size={22} /></span>
                            <h4>{title}</h4>
                            <p>{text}</p>
                        </motion.div>
                    ))}
                </motion.div>
                <div className="home-hiw-cta">
                    <Button variant="secondary" size="md" iconLeft={<BookOpen size={17} />} onClick={() => setHowOpen(true)}>
                        How It Works
                    </Button>
                </div>
            </motion.section>


            {/* ---------------- TEAM ---------------- */}
            <motion.section
                className="home-section"
                variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}
            >
                <h3 className="home-section__title"><Users size={18} /> Project Team</h3>
                <motion.div className="home-team" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}>
                    {TEAM.map((m) => (
                        <motion.div key={m.usn} className="home-team-card" variants={reveal}>
                            <div className="team-card__top">
                                <label className="team-card__avatar" title="Upload photo">
                                    {memberPhotos[m.usn] ? <img src={memberPhotos[m.usn]} alt={m.name} /> : <Users size={22} />}
                                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, m.usn)} />
                                </label>
                                <h4>
                                    {m.name}
                                    {m.isLeader && <span className="team-chip">Leader</span>}
                                </h4>
                            </div>
                            <ul className="team-card__roles">
                                {m.roles.map((r) => (
                                    <li key={r}><span className="dot" />{r}</li>
                                ))}
                            </ul>
                            <div className="team-card__usn">
                                <span>USN</span>
                                <span>{m.usn}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.section>

            {/* ---------------- GUIDE ---------------- */}
            <motion.section
                className="home-section"
                variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
            >
                <div className="home-guide">
                    <label className="home-guide__avatar" title="Upload photo">
                        {guidePhoto ? <img src={guidePhoto} alt="Guide" /> : <GraduationCap size={30} />}
                        <input type="file" accept="image/*" onChange={handleGuideUpload} />
                    </label>
                    <div className="home-guide__info">
                        <span className="home-guide__kicker">Guided By</span>
                        <h4>{GUIDE.name}</h4>
                        <p>{GUIDE.title} · {GUIDE.dept}</p>
                    </div>
                    <div className="home-guide__year">
                        <span>Academic Year</span>
                        <strong>{PROJECT.academicYear}</strong>
                    </div>
                </div>
            </motion.section>

            {/* ---------------- FOOTER ---------------- */}
            <footer className="home-footer">
                <div className="home-footer__divider" />
                <p className="home-footer__main">{INSTITUTION.college}</p>
                <p className="home-footer__meta">{INSTITUTION.department} · {PROJECT.academicYear} · {INSTITUTION.city}</p>
            </footer>

            <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
            <HowItWorksModal open={howOpen} onClose={() => setHowOpen(false)} />
        </div>
    );
}
