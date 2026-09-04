import { useState, useEffect } from "react";
import { Folder, Image as ImageIcon, Video, Upload, Trash2, Eye, Play, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { fetchMedia, uploadMedia, deleteMedia } from "../services/api";
import { confirmDialog } from "./ConfirmDialog";

export default function MediaGallery() {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [notice, setNotice] = useState("");

    // Fetch media files saved in backend storage (/public/media/)
    const loadMediaFromBackend = async () => {
        setLoading(true);
        try {
            const data = await fetchMedia();
            if (Array.isArray(data)) {
                setMediaItems(data);
            }
        } catch (err) {
            console.error("Failed to load backend media:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMediaFromBackend();
    }, []);

    // Handle file selection & upload to backend server storage
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setNotice(`Uploading ${files.length} file(s) to backend storage (/public/media)...`);

        try {
            for (const file of files) {
                const reader = new FileReader();
                const base64Data = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });

                await uploadMedia(file.name, base64Data);
            }

            setNotice(`Successfully saved ${files.length} file(s) to backend storage!`);
            await loadMediaFromBackend();
        } catch (err) {
            console.error("Upload error:", err);
            setNotice(`Upload failed: ${err.message || "Server error"}`);
        } finally {
            setUploading(false);
            setTimeout(() => setNotice(""), 6000);
        }
    };

    // Permanently remove file from backend storage
    const handleDelete = async (item) => {
        const filename = item.filename || item.name;
        const ok = await confirmDialog({
            title: "Delete file?",
            message: `"${filename}" will be permanently removed from backend storage. This can't be undone.`,
            confirmText: "Delete",
            tone: "danger",
        });
        if (!ok) return;

        try {
            await deleteMedia(filename);
            setNotice(`Deleted "${filename}" from backend storage.`);
            if (selectedMedia?.filename === filename || selectedMedia?.id === item.id) {
                setSelectedMedia(null);
            }
            await loadMediaFromBackend();
        } catch (err) {
            console.error("Delete error:", err);
            setNotice(`Failed to delete file: ${err.message}`);
        } finally {
            setTimeout(() => setNotice(""), 5000);
        }
    };

    return (
        <div style={{
            background: "#0e1524",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 0 25px rgba(18,211,224, .2)",
            border: "1px solid rgba(18,211,224, .3)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            height: "100%",
            boxSizing: "border-box"
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ color: "#22d3ee", fontSize: "20px", fontWeight: "900", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <Folder size={22} /> Backend Media Storage & Gallery
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={loadMediaFromBackend}
                        disabled={loading}
                        style={{
                            background: "#16203a",
                            color: "#22d3ee",
                            border: "1px solid rgba(18,211,224,0.4)",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: "bold"
                        }}
                        title="Refresh media files from backend storage"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>

                    <label style={{
                        background: uploading ? "#0a6b78" : "#22d3ee",
                        color: "#ffffff",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        fontSize: "12px",
                        cursor: uploading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(18,211,224,0.3)"
                    }}>
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? "Saving to Backend..." : "Upload Image / Video"}
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            style={{ display: "none" }}
                        />
                    </label>
                </div>
            </div>

            {/* Storage Directory Callout Banner */}
            <div style={{
                background: "rgba(18,211,224, 0.08)",
                border: "1px dashed rgba(18,211,224, 0.35)",
                borderRadius: "12px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
            }}>
                <Sparkles size={20} className="text-yellow-400 shrink-0" />
                <div style={{ fontSize: "12px", color: "#f3d0d5", lineHeight: "1.5" }}>
                    <strong style={{ color: "#22d3ee" }}>Backend Storage Active: </strong>
                    Files uploaded here are saved directly to <code style={{ background: "#16203a", padding: "2px 6px", borderRadius: "4px", color: "#60a5fa" }}>/public/media/</code> on the server and rendered dynamically in the frontend.
                </div>
            </div>

            {notice && (
                <div style={{
                    background: notice.includes("failed") || notice.includes("Failed") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.15)",
                    border: `1px solid ${notice.includes("failed") || notice.includes("Failed") ? "#ef4444" : "#22c55e"}`,
                    color: notice.includes("failed") || notice.includes("Failed") ? "#93a1bc" : "#4ade80",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "bold"
                }}>
                    {notice}
                </div>
            )}

            {/* Selected Media Lightbox Preview */}
            {selectedMedia && (
                <div style={{
                    background: "#16203a",
                    border: "1px solid rgba(18,211,224, 0.5)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {selectedMedia.type === "video" ? <Video size={16} className="text-yellow-400" /> : <ImageIcon size={16} className="text-blue-400" />}
                            {selectedMedia.name}
                        </span>
                        <button
                            onClick={() => setSelectedMedia(null)}
                            style={{ background: "transparent", border: "none", color: "#22d3ee", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}
                        >
                            ✖ Close Preview
                        </button>
                    </div>

                    <div style={{ background: "#000000", borderRadius: "10px", overflow: "hidden", display: "flex", justifyContent: "center", maxHeight: "360px" }}>
                        {selectedMedia.type === "video" ? (
                            <video src={selectedMedia.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain" }} />
                        ) : (
                            <img src={selectedMedia.url} alt={selectedMedia.name} style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain" }} />
                        )}
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px", color: "#93a1bc", fontSize: "14px", gap: "10px" }}>
                    <Loader2 size={20} className="animate-spin text-cyan-500" /> Loading backend media storage...
                </div>
            ) : mediaItems.length === 0 ? (
                /* Empty state */
                <div style={{
                    border: "2px dashed rgba(18,211,224, 0.2)",
                    borderRadius: "16px",
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#8296a8",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px"
                }}>
                    <Folder size={36} style={{ color: "#22d3ee", opacity: 0.6 }} />
                    <div style={{ fontWeight: "bold", color: "#ffffff", fontSize: "14px" }}>No media files in backend storage</div>
                    <div style={{ fontSize: "12px", maxWidth: "360px" }}>
                        Click <strong>"Upload Image / Video"</strong> above to upload files directly into <code style={{ color: "#60a5fa" }}>/public/media/</code> on the backend server.
                    </div>
                </div>
            ) : (
                /* Media Grid */
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "14px",
                    overflowY: "auto",
                    flex: 1
                }}>
                    {mediaItems.map((item) => (
                        <div
                            key={item.id || item.filename}
                            style={{
                                background: "rgba(15,36,56, 0.8)",
                                border: "1px solid rgba(18,211,224, 0.2)",
                                borderRadius: "12px",
                                padding: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px"
                            }}
                        >
                            {/* Thumbnail */}
                            <div
                                onClick={() => setSelectedMedia(item)}
                                style={{
                                    height: "120px",
                                    background: "#070b14",
                                    borderRadius: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    border: "1px solid rgba(18,211,224,0.15)",
                                    overflow: "hidden",
                                    position: "relative"
                                }}
                            >
                                {item.type === "image" ? (
                                    <img src={item.url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                                )}
                                <div style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.4)",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                    opacity: 0.9
                                }}>
                                    {item.type === "video" ? <Play size={24} className="text-yellow-400" /> : <Eye size={22} className="text-white" />}
                                    <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: "bold" }}>Click to View</span>
                                </div>
                            </div>

                            {/* File Details */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ overflow: "hidden" }}>
                                    <div style={{ color: "#ffffff", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.name}>
                                        {item.name}
                                    </div>
                                    <div style={{ color: "#8296a8", fontSize: "10px", marginTop: "2px" }}>
                                        {item.size} • {item.type.toUpperCase()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item)}
                                    style={{ background: "transparent", border: "none", color: "#22d3ee", cursor: "pointer", padding: "2px" }}
                                    title="Delete from backend storage"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
