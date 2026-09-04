import { useNavigate } from "react-router-dom";
import AboutModal from "../components/AboutModal";

// Standalone /about route (used from the nav on inner pages). On Home the same
// modal opens in-place instead of navigating here.
export default function About() {
    const navigate = useNavigate();
    return <AboutModal open onClose={() => navigate("/home")} />;
}
