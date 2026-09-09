import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./index.css";
import "./App.css";

import App from "./App.jsx";

import { MissionProvider } from "./context/MissionContext";
import { AuthProvider } from "./context/AuthContext";

createRoot(document.getElementById("root")).render(

    <StrictMode>

        <AuthProvider>

            <MissionProvider>

                <App />

            </MissionProvider>

        </AuthProvider>

    </StrictMode>

);