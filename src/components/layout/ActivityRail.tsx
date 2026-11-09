import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  FolderTree,
  Sparkles,
  LayoutGrid,
  GitBranch,
  Settings,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
} from 'lucide-react';
import { SidebarTab } from '../../types/ide';

export const ActivityRail: React.FC = () => {
  const {
    activeSidebarTab,
    toggleSidebarTab,
    setSettingsOpen,
    toggleCommandPalette,
    projectFiles,
    projectVersions,
  } = useIDEStore();

  const navItems: {
    id: SidebarTab;
    label: string;
    icon: LucideIcon;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'files',
      label: 'ไฟล์โครงงาน (Files)',
      icon: FolderTree,
      badge: projectFiles.length,
      badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    },
    {
      id: 'macro',
      label: 'ชุดคำสั่ง & ฟังก์ชั่น (Macro)',
      icon: Sparkles,
      badge: 'Fx',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'arena',
      label: 'ชิ้นส่วนสนามกติกา (Arena Tools)',
      icon: LayoutGrid,
    },
    {
      id: 'versions',
      label: 'ประวัติเวอร์ชัน (Versions)',
      icon: GitBranch,
      badge: projectVersions.length > 0 ? projectVersions.length : undefined,
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    },
  ];

  return (
    <aside className="w-12 bg-surface-darker/95 backdrop-blur-md border-r border-surface-border flex flex-col items-center justify-between py-2 select-none z-30 shrink-0">
      {/* Top Nav Rail */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSidebarTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => toggleSidebarTab(item.id)}
              title={`${item.label} (คลิกเพื่อเปิด/ปิด)`}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all group ${
                isActive
                  ? 'bg-surface-card text-brand-400 border border-surface-borderLight shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/60'
              }`}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-500 rounded-r-full shadow-glow-brand" />
              )}

              <Icon
                size={18}
                className={`transition-transform group-hover:scale-105 ${
                  isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {/* Badge indicator */}
              {item.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-1 text-[9px] font-mono font-bold px-1 py-0.2 rounded-full border leading-none ${
                    item.badgeColor || 'bg-surface-card text-slate-300 border-surface-border'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Nav Rail */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Toggle Command Palette */}
        <button
          onClick={toggleCommandPalette}
          title="เปิด Command Palette (Ctrl+P / Ctrl+K)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-card transition-all group"
        >
          <Command size={16} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* App Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="ตั้งค่าแอปพลิเคชัน (Ctrl+,)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-card transition-all group"
        >
          <Settings size={17} className="group-hover:rotate-45 transition-transform" />
        </button>

        <div className="w-5 h-[1px] bg-surface-border my-1" />

        {/* Toggle Sidebar Collapse */}
        <button
          onClick={() => toggleSidebarTab(activeSidebarTab || 'files')}
          title={activeSidebarTab ? 'พับเก็บแถบเครื่องมือซ้าย (Ctrl+B)' : 'เปิดแถบเครื่องมือซ้าย (Ctrl+B)'}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-surface-card transition-all"
        >
          {activeSidebarTab ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>
    </aside>
  );
};