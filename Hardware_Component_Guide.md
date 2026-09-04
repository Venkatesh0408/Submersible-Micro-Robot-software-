# Submersible Micro Robot - Hardware Component Guide

This document outlines the complete hardware architecture for the Raspberry Pi-based Submersible Micro Robot. It details the purpose, working principles, and integration of each physical component.

## 1. Central Processing & Vision (The Core)

**Raspberry Pi (Model 4B or 5)**
*   **What it is:** A powerful single-board computer running a Linux OS (Raspberry Pi OS).
*   **How it works:** It serves as the "brain" of the entire submarine. It runs the Node.js server, hosts the web dashboard, processes video streams, runs AI detection models (via Gemini API/local models), and orchestrates all hardware components.
*   **Integration:** Connects to the local network (via Wi-Fi tethering or an ethernet tether cable) to allow operators to access the control dashboard.

**High-Speed MicroSD Card (32GB+ Class 10 / A2)**
*   **What it is:** The primary storage drive for the Raspberry Pi.
*   **How it works:** Stores the operating system, the Node.js software stack, and local database files (history, telemetry logs).

**Camera Module (Raspberry Pi Camera V2/V3 or USB Webcam)**
*   **What it is:** A high-definition camera mounted inside the watertight enclosure looking out through a clear dome or flat port.
*   **How it works:** Captures continuous video of the underwater environment. The Raspberry Pi compresses this into an MJPEG stream and serves it to the web dashboard. Snapshots are taken from this feed and sent to the AI for defect detection (cracks, algae, corrosion).

---

## 2. Hardware Interfacing 

*Note: Because the Raspberry Pi is a microcomputer, it lacks native Analog-to-Digital capabilities. We must use intermediary boards to read analog sensors.*

**Analog-to-Digital Converter (ADC - e.g., ADS1115 or MCP3008)**
*   **What it is:** A microchip that converts analog voltage signals into digital numbers.
*   **How it works:** Sensors like pH and Turbidity output an analog voltage based on water conditions. The ADC reads this voltage, converts it to a digital value, and sends it to the Raspberry Pi via the I2C or SPI communication protocol.

**PWM Servo/Motor Driver (e.g., PCA9685) *[Recommended]***
*   **What it is:** An I2C-controlled PWM (Pulse Width Modulation) generator.
*   **How it works:** Offloads the precise timing signals needed to drive the thrusters from the Raspberry Pi's CPU. The Pi tells the PCA9685 what speed is needed, and the driver generates a flawless, jitter-free signal to the Electronic Speed Controllers (ESCs).

---

## 3. Sensor Suite (Navigation & Water Quality)

**Waterproof Temperature Sensor (DS18B20)**
*   **What it is:** A digital, sealed temperature probe.
*   **How it works:** Uses the "1-Wire" protocol to send digital temperature readings directly to the Raspberry Pi's GPIO pins. Used to monitor water temperature and detect thermal anomalies in pipes or tanks.

**Analog pH Sensor Kit**
*   **What it is:** A probe that measures the acidity or alkalinity of the water.
*   **How it works:** Generates a small voltage corresponding to the pH level of the water. This voltage is read by the ADC module and converted into a pH value (0-14) displayed on the dashboard.

**Analog Turbidity Sensor**
*   **What it is:** An optical sensor that measures water clarity.
*   **How it works:** Shoots a beam of light across a small gap. If the water is muddy or particulate-heavy, less light reaches the receiver, changing the output voltage. Read via the ADC module.

**Waterproof Ultrasonic Sensor (JSN-SR04T)**
*   **What it is:** A sealed sonar sensor used for distance measurement and obstacle avoidance.
*   **How it works:** Emits a high-frequency sound wave and listens for the echo. The Raspberry Pi measures the time it takes for the echo to return to calculate the distance to walls or obstacles. *(Note: Must ensure voltage compatibility, as Pi GPIO is 3.3V and the sensor may be 5V).*

**GPS Module (Ublox NEO-6M)**
*   **What it is:** A satellite navigation receiver.
*   **How it works:** Connects to the Pi via UART (TX/RX). Because GPS signals do not penetrate water well, this is primarily used when the robot surfaces to record its location or establish a starting waypoint.

---

## 4. Propulsion & Locomotion

**Brushless Underwater Thrusters (e.g., Blue Robotics or similar)**
*   **What it is:** Specially sealed brushless motors with propellers designed to operate while fully submerged.
*   **How it works:** Depending on the setup (usually 3 to 6 thrusters), they provide vector thrust, allowing the robot to move forward/backward, strafe, and control depth (heave) and pitch.

**Electronic Speed Controllers (ESCs)**
*   **What it is:** High-current motor controllers.
*   **How it works:** They sit between the battery and the thrusters. They receive a low-voltage PWM control signal from the Raspberry Pi (or PCA9685) and deliver the appropriate high-current power from the battery to spin the thrusters at the requested speed.

---

## 5. Power Management

**LiPo Battery Pack (3S 11.1V or 4S 14.8V)**
*   **What it is:** A high-capacity Lithium Polymer battery.
*   **How it works:** Provides the raw, high-current power required to drive the underwater thrusters. 

**High-Current UBEC / DC-DC Buck Converter (5V, 3A - 5A min)**
*   **What it is:** A voltage step-down regulator.
*   **How it works:** The battery provides 11.1V or 14.8V, which would instantly destroy the Raspberry Pi (which requires exactly 5V). The UBEC safely steps this high voltage down to a stable 5V. It must be rated for at least 3 to 5 Amps, as the Pi 4/5, camera, and sensors draw significant power.

---

## 6. Chassis & Waterproofing

**Watertight Enclosure (WTE)**
*   **What it is:** The main hull of the submarine, usually a clear acrylic or PVC cylinder with aluminum/plastic end-caps.
*   **How it works:** Houses the Raspberry Pi, ADC, motor controllers, and battery, keeping them completely dry. The camera looks out through the clear acrylic.

**Cable Penetrators & Glands**
*   **What it is:** Specially designed waterproof nuts/bolts with rubber seals or potting epoxy.
*   **How it works:** Allows wires (for the thrusters, temp sensor, sonar, etc.) to pass from the inside of the dry hull to the outside water without allowing any leaks.

**Buoyancy Foam**
*   **What it is:** High-density foam that doesn't compress under water pressure.
*   **How it works:** Attached to the top of the robot to counteract the weight of the electronics and battery. The goal is "neutral buoyancy"—so the robot neither sinks like a stone nor floats uncontrollably to the surface, making it easy for the thrusters to maintain depth.