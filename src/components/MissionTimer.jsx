import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';

export default function MissionTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Mission Duration</span>
        <span className="text-xl font-mono font-bold text-gray-900">{formatTime(time)}</span>
      </div>
      
      <div className="flex items-center gap-1 border-l border-gray-200 pl-4 ml-2">
        {!isRunning ? (
          <button 
            onClick={() => setIsRunning(true)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Start Timer"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
        ) : (
          <button 
            onClick={() => setIsRunning(false)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Pause Timer"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        )}
        
        <button 
          onClick={() => {
            setIsRunning(false);
            setTime(0);
          }}
          className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
          title="Reset Timer"
        >
          <Square className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}
