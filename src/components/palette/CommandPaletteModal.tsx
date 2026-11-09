import React, { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import {
  Search,
  Play,
  CheckCircle2,
  Upload,
  FileCode,
  Sparkles,
  Settings,
  GitBranch,
  Cpu,
  Trash2,
  RotateCcw,
  AlignLeft,
  Maximize2,
  FolderOpen,
  FolderPlus,
  Command,
  X,
  LucideIcon,
  Radio,
  Dices,
} from 'lucide-react';

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    projectFiles,
    setActiveFileId,
    compileCode,
    uploadFirmware,
    toggleBuilderSplitMode,
    isBuilderSplitMode,
    setSettingsOpen,
    setVersionModalOpen,
    setBoardManagerOpen,
    insertCodeAtCursor,
    clearConsole,
    toggleSimulationOnLine,
    isSimulationOnLine,
    getMainCode,
    code,
  } = useIDEStore();

  const { startSimulationWithCode, resetRobot, clearTrail } = useSimulatorStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette: Ctrl+P or Ctrl+K or Meta+P or Meta+K
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Build searchable items list
  interface PaletteCommand {
    id: string;
    title: string;
    subtitle?: string;
    category: 'File' | 'Action' | 'Command' | 'Settings';
    icon: LucideIcon;
    run: () => void;
    hotkey?: string;
  }

  const allItems: PaletteCommand[] = [
    // Files
    ...projectFiles.map((f) => ({
      id: `file_${f.id}`,
      title: `เปิดไฟล์: ${f.name}`,
      subtitle: f.name.endsWith('.ino') ? 'Main Arduino Sketch' : 'Header / Source file',
      category: 'File' as const,
      icon: FileCode,
      run: () => setActiveFileId(f.id),
    })),

    // Execution Actions
    {
      id: 'act_simulate',
      title: 'เริ่มจำลองสนาม 3D (Simulate)',
      subtitle: 'รันโค้ดและทดสอบการเคลื่อนที่ของหุ่นยนต์',
      category: 'Action',
      icon: Play,
      hotkey: 'F5',
      run: () => {
        const { projectFiles, activeFileId, getMainCode, code } = useIDEStore.getState();
        const simStore = useSimulatorStore.getState();
        if (projectFiles && projectFiles.length > 0) {
          simStore.startSimulationWithFiles(projectFiles, activeFileId);
        } else {
          simStore.startSimulationWithCode(getMainCode() || code);
        }
      },
    },
    {
      id: 'act_verify',
      title: 'ตรวจสอบและคอมไพล์โค้ด (Verify / Compile)',
      subtitle: 'ตรวจสอบข้อผิดพลาดทางไวยากรณ์ C/Arduino',
      category: 'Action',
      icon: CheckCircle2,
      hotkey: 'Ctrl+R',
      run: () => compileCode(),
    },
    {
      id: 'act_upload',
      title: 'อัปโหลดเฟิร์มแวร์เข้าบอร์ด (Upload / Flash)',
      subtitle: 'เขียนโปรแกรมลงในชิป ESP32 / Arduino',
      category: 'Action',
      icon: Upload,
      hotkey: 'Ctrl+U',
      run: () => uploadFirmware(),
    },
    {
      id: 'act_open_serial',
      title: 'เปิด Serial Monitor',
      subtitle: 'ส่งและรับข้อความผ่านพอร์ต Serial กับบอร์ดหุ่นยนต์',
      category: 'Action',
      icon: Radio,
      hotkey: 'Ctrl+Shift+M',
      run: () => {
        const { setBottomDockTab } = useIDEStore.getState();
        setBottomDockTab('serial');
      },
    },
    {
      id: 'act_random_arena',
      title: 'สุ่มสนามแข่งขันอัตโนมัติ (Randomize Arena)',
      subtitle: 'สุ่มผังสนาม เลือกระดับความยากง่าย บันทึกเป็น HTML ออฟไลน์และพิมพ์ PDF',
      category: 'Action',
      icon: Dices,
      run: () => {
        const { setRandomArenaModalOpen } = useIDEStore.getState();
        setRandomArenaModalOpen(true);
      },
    },
    {
      id: 'act_sim_online',
      title: `สลับ Sim on Line (ปัจจุบัน: ${isSimulationOnLine ? 'เปิด' : 'ปิด'})`,
      subtitle: 'วาร์ปหุ่นยนต์ไปตำแหน่งบรรทัดเคอร์เซอร์ทันที',
      category: 'Action',
      icon: Sparkles,
      run: () => toggleSimulationOnLine(),
    },
    {
      id: 'act_builder_split',
      title: isBuilderSplitMode ? 'ปิดโหมดจัดสนามเต็มจอ (กลับหน้าโค้ด)' : 'เปิดโหมดจัดสนามเต็มจอ',
      subtitle: 'ย้ายเครื่องมือจัดสนามไปไว้ฝั่งซ้าย จอ 3D อยู่ฝั่งขวา',
      category: 'Action',
      icon: Maximize2,
      run: () => toggleBuilderSplitMode(),
    },
    {
      id: 'act_reset_robot',
      title: 'รีเซ็ตตำแหน่งหุ่นยนต์ (Reset Robot)',
      subtitle: 'ย้ายหุ่นยนต์กลับไปที่จุดเริ่มต้น (Start Dock)',
      category: 'Action',
      icon: RotateCcw,
      run: () => resetRobot(),
    },
    {
      id: 'act_clear_trail',
      title: 'ล้างเส้นทางจำลอง (Clear Trail)',
      subtitle: 'ลบรอยทางเดินจำลองของหุ่นยนต์',
      category: 'Action',
      icon: Trash2,
      run: () => clearTrail(),
    },
    {
      id: 'act_clear_console',
      title: 'ล้างหน้าต่าง Terminal (Clear Logs)',
      subtitle: 'ลบข้อความบันทึกใน Output Console',
      category: 'Action',
      icon: Trash2,
      run: () => clearConsole(),
    },

    // Snippets / Robot Functions
    {
      id: 'snip_ffe',
      title: 'แทรกคำสั่ง: FFE (เดินหน้าด้วย Encoder)',
      subtitle: 'FFE(speed, distance, [turn]);',
      category: 'Command',
      icon: Sparkles,
      run: () => insertCodeAtCursor('FFE(100, 400);'),
    },
    {
      id: 'snip_bbe',
      title: 'แทรกคำสั่ง: BBE (ถอยหลังด้วย Encoder)',
      subtitle: 'BBE(speed, distance, [turn]);',
      category: 'Command',
      icon: Sparkles,
      run: () => insertCodeAtCursor('BBE(100, 400);'),
    },
    {
      id: 'snip_spin',
      title: 'แทรกคำสั่ง: spinDegree (หมุนตัวด้วยไจโร)',
      subtitle: 'spinDegree(90); // 90=ขวา, -90=ซ้าย',
      category: 'Command',
      icon: Sparkles,
      run: () => insertCodeAtCursor('spinDegree(90);'),
    },
    {
      id: 'snip_setfront',
      title: 'แทรกคำสั่ง: SetFront (จัดหน้าหุ่นเข้าเส้น)',
      subtitle: 'SetFront(20);',
      category: 'Command',
      icon: Sparkles,
      run: () => insertCodeAtCursor('SetFront(20);'),
    },
    {
      id: 'snip_dropf',
      title: 'แทรกคำสั่ง: DropF (ทิ้งกล่องด้านหน้า)',
      subtitle: 'DropF();',
      category: 'Command',
      icon: Sparkles,
      run: () => insertCodeAtCursor('DropF();'),
    },

    // Settings & Managers
    {
      id: 'mgr_boards',
      title: 'เปิด Boards Manager (จัดการบอร์ด)',
      subtitle: 'เลือกและติดตั้งบอร์ด PTBOT ESP32 / Arduino',
      category: 'Settings',
      icon: Cpu,
      run: () => setBoardManagerOpen(true),
    },
    {
      id: 'mgr_versions',
      title: 'จัดการเวอร์ชันสนามและโค้ด (Versions)',
      subtitle: 'ดูประวัติ Snapshot และสลับเวอร์ชัน',
      category: 'Settings',
      icon: GitBranch,
      run: () => setVersionModalOpen(true),
    },
    {
      id: 'mgr_settings',
      title: 'ตั้งค่าแอปพลิเคชัน (Preferences)',
      subtitle: 'ขนาดตัวอักษร, ธีม, ฟอนต์, ปุ่มลัด',
      category: 'Settings',
      icon: Settings,
      hotkey: 'Ctrl+,',
      run: () => setSettingsOpen(true),
    },
  ];

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const handleSelect = (cmd: PaletteCommand) => {
    cmd.run();
    setCommandPaletteOpen(false);
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    }
  };

  return (
    <div
      onClick={() => setCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface-dark border border-surface-borderLight rounded-2xl shadow-modal-elevation overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-100"
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-surface-darker/80 border-b border-surface-border">
          <Search size={16} className="text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownList}
            placeholder="พิมพ์คำสั่ง ค้นหาไฟล์ หรือพิมพ์ฟังก์ชั่นหุ่นยนต์..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono bg-surface-card px-1.5 py-0.5 rounded text-slate-400 border border-surface-border">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              ไม่พบคำสั่งหรือไฟล์ที่ตรงกับ "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-surface-card/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={15}
                      className={isSelected ? 'text-white' : 'text-slate-400'}
                    />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-xs truncate">{item.title}</span>
                      {item.subtitle && (
                        <span
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.hotkey && (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-surface-darker text-slate-400 border-surface-border'
                        }`}
                      >
                        {item.hotkey}
                      </kbd>
                    )}
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-card text-slate-400 border border-surface-border'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-surface-darker/60 border-t border-surface-border text-[10px] text-slate-500 flex items-center justify-between">
          <span>กด ↑ ↓ เพื่อเลื่อน | Enter เพื่อเลือก | Esc เพื่อปิด</span>
          <span className="font-mono">{filtered.length} คำสั่ง</span>
        </div>
      </div>
    </div>
  );
};