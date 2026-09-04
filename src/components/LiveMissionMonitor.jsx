import { useEffect, useState } from "react";

import {
    getTelemetry,
    getSensorData,
    getHealth
} from "../services/api";

export default function LiveMissionMonitor() {

    const [telemetry, setTelemetry] = useState({

        status: "IDLE",

        battery: 100,

        signal: 100,

        speed: 0,

        progress: 0,

        currentWaypoint: 0,

        totalWaypoints: 0

    });

    const [sensor, setSensor] = useState({

        ph: 7.2,

        turbidity: 12,

        temperature: 28

    });

    const [health, setHealth] = useState({

        camera: "Connected",

        ai: "Ready",

        backend: "Running"

    });

    useEffect(() => {

        async function loadData() {

            try {

                const t = await getTelemetry();

                setTelemetry(t);

            }

            catch (err) {

                console.log(err);

            }

            try {

                const s = await getSensorData();

                setSensor(s);

            }

            catch (err) {

                console.log(err);

            }

            try {

                const h = await getHealth();

                setHealth(h);

            }

            catch (err) {

                console.log(err);

            }

        }

        loadData();

        const timer = setInterval(loadData, 5000);

        return () => clearInterval(timer);

    }, []);

    return (

        <div className="monitor-card">

            <h2>🛰 Live Mission Monitor</h2>

            <div className="monitor-grid">

                <div className="monitor-item">

                    <h4>📷 Camera</h4>

                    <span>

                        {health.camera}

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🤖 AI Engine</h4>

                    <span>

                        {health.ai}

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🚀 Mission</h4>

                    <span>

                        {telemetry.status}

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🔋 Battery</h4>

                    <span>

                        {telemetry.battery}%

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>📡 Signal</h4>

                    <span>

                        {telemetry.signal}%

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>⚡ Speed</h4>

                    <span>

                        {telemetry.speed} m/s

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>📍 Waypoint</h4>

                    <span>

                        {telemetry.currentWaypoint} / {telemetry.totalWaypoints}

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>📈 Progress</h4>

                    <span>

                        {telemetry.progress}%

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🌡 Temperature</h4>

                    <span>

                        {sensor.temperature} °C

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🧪 pH</h4>

                    <span>

                        {sensor.ph}

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>🌊 Turbidity</h4>

                    <span>

                        {sensor.turbidity} NTU

                    </span>

                </div>

                <div className="monitor-item">

                    <h4>⚠ System</h4>

                    <span

                        style={{

                            color:

                                telemetry.status === "RUNNING"

                                    ? "#22c55e"

                                    : "#ffd43b"

                        }}

                    >

                        {telemetry.status === "RUNNING"

                            ? "Mission Active"

                            : "Standby"}

                    </span>

                </div>

            </div>

        </div>

    );

}