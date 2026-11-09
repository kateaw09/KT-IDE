import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';
import { useIDEStore } from '../store/useIDEStore';
import { SketchManagerModal } from './modals/SketchManagerModal';
import { AppSettingsModal } from './modals/AppSettingsModal';
import { ProjectVersionModal } from './modals/ProjectVersionModal';
import { BoardAndPortModal } from './modals/BoardAndPortModal';
import { RandomArenaModal } from './modals/RandomArenaModal';
import { CommandPaletteModal } from './palette/CommandPaletteModal';
import {
  Upload,
  CheckCircle2,
  Save,
  Check,
  FolderOpen,
  GitBranch,
  Search,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    selectedBoard,
    ports,
    selectedPort,
    refreshPorts,
    isAutoPortDetect,
    projectName,
    saveCurrentProject,
    projectFiles,
    buildState,
    addConsoleLog,
    compileCode,
    uploadFirmware,
    projectVersions,
    setVersionModalOpen,
    toggleCommandPalette,
    setHardwareModalOpen,
  } = useIDEStore();

  const [isSketchModalOpen, setSketchModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-port detection effect
  useEffect(() => {
    refreshPorts(true);

    const interval = setInterval(() => {
      if (useIDEStore.getState().isAutoPortDetect) {
        refreshPorts(true);
      }
    }, 2500);

    const handleSerialConnect = () => {
      addConsoleLog('[Auto-Detect] มีการเสียบสาย USB บอร์ด กำลังตรวจจับพอร์ต...', 'info');
      refreshPorts(false);
    };

    const handleSerialDisconnect = () => {
      addConsoleLog('[Auto-Detect] สาย USB ถูกถอดออก กำลังอัปเดตรายการพอร์ต...', 'warn');
      refreshPorts(false);
    };

    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      (navigator as any).serial.addEventListener('connect', handleSerialConnect);
      (navigator as any).serial.addEventListener('disconnect', handleSerialDisconnect);
    }

    return () => {
      clearInterval(interval);
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        (navigator as any).serial.removeEventListener('connect', handleSerialConnect);
        (navigator as any).serial.removeEventListener('disconnect', handleSerialDisconnect);
      }
    };
  }, []);

  const handleQuickSave = () => {
    saveCurrentProject();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const handleCompile = async () => {
    await compileCode();
  };

  const handleUpload = async () => {
    await uploadFirmware();
  };

  const isConnected = !!selectedPort && ports.some((p) => p.portName === selectedPort);

  return (
    <>
      <header className="h-11 bg-surface-darker/95 backdrop-blur-md border-b border-surface-border flex items-center justify-between px-3 select-none z-30 shrink-0 gap-3">
        {/* Left Section: Logo (Only logo, links to https://kateaw.com), Project Capsule & Version */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Logo only - Clicking opens https://kateaw.com in new tab */}
          <a
            href="https://kateaw.com"
            target="_blank"
            rel="noopener noreferrer"
            title="ไปที่ kateaw.com"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src={logoImg}
              alt="Logo"
              className="h-6 w-auto object-contain filter drop-shadow cursor-pointer"
            />
          </a>

          {/* Project Capsule */}
          <div className="flex items-center bg-surface-dark border border-surface-border hover:border-surface-borderLight rounded-lg p-0.5 transition-colors">
            <button
              onClick={() => setSketchModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-200 hover:text-brand-300 rounded-md transition"
              title="จัดการโปรเจกต์ (สร้างใหม่ / บันทึก / เปิดไฟล์ ZIP / ส่งออก)"
            >
              <FolderOpen size={13} className="text-brand-400 shrink-0" />
              <span className="font-semibold max-w-[120px] truncate text-slate-100 text-xs">
                {projectName}
              </span>
              <span className="text-[10px] font-mono bg-surface-card px-1.5 py-0.2 rounded text-slate-400 border border-surface-border">
                {projectFiles.length}f
              </span>
            </button>

            <div className="w-[1px] h-3.5 bg-surface-border mx-0.5"></div>

            <button
              onClick={handleQuickSave}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all btn-press ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-emerald-400 hover:bg-surface-card'
              }`}
              title="บันทึกโปรเจกต์ลงเครื่อง (Ctrl+S)"
            >
              {saveSuccess ? (
                <>
                  <Check size={11} className="text-white" />
                  <span className="text-white text-[10px]">บันทึกแล้ว</span>
                </>
              ) : (
                <>
                  <Save size={11} className="text-emerald-400" />
                  <span className="text-[10px]">บันทึก</span>
                </>
              )}
            </button>
          </div>

          {/* Version Capsule */}
          <button
            onClick={() => setVersionModalOpen(true)}
            className="flex items-center gap-1.5 bg-surface-dark hover:bg-surface-card border border-surface-border hover:border-violet-500/40 px-2 py-1 rounded-lg text-xs text-slate-200 transition-all btn-press group"
            title="ประวัติเวอร์ชันสนามและโค้ด"
          >
            <GitBranch size={12} className="text-violet-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="font-medium text-xs text-slate-300">เวอร์ชัน</span>
            <span className="text-[10px] font-mono bg-violet-500/15 text-violet-300 px-1 py-0.2 rounded border border-violet-500/30">
              {projectVersions.length}
            </span>
          </button>
        </div>

        {/* Center: Search Bar / Command Palette Trigger */}
        <div className="flex-1 max-w-sm hidden md:flex items-center justify-center">
          <button
            onClick={toggleCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1 bg-surface-dark hover:bg-surface-card border border-surface-border hover:border-surface-borderLight rounded-lg text-xs text-slate-400 hover:text-slate-200 transition group shadow-inner"
            title="ค้นหาคำสั่ง สลับไฟล์ หรือเรียกใช้เครื่องมือ (Ctrl+P / Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search size={13} className="text-slate-400 group-hover:text-brand-400 transition" />
              <span className="truncate">ค้นหาคำสั่ง, ฟังก์ชั่น, สลับไฟล์...</span>
            </div>
            <kbd className="text-[10px] font-mono bg-surface-darker px-1.5 py-0.5 rounded text-slate-500 border border-surface-border group-hover:text-slate-300">
              Ctrl+P
            </kbd>
          </button>
        </div>

        {/* Right Section: Unified Board & Port Status Button + Circular Compile & Upload Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Combined Board & Port Status Button */}
          <button
            onClick={() => setHardwareModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium transition-all btn-press ${
              isConnected
                ? 'bg-surface-dark hover:bg-surface-card border-surface-border text-slate-200 hover:border-emerald-500/50'
                : 'bg-surface-dark hover:bg-surface-card border-amber-500/30 text-amber-200 hover:border-amber-500/60'
            }`}
            title="คลิกเพื่อตั้งค่าบอร์ดและพอร์ตเชื่อมต่อ USB"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse shadow-glow-emerald'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-sans text-xs">
              สถานะ :{' '}
              {isConnected ? (
                <span className="font-semibold text-emerald-400 font-mono">
                  เชื่อมต่อแล้ว ({selectedPort} - {selectedBoard.name})
                </span>
              ) : (
                <span className="font-semibold text-amber-300">
                  ยังไม่ได้เชื่อมต่อบอร์ด
                </span>
              )}
            </span>
          </button>

          <div className="w-[1px] h-3.5 bg-surface-border mx-0.5" />

          {/* Action: Circular Verify / Compile Button */}
          <button
            onClick={handleCompile}
            disabled={buildState === 'compiling' || buildState === 'uploading'}
            className="w-8 h-8 rounded-full bg-surface-card hover:bg-surface-hover text-slate-200 hover:text-brand-300 border border-surface-border flex items-center justify-center transition-all btn-press disabled:opacity-50"
            title={`ตรวจสอบและคอมไพล์โค้ด (Verify: Ctrl+R)`}
          >
            <CheckCircle2
              size={16}
              className={buildState === 'compiling' ? 'text-brand-400 animate-spin' : 'text-brand-400'}
            />
          </button>

          {/* Action: Circular Upload / Flash Button */}
          <button
            onClick={handleUpload}
            disabled={buildState === 'compiling' || buildState === 'uploading'}
            className="w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:shadow-glow-brand flex items-center justify-center transition-all btn-press disabled:opacity-50"
            title={`อัปโหลดโปรแกรมเข้าบอร์ด ${selectedBoard.name} (${selectedPort || 'USB'}) (Ctrl+U)`}
          >
            <Upload
              size={16}
              className={buildState === 'uploading' ? 'animate-bounce' : ''}
            />
          </button>
        </div>
      </header>

      {/* Modals */}
      <SketchManagerModal
        isOpen={isSketchModalOpen}
        onClose={() => setSketchModalOpen(false)}
      />
      <AppSettingsModal />
      <ProjectVersionModal />
      <BoardAndPortModal />
      <RandomArenaModal />
      <CommandPaletteModal />
    </>
  );
};