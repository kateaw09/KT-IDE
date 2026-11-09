import React, { useRef, useState } from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useIDEStore } from '../../store/useIDEStore';
import { TileType, TileRotation } from '../../types/simulator';
import {
  RotateCw,
  Trash2,
  Download,
  Upload,
  Grid,
  GitBranch,
  Sparkles,
  Dices,
} from 'lucide-react';

export interface PaletteItem {
  type: TileType;
  name: string;
  category: 'points' | 'lines' | 'elevation' | 'tunnels' | 'targets' | 'hazards';
  description: string;
  badge?: string;
}

export const TileThumbnail: React.FC<{ type: TileType }> = ({ type }) => {
  switch (type) {
    case 'start':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-red-600 p-0.5 shadow-inner">
          <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">START</text>
        </svg>
      );
    case 'finish':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-cyan-600 p-0.5 shadow-inner">
          <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">FINISH</text>
        </svg>
      );
    case 'checkpoint':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <circle cx="20" cy="20" r="7.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>
      );
    case 'checkpoint_line':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <circle cx="20" cy="18" r="7.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="0" y="33" width="40" height="7" fill="#0f172a" />
        </svg>
      );
    case 'checkpoint_corner':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <circle cx="22" cy="22" r="7.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="0" y="0" width="7" height="40" fill="#0f172a" />
          <rect x="0" y="0" width="40" height="7" fill="#0f172a" />
        </svg>
      );
    case 'checkpoint_parallel':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <circle cx="20" cy="20" r="7.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="0" y="0" width="40" height="6.5" fill="#0f172a" />
          <rect x="0" y="33.5" width="40" height="6.5" fill="#0f172a" />
        </svg>
      );
    case 'line_straight':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="0" y="33" width="40" height="7" fill="#0f172a" />
        </svg>
      );
    case 'line_corner':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="0" y="0" width="7" height="40" fill="#0f172a" />
          <rect x="0" y="33" width="40" height="7" fill="#0f172a" />
        </svg>
      );
    case 'line_parallel':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="0" y="0" width="40" height="6.5" fill="#0f172a" />
          <rect x="0" y="33.5" width="40" height="6.5" fill="#0f172a" />
        </svg>
      );
    case 'line_u':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="0" y="0" width="6.5" height="40" fill="#0f172a" />
          <rect x="0" y="33.5" width="40" height="6.5" fill="#0f172a" />
          <rect x="33.5" y="0" width="6.5" height="40" fill="#0f172a" />
        </svg>
      );
    case 'line_box':
    case 'pt_robotics':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="0" y="0" width="40" height="6.5" fill="#0f172a" />
          <rect x="0" y="33.5" width="40" height="6.5" fill="#0f172a" />
          <rect x="0" y="0" width="6.5" height="40" fill="#0f172a" />
          <rect x="33.5" y="0" width="6.5" height="40" fill="#0f172a" />
        </svg>
      );
    case 'drop_red':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="5" y="20" width="30" height="15" fill="#ef4444" />
          <rect x="0" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="35" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="0" y="35" width="40" height="5" fill="#0f172a" />
        </svg>
      );
    case 'drop_green':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="5" y="20" width="30" height="15" fill="#10b981" />
          <rect x="0" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="35" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="0" y="35" width="40" height="5" fill="#0f172a" />
        </svg>
      );
    case 'drop_blue':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="5" y="20" width="30" height="15" fill="#2563eb" />
          <rect x="0" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="35" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="0" y="35" width="40" height="5" fill="#0f172a" />
        </svg>
      );
    case 'drop_yellow':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="5" y="20" width="30" height="15" fill="#facc15" />
          <rect x="0" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="35" y="0" width="5" height="40" fill="#0f172a" />
          <rect x="0" y="35" width="40" height="5" fill="#0f172a" />
        </svg>
      );
    case 'hill_drop':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <polygon points="4,34 24,18 36,18 36,34" fill="#64748b" />
          <rect x="24" y="15" width="12" height="4" fill="#10b981" />
          <polyline points="20,13 38,13 38,34" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
        </svg>
      );
    case 'bridge_up':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <polygon points="4,32 36,10 36,32" fill="#10b981" />
          <polygon points="4,34 36,12 36,34" fill="#047857" />
        </svg>
      );
    case 'bridge_deck':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <rect x="4" y="12" width="32" height="20" fill="#64748b" />
          <rect x="4" y="10" width="32" height="3" fill="#facc15" />
        </svg>
      );
    case 'bridge_down':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <polygon points="4,10 36,32 4,32" fill="#facc15" />
          <polygon points="4,12 36,34 4,34" fill="#b45309" />
        </svg>
      );
    case 'seesaw':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <polygon points="15,34 25,34 20,22" fill="#ea580c" />
          <line x1="4" y1="28" x2="36" y2="15" stroke="#2563eb" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="4" y1="26" x2="36" y2="13" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'tunnel':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <rect x="5" y="8" width="30" height="26" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <rect x="11" y="14" width="18" height="20" rx="1.5" fill="#0f172a" />
        </svg>
      );
    case 'tunnel_corner':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <path d="M 5 8 L 35 8 L 35 22 L 22 22 L 22 35 L 5 35 Z" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 11 14 L 29 14 L 29 18 L 18 18 L 18 29 L 11 29 Z" fill="#0f172a" />
        </svg>
      );
    case 'speed_bumps':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          {[5, 10, 15, 20, 25, 30, 35].map((x) => (
            <line key={x} x1={x} y1="3" x2={x} y2="37" stroke="#f59e0b" strokeWidth="2.5" />
          ))}
        </svg>
      );
    case 'black_pit':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-100 border border-slate-300">
          <rect x="8" y="5" width="24" height="30" fill="#0f172a" />
          <rect x="6" y="3" width="28" height="34" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2" />
        </svg>
      );
    case 'barrier_bomb':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-600">
          <circle cx="20" cy="24" r="5" fill="#ef4444" />
          <line x1="6" y1="16" x2="34" y2="16" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'normal':
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full rounded bg-slate-900 border border-slate-700">
          <line x1="12" y1="12" x2="28" y2="28" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="12" x2="12" y2="28" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};

export const ALL_COMPETITION_PALETTE_ITEMS: PaletteItem[] = [
  // 1. Points & Docks
  {
    type: 'start',
    name: 'START ปล่อยตัว',
    category: 'points',
    description: 'พื้นที่ปล่อยตัวสีแดง 300x300mm',
    badge: '300x300',
  },
  {
    type: 'finish',
    name: 'FINISH สิ้นสุด',
    category: 'points',
    description: 'พื้นที่เข้าเส้นชัย สีฟ้า Cyan 300x300mm',
    badge: '300x300',
  },
  {
    type: 'checkpoint',
    name: 'Check Point กลาง',
    category: 'points',
    description: 'วงกลมสีเหลือง Ø 50mm บนพื้นขาว',
    badge: 'Ø 50mm',
  },
  {
    type: 'checkpoint_line',
    name: 'Check Point + เส้นตรง',
    category: 'points',
    description: 'วงกลมเหลือง Ø50mm + เส้นขอบ 1 ด้าน',
    badge: 'Screenshot 2',
  },
  {
    type: 'checkpoint_corner',
    name: 'Check Point + มุมเลี้ยว',
    category: 'points',
    description: 'วงกลมเหลือง Ø50mm + มุมเลี้ยว L-Corner',
    badge: 'Screenshot 2',
  },
  {
    type: 'checkpoint_parallel',
    name: 'Check Point + เส้นคู่',
    category: 'points',
    description: 'วงกลมเหลือง Ø50mm + เส้นขอบคู่บน-ล่าง',
    badge: 'Screenshot 2',
  },

  // 2. Lines & Walls (Screenshot 1)
  {
    type: 'line_straight',
    name: 'เส้นตรง / ขอบทาง',
    category: 'lines',
    description: 'เส้นขอบตรงสีดำหนา 1 ด้าน (หมุนได้ 360°)',
    badge: 'Screenshot 1',
  },
  {
    type: 'line_corner',
    name: 'มุมเลี้ยว L-Corner',
    category: 'lines',
    description: 'มุมหักเลี้ยว 90 องศา เส้นหนาสีดำ',
    badge: 'Screenshot 1',
  },
  {
    type: 'line_parallel',
    name: 'เส้นคู่ขนาน (Parallel)',
    category: 'lines',
    description: 'เส้นขอบทางคู่สองฝั่งบน-ล่าง',
    badge: 'Screenshot 1',
  },
  {
    type: 'line_u',
    name: 'เส้นกลับตัว U-Shape',
    category: 'lines',
    description: 'เส้นขอบ 3 ด้าน สำหรับกลับตัว',
    badge: 'Screenshot 1',
  },
  {
    type: 'line_box',
    name: 'กรอบสี่เหลี่ยม Box',
    category: 'lines',
    description: 'กรอบสี่เหลี่ยมปิดล้อม 4 ด้าน',
    badge: 'Screenshot 1',
  },

  // 3. Elevation & Bridge (Screenshot 7, 10, 4)
  {
    type: 'bridge_up',
    name: 'สะพาน ทางขึ้น (เขียว)',
    category: 'elevation',
    description: 'ความชันขึ้น 50mm สีเขียว 300x300mm',
    badge: '300x300 H:50',
  },
  {
    type: 'bridge_deck',
    name: 'สะพาน ช่วงกลาง (เทา)',
    category: 'elevation',
    description: 'ช่วงกลางสะพานสูง 50mm พร้อมขอบเหลือง',
    badge: '300x300 H:50',
  },
  {
    type: 'bridge_down',
    name: 'สะพาน ทางลง (เหลือง)',
    category: 'elevation',
    description: 'ความชันลง 50mm สู่ระดับพื้น',
    badge: '300x300 H:50',
  },
  {
    type: 'seesaw',
    name: 'ไม้กระดก (Seesaw)',
    category: 'elevation',
    description: 'ไม้กระดกสองทิศทาง 600mm ขอบน้ำเงิน',
    badge: '600mm',
  },
  {
    type: 'hill_drop',
    name: 'เนินปล่อยถุงยังชีพ',
    category: 'elevation',
    description: 'ทางลาด 600mm สูง 50mm สู่ขอบกั้น 100mm',
    badge: '600x300',
  },

  // 4. Tunnels (Screenshot 8, 9)
  {
    type: 'tunnel',
    name: 'อุโมงค์ทางตรง (Straight)',
    category: 'tunnels',
    description: 'อุโมงค์ทึบแสง 600x300mm สูง 303mm',
    badge: 'H:303mm',
  },
  {
    type: 'tunnel_corner',
    name: 'อุโมงค์มุมเลี้ยว 90°',
    category: 'tunnels',
    description: 'อุโมงค์หักเลี้ยว 90 องศา 300x300mm สูง 300mm',
    badge: 'H:300mm',
  },

  // 5. Mission Drop Targets (Screenshot 3)
  {
    type: 'drop_red',
    name: 'ปล่อยถุงยังชีพ สีแดง',
    category: 'targets',
    description: 'โซนสีแดง 300x150mm พร้อมกำแพง U 3 ด้าน',
    badge: 'Red 150mm',
  },
  {
    type: 'drop_green',
    name: 'ปล่อยถุงยังชีพ สีเขียว',
    category: 'targets',
    description: 'โซนสีเขียว 300x150mm พร้อมกำแพง U 3 ด้าน',
    badge: 'Green 150mm',
  },
  {
    type: 'drop_blue',
    name: 'ปล่อยถุงยังชีพ สีน้ำเงิน',
    category: 'targets',
    description: 'โซนสีน้ำเงิน 300x150mm พร้อมกำแพง U 3 ด้าน',
    badge: 'Blue 150mm',
  },
  {
    type: 'drop_yellow',
    name: 'ปล่อยถุงยังชีพ สีเหลือง',
    category: 'targets',
    description: 'โซนสีเหลือง 300x150mm พร้อมกำแพง U 3 ด้าน',
    badge: 'Yellow 150mm',
  },

  // 6. Hazards & Obstacles (Screenshot 5, 6)
  {
    type: 'speed_bumps',
    name: 'ลูกระนาด (7 แถบ)',
    category: 'hazards',
    description: 'ลูกระนาด 7 แถบสีส้ม 300x300mm ชะลอความเร็ว',
    badge: '7 Strips',
  },
  {
    type: 'black_pit',
    name: 'หลุมดำ (Black Pit)',
    category: 'hazards',
    description: 'หลุมดำ 200x300mm ห้ามตก (ฟาวล์)',
    badge: '200x300',
  },
  {
    type: 'barrier_bomb',
    name: 'จุดลูกระเบิด / ไม้กั้น',
    category: 'hazards',
    description: 'แท่งไม้กั้นขวางทางแข่งขัน',
    badge: 'Barrier',
  },
  {
    type: 'normal',
    name: 'ล้างเป็นพื้นว่าง (Clear)',
    category: 'hazards',
    description: 'ล้างชิ้นส่วนกลับเป็นพื้นปกติสีขาว',
    badge: 'Empty',
  },
];

export const ArenaBuilderPalette: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    activeRotation,
    setActiveRotation,
    clearTiles,
    saveArenaJson,
    loadArenaJson,
  } = useSimulatorStore();

  const { projectVersions, setVersionModalOpen, setRandomArenaModalOpen } = useIDEStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rotateToolClockwise = () => {
    const nextRot = ((activeRotation + 90) % 360) as TileRotation;
    setActiveRotation(nextRot);
  };

  const handleDownloadField = () => {
    const jsonStr = saveArenaJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_arena_${Date.now()}.field.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        loadArenaJson(content);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems =
    activeCategory === 'all'
      ? ALL_COMPETITION_PALETTE_ITEMS
      : ALL_COMPETITION_PALETTE_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-surface-dark border-t border-surface-border text-slate-200 select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-darker/95 backdrop-blur-sm border-b border-surface-border text-xs gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Grid size={13} className="text-brand-400" />
          <span className="font-semibold text-slate-200 text-xs">ชิ้นส่วนสนามกติกา</span>
          <span className="text-[10px] bg-brand-500/15 text-brand-300 border border-brand-500/25 px-1.5 py-0.2 rounded font-mono">
            {ALL_COMPETITION_PALETTE_ITEMS.length} แบบ
          </span>
        </div>

        {/* Rotate, Save, Import and Clear Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setRandomArenaModalOpen(true)}
            title="สุ่มสนามแข่งขันอัตโนมัติ เลือกระดับความยากง่ายได้ พร้อมบันทึกเป็น HTML และ PDF"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-cyan-600/30 to-brand-600/30 hover:from-cyan-600/40 hover:to-brand-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all btn-press shadow-sm"
          >
            <Dices size={12} className="text-cyan-400" />
            <span>สุ่มสนาม</span>
          </button>

          <button
            onClick={() => setVersionModalOpen(true)}
            title="จัดการเวอร์ชันสนามแข่ง (ดูเวอร์ชันเก่า, สลับสนาม, ดึงโค้ดที่ลิ้งค์ไว้)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 border border-violet-500/30 text-xs font-medium transition-all btn-press"
          >
            <GitBranch size={12} className="text-violet-400" />
            <span>เวอร์ชัน</span>
            <span className="px-1.5 py-0.2 rounded-full bg-violet-500/25 text-violet-200 text-[10px] font-mono">
              {projectVersions.length}
            </span>
          </button>

          <button
            onClick={rotateToolClockwise}
            title="หมุนชิ้นส่วน 90 องศา (Rotate)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card border border-surface-border text-slate-200 text-xs font-medium transition-all btn-press"
          >
            <RotateCw size={12} className="text-amber-400" />
            <span className="font-mono text-[11px]">{activeRotation}°</span>
          </button>

          <button
            onClick={handleDownloadField}
            title="บันทึกไฟล์สนาม (.field.json)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-emerald-400 border border-surface-border text-xs font-medium transition-all btn-press"
          >
            <Download size={12} />
            <span>ส่งออก</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportField}
            accept=".json,.field.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="นำเข้าไฟล์สนามจากเครื่อง (.field.json)"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-brand-300 border border-surface-border text-xs font-medium transition-all btn-press"
          >
            <Upload size={12} />
            <span>นำเข้า</span>
          </button>

          <button
            onClick={clearTiles}
            title="ล้างสนามทั้งหมดเป็นพื้นว่างเปล่า"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-dark hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-surface-border text-xs transition-all btn-press"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 bg-surface-dark border-b border-surface-border text-xs overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'all', label: `ทั้งหมด (${ALL_COMPETITION_PALETTE_ITEMS.length})` },
          { id: 'points', label: 'จุดปล่อย / Check Point' },
          { id: 'lines', label: 'เส้นทาง & ขอบสนาม' },
          { id: 'elevation', label: 'สะพาน & ไม้กระดก' },
          { id: 'tunnels', label: 'อุโมงค์' },
          { id: 'targets', label: 'จุดปล่อยกล่อง' },
          { id: 'hazards', label: 'หลุม & สิ่งกีดขวาง' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeCategory === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Palette Items Grid (Click to select, drag to canvas) */}
      <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
        {filteredItems.map((item) => {
          const isSelected = activeTool === item.type;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type, rotation: activeRotation }));
                setActiveTool(item.type);
              }}
              onClick={() => setActiveTool(item.type)}
              title={`${item.name} - ${item.description}\n(คลิกเลือก หรือลากไปวางในช่องสนาม 3D)`}
              className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center gap-2.5 select-none group hover:-translate-y-[1px] ${
                isSelected
                  ? 'border-brand-500 bg-brand-500/15 shadow-sm shadow-brand-500/20 ring-1 ring-brand-500/40'
                  : 'border-surface-border hover:border-slate-500 bg-surface-card/60 hover:bg-surface-card'
              }`}
            >
              {/* Visual SVG Thumbnail */}
              <div className="w-9 h-9 rounded-md shrink-0 shadow-sm overflow-hidden flex items-center justify-center p-0.5 bg-surface-dark border border-surface-border group-hover:scale-105 transition-transform">
                <TileThumbnail type={item.type} />
              </div>

              {/* Title & Badge */}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-200 text-xs truncate leading-tight group-hover:text-brand-300 transition-colors">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {item.badge || item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status strip */}
      <div className="px-3 py-1 bg-surface-darker border-t border-surface-border text-xs text-slate-300 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-400">ชิ้นส่วนที่เลือก:</span>
          <span className="text-brand-300 font-semibold">{activeTool}</span>
          <span className="text-amber-400">({activeRotation}°)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-sans">
          คลิกที่ช่องสนาม 3D เพื่อวางชิ้นส่วน
        </span>
      </div>
    </div>
  );
};
