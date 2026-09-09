import { Suspense, Component, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    OrbitControls, Environment, Lightformer, ContactShadows, Grid,
    useGLTF, useProgress, AdaptiveDpr, AdaptiveEvents,
} from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Boxes, Box as BoxIcon, RotateCcw, RefreshCw, MousePointer2, X, TriangleAlert } from "lucide-react";
import * as THREE from "three";
import "../styles/RobotViewer.css";

const ASSEMBLED_URL = "/models/robot-assembled.glb";
const EXPLODED_URL = "/models/robot-exploded.glb";
const DRACO = "/draco/"; // self-hosted decoder, no CDN
const POSTER = "/models/robot-poster.jpg"; // optional static fallback (degrades gracefully)

useGLTF.preload(ASSEMBLED_URL, DRACO);
useGLTF.preload(EXPLODED_URL, DRACO);

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function hasWebGL() {
    try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch { return false; }
}

// One fused model: recenter onto the floor, clone materials so we can cross-fade opacity.
function Model({ url, active }) {
    const { scene } = useGLTF(url, DRACO);
    const opacity = useRef(active ? 1 : 0);

    useEffect(() => {
        const box = new THREE.Box3().setFromObject(scene);
        const c = box.getCenter(new THREE.Vector3());
        scene.position.set(-c.x, -box.min.y, -c.z); // centered on X/Z, resting on y=0
        scene.traverse((o) => {
            if (o.isMesh && o.material && !o.material.userData.__cf) {
                o.material = o.material.clone();
                o.material.userData.__cf = true;
                o.material.transparent = true;
                o.material.depthWrite = true;
                o.material.envMapIntensity = 0.9;
            }
        });
    }, [scene]);

    useFrame((_, delta) => {
        opacity.current = THREE.MathUtils.damp(opacity.current, active ? 1 : 0, 5, delta);
        scene.visible = opacity.current > 0.015;
        scene.traverse((o) => { if (o.isMesh && o.material) o.material.opacity = opacity.current; });
    });

    return <primitive object={scene} />;
}

// Frames the model on load / reset, and eases a ~15% dolly-out on disassemble ("opens up").
function Framing({ exploded, resetKey, reduce }) {
    const camera = useThree((s) => s.camera);
    const controls = useThree((s) => s.controls);
    const { scene } = useGLTF(ASSEMBLED_URL, DRACO); // both models share ~the same extent
    const anim = useRef(null);
    const baseDist = useRef(0);

    const start = useCallback((toDist, snap) => {
        if (!controls) return;
        const box = new THREE.Box3().setFromObject(scene);
        const sph = box.getBoundingSphere(new THREE.Sphere());
        const fromDir = camera.position.clone().sub(controls.target);
        if (fromDir.lengthSq() < 1e-6) fromDir.set(1.1, 0.7, 1.4);
        anim.current = {
            t: 0, dur: snap || reduce ? 0.0001 : 0.75,
            fromT: controls.target.clone(), toT: sph.center.clone(),
            fromC: camera.position.clone(),
            toC: sph.center.clone().add(fromDir.setLength(toDist)),
        };
    }, [controls, camera, scene, reduce]);

    // Absolute fit on mount + reset.
    useEffect(() => {
        if (!controls) return;
        const box = new THREE.Box3().setFromObject(scene);
        const sph = box.getBoundingSphere(new THREE.Sphere());
        baseDist.current = (sph.radius / Math.sin((camera.fov * Math.PI) / 180 / 2)) * 1.15;
        start(baseDist.current * (exploded ? 1.15 : 1), resetKey === 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controls, resetKey]);

    // Relative dolly on disassemble/reassemble.
    useEffect(() => {
        if (!controls || !baseDist.current) return;
        const cur = camera.position.distanceTo(controls.target);
        start(cur * (exploded ? 1.15 : 1 / 1.15), false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exploded]);

    useFrame((_, delta) => {
        const a = anim.current;
        if (!a || !controls) return;
        a.t = Math.min(1, a.t + delta / a.dur);
        const e = easeInOut(a.t);
        controls.target.lerpVectors(a.fromT, a.toT, e);
        camera.position.lerpVectors(a.fromC, a.toC, e);
        controls.update();
        if (a.t >= 1) anim.current = null;
    });

    return null;
}

function Scene({ exploded, resetKey, autoRotate, reduce, isMobile, controlsRef, onInteractStart, onInteractEnd }) {
    return (
        <>
            <color attach="background" args={["#070b14"]} />
            <hemisphereLight args={["#dff4ff", "#0a1420", 0.65]} />
            <directionalLight position={[4, 6, 3]} intensity={1.25} />
            <directionalLight position={[-4, 2, -3]} intensity={0.45} color="#8bb6ff" />

            {/* Procedural studio env map (no external HDRI — self-contained, offline-safe). */}
            <Environment resolution={256} frames={1}>
                <Lightformer intensity={2.2} position={[0, 4, -3]} scale={[10, 6, 1]} color="#cfeaff" />
                <Lightformer intensity={1.1} position={[-5, 2, 2]} scale={[6, 6, 1]} color="#7fb4ff" />
                <Lightformer intensity={0.9} position={[5, 1, 2]} scale={[6, 6, 1]} color="#ffffff" />
                <Lightformer intensity={0.6} position={[0, -3, 1]} scale={[10, 4, 1]} color="#22d3ee" />
            </Environment>

            <Suspense fallback={null}>
                <Model url={ASSEMBLED_URL} active={!exploded} />
                <Model url={EXPLODED_URL} active={exploded} />
                <Framing exploded={exploded} resetKey={resetKey} reduce={reduce} />
            </Suspense>

            <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={5} blur={2.6} far={3} resolution={512} color="#000000" />
            <Grid
                position={[0, 0, 0]} args={[14, 14]} cellSize={0.2} cellThickness={0.6}
                cellColor="#1e2a44" sectionSize={1} sectionThickness={1} sectionColor="#22d3ee"
                fadeDistance={12} fadeStrength={1.6} infiniteGrid followCamera={false}
            />

            <OrbitControls
                ref={controlsRef} makeDefault
                enableDamping dampingFactor={0.08} rotateSpeed={0.55} zoomSpeed={0.7}
                enablePan={!isMobile} minDistance={0.4} maxDistance={10} maxPolarAngle={Math.PI * 0.92}
                autoRotate={autoRotate} autoRotateSpeed={0.8}
                onStart={onInteractStart} onEnd={onInteractEnd}
            />

            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
        </>
    );
}

class GLBoundary extends Component {
    state = { error: false };
    static getDerivedStateFromError() { return { error: true }; }
    componentDidCatch(err) { console.error("RobotViewer WebGL/asset error:", err); }
    render() { return this.state.error ? this.props.fallback : this.props.children; }
}

function Fallback() {
    return (
        <div className="rv-fallback">
            <TriangleAlert size={30} />
            <p className="rv-fallback__head">3D preview unavailable on this device</p>
            <p className="rv-fallback__sub">Your browser or GPU can’t render WebGL here.</p>
            <img src={POSTER} alt="Submersible micro robot" className="rv-fallback__img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
    );
}

export default function RobotViewer() {
    const reduce = useReducedMotion();
    const controlsRef = useRef(null);
    const idleTimer = useRef(0);
    const [webgl] = useState(hasWebGL);
    const [exploded, setExploded] = useState(false);
    const [autoRotateOn, setAutoRotateOn] = useState(!reduce);
    const [interacting, setInteracting] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const [hint, setHint] = useState(true);
    const [frameloop, setFrameloop] = useState("always");
    const [isMobile, setIsMobile] = useState(false);

    const { active, progress } = useProgress();
    const [ready, setReady] = useState(false);
    useEffect(() => { if (!active && progress >= 100) setReady(true); }, [active, progress]);

    useEffect(() => setAutoRotateOn(!reduce), [reduce]);
    useEffect(() => setIsMobile(window.matchMedia("(pointer: coarse), (max-width: 640px)").matches), []);

    // Pause the render loop while the tab is hidden (saves battery/CPU in a background tab).
    useEffect(() => {
        const onVis = () => setFrameloop(document.hidden ? "never" : "always");
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    // Free GPU memory + GLTF cache when leaving the page.
    useEffect(() => () => {
        clearTimeout(idleTimer.current);
        useGLTF.clear([ASSEMBLED_URL, EXPLODED_URL]);
    }, []);

    const onInteractStart = useCallback(() => {
        setHint(false);
        clearTimeout(idleTimer.current);
        setInteracting(true);
    }, []);
    const onInteractEnd = useCallback(() => {
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => setInteracting(false), 2500);
    }, []);

    // Auto-hide the hint after a few seconds even without interaction.
    useEffect(() => {
        if (!hint) return;
        const t = setTimeout(() => setHint(false), 5000);
        return () => clearTimeout(t);
    }, [hint]);

    const resetView = useCallback(() => {
        controlsRef.current?.reset?.();
        setResetKey((k) => k + 1);
    }, []);

    const effectiveAutoRotate = autoRotateOn && !interacting && !reduce;

    return (
        <div className="rv">
            <div className="rv-stage">
                {!webgl ? (
                    <Fallback />
                ) : (
                    <GLBoundary fallback={<Fallback />}>
                        <div className={`rv-canvas-wrap${ready ? " is-ready" : ""}`}>
                            <Canvas
                                frameloop={frameloop}
                                shadows={false}
                                dpr={[1, 2]}
                                gl={{ antialias: true, powerPreference: "high-performance" }}
                                camera={{ position: [1.6, 1.1, 1.9], fov: 42, near: 0.01, far: 100 }}
                                onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}
                            >
                                <Scene
                                    exploded={exploded} resetKey={resetKey} autoRotate={effectiveAutoRotate}
                                    reduce={reduce} isMobile={isMobile} controlsRef={controlsRef}
                                    onInteractStart={onInteractStart} onInteractEnd={onInteractEnd}
                                />
                            </Canvas>
                        </div>

                        {!ready && (
                            <div className="rv-loading" aria-live="polite">
                                <span className="rv-spin" />
                                <p>Loading 3D model… <b>{Math.round(progress)}%</b></p>
                            </div>
                        )}

                        <div className={`rv-statelabel${exploded ? " is-exploded" : ""}`}>
                            {exploded ? "Disassembled view — components separated" : "Assembled view"}
                        </div>

                        {hint && ready && (
                            <button type="button" className="rv-hint" onClick={() => setHint(false)}>
                                <MousePointer2 size={13} /> Drag to rotate · Scroll to zoom
                                <X size={13} className="rv-hint__x" />
                            </button>
                        )}

                        <div className="rv-controls">
                            <button type="button" className="rv-btn rv-btn--primary" onClick={() => setExploded((v) => !v)}>
                                {exploded ? <BoxIcon size={16} /> : <Boxes size={16} />}
                                {exploded ? "Reassemble" : "Disassemble"}
                            </button>
                            <button type="button" className="rv-btn" onClick={resetView}>
                                <RotateCcw size={15} /> Reset view
                            </button>
                            <button
                                type="button"
                                className={`rv-btn${autoRotateOn ? " is-on" : ""}`}
                                onClick={() => setAutoRotateOn((v) => !v)}
                                aria-pressed={autoRotateOn}
                            >
                                <RefreshCw size={15} /> Auto-rotate
                            </button>
                        </div>
                    </GLBoundary>
                )}
            </div>

            <p className="rv-caption">Interactive 3D model of our hardware.</p>
        </div>
    );
}
