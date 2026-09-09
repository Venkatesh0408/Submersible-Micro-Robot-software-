import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TopNav from "../components/TopNav";
import RobotViewer from "../components/RobotViewer";
import "../styles/ModelViewerPage.css";

const TITLE = "3D Model — Submersible Micro Robot";
const DESC = "Interactive 3D model of our submersible micro robot — rotate, zoom, and switch between assembled and disassembled views.";

export default function ModelViewerPage() {
    // SEO / meta for the standalone route.
    useEffect(() => {
        const prevTitle = document.title;
        document.title = TITLE;
        let meta = document.querySelector('meta[name="description"]');
        const created = !meta;
        if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
        const prevDesc = meta.getAttribute("content");
        meta.setAttribute("content", DESC);
        return () => {
            document.title = prevTitle;
            if (created) meta.remove();
            else if (prevDesc != null) meta.setAttribute("content", prevDesc);
        };
    }, []);

    return (
        <div className="mvp">
            <TopNav />
            <div className="mvp-bar">
                <Link to="/home" className="mvp-back">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
                <div className="mvp-heading">
                    <span className="mvp-kicker">Hardware Showcase</span>
                    <h1 className="mvp-title">Submersible Micro Robot — 3D Model</h1>
                </div>
            </div>
            <div className="mvp-viewer">
                <RobotViewer />
            </div>
        </div>
    );
}
