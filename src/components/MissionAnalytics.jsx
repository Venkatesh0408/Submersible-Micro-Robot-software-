import { useEffect, useState } from "react";

import {
    getTelemetry,
    getGPS,
    getHealth,
    getSensorData
} from "../services/api";

export default function MissionAnalytics() {

    const [telemetry, setTelemetry] = useState({

        battery: 100,

        speed: 0,

        status: "READY"

    });

    const [gps, setGps] = useState({

        distance: 0,

        eta: 0

    });

    const [health, setHealth] = useState({

        camera: "Connected"

    });

    const [sensor, setSensor] = useState({

        ph: 7.2,

        turbidity: 12

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

                const g = await getGPS();

                setGps(g);

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

            try {

                const s = await getSensorData();

                setSensor(s);

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

        <div className="analytics-grid">

            <div className="analytics-card">

                <span className="analytics-icon">📏</span>

                <h4>Total Distance</h4>

                <h2>

                    {gps.distance || 0} m

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">⏱</span>

                <h4>Estimated Time</h4>

                <h2>

                    {gps.eta || 0} min

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">🤖</span>

                <h4>Robot Speed</h4>

                <h2>

                    {telemetry.speed} m/s

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">🔋</span>

                <h4>Battery</h4>

                <h2>

                    {telemetry.battery}%

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">📡</span>

                <h4>GPS Status</h4>

                <h2>

                    Connected

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">📷</span>

                <h4>Camera</h4>

                <h2>

                    {health.camera}

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">🌊</span>

                <h4>Water Quality</h4>

                <h2>

                    pH {sensor.ph}

                </h2>

            </div>

            <div className="analytics-card">

                <span className="analytics-icon">🛰</span>

                <h4>Mission</h4>

                <h2

                    style={{

                        color:

                            telemetry.status === "RUNNING"

                                ? "#22c55e"

                                : "#ffffff"

                    }}

                >

                    {telemetry.status}

                </h2>

            </div>

        </div>

    );

}