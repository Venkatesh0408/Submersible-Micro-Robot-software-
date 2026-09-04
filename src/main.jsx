import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "leaflet/dist/leaflet.css";

import "./index.css";
import "./App.css";

import App from "./App.jsx";

import { MissionProvider } from "./context/MissionContext";

createRoot(document.getElementById("root")).render(

    <StrictMode>

        <MissionProvider>

            <App />

        </MissionProvider>

    </StrictMode>

);