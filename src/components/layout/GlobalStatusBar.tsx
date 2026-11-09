import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Usb,
  Cpu,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const GlobalStatusBar: React.FC = () => {
  const {
    projectName,
    projectVersions,
    setVersionModalOpen,
    consoleLogs,
    selectedBoard,
    setBoardManagerOpen,
    ports,
    selectedPort,
    refreshPorts,
    isAutoPortDetect,
    editorFontSize,
    setSettingsOpen,
    isSimulationOnLine,
    toggleSimulationOnLine,
  } = useIDEStore();

  const errorCount = consoleLogs.filter((l) => l.type === 'error').length;
  const warnCount = consoleLogs.filter((l) => l.type === 'warn').length;

  return (
    <footer className="h-6 bg-surface-darker/95 backdrop-blur-md border-t border-surface-border flex items-center justify-between px-3 text-[11px] font-sans text-slate-400 select-none shrink-0 z-20">
      {/* Left Status Group */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* Version Capsule */}
        <button
          onClick={() => setVersionModalOpen(true)}
          title="จัดการเวอร์ชันสนามและโค้ด"
          className="flex items-center gap-1 text-slate-300 hover:text-white transition"
        >
          <GitBranch size={11} className="text-violet-400" />
          <span className="font-mono text-[10px]">
            {projectVersions.length > 0
              ? projectVersions[projectVersions.length - 1].versionTag
              : 'main'}
          </span>
        </button>

        <div className="w-[1px] h-3 bg-surface-border" />

        {/* Errors & Warnings count */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span
            className={`flex items-center gap-1 ${
              errorCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'
            }`}
          >
            ✕ {errorCount}
          </span>
          <span
            className={`flex items-center gap-1 ${
              warnCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'
            }`}
          >
            ⚠ {warnCount}
          </span>
        </div>

        <div className="w-[1px] h-3 bg-surface-border" />

        {/* Sim on Line indicator */}
        <button
          onClick={toggleSimulationOnLine}
          title="สลับโหมด Sim on Line"
          className={`flex items-center gap-1 px-1.5 py-0.2 rounded transition text-[10px] ${
            isSimulationOnLine
              ? 'text-brand-300 bg-brand-500/10'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles size={10} className={isSimulationOnLine ? 'text-brand-400' : 'text-slate-500'} />
          <span>Sim on Line: {isSimulationOnLine ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Center Credit */}
      <div className="hidden lg:flex items-center text-[10px] text-slate-500 font-sans">
        <span>©KT-IDE v0.1.0 | Develop By&nbsp;</span>
        <a
          href="https://kateaw.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 hover:text-brand-300 font-semibold hover:underline"
        >
          KATEAW
        </a>
      </div>

      {/* Right Status Group */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-[10px] text-slate-400">Spaces: 2</span>
        <span className="font-mono text-[10px] text-slate-400">UTF-8</span>
        <span className="font-mono text-[10px] text-slate-400">C++ (Arduino)</span>

        <div className="w-[1px] h-3 bg-surface-border" />

        {/* Hardware Board */}
        <button
          onClick={() => setBoardManagerOpen(true)}
          title="จัดการบอร์ดไมโครคอนโทรลเลอร์"
          className="flex items-center gap-1 text-slate-300 hover:text-brand-300 transition"
        >
          <Cpu size={11} className="text-amber-400" />
          <span className="truncate max-w-[130px] font-mono text-[10px]">
            {selectedBoard.name}
          </span>
        </button>

        <div className="w-[1px] h-3 bg-surface-border" />

        {/* USB Port & Auto-detect indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
          <div className="relative flex items-center justify-center">
            <Usb size={11} className={ports.length > 0 ? 'text-emerald-400' : 'text-slate-500'} />
            {isAutoPortDetect && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </div>
          <span>{selectedPort || 'No USB'}</span>
          <button
            onClick={() => refreshPorts(false)}
            title="สแกนพอร์ตใหม่"
            className="text-slate-500 hover:text-emerald-400 ml-0.5"
          >
            <RefreshCw size={9} />
          </button>
        </div>

        <div className="w-[1px] h-3 bg-surface-border" />

        {/* Zoom Level */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="ขนาดฟอนต์โค้ด (คลิกเพื่อตั้งค่า)"
          className="font-mono text-[10px] text-slate-400 hover:text-white"
        >
          {editorFontSize}px
        </button>
      </div>
    </footer>
  );
};