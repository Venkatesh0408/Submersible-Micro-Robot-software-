import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationListener from "./components/NotificationListener";
import AnimatedBackground from "./components/AnimatedBackground";
import LoadingAnimation from "./components/LoadingAnimation";
import ToastHost from "./components/Toast";
import ConfirmHost from "./components/ConfirmDialog";

// Single import map: reused for both lazy() and idle prefetch so navigation is instant.
const load = {
  Splash: () => import("./pages/Splash"),
  Welcome: () => import("./pages/Welcome"),
  Login: () => import("./pages/Login"),
  Home: () => import("./pages/Main"),
  About: () => import("./pages/About"),
  Dashboard: () => import("./pages/Dashboard"),
  RoutePlanner: () => import("./pages/RoutePlanner"),
  ImageAnalysis: () => import("./pages/ImageAnalysis"),
  History: () => import("./pages/History"),
};

const Splash = lazy(load.Splash);
const Welcome = lazy(load.Welcome);
const Login = lazy(load.Login);
const Home = lazy(load.Home);
const About = lazy(load.About);
const Dashboard = lazy(load.Dashboard);
const RoutePlanner = lazy(load.RoutePlanner);
const ImageAnalysis = lazy(load.ImageAnalysis);
const History = lazy(load.History);

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Instant navigation: a keyed fade-in (no AnimatePresence exit-wait, which used to
// stall every click by fading the old page out before loading the next).
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      <Suspense fallback={<LoadingAnimation />}>
        <Routes location={location}>
          <Route path="/" element={<Splash />} />
          <Route path="/home" element={<Home />} />
          <Route path="/main" element={<Navigate to="/home" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/route-planner" element={<ProtectedRoute><RoutePlanner /></ProtectedRoute>} />
          <Route path="/image-analysis" element={<ProtectedRoute><ImageAnalysis /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </motion.div>
  );
}

function App() {
  // Warm the route chunks once the app is idle so clicking a nav link never waits
  // on a download — navigation feels instant.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    const id = idle(() => {
      load.Home(); load.Login(); load.Dashboard();
      load.RoutePlanner(); load.ImageAnalysis(); load.History(); load.About();
    });
    return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
  }, []);

  return (
    <BrowserRouter>
      <AnimatedBackground />
      <NotificationListener />
      <ToastHost />
      <ConfirmHost />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
