import { useState, useEffect } from "react";
import TopNav from "../components/TopNav";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { confirmDialog } from "../components/ConfirmDialog";
import { useMission } from "../context/MissionContext";
import { Trash2, Play, CheckCircle, Clock } from "lucide-react";
import "../styles/History.css"; // Reuse existing history styles

export default function MissionHistory() {
    const navigate = useNavigate();
    const { loadMissionFromHistory } = useMission();
    const [missions, setMissions] = useState([]);

    useEffect(() => {
        const history = JSON.parse(localStorage.getItem("missionHistory") || "[]");
        // Sort descending by date
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMissions(history);
    }, []);

    const handleResume = async (mission) => {
        if (mission.status === "completed") {
            const c = await confirmDialog({ title: "Completed Mission", message: "This mission is already completed. Do you want to load it anyway?", confirmText: "Load Anyway" });
            if (!c) return;
        }
        loadMissionFromHistory(mission);
        navigate("/route-planner");
    };

    const handleDelete = async (id) => {
        if (await confirmDialog({ title: "Delete Record?", message: "Are you sure you want to delete this mission record?", confirmText: "Delete", tone: "danger" })) {
            const updated = missions.filter(m => m.id !== id);
            setMissions(updated);
            localStorage.setItem("missionHistory", JSON.stringify(updated));
        }
    };

    return (
        <div className="dashboard-layout">
            <TopNav />
            <div className="dashboard-content">
                <Header title="Mission History" subtitle="Review past and resume incomplete missions." />

                <div className="history-container p-6">
                    {missions.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <p>No missions recorded in history.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {missions.map(m => (
                                <div key={m.id} className="bg-[#16203a] border border-cyan-500/20 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-cyan-500/50">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{m.name}</h3>
                                        <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-2">
                                            <span><strong>Area:</strong> {m.area}</span>
                                            <span><strong>Date:</strong> {new Date(m.date).toLocaleString()}</span>
                                            <span><strong>Distance:</strong> {m.distance?.toFixed(2)}m</span>
                                            <span><strong>Time:</strong> {Math.floor(m.missionTime / 60)}m {m.missionTime % 60}s</span>
                                            <span><strong>Waypoints:</strong> {m.currentWaypoint} / {m.waypoints?.length}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                                            m.status === 'completed' 
                                            ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                        }`}>
                                            {m.status === 'completed' ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                            {m.status.toUpperCase()}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleResume(m)}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none"
                                            title="Load Mission"
                                        >
                                            <Play size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(m.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
