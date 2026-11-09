# 🤖 KT-IDE (Robotics Code Editor & 3D Simulation Platform)

[![Version](https://img.shields.io/badge/version-v0.1.0-blue.svg)](https://github.com/KATEAW/KT-IDE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.187.0-black.svg?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.19-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

An advanced, offline-first developer IDE and 3D simulation platform tailored for Autonomous Robotics Competitions (PT-Version and OBEC / สพฐ. Junior & Senior High School levels).

---

## 📑 Table of Contents / สารบัญ
* [🇬🇧 English Documentation](#-english-documentation)
  * [Overview](#overview)
  * [Key Features](#key-features)
  * [Technologies Used](#technologies-used)
  * [Competition Modes & Rules](#competition-modes--rules)
  * [System Requirements](#system-requirements)
  * [Getting Started & Installation](#getting-started--installation)
  * [Project Structure](#project-structure)
  * [Keyboard Shortcuts](#keyboard-shortcuts)
* [🇹🇭 เอกสารภาษาไทย](#-เอกสารภาษาไทย)
  * [ภาพรวมโครงการ](#ภาพรวมโครงการ)
  * [จุดเด่นและฟังก์ชันการทำงาน](#จุดเด่นและฟังก์ชันการทำงาน)
  * [เทคโนโลยีและสถาปัตยกรรมที่ใช้](#เทคโนโลยีและสถาปัตยกรรมที่ใช้)
  * [โหมดการแข่งขันและกติกา](#โหมดการแข่งขันและกติกา)
  * [ความต้องการของระบบ](#ความต้องการของระบบ)
  * [วิธีติดตั้งและเริ่มใช้งาน](#วิธีติดตั้งและเริ่มใช้งาน)
  * [คีย์ลัดการใช้งาน](#คีย์ลัดการใช้งาน)
* [Author & Credits](#author--credits)

---

# 🇬🇧 English Documentation

## Overview
**KT-IDE** is an all-in-one desktop environment designed for competitive autonomous robotics teams. It bridges the gap between C/C++ firmware development and physical field deployment by offering a code editor with real-time compilation tools alongside a 4x8 modular arena simulator with procedural field generation.

## Key Features
* **Code Editor (Monaco Editor)**:
  * Full C/C++ and Arduino syntax highlighting with dark enterprise theme.
  * Autocomplete, IntelliSense, auto-indentation, and error diagnostics.
  * Quick Build command palette (`Ctrl+K` / `Cmd+K`) for rapid compilation and flashing.
* **3D Physics & Kinematics Field Simulator**:
  * 120 x 240 cm competition arena built from 32 modular 30x30 cm vinyl tiles.
  * Real-time robot wheel animation, ground clearance tracking, and dynamic pitch.
  * 3D Obstacles: 30x30 cm Seesaw with dynamic weight tilting, 50 mm Bridge with climb/descent ramps, Speed Bumps, Tunnels, and Black Pits.
* **Procedural Random Arena Generator**:
  * Deterministic **Seed-based** generation (`Mulberry32` PRNG) allowing teams to replay or share exact field layouts.
  * Guaranteed 100% passable layouts with mathematically verified corridor connectivity and zero dead ends.
  * Drop zones with clear through-lanes and decoy hazard placements outside the main travel path.
* **100% Offline HTML & PDF Export**:
  * Standalone offline HTML export containing embedded SVG maps.
  * Print-ready A4 Portrait PDF export with automatic page breaks for the Tile Inventory and Grid Matrix coordinates.
* **Serial Hardware Integration**:
  * Unified Board & COM Port connection management modal.
  * Built-in real-time Serial Monitor with auto-scroll and baud rate selection.

## Technologies Used
| Component | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 | Core component-based UI rendering |
| **Language** | TypeScript 5.9.3 | Strict end-to-end type safety |
| **Code Editor Engine** | Monaco Editor (`@monaco-editor/react`) | Industrial-grade code editing experience |
| **3D Graphics Engine** | Three.js (`three` 0.187.0) | WebGL rendering, orbit controls, custom mesh geometry |
| **Styling & Design** | Tailwind CSS 3.4.19 & PostCSS | Minimalist developer productivity theme |
| **State Management** | Zustand 5.1.0 | Fast, unopinionated reactive state stores |
| **Iconography** | Lucide React | Clean, lightweight developer icons |
| **Desktop Wrapper** | Tauri 2.x & C# Native Launcher | Ultra-lightweight native Windows desktop distribution |
| **PRNG Engine** | Mulberry32 Algorithm | High-entropy 32-bit seeded pseudo-random number generator |
| **Bundler & Build Tool**| Vite 6.4.6 & Rollup Wasm | Instant HMR development server and optimized production bundler |

## Competition Modes & Rules
1. **หุ่นยนต์ขนส่งถุงยังชีพ (PT-Version)**:
   * Autonomous navigation from `START` to `FINISH`.
   * Complete 2 Checkpoints (yellow markers).
   * Deliver 4 colored relief payloads (Red, Green, Blue, Yellow).
   * Overcome full championship obstacles: 30x30 cm Seesaw, 50 mm Bridge, Speed Bumps, and Tunnel.
2. **หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนต้น - OBEC Junior High)**:
   * Closed circuit loop returning to `START`.
   * 2 Yellow Checkpoint markers + 4 Green payload drop zones.
   * Obstacles: 1 Black Pit (depth limit < 50%) + 1 Speed Bumps tile (7 strips).
3. **หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนปลาย - OBEC Senior High)**:
   * Closed circuit loop returning to `START`.
   * 2 Yellow Checkpoint markers + 4 Green payload drop zones.
   * Full obstacle package: 1 Black Pit + 1 Speed Bumps tile + 1 Incline Bridge (3 tiles, 50 mm elevation).

## System Requirements
* **Operating System**: Windows 10 (Build 1809+) / Windows 11 (64-bit)
* **Web View Engine**: Microsoft Edge WebView2 Runtime
* **Node.js**: v18.0.0 or higher (for developers building from source)
* **Hardware**:
  * CPU: Dual-core 2.0 GHz or faster
  * Memory: 2 GB RAM (4 GB recommended for 3D simulator)
  * Storage: 100 MB available space

## Getting Started & Installation

### Option 1: Running the Standalone Release (End Users)
1. Download `KT-IDE-v0.1.0-windows-x64.zip` from the `release/` directory.
2. Extract the archive to any folder.
3. Double-click `KT-IDE.exe` to launch the application.

### Option 2: Running from Source (Developers)
```bash
# Clone the repository
git clone https://github.com/KATEAW/KT-IDE.git
cd KT-IDE

# Install dependencies
npm install

# Run the development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build
```

## Project Structure
```text
KT-IDE/
├── dist/                          # Production web bundle
├── release/                       # Standalone Windows executable package (.zip / .exe)
├── src/
│   ├── components/
│   │   ├── editor/                # Monaco code editor integration
│   │   ├── modals/                # Random arena generator, Board/Port modal, Settings
│   │   ├── palette/               # Quick build command palette
│   │   ├── serial/                # Real-time Serial Monitor component
│   │   ├── simulator/             # 2D Canvas simulator & tile palette
│   │   └── simulator3d/           # Three.js 3D arena simulator
│   ├── sim-engine/                # Kinematics & physics calculations
│   ├── store/                     # Zustand state management stores
│   ├── types/                     # TypeScript definitions for simulator, tiles & IDE
│   └── utils/                     # Procedural arena generator & offline export engines
├── package.json                   # Dependencies and npm scripts
├── tailwind.config.js             # Tailwind design tokens
└── tsconfig.json                  # TypeScript compiler configuration
```

## Keyboard Shortcuts
* `Ctrl + K` / `Cmd + K`: Open Quick Build / Command Palette
* `F5`: Run Code Simulator
* `Ctrl + S` / `Cmd + S`: Save Current Code File
* `Esc`: Close Active Modal / Return to Code Editor

---

# 🇹🇭 เอกสารภาษาไทย

## ภาพรวมโครงการ
**KT-IDE** คือโปรแกรมแก้ไขโค้ดและแพลตฟอร์มจำลองสนามหุ่นยนต์ 3 มิติสำหรับการแข่งขันหุ่นยนต์อัตโนมัติระดับมัธยมศึกษา (กติกา PT-Version และ สพฐ. ม.ต้น / ม.ปลาย) ออกแบบตามหลัก User Experience ระดับสากล เรียบหรู ใช้งานง่าย และทำงานแบบ Offline ได้สมบูรณ์

## จุดเด่นและฟังก์ชันการทำงาน
* **โปรแกรมเขียนโค้ด (Monaco Editor)**:
  * ไฮไลต์ไวยากรณ์ภาษา C/C++ สำหรับบอร์ด Arduino, ESP32, STM32 พร้อมระบบแนะนำโค้ด (IntelliSense)
  * เมนูคำสั่งลัด Quick Build (`Ctrl+K`) รวมคำสั่งคอมไพล์ อัปโหลด และเลือกพอร์ตไว้ในที่เดียว
* **ระบบจำลองสนาม 3D เสมือนจริง (Three.js)**:
  * สนามขนาดมาตรฐาน 120 x 240 ซม. (แบ่งเป็น 32 ช่อง ช่องละ 30x30 ซม.)
  * คำนวณมุมเอียงของหุ่นยนต์ การหมุนของล้อ และความชันของสะพานแบบเรียลไทม์
  * โมเดลอุปสรรค 3 มิติสมบูรณ์: ไม้กระดกขนาด 30x30 ซม. สูง 40 มม. ขอบข้าง 20 มม., สะพานลาดชัน 50 มม., ลูกระนาด 7 อัน, อุโมงค์ทึบแสง และหลุมดำ
* **ระบบสุ่มสนามอัตโนมัติ (Procedural Arena Generator)**:
  * ขับเคลื่อนด้วยอัลกอริทึม **Seed** สามารถแชร์เลข Seed หรือกด Reroll เพื่อสุ่มผังสนามใหม่ได้ทันที
  * เส้นทางเชื่อมต่อสมบูรณ์ $100\%$ ไม่มีทางตัน มุมเลี้ยวและจุดปล่อยถุงเปิดโล่งตามทิศทางการเดินทาง
  * วางหลุมดำและระเบิดในตำแหน่ง Decoy นอกแนววิ่งหลัก เพื่อฝึกเซนเซอร์ตรวจจับโดยไม่ขวางทางเดิน
* **ส่งออกไฟล์ HTML และ PDF แบบ 100% Offline**:
  * ส่งออกไฟล์ HTML หน้าเดียวพร้อมกราฟิก SVG แบบเวกเตอร์ เปิดดูได้โดยไม่ต้องต่อเน็ต
  * พิมพ์เป็น PDF กระดาษ A4 แนวตั้ง จัดแบ่งหน้าอัตโนมัติสำหรับรายการแผ่นกระเบื้อง (Tile Inventory) และตารางพิกัดตำแหน่ง (Grid Coordinates)
* **Serial Monitor & การจัดการฮาร์ดแวร์**:
  * ปุ่มสถานะบอร์ดบน Navbar รวมการเลือกบอร์ดและพอร์ตเชื่อมต่อไว้ในหน้าต่างเดียว
  * แท็บ Serial Monitor ด้านล่างสำหรับตรวจสอบข้อมูลสื่อสารแบบเรียลไทม์

## เทคโนโลยีและสถาปัตยกรรมที่ใช้
| ส่วนประกอบ | เทคโนโลยีที่ใช้ | วัตถุประสงค์และการทำงาน |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3.1 | จัดการการแสดงผล UI แบบ Component-Based |
| **ภาษาหลัก** | TypeScript 5.9.3 | ควบคุมความถูกต้องของ Type ป้องกันข้อผิดพลาด |
| **Code Editor** | Monaco Editor | เอนจินเดียวกับ VS Code รองรับ IntelliSense |
| **3D Simulator** | Three.js 0.187.0 | เรนเดอร์สนาม 3 มิติ แสงเงา มุมกล้อง และฟิสิกส์ |
| **การตกแต่งสไตล์** | Tailwind CSS 3.4.19 | ดีไซน์ UI แบบ Dark Mode ที่มินิมอลและเป็นระเบียบ |
| **ระบบจัดการ State** | Zustand 5.1.0 | จัดการสถานะจำลองและโค้ดโปรแกรมที่มีประสิทธิภาพสูง |
| **ไอคอน** | Lucide React | ชุดไอคอนมาตรฐานสำหรับ Developer Tools |
| **Desktop Launcher** | C# (.NET WinExe) & Tauri | แอปพลิเคชันจำลองบนระบบปฏิบัติการ Windows |
| **ระบบสุ่มผังสนาม** | Mulberry32 PRNG | อัลกอริทึมการสุ่มสนามที่มีค่าคงที่ตาม Seed |

## โหมดการแข่งขันและกติกา
1. **หุ่นยนต์ขนส่งถุงยังชีพ (PT-Version)**:
   * ออกตัวจากจุด `START` ไปยังจุด `FINISH` ทำงานอัตโนมัติ 100%
   * ผ่าน Checkpoint สติกเกอร์สีเหลือง 2 จุด
   * ปล่อยถุงยังชีพ 4 สี (แดง, เขียว, น้ำเงิน, เหลือง) ลงในเป้าหมาย
   * ข้ามอุปสรรค: ไม้กระดก 30x30 ซม., สะพานชัน 50 มม., ลูกระนาด และอุโมงค์
2. **หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนต้น)**:
   * วิ่งเป็นวงรอบและกลับมาหยุดนิ่ง ณ ช่อง `START` เดิม
   * ผ่าน Checkpoint สีเหลือง 2 จุด + ปล่อยถุงยังชีพพื้นที่สีเขียว 4 จุด
   * อุปสรรค: หลุมดำ 1 แผ่น (ห้ามลึกเกิน 50%) + ลูกระนาด 1 แผ่น (7 แถบ)
3. **หุ่นยนต์ขนส่งถุงยังชีพ (สพฐ. มัธยมศึกษาตอนปลาย)**:
   * วิ่งเป็นวงรอบและกลับมาหยุดนิ่ง ณ ช่อง `START` เดิม
   * ผ่าน Checkpoint สีเหลือง 2 จุด + ปล่อยถุงยังชีพพื้นที่สีเขียว 4 จุด
   * อุปสรรคครบ 3 ชนิด: หลุมดำ 1 แผ่น + ลูกระนาด 1 แผ่น + สะพานลาดชัน 5 ซม. (3 แผ่นต่อเนื่อง)

## ความต้องการของระบบ
* **ระบบปฏิบัติการ**: Windows 10 (Build 1809 ขึ้นไป) หรือ Windows 11 (64-bit)
* **สภาพแวดล้อมรันไทม์**: Microsoft Edge WebView2 Runtime (มีมาพร้อมกับ Windows 10/11)
* **หน่วยความจำ**: RAM 2 GB ขึ้นไป (แนะนำ 4 GB สำหรับการจำลอง 3 มิติ)
* **พื้นที่ว่างในฮาร์ดดิสก์**: อย่างน้อย 100 MB

## วิธีติดตั้งและเริ่มใช้งาน
1. ดาวน์โหลดไฟล์ `KT-IDE-v0.1.0-windows-x64.zip` จากโฟลเดอร์ `release/`
2. แตกไฟล์ ZIP ไปยังตำแหน่งที่ต้องการ
3. ดับเบิ้ลคลิกไฟล์ `KT-IDE.exe` หรือ `start-app.cmd` เพื่อเปิดใช้งานโปรแกรมทันที

## คีย์ลัดการใช้งาน
* `Ctrl + K`: เปิด Quick Build และเลือกคำสั่งหลัก
* `F5`: เริ่มต้นการจำลองหุ่นยนต์ในสนาม (Simulation)
* `Ctrl + S`: บันทึกโค้ดปัจจุบัน
* `Esc`: ปิดหน้าต่าง Popup / กลับสู่พื้นที่เขียนโค้ด

---

## Author & Credits
* **Product Name**: KT-IDE
* **Version**: v0.1.0
* **Developer**: KATEAW (`©KT-IDE | Develop By KATEAW`)
* **License**: MIT License
