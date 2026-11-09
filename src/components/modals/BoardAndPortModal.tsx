import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  Cpu,
  Usb,
  X,
  Check,
  RefreshCw,
  Globe,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

export const BoardAndPortModal: React.FC = () => {
  const {
    isHardwareModalOpen,
    setHardwareModalOpen,
    boards,
    selectedBoard,
    setSelectedBoard,
    ports,
    selectedPort,
    setSelectedPort,
    refreshPorts,
    isAutoPortDetect,
    setIsAutoPortDetect,
    boardManagerUrls,
    addBoardManagerUrl,
    addConsoleLog,
  } = useIDEStore();

  const [activeTab, setActiveTab] = useState<'connection' | 'boards'>('connection');
  const [newUrl, setNewUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);

  if (!isHardwareModalOpen) return null;

  const handleRefresh = async () => {
    setIsScanning(true);
    await refreshPorts(false);
    setTimeout(() => setIsScanning(false), 500);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      addBoardManagerUrl(newUrl.trim());
      setNewUrl('');
    }
  };

  const isConnected = !!selectedPort && ports.some((p) => p.portName === selectedPort);

  return (
    <div
      onClick={() => setHardwareModalOpen(false)}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-dark border border-surface-borderLight rounded-2xl shadow-modal-elevation w-full max-w-2xl max-h-[88vh] flex flex-col text-slate-100 overflow-hidden animate-in zoom-in-95 duration-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-darker shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 border border-brand-500/25 text-brand-400">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">
                ตั้งค่าบอร์ดและพอร์ตเชื่อมต่อ (Hardware & Connection)
              </h2>
              <p className="text-[11px] text-slate-400">
                เลือกบอร์ดไมโครคอนโทรลเลอร์ ตรวจสอบพอร์ต USB และจัดการการเชื่อมต่อ
              </p>
            </div>
          </div>
          <button
            onClick={() => setHardwareModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="px-5 py-2.5 bg-surface-darker/60 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse shadow-glow-emerald' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-200">
              สถานะ:{' '}
              {isConnected ? (
                <span className="text-emerald-400 font-semibold font-mono">
                  เชื่อมต่อแล้ว ({selectedPort} - {selectedBoard.name})
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">
                  ยังไม่ได้เชื่อมต่อบอร์ด (โปรดเสียบสาย USB)
                </span>
              )}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-emerald-400 border border-surface-border text-xs transition"
          >
            <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
            <span>สแกนพอร์ตใหม่</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-2 bg-surface-darker/40 border-b border-surface-border text-xs">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition ${
              activeTab === 'connection'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb size={13} />
            <span>พอร์ต USB & การเชื่อมต่อ</span>
          </button>

          <button
            onClick={() => setActiveTab('boards')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition ${
              activeTab === 'boards'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={13} />
            <span>เลือกบอร์ด & ตัวจัดการบอร์ด</span>
          </button>
        </div>

        {/* Tab 1: USB Port Selection */}
        {activeTab === 'connection' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Auto Detect Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card/60 border border-surface-border">
              <div>
                <div className="font-semibold text-xs text-slate-200">
                  ระบบตรวจจับพอร์ต USB อัตโนมัติ (Auto-Port Detection)
                </div>
                <div className="text-[11px] text-slate-400">
                  สแกนหาพอร์ตทันทีเมื่อมีการเสียบหรือถอดสาย USB ของหุ่นยนต์
                </div>
              </div>
              <button
                onClick={() => setIsAutoPortDetect(!isAutoPortDetect)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoPortDetect ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAutoPortDetect ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Ports List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                รายการพอร์ตที่ตรวจพบในเครื่อง ({ports.length}):
              </label>

              {ports.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-surface-border bg-surface-card/30 text-slate-400 text-xs space-y-2">
                  <Usb size={28} className="mx-auto text-slate-500" />
                  <p>ไม่พบพอร์ต Serial หรือสาย USB ในขณะนี้</p>
                  <p className="text-[10px] text-slate-500">
                    โปรดเสียบสาย USB ของบอร์ด PTBOT หรือ Arduino เข้ากับเครื่อง แล้วกดปุ่มสแกนพอร์ตใหม่
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ports.map((p) => {
                    const isPortSelected = selectedPort === p.portName;
                    return (
                      <div
                        key={p.portName}
                        onClick={() => {
                          setSelectedPort(p.portName);
                          addConsoleLog(`[Port Manager] เลือกพอร์ต: ${p.portName}`, 'info');
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isPortSelected
                            ? 'border-brand-500 bg-brand-500/15 shadow-sm ring-1 ring-brand-500/30'
                            : 'border-surface-border hover:border-slate-500 bg-surface-card/60 hover:bg-surface-card'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Usb
                            size={16}
                            className={isPortSelected ? 'text-emerald-400' : 'text-slate-400'}
                          />
                          <div>
                            <div className="font-mono text-xs font-bold text-slate-100">
                              {p.portName}
                            </div>
                            {p.description && (
                              <div className="text-[10px] text-slate-400 font-sans">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isPortSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full font-sans">
                            <Check size={11} />
                            <span>ใช้งานอยู่</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Board Selection & Board Manager */}
        {activeTab === 'boards' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Boards Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                เลือกบอร์ดเป้าหมายสำหรับการคอมไพล์และอัปโหลด:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {boards.map((b) => {
                  const isBoardSelected = selectedBoard.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBoard(b);
                        addConsoleLog(`Switched target board: ${b.name}`, 'info');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isBoardSelected
                          ? 'border-brand-500 bg-brand-500/15 shadow-sm ring-1 ring-brand-500/30'
                          : 'border-surface-border hover:border-slate-500 bg-surface-card/60 hover:bg-surface-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu
                            size={15}
                            className={
                              b.architecture === 'esp32' ? 'text-amber-400' : 'text-brand-400'
                            }
                          />
                          <span className="font-semibold text-xs text-slate-100">{b.name}</span>
                        </div>
                        {isBoardSelected && (
                          <span className="p-0.5 rounded-full bg-brand-500 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono mt-2 space-y-0.5">
                        <div>สถาปัตยกรรม: {b.architecture?.toUpperCase() || 'AVR'}</div>
                        <div>ความเร็ว: {b.fCpu ? `${parseInt(b.fCpu) / 1000000}MHz` : '16MHz'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Board Manager URL */}
            <div className="p-3 rounded-xl bg-surface-card/40 border border-surface-border space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                เพิ่ม Board Manager URL:
              </span>
              <form onSubmit={handleAddUrl} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1 bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1 text-xs">
                  <Globe size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://.../package_esp32_index.json"
                    className="bg-transparent flex-1 text-xs text-slate-200 placeholder-slate-500 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-surface-card hover:bg-surface-hover text-slate-200 border border-surface-border text-xs font-medium transition"
                >
                  เพิ่ม URL
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-darker flex items-center justify-end">
          <button
            onClick={() => setHardwareModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow-sm"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};