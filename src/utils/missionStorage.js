export const saveMission = (missionData) => {
    const history = getMissionHistory();
    history.push({
        ...missionData,
        id: Date.now(),
        date: new Date().toISOString()
    });
    localStorage.setItem("missionHistory", JSON.stringify(history));
};

export const updateMission = (id, newMissionData) => {
    let history = getMissionHistory();
    history = history.map(m => m.id === id ? { ...m, ...newMissionData, lastUpdated: new Date().toISOString() } : m);
    localStorage.setItem("missionHistory", JSON.stringify(history));
};

export const getMissionHistory = () => {
    try {
        const stored = localStorage.getItem("missionHistory");
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse mission history", e);
    }
    return [];
};

export const deleteMission = (id) => {
    let history = getMissionHistory();
    history = history.filter(m => m.id !== id);
    localStorage.setItem("missionHistory", JSON.stringify(history));
};
