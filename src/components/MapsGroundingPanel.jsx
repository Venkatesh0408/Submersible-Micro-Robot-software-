import React, { useState, useEffect } from "react";
import { useMission } from "../context/MissionContext";
import { searchMapsGrounding } from "../services/api";
import { MapPin, Search, Compass, ExternalLink, RefreshCw, Droplets, Layers, Building, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function MapsGroundingPanel() {
    const { robot, setBotLocation } = useMission();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const presetQueries = [
        { label: "💧 Water Reservoirs & Dams", value: "Find nearby water reservoirs, dams, and lakes suitable for submersible robot inspection" },
        { label: "🏭 Pump Stations & Treatment Facilities", value: "Search for nearby municipal water treatment plants and water pump stations" },
        { label: "🔧 Marine & Subsea Equipment Suppliers", value: "Locate nearby marine hardware, industrial pump suppliers, or underwater inspection equipment services" },
        { label: "🏛️ Local Water Authorities", value: "Find nearby municipal water supply board centers or environmental protection offices" }
    ];

    const handleSearch = async (searchPrompt) => {
        const promptToUse = searchPrompt || query;
        if (!promptToUse.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const data = await searchMapsGrounding(promptToUse, robot.latitude, robot.longitude);
            if (data && data.success) {
                setResults(data);
            } else {
                setError(data?.message || "Failed to retrieve grounded Google Maps data.");
            }
        } catch (err) {
            setError("Error connecting to Gemini Google Maps service.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-run initial search on mount
    useEffect(() => {
        handleSearch("Find nearby water bodies, reservoirs, or pump stations for underwater robot inspection");
    }, []);

    return (
        <div style={{
            background: "rgba(22, 10, 16, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(18,211,224, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            color: "#ffffff",
            marginTop: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #22d3ee, #0a6b78)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 12px rgba(18,211,224, 0.5)"
                    }}>
                        <MapPin size={22} color="#ffffff" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#ffffff", letterSpacing: "0.5px" }}>
                            Google Maps Site Intelligence
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px", color: "#93a1bc" }}>
                            Grounded in real-time Google Maps data via Gemini 3.5 Flash
                        </p>
                    </div>
                </div>

                {/* GPS Location Context Indicator */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(18,211,224, 0.1)",
                    border: "1px solid rgba(18,211,224, 0.25)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    color: "#2ee6f0"
                }}>
                    <Compass size={14} className="spin-slow" />
                    <span>Robot Lat: <strong>{robot.latitude.toFixed(5)}</strong>, Lng: <strong>{robot.longitude.toFixed(5)}</strong></span>
                </div>
            </div>

            {/* Quick Preset Chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {presetQueries.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setQuery(item.value);
                            handleSearch(item.value);
                        }}
                        disabled={loading}
                        style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(18,211,224, 0.2)",
                            borderRadius: "20px",
                            padding: "6px 12px",
                            color: "#ffd6dc",
                            fontSize: "12px",
                            cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(18,211,224, 0.2)";
                            e.currentTarget.style.borderColor = "#22d3ee";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(18,211,224, 0.2)";
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Custom Query Search Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#93a1bc" }} />
                    <input
                        type="text"
                        placeholder="Ask Gemini to find nearby inspection targets, water plants, dams, or hardware suppliers..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            background: "rgba(0, 0, 0, 0.4)",
                            border: "1px solid rgba(18,211,224, 0.3)",
                            borderRadius: "10px",
                            color: "#ffffff",
                            fontSize: "13px",
                            outline: "none"
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: "linear-gradient(135deg, #22d3ee, #0a6b78)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "0 20px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: loading ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 14px rgba(18,211,224, 0.4)",
                        whiteSpace: "nowrap"
                    }}
                >
                    {loading ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={16} />}
                    {loading ? "Grounding..." : "Search Maps"}
                </button>
            </form>

            {/* Error Banner */}
            {error && (
                <div style={{
                    background: "rgba(220, 38, 38, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "10px",
                    padding: "12px",
                    color: "#93a1bc",
                    fontSize: "13px",
                    marginBottom: "16px"
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#93a1bc",
                    fontSize: "13px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px"
                }}>
                    <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", color: "#22d3ee" }} />
                    <div>Retrieving real-time spatial data via <strong>Gemini 3.5 Flash</strong> + <strong>Google Maps Grounding</strong>...</div>
                </div>
            )}

            {/* Results Output */}
            {!loading && results && (
                <div>
                    {/* Grounded Places Cards */}
                    {results.places && results.places.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#2ee6f0", display: "flex", alignItems: "center", gap: "6px" }}>
                                <MapPin size={16} /> Grounded Google Maps Locations ({results.places.length})
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                                {results.places.map((place, idx) => (
                                    <div key={idx} style={{
                                        background: "rgba(35, 12, 20, 0.7)",
                                        border: "1px solid rgba(18,211,224, 0.25)",
                                        borderRadius: "12px",
                                        padding: "12px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: "10px"
                                    }}>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>
                                                {place.title}
                                            </div>
                                            {place.address && (
                                                <div style={{ fontSize: "11px", color: "#93a1bc", marginBottom: "6px" }}>
                                                    📍 {place.address}
                                                </div>
                                            )}
                                        </div>

                                        {place.uri && (
                                            <a
                                                href={place.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "#4ade80",
                                                    textDecoration: "none",
                                                    background: "rgba(34, 197, 94, 0.12)",
                                                    padding: "6px 12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid rgba(34, 197, 94, 0.3)",
                                                    alignSelf: "flex-start"
                                                }}
                                            >
                                                <span>View on Google Maps</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Grounded Summary */}
                    {results.text && (
                        <div style={{
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            padding: "16px",
                            fontSize: "13px",
                            lineHeight: "1.6",
                            color: "#e2e8f0"
                        }}>
                            <ReactMarkdown>{results.text}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
