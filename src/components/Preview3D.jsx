import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Box, Download, Loader2, AlertTriangle } from "lucide-react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { toast } from "./Toast";
import "../styles/Preview3D.css";

const SAMPLE_GLB = "/samples/preview-sample.glb";

export default function Preview3D({ open, image, onClose }) {
    const reduce = useReducedMotion();
    const mountRef = useRef(null);
    const abortRef = useRef(null);
    const objectUrlRef = useRef(null);
    const [status, setStatus] = useState("generating"); // generating | ready | error
    const [glbUrl, setGlbUrl] = useState(null);
    const [usedFallback, setUsedFallback] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    // --- generate (or fetch) the model when opened ---
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const controller = new AbortController();
        abortRef.current = controller;
        setStatus("generating");
        setGlbUrl(null);
        setUsedFallback(false);
        setElapsed(0);
        const started = Date.now();
        const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);

        (async () => {
            try {
                const res = await fetch("/api/generate-3d", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    let m = "3D generation failed.";
                    try { m = (await res.json()).error || m; } catch { /* ignore */ }
                    throw new Error(m);
                }
                const blob = await res.blob();
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                objectUrlRef.current = url;
                setGlbUrl(url);
                setStatus("ready");
            } catch (e) {
                if (cancelled || e.name === "AbortError") return;
                // graceful fallback to the committed sample mesh
                console.warn("Live 3D failed, using sample:", e.message);
                setUsedFallback(true);
                setGlbUrl(SAMPLE_GLB);
                setStatus("ready");
                toast.warning("Live 3D unavailable — showing a sample preview.", { title: "3D Preview" });
            } finally {
                clearInterval(timer);
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
            clearInterval(timer);
        };
    }, [open, image]);

    // --- render the glb with three.js ---
    useEffect(() => {
        if (!open || !glbUrl || !mountRef.current) return;
        const mount = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b1626);

        const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
        camera.position.set(1.7, 1.25, 1.9);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        // soft, neutral studio lighting
        scene.add(new THREE.HemisphereLight(0xdff4ff, 0x0a1420, 1.15));
        const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 4); scene.add(key);
        const fill = new THREE.DirectionalLight(0x88bbff, 0.5); fill.position.set(-3, 2, -2); scene.add(fill);

        // ground grid
        const grid = new THREE.GridHelper(6, 24, 0x22d3ee, 0x1e2a44);
        grid.material.opacity = 0.35; grid.material.transparent = true;
        scene.add(grid);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = !reduce;
        controls.autoRotateSpeed = 1.1;

        const loader = new GLTFLoader();
        loader.load(
            glbUrl,
            (gltf) => {
                const model = gltf.scene;
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const scale = 1.7 / maxDim;
                model.scale.setScalar(scale);
                model.position.sub(center.multiplyScalar(scale));
                const box2 = new THREE.Box3().setFromObject(model);
                model.position.y -= box2.min.y; // sit on the grid
                scene.add(model);
            },
            undefined,
            (err) => { console.error("GLTF load error", err); setStatus("error"); }
        );

        const resize = () => {
            const w = mount.clientWidth, h = mount.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        let raf;
        const tick = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
        tick();

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            controls.dispose();
            renderer.dispose();
            scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose?.()); });
            if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        };
    }, [open, glbUrl, reduce]);

    // release object URLs on unmount
    useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

    const close = () => { abortRef.current?.abort(); onClose(); };
    const download = () => {
        if (!glbUrl) return;
        const a = document.createElement("a");
        a.href = glbUrl; a.download = "preview.glb"; a.click();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="p3d-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={close}>
                    <motion.div
                        className="p3d-modal"
                        role="dialog" aria-modal="true" aria-label="3D preview"
                        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.98, transition: { duration: 0.16 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p3d-head">
                            <div className="p3d-title">
                                <Box size={18} /> 3D Preview
                                <span className="p3d-chip">Experimental</span>
                            </div>
                            <button className="p3d-close" onClick={close} aria-label="Close"><X size={18} /></button>
                        </div>

                        <div className="p3d-stage">
                            <div className="p3d-canvas" ref={mountRef} />
                            {status === "generating" && (
                                <div className="p3d-loading">
                                    <Loader2 size={30} className="p3d-spin" />
                                    <p>Generating 3D mesh… <b>{elapsed}s</b></p>
                                    <span>TripoSR usually takes ~10–40s</span>
                                    <button className="p3d-cancel" onClick={close}>Cancel</button>
                                </div>
                            )}
                            {status === "error" && (
                                <div className="p3d-loading"><AlertTriangle size={26} style={{ color: "var(--danger)" }} /><p>Could not render the model.</p></div>
                            )}
                        </div>

                        <div className="p3d-foot">
                            <p className="p3d-caption">
                                AI-generated approximation from a single image — visualization only, not dimensionally accurate.
                                {usedFallback && " (showing bundled sample — live generation was unavailable)"}
                            </p>
                            <button className="p3d-download" onClick={download} disabled={status !== "ready"}>
                                <Download size={16} /> Download .glb
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
