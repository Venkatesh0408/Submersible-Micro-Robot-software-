import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Helper function to convert external image URLs to base64 Data URLs
const loadImageAsDataUrl = (url) => {
    return new Promise((resolve) => {
        if (!url) return resolve(null);
        if (url.startsWith("data:")) return resolve(url);

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
            } catch (e) {
                console.warn("Canvas export failed for image:", e);
                resolve(url);
            }
        };
        img.onerror = () => {
            console.warn("Failed to load image for PDF:", url);
            resolve(null);
        };
        img.src = url;
    });
};

export const generateInspectionReport = async (item) => {
    const doc = new jsPDF();
    const imageDataUrl = item.image ? await loadImageAsDataUrl(item.image) : null;
    
    // Header Banner
    doc.setFillColor(15, 23, 42); // Deep navy blue
    doc.rect(0, 0, 210, 32, 'F');
    
    // Header Title
    doc.setTextColor(255, 42, 75); // Red theme color
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SUBMERSIBLE MICRO ROBOT", 15, 14);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("UNDERWATER MISSION COMPLETION & DEFECT REPORT", 15, 24);

    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 200);
    doc.text(`Report ID: #${item.id || Date.now()}`, 195, 14, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 22, { align: 'right' });

    let yPos = 38;

    // 1. Mission Context & Location Metadata Box
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, yPos, 182, 54, 3, 3, 'F');
    doc.setDrawColor(210, 215, 225);
    doc.roundedRect(14, yPos, 182, 54, 3, 3, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.text(`MISSION & LOCATION METADATA [LOCATION FOLDER: ${item.inspectionArea || 'Water Tank'}]`, 18, yPos + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Mission Name:", 18, yPos + 17);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.missionName || 'Autonomous Inspection Mission'}`, 48, yPos + 17);

    doc.setFont("helvetica", "bold");
    doc.text("Target Location:", 18, yPos + 24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 42, 75);
    doc.text(`${item.inspectionArea || 'Water Tank / Storage Reservoir'}`, 52, yPos + 24);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Infected Address:", 18, yPos + 31);
    doc.setFont("helvetica", "normal");
    const addressStr = item.address || "Sector 4 Subsurface Wall, Water Tank Facility, Bengaluru, Karnataka 560060";
    doc.text(doc.splitTextToSize(addressStr, 120), 50, yPos + 31);

    doc.setFont("helvetica", "bold");
    doc.text("Robot / Sensor IP:", 18, yPos + 41);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.ipAddress || '192.168.1.100:81'} (ESP32-CAM WiFi)`, 52, yPos + 41);

    doc.setFont("helvetica", "bold");
    doc.text("Mission Brief Info:", 18, yPos + 48);
    doc.setFont("helvetica", "normal");
    const briefInfo = `Autonomous Micro-Robot submerged inspection at ${item.inspectionArea || 'Target Location'}. AI anomaly scanning and telemetry active.`;
    doc.text(doc.splitTextToSize(briefInfo, 120), 52, yPos + 48);

    doc.setFont("helvetica", "bold");
    doc.text("GPS Coords:", 110, yPos + 17);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.lat || '12.908200'} N, ${item.lng || '77.518600'} E`, 135, yPos + 17);

    doc.setFont("helvetica", "bold");
    doc.text("Overall Status:", 110, yPos + 41);
    doc.setFont("helvetica", "bold");
    if (item.overallCondition === 'GOOD') {
        doc.setTextColor(34, 197, 94);
    } else {
        doc.setTextColor(220, 38, 38);
    }
    doc.text(`${item.overallCondition || 'NEEDS ATTENTION'} (${item.accuracy || 95}% Accuracy)`, 138, yPos + 41);

    yPos += 60;

    // 2. Anomaly / Infected Area Image
    if (imageDataUrl) {
        try {
            doc.setFillColor(240, 243, 248);
            doc.rect(14, yPos, 182, 52, 'F');
            doc.setDrawColor(200, 210, 225);
            doc.rect(14, yPos, 182, 52, 'S');

            // Embed captured image
            doc.addImage(imageDataUrl, 'JPEG', 18, yPos + 4, 72, 44);

            // Side info box
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("INFECTED AREA SNAPSHOT ANALYSIS", 96, yPos + 10);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.text("Detected Anomaly:", 96, yPos + 18);
            doc.setFont("helvetica", "normal");
            const primaryAnomaly = item.detections?.[0]?.type || item.defectType || "Structural Crack & Water Leakage";
            doc.text(primaryAnomaly, 130, yPos + 18);

            doc.setFont("helvetica", "bold");
            doc.text("Severity Rating:", 96, yPos + 25);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(220, 38, 38);
            doc.text(item.detections?.[0]?.severity || item.severity || "HIGH / CRITICAL", 125, yPos + 25);

            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text("Capture Time:", 96, yPos + 32);
            doc.setFont("helvetica", "normal");
            doc.text(new Date(item.timestamp || Date.now()).toLocaleTimeString(), 122, yPos + 32);

            yPos += 58;
        } catch (e) {
            console.error("Image rendering in PDF failed:", e);
            yPos += 5;
        }
    }

    // 3. Detailed Explanation of Error / Defect
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14, yPos, 182, 38, 2, 2, 'F');
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(14, yPos, 182, 38, 2, 2, 'S');

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("DETAILED EXPLANATION OF ERROR / ANOMALY", 18, yPos + 7);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const errorExplanation = item.errorDetail || 
        item.detections?.[0]?.errorDetail ||
        `High-pressure underwater fracture & concrete joint degradation detected along ${item.inspectionArea || 'Water Structure'}. AI computer vision identified severe 3.2mm aperture fissure with continuous seepage and internal rebar oxidation risk caused by hydrostatic pressure stress.`;
    
    const splitError = doc.splitTextToSize(errorExplanation, 174);
    doc.text(splitError, 18, yPos + 15);

    yPos += 42;

    // 4. Detailed Solution & Action Plan
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, yPos, 182, 42, 2, 2, 'F');
    doc.setDrawColor(134, 239, 172);
    doc.roundedRect(14, yPos, 182, 42, 2, 2, 'S');

    doc.setTextColor(21, 128, 61);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("RECOMMENDED ENGINEERING SOLUTION & ACTION PLAN", 18, yPos + 7);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const solutionDetail = item.solutionDetail || 
        item.detections?.[0]?.solutionEnglish ||
        `1. Depressurize local sector and isolate intake valve.\n2. Inject hydrophobic polyurethane expansion resin seal under 15 bar pressure.\n3. Apply anti-corrosive epoxy carbon fiber patch across fracture line.\n4. Perform secondary submersible ultrasonic echo re-scan within 24 hours.`;
    
    const splitSolution = doc.splitTextToSize(solutionDetail, 174);
    doc.text(splitSolution, 18, yPos + 15);

    yPos += 48;

    // Detections Table if multiple exist
    if (item.detections && item.detections.length > 0) {
        const tableColumn = ["Defect Type", "Severity", "Confidence", "Action Plan / Solution"];
        const tableRows = [];
        item.detections.forEach(det => {
            tableRows.push([
                det.type,
                det.severity,
                det.confidence ? `${det.confidence}%` : 'N/A',
                det.solutionEnglish || "Standard maintenance required"
            ]);
        });
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 8 }
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 150, 160);
        doc.text(`Submersible Micro Robot AI Mission Control System • Certified Inspection Report`, 105, 287, { align: 'center' });
    }

    // Sanitize values for file naming
    const locationCategory = (item.inspectionArea || item.environmentType || "Location")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_");
    const missionInfo = (item.missionName || "Mission")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_");
    const defectInfo = (item.defectType || item.detections?.[0]?.type || "Inspection")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_");
    const dateFormatted = new Date(item.timestamp || Date.now()).toISOString().split("T")[0];

    const fileName = `${locationCategory}_Report_${missionInfo}_${defectInfo}_${dateFormatted}.pdf`;

    doc.save(fileName);
};
