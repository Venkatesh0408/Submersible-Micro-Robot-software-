const fs = require('fs');
const file = '/app/applet/src/pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const newCard = `
                {/* MISSION HISTORY CARD */}
                <div
                    className="system-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate("/mission-history")}
                >
                    <div className="system-icon">
                        📁
                    </div>
                    <h2>
                        Mission History
                    </h2>
                    <p>
                        Review completed missions or resume uncompleted route plans.
                    </p>
                    <div className="system-info">
                        <span>Save & Load</span>
                        <span>Tracking</span>
                    </div>
                    <button style={{ marginTop: 'auto' }}>
                        OPEN HISTORY →
                    </button>
                </div>
`;

content = content.replace('{/* HEALTH & TELEMETRY */}', newCard + '\n                {/* HEALTH & TELEMETRY */}');

fs.writeFileSync(file, content);
