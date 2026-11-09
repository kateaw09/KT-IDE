import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ActivityRail } from './components/layout/ActivityRail';
import { FileExplorerPanel } from './components/layout/FileExplorerPanel';
import { GlobalStatusBar } from './components/layout/GlobalStatusBar';
import { FunctionBuilderPanel } from './components/macro/FunctionBuilderPanel';
import { CodeEditor } from './components/editor/CodeEditor';
import { OutputConsole } from './components/console/OutputConsole';
import { FieldSimulator3D } from './components/simulator3d/FieldSimulator3D';
import { SimulatorTelemetry } from './components/simulator/SimulatorTelemetry';
import { SimulatorControls } from './components/simulator/SimulatorControls';
import { ArenaBuilderPalette } from './components/simulator/ArenaBuilderPalette';
import { useIDEStore, applyUIFontGlobally } from './store/useIDEStore';
import { useSimulatorStore } from './store/useSimulatorStore';
import { LayoutGrid, Gauge, Minimize2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeSidebarTab,
    toggleSidebarTab,
    isBuilderSplitMode,
    toggleBuilderSplitMode,
    uiFontSize,
    uiFontFamily,
    toggleCommandPalette,
    compileCode,
    uploadFirmware,
    setSettingsOpen,
    getMainCode,
    code,
    setBottomDockTab,
  } = useIDEStore();

  const { startSimulationWithCode } = useSimulatorStore();

  const [builderTab, setBuilderTab] = useState<'builder' | 'telemetry'>('builder');

  // Synchronize UI Font Size and UI Font Family globally
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${uiFontSize || 14}px`;
      if (uiFontFamily) {
        applyUIFontGlobally(uiFontFamily);
      }
    }
  }, [uiFontSize, uiFontFamily]);

  // Global Keyboard Shortcuts (Enterprise IDE Standard)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle Primary Sidebar Drawer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarTab('files');
        return;
      }

      // F5: Run 3D Simulation
      if (e.key === 'F5') {
        e.preventDefault();
        const mainSource = getMainCode() || code;
        startSimulationWithCode(mainSource);
        return;
      }

      // Ctrl+R: Verify / Compile
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        compileCode();
        return;
      }

      // Ctrl+U: Upload / Flash Firmware
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        uploadFirmware();
        return;
      }

      // Ctrl+Shift+M: Open Serial Monitor
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setBottomDockTab('serial');
        return;
      }

      // Ctrl+,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [toggleSidebarTab, getMainCode, code, compileCode, uploadFirmware, setSettingsOpen, setBottomDockTab]);

  // Sidebar Drawer Width Resizing (Left Primary Drawer)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kt_primary_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 220 && val <= 600) return val;
      }
    } catch (e) {}
    return 280;
  });

  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  // Width of Left Tools Panel when in isBuilderSplitMode (default 45-50% of screen)
  const [builderLeftWidth, setBuilderLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kt_builder_left_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 280 && val <= 1400) return val;
      }
    } catch (e) {}
    return typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.45) : 560;
  });

  const [isDraggingBuilderSplit, setIsDraggingBuilderSplit] = useState(false);

  // Normal Mode: Resizable Right Pane Horizontal (Overall Width)
  const [rightWidth, setRightWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kt_right_pane_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 320 && val <= 1400) return val;
      }
    } catch (e) {}
    return Math.max(500, Math.min(680, typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.45) : 560));
  });

  // Output Console / Terminal Vertical Resizable Height
  const [consoleHeight, setConsoleHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('kt_console_height');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 32 && val <= 800) return val;
      }
    } catch (e) {}
    return 176;
  });

  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const [isDraggingConsoleHeight, setIsDraggingConsoleHeight] = useState(false);

  // Event handlers for Primary Sidebar resizing
  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minW = 220;
      const maxW = 550;
      const clamped = Math.max(minW, Math.min(e.clientX - 48, maxW));
      setSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      try {
        localStorage.setItem('kt_primary_sidebar_width', String(sidebarWidth));
      } catch (e) {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSidebar, sidebarWidth]);

  // Dragging event handlers for isBuilderSplitMode (Divider between Left Tools and Right 3D)
  useEffect(() => {
    if (!isDraggingBuilderSplit) return;

    const handleMouseMove = (e: MouseEvent) => {
      const minW = 280;
      const maxW = Math.max(minW, window.innerWidth - 340);
      const clamped = Math.max(minW, Math.min(e.clientX, maxW));
      setBuilderLeftWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingBuilderSplit(false);
      try {
        localStorage.setItem('kt_builder_left_width', String(builderLeftWidth));
      } catch (e) {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingBuilderSplit, builderLeftWidth]);

  // Normal Mode: Horizontal dragging (Code Editor vs Simulator Pane)
  useEffect(() => {
    if (!isDraggingWidth) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const minW = 340;
      const maxW = Math.max(minW, window.innerWidth - 360);
      const clamped = Math.max(minW, Math.min(newWidth, maxW));
      setRightWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingWidth(false);
      try {
        localStorage.setItem('kt_right_pane_width', String(rightWidth));
      } catch (e) {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingWidth, rightWidth]);

  // Normal Mode: Vertical dragging for Terminal / Output Console
  useEffect(() => {
    if (!isDraggingConsoleHeight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const offsetFromBottom = window.innerHeight - e.clientY - 24; // account for StatusBar height
      const minH = 32;
      const maxH = Math.max(minH, window.innerHeight - 200);
      const clamped = Math.max(minH, Math.min(offsetFromBottom, maxH));
      setConsoleHeight(clamped);
    };

    const handleMouseUp = () => {
      setIsDraggingConsoleHeight(false);
      try {
        localStorage.setItem('kt_console_height', String(consoleHeight));
      } catch (e) {}
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingConsoleHeight, consoleHeight]);

  return (
    <div className="flex flex-col h-screen w-screen bg-surface-darker text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Top Command Bar */}
      <Navbar />

      {/* 2. Main Workspace Layout */}
      {isBuilderSplitMode ? (
        /* ========================================================================= */
        /* MODE A: FULL BUILDER SPLIT (Code Hidden, Tools on Left, 3D on Right)     */
        /* ========================================================================= */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Tools Drawer */}
          <div
            style={{ width: `${builderLeftWidth}px` }}
            className={`flex flex-col bg-surface-dark shrink-0 overflow-hidden border-r border-surface-border ${
              isDraggingBuilderSplit ? '' : 'transition-[width] duration-150'
            }`}
          >
            {/* Top Header of Left Panel */}
            <div className="flex items-center justify-between bg-surface-darker px-3 py-2 border-b border-surface-border text-xs shrink-0 select-none">
              <div className="flex items-center bg-surface-dark p-0.5 rounded-lg border border-surface-border">
                <button
                  onClick={() => setBuilderTab('builder')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    builderTab === 'builder'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>เครื่องมือสร้างสนาม</span>
                </button>

                <button
                  onClick={() => setBuilderTab('telemetry')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    builderTab === 'telemetry'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Gauge size={13} />
                  <span>เซนเซอร์ & เทเลเมตรี</span>
                </button>
              </div>

              {/* Action Buttons: 50:50 and Exit Back to Code */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBuilderLeftWidth(Math.round(window.innerWidth * 0.5))}
                  title="แบ่งหน้าจอ 50:50"
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-surface-card hover:bg-surface-hover text-slate-300 border border-surface-border transition"
                >
                  50:50
                </button>

                <button
                  onClick={toggleBuilderSplitMode}
                  title="กลับสู่หน้าเขียนโค้ด"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-surface-card hover:bg-surface-hover text-slate-200 border border-surface-border hover:border-slate-500 transition-all btn-press"
                >
                  <Minimize2 size={12} className="text-slate-400" />
                  <span>กลับหน้าโค้ด</span>
                </button>
              </div>
            </div>

            {/* Content: Full Height Palette or Telemetry */}
            <div className="flex-1 overflow-hidden">
              {builderTab === 'builder' ? <ArenaBuilderPalette /> : <SimulatorTelemetry />}
            </div>
          </div>

          {/* Draggable Divider */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingBuilderSplit(true);
            }}
            onDoubleClick={() => setBuilderLeftWidth(Math.round(window.innerWidth * 0.5))}
            title="ลากเพื่อปรับขนาด (ดับเบิลคลิกเพื่อแบ่งครึ่ง 50:50)"
            className={`w-1.5 hover:w-2 bg-surface-border hover:bg-brand-500 cursor-col-resize select-none relative z-30 transition-all flex items-center justify-center shrink-0 group ${
              isDraggingBuilderSplit ? 'bg-brand-500 w-2 shadow-lg shadow-brand-500/50' : ''
            }`}
          >
            <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-0.5 h-3 bg-white rounded-full"></span>
            </div>
          </div>

          {/* Right Panel: 3D Field Simulator + Controls */}
          <div className="flex-1 flex flex-col min-w-[320px] overflow-hidden bg-surface-dark">
            <div className="flex-1 relative overflow-hidden">
              <FieldSimulator3D />
            </div>
            <SimulatorControls />
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE B: ENTERPRISE IDE WORKSPACE                                         */
        /* (Activity Rail + Collapsible Drawer + Code Canvas + 3D Viewport)          */
        /* ========================================================================= */
        <div className="flex-1 flex overflow-hidden">
          {/* 2.1 Activity Rail (Left 44px) */}
          <ActivityRail />

          {/* 2.2 Primary Collapsible Sidebar Drawer */}
          {activeSidebarTab !== null && (
            <>
              <div
                style={{ width: `${sidebarWidth}px` }}
                className={`bg-surface-dark border-r border-surface-border flex flex-col shrink-0 overflow-hidden ${
                  isDraggingSidebar ? '' : 'transition-[width] duration-150'
                }`}
              >
                {activeSidebarTab === 'files' && <FileExplorerPanel />}
                {activeSidebarTab === 'macro' && <FunctionBuilderPanel />}
                {activeSidebarTab === 'arena' && <ArenaBuilderPalette />}
                {activeSidebarTab === 'versions' && (
                  <div className="flex flex-col h-full bg-surface-dark p-3 select-none text-xs">
                    <span className="font-semibold text-slate-200 mb-2 uppercase tracking-wider text-[11px]">
                      ประวัติเวอร์ชันสนามและโค้ด
                    </span>
                    <p className="text-slate-400 text-xs mb-3">
                      จัดการ Snapshot เพื่อย้อนกลับหรือเปรียบเทียบสนามแข่ง
                    </p>
                    <button
                      onClick={() => useIDEStore.getState().setVersionModalOpen(true)}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold text-xs transition"
                    >
                      เปิดหน้าจัดการเวอร์ชันเต็ม
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Draggable Splitter */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingSidebar(true);
                }}
                onDoubleClick={() => setSidebarWidth(280)}
                title="ลากปรับขนาด Sidebar"
                className={`w-1 hover:w-1.5 bg-surface-border hover:bg-brand-500 cursor-col-resize select-none relative z-20 transition-all flex items-center justify-center shrink-0 ${
                  isDraggingSidebar ? 'bg-brand-500 w-1.5' : ''
                }`}
              />
            </>
          )}

          {/* 2.3 Center Pane: Editor Workspace & Bottom Dock */}
          <div className="flex-1 flex flex-col min-w-[320px] overflow-hidden">
            {/* Main Code Editor */}
            <div className="flex-1 relative overflow-hidden">
              <CodeEditor />
            </div>

            {/* DRAGGABLE RESIZE DIVIDER (for Bottom Dock) */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingConsoleHeight(true);
              }}
              onDoubleClick={() => setConsoleHeight(176)}
              title="ลากขึ้น-ลงเพื่อปรับขนาด Terminal (ดับเบิลคลิกคืนค่า 176px)"
              className={`h-1.5 hover:h-2 bg-surface-border hover:bg-brand-500 cursor-row-resize select-none relative z-20 transition-all flex items-center justify-center shrink-0 group ${
                isDraggingConsoleHeight ? 'bg-brand-500 h-2 shadow-lg shadow-brand-500/50' : ''
              }`}
            >
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="w-8 h-0.5 bg-white rounded-full"></span>
              </div>
            </div>

            {/* Bottom Dock (Terminal / Flasher / Telemetry) */}
            <OutputConsole
              height={consoleHeight}
              onResetHeight={() => setConsoleHeight(176)}
            />
          </div>

          {/* DRAGGABLE RESIZE DIVIDER (Horizontal - Editor vs 3D Simulator) */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingWidth(true);
            }}
            onDoubleClick={() => setRightWidth(560)}
            title="ลากปรับขนาดหน้าจอ 3D (ดับเบิลคลิกคืนค่า 560px)"
            className={`w-1.5 hover:w-2 bg-surface-border hover:bg-brand-500 cursor-col-resize select-none relative z-20 transition-all flex items-center justify-center shrink-0 group ${
              isDraggingWidth ? 'bg-brand-500 w-2 shadow-lg shadow-brand-500/50' : ''
            }`}
          >
            <div className="flex flex-col gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="w-0.5 h-4 bg-white rounded-full"></span>
            </div>
          </div>

          {/* 2.4 Right Pane: 3D Field Simulator Viewport + Transport Controls */}
          <div
            style={{ width: `${rightWidth}px` }}
            className="flex flex-col bg-surface-dark shrink-0 overflow-hidden relative border-l border-surface-border"
          >
            {/* 3D Interactive Viewport */}
            <div className="flex-1 relative overflow-hidden min-h-[160px]">
              <FieldSimulator3D />
            </div>

            {/* Simulator Transport Bar */}
            <SimulatorControls />
          </div>
        </div>
      )}

      {/* 3. Global Status Bar (Bottom 24px) */}
      <GlobalStatusBar />
    </div>
  );
};

export default App;