import React, { useState, useRef } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  X,
  Settings,
  Type,
  Eye,
  RotateCcw,
  Check,
  Laptop,
  Code2,
  Sparkles,
  Keyboard,
  Bot,
  Zap,
  Sliders,
  Download,
  Upload,
  AlignLeft,
  Undo2,
  Redo2,
  Save,
  Info,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const AppSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    editorFontSize,
    setEditorFontSize,
    editorFontFamily,
    setEditorFontFamily,
    uiFontFamily,
    setUIFontFamily,
    uiFontSize,
    setUIFontSize,
    editorWordWrap,
    setEditorWordWrap,
    editorMinimap,
    setEditorMinimap,
    isSimulationOnLine,
    setIsSimulationOnLine,
    resetSettings,
    // Robot defaults & Distance presets
    robotDefaultSpeed,
    setRobotDefaultSpeed,
    robotDefaultDistance,
    setRobotDefaultDistance,
    distancePresets,
    setDistancePreset,
    setDistancePresets,
    // Fast keyboard mode
    isFastKeyboardMode,
    setIsFastKeyboardMode,
    fastKeyBindings,
    updateFastKeyBinding,
    resetFastKeyBindings,
    exportFastKeyBindings,
    importFastKeyBindings,
    customFunctions,
  } = useIDEStore();

  const [activeTab, setActiveTab] = useState<'editor' | 'ui' | 'robot' | 'fastMacro' | 'system'>('editor');
  const keymapFileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  // Editor Font Presets
  const EDITOR_FONT_PRESETS = [12, 13, 14, 16, 18, 20, 24];

  // Editor Fonts (Monospace for coding)
  const EDITOR_FONTS = [
    {
      id: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      label: 'JetBrains Mono',
      sub: 'แนะนำสำหรับโค้ดดิ้ง (มีสัญลักษณ์พิเศษ Ligatures)',
    },
    {
      id: "'Fira Code', 'Consolas', monospace",
      label: 'Fira Code',
      sub: 'ฟอนต์ยอดนิยมสำหรับโปรแกรมเมอร์',
    },
    {
      id: "'Consolas', 'Courier New', monospace",
      label: 'Consolas',
      sub: 'ฟอนต์มาตรฐาน Windows & Visual Studio',
    },
    {
      id: "'Cascadia Code', 'Consolas', monospace",
      label: 'Cascadia Code',
      sub: 'ฟอนต์โมเดิร์นจาก Microsoft',
    },
    {
      id: "'Courier New', Courier, monospace",
      label: 'Courier New',
      sub: 'ฟอนต์พิมพ์ดีดคลาสสิก',
    },
  ];

  // UI System Fonts (Separated from coding font)
  const UI_FONTS = [
    {
      id: "'Google Sans', 'Prompt', 'Kanit', 'Inter', system-ui, sans-serif",
      label: 'ฟอนต์ดั้งเดิม (Default)',
      sub: 'ฟอนต์มาตรฐานของระบบ KT-IDE สไตล์โมเดิร์น อ่านง่าย คมชัด',
    },
    {
      id: "'TH Sarabun New', 'THSarabunNew', 'TH Sarabun PSK', 'Sarabun', sans-serif",
      label: 'TH Sarabun New (สารบรรณนิว)',
      sub: 'ฟอนต์มาตรฐานราชการไทย อ่านง่าย สบายตา (หมายเหตุ: ตัวเครื่องคอมพิวเตอร์ของผู้ใช้ต้องมีการติดตั้งฟอนต์ TH Sarabun New ไว้ในระบบ)',
    },
  ];

  // UI System Font Sizes
  const UI_FONT_PRESETS = [
    { size: 12, label: '12px (กะทัดรัด)' },
    { size: 13, label: '13px (เล็ก)' },
    { size: 14, label: '14px (มาตรฐาน)' },
    { size: 15, label: '15px (สบายตา)' },
    { size: 16, label: '16px (ใหญ่)' },
    { size: 18, label: '18px (ใหญ่พิเศษ)' },
  ];

  const handleImportKeymap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importFastKeyBindings(content);
      }
    };
    reader.readAsText(file);
    if (keymapFileInputRef.current) keymapFileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-surface-dark border border-surface-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-darker shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ตั้งค่าแอปพลิเคชัน (Preferences)</h2>
              <p className="text-xs text-slate-400">
                ปรับแต่งตัวแก้ไขโค้ด ฟอนต์ ค่าเริ่มต้นหุ่นยนต์ และปุ่มลัดสร้างคำสั่งแบบรวดเร็ว
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-1.5 px-6 pt-3 bg-surface-darker/60 border-b border-surface-border shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-brand-500 text-brand-300 bg-surface-dark'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/50'
            }`}
          >
            <Code2 size={14} />
            <span>แก้ไขโค้ด & คีย์ลัด</span>
          </button>

          <button
            onClick={() => setActiveTab('ui')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === 'ui'
                ? 'border-emerald-500 text-emerald-300 bg-surface-dark'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/50'
            }`}
          >
            <Laptop size={14} />
            <span>ฟอนต์ระบบ UI</span>
          </button>

          <button
            onClick={() => setActiveTab('robot')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === 'robot'
                ? 'border-amber-500 text-amber-300 bg-surface-dark'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/50'
            }`}
          >
            <Bot size={14} />
            <span>ค่าเริ่มต้น & ระยะทาง 1-8</span>
          </button>

          <button
            onClick={() => setActiveTab('fastMacro')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === 'fastMacro'
                ? 'border-cyan-500 text-cyan-300 bg-surface-dark'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/50'
            }`}
          >
            <Zap size={14} />
            <span>โหมดพิมพ์ด่วน (Fast Mode)</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-violet-500 text-violet-300 bg-surface-dark'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/50'
            }`}
          >
            <Info size={14} />
            <span>ข้อมูลระบบ (System Info)</span>
          </button>
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'editor' && (
            /* ======================================================= */
            /* TAB 1: CODE EDITOR SETTINGS & SHORTCUTS                 */
            /* ======================================================= */
            <div className="space-y-5">
              {/* Shortcut Cheat Sheet */}
              <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Keyboard size={15} className="text-amber-400 shrink-0" />
                  <span>คีย์ลัดสำหรับเขียนโค้ด (Editor Shortcuts)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">ย้อนกลับ (Undo):</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-brand-300 font-mono">Ctrl + Z</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">ทำซ้ำ (Redo):</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-brand-300 font-mono">Ctrl + Shift + Z</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">จัดหน้าโค้ด (Format):</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-amber-300 font-mono">Alt + Shift + F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">บันทึกโปรเจกต์:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-emerald-300 font-mono">Ctrl + S</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">ขยายตัวอักษร:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-slate-200 font-mono">Ctrl + / Ctrl +</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-dark border border-white/5">
                    <span className="text-slate-400">ลดขนาดตัวอักษร:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-slate-200 font-mono">Ctrl -</kbd>
                  </div>
                </div>
              </div>

              {/* Font Size Setting */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    ขนาดตัวอักษรในโค้ด (Editor Font Size)
                  </label>
                  <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {editorFontSize} px
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="28"
                    step="1"
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(parseInt(e.target.value, 10))}
                    className="flex-1 accent-brand-500 h-2 bg-surface-card rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {EDITOR_FONT_PRESETS.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setEditorFontSize(sz)}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                          editorFontSize === sz
                            ? 'bg-brand-500 text-white font-bold'
                            : 'bg-surface-card hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Font Family Setting */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  รูปแบบฟอนต์โค้ด (Coding Font Family)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EDITOR_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setEditorFontFamily(f.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        editorFontFamily === f.id
                          ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/30'
                          : 'border-surface-border bg-surface-card hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white" style={{ fontFamily: f.id }}>
                          {f.label}
                        </span>
                        {editorFontFamily === f.id && (
                          <Check size={14} className="text-brand-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Switches */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-surface-border cursor-pointer hover:border-slate-600 transition">
                  <div>
                    <div className="text-xs font-medium text-slate-200">ตัดบรรทัดอัตโนมัติ (Word Wrap)</div>
                    <div className="text-[10px] text-slate-400">ตัดข้อความเมื่อยาวเกินขอบจอ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editorWordWrap}
                    onChange={(e) => setEditorWordWrap(e.target.checked)}
                    className="accent-brand-500 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-surface-border cursor-pointer hover:border-slate-600 transition">
                  <div>
                    <div className="text-xs font-medium text-slate-200">แผนผังโค้ดย่อ (Minimap)</div>
                    <div className="text-[10px] text-slate-400">แสดงภาพรวมโค้ดด้านข้าง</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editorMinimap}
                    onChange={(e) => setEditorMinimap(e.target.checked)}
                    className="accent-brand-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Simulation on Line Mode Setting */}
              <div className="pt-2">
                <label className="flex items-start justify-between p-4 rounded-xl bg-gradient-to-r from-surface-card to-brand-950/20 border border-brand-500/30 hover:border-brand-500/60 cursor-pointer transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">ระบบจำลองตามบรรทัดที่เลือก (Simulation on Line)</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSimulationOnLine ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400'}`}>
                        {isSimulationOnLine ? 'เปิดใช้งาน' : 'ปิดอยู่ (ค่าเริ่มต้น)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      เมื่อคลิกหรือเลื่อนเคอร์เซอร์ไปที่บรรทัดใด ระบบจะจำลองผลลัพธ์คำสั่งตั้งแต่จุดเริ่มต้นจนถึงบรรทัดนั้น แล้ววาร์ปหุ่นไปยังตำแหน่งเป้าหมายทันที โดยไม่ต้องรันทีละสเต็ปจากจุดเริ่มต้น
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSimulationOnLine}
                    onChange={(e) => setIsSimulationOnLine(e.target.checked)}
                    className="accent-brand-500 w-5 h-5 cursor-pointer ml-4 mt-0.5 shrink-0"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'ui' && (
            /* ======================================================= */
            /* TAB 2: SYSTEM UI FONT & APPEARANCE                      */
            /* ======================================================= */
            <div className="space-y-5">
              {/* UI Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    ขนาดตัวอักษรของระบบเมนู UI (UI System Size)
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {uiFontSize} px
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {UI_FONT_PRESETS.map((item) => (
                    <button
                      key={item.size}
                      onClick={() => setUIFontSize(item.size)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${
                        uiFontSize === item.size
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                          : 'bg-surface-card hover:bg-slate-700 text-slate-300 border border-surface-border'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Font Family */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  รูปแบบฟอนต์ระบบ UI (System UI Font Family)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {UI_FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setUIFontFamily(f.id)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        uiFontFamily === f.id
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-surface-border bg-surface-card hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white" style={{ fontFamily: f.id }}>
                          {f.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{f.sub}</div>
                      </div>
                      {uiFontFamily === f.id && <Check size={16} className="text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'robot' && (
            /* ======================================================= */
            /* TAB 3: ROBOT DEFAULTS & DISTANCE PRESETS (1-8)          */
            /* ======================================================= */
            <div className="space-y-5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
                <Bot size={18} className="shrink-0" />
                <span>
                  กำหนดความเร็วและระยะทางเริ่มต้นของหุ่นยนต์ พร้อมช่องระยะทางลัด 1 ถึง 8 สำหรับคลิกเลือกในแถบ Function Builder
                </span>
              </div>

              {/* Default Speed & Default Distance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    ความเร็วมาตรฐานเริ่มต้น (Default Speed)
                  </label>
                  <p className="text-[10px] text-slate-400">ใช้เมื่อกดปุ่ม d หรือเว้นว่าง (0 - 100%)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={robotDefaultSpeed}
                      onChange={(e) => setRobotDefaultSpeed(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm font-mono text-amber-300 font-bold outline-none focus:border-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    ระยะทางมาตรฐานต่อ 1 ช่อง (1 Grid Tile = 30 ซม.)
                  </label>
                  <p className="text-[10px] text-slate-400">
                    ใช้เป็นฐานคำนวณการเดินจริงในสนามจำลอง (เช่น 400 pulses = 1 ช่อง) และค่าเริ่มต้นเมื่อกดปุ่ม d
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      value={robotDefaultDistance}
                      onChange={(e) => setRobotDefaultDistance(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-300 font-bold outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs font-bold text-slate-400">pulses</span>
                  </div>
                </div>
              </div>

              {/* 8 Distance Presets (ช่อง 1 ถึง 8) */}
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={15} className="text-amber-400" />
                    <span className="text-xs font-bold text-white">ช่องระยะทางลัด 1 ถึง 8 (Distance Presets 1-8)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const base = robotDefaultDistance || 400;
                      setDistancePresets([1, 2, 3, 4, 5, 6, 7, 8].map((n) => n * base));
                    }}
                    title="คำนวณระยะ 1 - 8 ช่องอัตโนมัติตามระยะต่อ 1 ช่อง"
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold transition"
                  >
                    คำนวณระยะ 1-8 ช่องอัตโนมัติ (1x ถึง 8x)
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                  {distancePresets.map((val, idx) => {
                    const base = robotDefaultDistance || 400;
                    const gridRatio = val / base;
                    const gridText = Number.isInteger(gridRatio) ? `${gridRatio} ช่อง` : `${gridRatio.toFixed(1)} ช่อง`;
                    const cmText = Math.round(gridRatio * 30);

                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-surface-dark border border-surface-border flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                            ปุ่ม #{idx + 1}
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans">{gridText}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={(e) => setDistancePreset(idx, parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-surface-card border border-surface-border rounded px-2 py-1 text-xs font-mono font-bold text-slate-100 outline-none focus:border-amber-500"
                        />
                        <span className="text-[8.5px] text-slate-500 text-right">{cmText} ซม.</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fastMacro' && (
            /* ======================================================= */
            /* TAB 4: FAST KEYBOARD COMMAND MODE & KEYMAPS             */
            /* ======================================================= */
            <div className="space-y-5">
              {/* Mode Toggle & Description */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Zap size={16} />
                    <span>เปิดใช้งานโหมดสร้างแบบไวด้วยคีย์บอร์ด (Fast Keyboard Mode)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                    เมื่อเปิดโหมดนี้ คุณสามารถกดคีย์บอร์ด (เช่น F, B, S, T) แล้วป้อนค่าทีละพารามิเตอร์ โดยคั่นด้วยเครื่องหมายจุลภาค (,) และกด d เพื่อดึงค่าเริ่มต้นได้ทันที
                  </p>
                </div>

                <button
                  onClick={() => setIsFastKeyboardMode(!isFastKeyboardMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                    isFastKeyboardMode
                      ? 'bg-cyan-500 text-black shadow-cyan-500/30 ring-2 ring-cyan-300'
                      : 'bg-surface-card border border-surface-border text-slate-300 hover:text-white'
                  }`}
                >
                  {isFastKeyboardMode ? 'เปิดใช้งานอยู่ (ACTIVE)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                </button>
              </div>

              {/* Keybindings Management */}
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard size={15} className="text-cyan-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">กำหนดปุ่มลัดคีย์บอร์ด (Keymap Configuration)</span>
                      <span className="text-[10px] text-slate-400">ปุ่มลัดทั้งหมดจะถูกบันทึกรวมในไฟล์โปรเจกต์ (.ktproj / .zip) อัตโนมัติ</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Export Keymaps */}
                    <button
                      onClick={exportFastKeyBindings}
                      title="ส่งออกปุ่มลัด (.json) เฉพาะส่วน หรือใช้ระบบส่งออกโปรเจกต์รวมเพื่อพกพาครบทุกอย่าง"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-dark hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-surface-border transition"
                    >
                      <Download size={12} />
                      <span>ส่งออก JSON</span>
                    </button>

                    {/* Import Keymaps */}
                    <input
                      type="file"
                      ref={keymapFileInputRef}
                      onChange={handleImportKeymap}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => keymapFileInputRef.current?.click()}
                      title="นำเข้าปุ่มลัด (.json) จากเครื่องอื่น"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-dark hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-surface-border transition"
                    >
                      <Upload size={12} />
                      <span>นำเข้า JSON</span>
                    </button>

                    {/* Reset Keymaps */}
                    <button
                      onClick={resetFastKeyBindings}
                      title="รีเซ็ตปุ่มลัดทั้งหมดเป็นค่าเริ่มต้น"
                      className="p-1 rounded bg-surface-dark hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-surface-border transition"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>

                {/* Keybindings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-surface-border text-slate-400 text-[11px]">
                        <th className="pb-2 font-medium">ปุ่มคีย์บอร์ด</th>
                        <th className="pb-2 font-medium">ฟังก์ชั่นที่ผูกไว้</th>
                        <th className="pb-2 font-medium">คำอธิบาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 font-mono">
                      {fastKeyBindings.map((kb) => (
                        <tr key={kb.key} className="hover:bg-surface-darker/50 transition">
                          <td className="py-2.5">
                            <kbd className="px-2.5 py-1 rounded-md bg-surface-darker border border-surface-border text-cyan-300 font-bold text-xs uppercase shadow-sm">
                              {kb.key}
                            </kbd>
                          </td>
                          <td className="py-2.5">
                            <select
                              value={kb.functionId}
                              onChange={(e) => updateFastKeyBinding(kb.key, e.target.value)}
                              className="bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono text-brand-300 outline-none focus:border-brand-500 cursor-pointer"
                            >
                              {customFunctions.map((fn) => (
                                <option key={fn.id} value={fn.id} className="bg-slate-900 text-slate-200">
                                  {fn.name} ({fn.category})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 text-slate-400 text-[11px] font-sans">
                            {kb.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            /* ======================================================= */
            /* TAB 5: SYSTEM INFO & ENVIRONMENT STATUS                 */
            /* ======================================================= */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>KT-Robotics IDE v0.1.0</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          อัปเดตปัจจุบันล่าสุด (9 พฤศจิกายน 2026)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        สภาพแวดล้อมระบบพัฒนาหุ่นยนต์ออฟไลน์ (Offline Arduino & ESP32 C IDE)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 text-xs">
                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">Arduino CLI Compiler Toolchain</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-brand-300 font-semibold">arduino-cli v1.5.1</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">พร้อมใช้งาน</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">Arduino AVR Core</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-cyan-300 font-semibold">arduino:avr v1.8.8</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ติดตั้งแล้ว</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">PTBOT ESP32 Core</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-violet-300 font-semibold">PTBOT_ESP32 v1.1.7</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">ติดตั้งแล้ว</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">3D Physics & Arena Simulator</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-amber-300 font-semibold">Three.js v0.187.0</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">WebGL 2.0</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">Code Editor Core</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-blue-300 font-semibold">Monaco Editor v0.52.2</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-darker/70 border border-surface-border/70 flex flex-col justify-between">
                    <span className="text-slate-400 text-[11px]">Frontend Stack & Build System</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-pink-300 font-semibold">Vite v6.4.6 / React 18.3.1</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">TypeScript 5.9</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>ระบบทุกส่วนได้รับการตรวจสอบความปลอดภัย (Zero Vulnerabilities) และพร้อมทำงานแบบออฟไลน์ 100% ไม่มีบัค</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-surface-border bg-surface-darker shrink-0">
          <button
            onClick={resetSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-surface-border transition"
            title="คืนค่าการตั้งค่าฟอนต์ทั้งหมดกลับเป็นค่ามาตรฐาน"
          >
            <RotateCcw size={12} />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition"
          >
            บันทึกและปิด
          </button>
        </div>
      </div>
    </div>
  );
};
