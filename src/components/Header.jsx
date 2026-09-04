import { useEffect, useState } from "react";
import "../styles/Header.css";

export default function Header() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-box bg-white p-1 border border-cyan-500/40 shadow-sm overflow-hidden flex items-center justify-center">
          <img src="/rrce-logo.jpg" alt="RRCE College Logo" className="w-full h-full object-contain rounded-md" />
        </div>
        <div>
          <h1>
            SUBMERSIBLE MICRO ROBOT
          </h1>
          <span>
            AI Powered Underwater Inspection & Mission Control System
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="clock-box">
          <div className="time">
            {time}
          </div>
          <div className="date">
            {date}
          </div>
        </div>
        <div className="profile">
          VC
        </div>
      </div>
    </header>
  );
}
