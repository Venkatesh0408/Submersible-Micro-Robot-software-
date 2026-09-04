const BASE_URL = "";
const REQUEST_TIMEOUT_MS = 8000;

export async function safeFetchJson(url, options = {}) {
    // Time-box every request so a hung backend can't leave the UI spinning.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    // A caller-supplied signal (e.g. poll cancellation) also aborts this request.
    if (options.signal) {
        if (options.signal.aborted) controller.abort();
        else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    try {
        const token = localStorage.getItem('token');
        const headers = {
            ...(options.headers || {})
        };
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        if (!res.ok) {
            return null;
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return null;
        }
        const text = await res.text();
        if (!text || text.trim().startsWith("<")) {
            return null;
        }
        return JSON.parse(text);
    } catch (err) {
        console.warn(`safeFetchJson failed for ${url}:`, err);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

// De-duplicate identical in-flight GETs: if several components hit the same
// read endpoint on the same tick, they share one request/response for a short
// TTL. A cancellable caller (passes a signal) opts out so its abort is honored.
const _getCache = new Map(); // url -> { time, promise }
const GET_TTL_MS = 1500;

function cachedGet(url, options) {
    if (options && options.signal) {
        return safeFetchJson(url, options);
    }
    const now = Date.now();
    const hit = _getCache.get(url);
    if (hit && now - hit.time < GET_TTL_MS) {
        return hit.promise;
    }
    const promise = safeFetchJson(url);
    _getCache.set(url, { time: now, promise });
    setTimeout(() => {
        if (_getCache.get(url)?.promise === promise) _getCache.delete(url);
    }, GET_TTL_MS);
    return promise;
}

// ======================================================
// MEDIA STORAGE
// ======================================================

export async function fetchMedia() {
    try {
        return await safeFetchJson(`${BASE_URL}/api/media`);
    } catch (err) {
        console.error("fetchMedia error:", err);
        return [];
    }
}

export async function uploadMedia(name, fileData) {
    let base64Content = fileData;
    if (fileData.includes("base64,")) {
        base64Content = fileData.split("base64,")[1];
    }
    
    // Chunk size: 500KB of base64 string
    const chunkSize = 500 * 1024;
    const totalChunks = Math.ceil(base64Content.length / chunkSize);
    
    let lastResult = null;
    for (let i = 0; i < totalChunks; i++) {
        const chunk = base64Content.slice(i * chunkSize, (i + 1) * chunkSize);
        lastResult = await safeFetchJson(`${BASE_URL}/api/media/upload-chunk`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, chunk, index: i, total: totalChunks })
        });
        if (!lastResult || !lastResult.success) {
            throw new Error(lastResult?.message || "Upload failed during chunking");
        }
    }
    return lastResult;
}

export async function deleteMedia(filename) {
    return await safeFetchJson(`${BASE_URL}/api/media/${encodeURIComponent(filename)}`, {
        method: "DELETE"
    });
}

export async function pingEspCam(streamUrl) {
    return await safeFetchJson(`${BASE_URL}/api/esp-ping?url=${encodeURIComponent(streamUrl)}`);
}

export async function pingRaspberryPi(streamUrl) {
    return await pingEspCam(streamUrl);
}

export async function captureEspSnapshot(streamUrl, filename) {
    return await safeFetchJson(`${BASE_URL}/api/esp-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: streamUrl, filename })
    });
}

export async function captureRpiSnapshot(streamUrl, filename) {
    return await captureEspSnapshot(streamUrl, filename);
}

// ======================================================
// SENSOR
// ======================================================

export async function getSensorData(options) {
    return await cachedGet(`${BASE_URL}/api/sensors`, options);
}

// ======================================================
// ROBOT STATUS
// ======================================================

export async function getRobotStatus(options){
    return await cachedGet(`${BASE_URL}/api/status`, options).catch(() => ({ status: "READY" }));
}

// ======================================================
// TELEMETRY
// ======================================================

export async function getTelemetry(options){
    return await cachedGet(`${BASE_URL}/api/telemetry`, options);
}

// ======================================================
// GPS
// ======================================================

export async function getGPS(){
    return await safeFetchJson(`${BASE_URL}/api/gps`);
}

export async function updateGpsPosition(data){
    return await safeFetchJson(`${BASE_URL}/api/gps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

export async function searchMapsGrounding(query, latitude, longitude) {
    return await safeFetchJson(`${BASE_URL}/api/maps-grounding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, latitude, longitude })
    });
}

// ======================================================
// AI DETECTION
// ======================================================

export async function getDetections(){
    return await safeFetchJson(`${BASE_URL}/api/detections`);
}

export async function runAI(){
    return await safeFetchJson(`${BASE_URL}/api/detect`);
}

// ======================================================
// CAMERA
// ======================================================

export async function captureImage(){
    return await safeFetchJson(`${BASE_URL}/capture`, {
        method: "POST"
    });
}

// ======================================================
// HEALTH
// ======================================================

export async function getHealth(){
    return await safeFetchJson(`${BASE_URL}/api/health`);
}

// ======================================================
// ROBOT CONTROLS
// ======================================================

export async function startMission(){
    return await safeFetchJson(`${BASE_URL}/api/start`, { method: "POST" });
}

export async function pauseMission(){
    return await safeFetchJson(`${BASE_URL}/api/pause`, { method: "POST" });
}

export async function resumeMission(){
    return await safeFetchJson(`${BASE_URL}/api/resume`, { method: "POST" });
}

export async function stopMission(){
    return await safeFetchJson(`${BASE_URL}/api/stop`, { method: "POST" });
}

export async function returnHome(){
    return await safeFetchJson(`${BASE_URL}/api/home`, { method: "POST" });
}

// ======================================================
// WAYPOINTS
// ======================================================

export async function saveWaypoints(waypoints){
    return await safeFetchJson(`${BASE_URL}/api/waypoints`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ waypoints })
    });
}

export async function emergencyStopMission(){
    return await safeFetchJson(`${BASE_URL}/api/emergency-stop`, {
        method: "POST"
    });
}
