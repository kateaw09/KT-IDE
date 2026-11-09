import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { Cpu, X, Download, Check, Plus, Globe, ShieldCheck, RefreshCw, Layers } from 'lucide-react';

export const BoardManagerModal: React.FC = () => {
  const {
    isBoardManagerOpen,
    setBoardManagerOpen,
    boardManagerUrls,
    addBoardManagerUrl,
    boards,
    setSelectedBoard,
    addConsoleLog,
  } = useIDEStore();

  const [search, setSearch] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [installedVersions, setInstalledVersions] = useState<Record<string, string>>({
    ptbot: '1.1.7',
    avr: '1.8.8',
  });

  if (!isBoardManagerOpen) return null;

  const handleInstall = (pkgId: string, version: string) => {
    setIsInstalling(pkgId);
    addConsoleLog(`[Boards Manager] Downloading package payload for ${pkgId} v${version}...`, 'info');
    setTimeout(() => {
      setInstalledVersions((prev) => ({ ...prev, [pkgId]: version }));
      setIsInstalling(null);
      addConsoleLog(`[Boards Manager] Package ${pkgId} v${version} installed successfully!`, 'success');
    }, 1200);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      addBoardManagerUrl(newUrl.trim());
      setNewUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-darker">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <span>Boards Manager</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-surface-card border border-surface-border text-slate-300">
                  ตัวจัดการบอร์ด & ESP32 Core
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">ติดตั้งและจัดการชุดคำสั่งบอร์ดไมโครคอนโทรลเลอร์ (PTBOT & Arduino)</p>
            </div>
          </div>
          <button
            onClick={() => setBoardManagerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-card transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* URL Settings & Search */}
        <div className="p-4 border-b border-surface-border bg-surface-dark/70 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อบอร์ด เช่น PTBOT Atom, ESP32, Uno..."
              className="flex-1 bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition"
            />
          </div>

          <form onSubmit={handleAddUrl} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs">
              <Globe size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="เพิ่ม URL Board Manager JSON..."
                className="bg-transparent flex-1 text-xs text-slate-200 placeholder-slate-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-card hover:bg-slate-700 border border-surface-border text-xs font-medium text-slate-200 transition"
            >
              <Plus size={13} />
              <span>เพิ่ม URL</span>
            </button>
          </form>

          {/* Active URLs list */}
          <div className="text-[10px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Board Index URLs:</span>
            {boardManagerUrls.map((url, i) => (
              <div key={i} className="font-mono text-[10px] text-brand-400/90 truncate bg-surface-darker/60 px-2 py-0.5 rounded border border-surface-border/50">
                {url}
              </div>
            ))}
          </div>
        </div>

        {/* Board Packages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Package 1: PTBOT ESP32 */}
          <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">PTBOT ESP32</span>
                  <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-1.5 py-0.5 rounded font-mono">
                    Official Support
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Check size={10} />
                    <span>ติดตั้งแล้ว v{installedVersions.ptbot}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  บอร์ดหุ่นยนต์ ESP32 พัฒนาโดย PTBOT สำหรับการแข่งขันและการเรียนรู้หุ่นยนต์อัตโนมัติ
                </p>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ผู้ดูแล: <span className="text-slate-300">PTBOT</span> | สถาปัตยกรรม: <span className="font-mono text-slate-300">esp32 (Xtensa Dual-Core 240MHz)</span>
                </div>
              </div>

              <button
                onClick={() => handleInstall('ptbot', '1.1.7')}
                disabled={isInstalling === 'ptbot'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition shadow-sm"
              >
                {isInstalling === 'ptbot' ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>กำลังติดตั้ง...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>อัปเดต v1.1.7</span>
                  </>
                )}
              </button>
            </div>

            {/* Boards in this package */}
            <div className="bg-surface-darker/60 rounded-lg p-2.5 border border-surface-border text-xs space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300">บอร์ดที่รองรับในแพ็กเกจนี้:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { id: 'ptbot_atom_vx', name: 'PTBOT Atom VX', desc: '4MB Flash, Motor & Line ADC' },
                  { id: 'ptbot_atom_mini', name: 'PTBOT Atom mini', desc: 'Compact ESP32 Controller' },
                  { id: 'ptbot_strom_mini', name: 'PTBOT Strom mini', desc: '8MB Flash, High-Power Drive' },
                ].map((b) => (
                  <div
                    key={b.id}
                    className="p-2 rounded bg-surface-card border border-surface-border flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-semibold text-brand-300 text-xs">{b.name}</div>
                      <div className="text-[10px] text-slate-400">{b.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        const target = boards.find(x => x.id === b.id);
                        if (target) {
                          setSelectedBoard(target);
                          addConsoleLog(`เลือกบอร์ดใช้งาน: ${target.name}`, 'info');
                          setBoardManagerOpen(false);
                        }
                      }}
                      className="mt-2 text-[10px] text-center w-full py-0.5 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 font-medium transition"
                    >
                      เลือกบอร์ดนี้
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Package 2: Arduino AVR */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface-card/60 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">Arduino AVR Boards</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">Built-in</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Check size={10} />
                    <span>ติดตั้งแล้ว v{installedVersions.avr}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  บอร์ด Arduino Uno, Nano, Mega 2560 สำหรับการทดลองทั่วไป
                </p>
              </div>

              <button
                onClick={() => {
                  const target = boards.find(x => x.id === 'uno');
                  if (target) {
                    setSelectedBoard(target);
                    addConsoleLog(`เลือกบอร์ดใช้งาน: ${target.name}`, 'info');
                    setBoardManagerOpen(false);
                  }
                }}
                className="px-3 py-1 rounded bg-surface-darker hover:bg-slate-700 text-xs text-slate-300 border border-surface-border transition"
              >
                เลือกบอร์ดนี้
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-darker flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>แพ็กเกจทั้งหมดได้รับการตรวจสอบความเข้ากันได้แบบออฟไลน์ 100%</span>
          </div>
          <button
            onClick={() => setBoardManagerOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-200 text-xs font-medium border border-surface-border transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
