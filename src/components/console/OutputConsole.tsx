import React, { useRef, useEffect, useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { SimulatorTelemetry } from '../simulator/SimulatorTelemetry';
import { SerialMonitor } from './SerialMonitor';
import {
  Terminal,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Gauge,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';

interface OutputConsoleProps {
  height?: number;
  onResetHeight?: () => void;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({
  height = 176,
  onResetHeight,
}) => {
  const {
    consoleLogs,
    clearConsole,
    buildState,
    bottomDockTab,
    setBottomDockTab,
    isBottomDockCollapsed,
    setIsBottomDockCollapsed,
    serialLogs,
    isSerialConnected,
  } = useIDEStore();

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  useEffect(() => {
    if (!isBottomDockCollapsed && bottomDockTab === 'terminal') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, isBottomDockCollapsed, bottomDockTab]);

  const handleCopyLogs = () => {
    const text = consoleLogs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filteredLogs =
    filterType === 'all'
      ? consoleLogs
      : consoleLogs.filter((l) => {
          if (filterType === 'info') return l.type === 'info' || l.type === 'success';
          return l.type === filterType;
        });

  const errorCount = consoleLogs.filter((l) => l.type === 'error').length;
  const warnCount = consoleLogs.filter((l) => l.type === 'warn').length;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />;
      case 'error':
        return <AlertCircle size={13} className="text-rose-400 mt-0.5 shrink-0" />;
      case 'warn':
        return <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />;
      default:
        return <Info size={13} className="text-sky-400 mt-0.5 shrink-0" />;
    }
  };

  return (
    <div
      style={{ height: isBottomDockCollapsed ? '32px' : `${height}px` }}
      className="bg-surface-darker/95 backdrop-blur-md border-t border-surface-border flex flex-col font-mono text-xs select-none transition-[height] duration-75 relative shrink-0"
    >
      {/* Bottom Dock Header Bar */}
      <div className="h-8 flex items-center justify-between px-3 bg-surface-dark border-b border-surface-border shrink-0 select-none">
        {/* Left: Tab Switchers */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setBottomDockTab('terminal');
              if (isBottomDockCollapsed) setIsBottomDockCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              bottomDockTab === 'terminal' && !isBottomDockCollapsed
                ? 'bg-surface-card text-white border border-surface-borderLight shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/40'
            }`}
          >
            <Terminal size={12} className="text-brand-400" />
            <span>Terminal & Flasher</span>
            <span className="text-[10px] text-slate-500 font-mono">({consoleLogs.length})</span>
          </button>

          <button
            onClick={() => {
              setBottomDockTab('serial');
              if (isBottomDockCollapsed) setIsBottomDockCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all relative ${
              bottomDockTab === 'serial' && !isBottomDockCollapsed
                ? 'bg-surface-card text-white border border-surface-borderLight shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/40'
            }`}
          >
            <Radio size={12} className={isSerialConnected ? 'text-emerald-400' : 'text-cyan-400'} />
            <span>Serial Monitor</span>
            {isSerialConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">({serialLogs.length})</span>
            )}
          </button>

          <button
            onClick={() => {
              setBottomDockTab('telemetry');
              if (isBottomDockCollapsed) setIsBottomDockCollapsed(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              bottomDockTab === 'telemetry' && !isBottomDockCollapsed
                ? 'bg-surface-card text-white border border-surface-borderLight shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/40'
            }`}
          >
            <Gauge size={12} className="text-amber-400" />
            <span>Telemetry & Dynamics</span>
          </button>

          {/* Build State indicator badge */}
          {buildState !== 'idle' && (
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tracking-wide ${
                buildState === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : buildState === 'error'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-brand-500/15 text-brand-300 animate-pulse border border-brand-500/30'
              }`}
            >
              {buildState.toUpperCase()}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Filters for Terminal Tab */}
          {bottomDockTab === 'terminal' && !isBottomDockCollapsed && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium transition ${
                  filterType === 'all'
                    ? 'bg-surface-card text-white border border-surface-border'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ทั้งหมด
              </button>

              {errorCount > 0 && (
                <button
                  onClick={() => setFilterType('error')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition ${
                    filterType === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  <AlertCircle size={10} />
                  <span>{errorCount}</span>
                </button>
              )}

              {warnCount > 0 && (
                <button
                  onClick={() => setFilterType('warn')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium transition ${
                    filterType === 'warn'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <AlertTriangle size={10} />
                  <span>{warnCount}</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Height Reset */}
          {onResetHeight && !isBottomDockCollapsed && height !== 176 && (
            <button
              onClick={onResetHeight}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-card transition border border-surface-border"
              title="คืนค่าความสูง Terminal เริ่มต้น (176px)"
            >
              176px
            </button>
          )}

          {/* Copy Logs (Terminal tab only) */}
          {bottomDockTab === 'terminal' && !isBottomDockCollapsed && (
            <button
              onClick={handleCopyLogs}
              className="text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-surface-card"
              title="คัดลอกข้อความทั้งหมด"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          )}

          {/* Clear Console */}
          {bottomDockTab === 'terminal' && !isBottomDockCollapsed && (
            <button
              onClick={clearConsole}
              className="text-slate-400 hover:text-rose-400 transition p-1 rounded hover:bg-surface-card"
              title="ล้างหน้าต่าง Console"
            >
              <Trash2 size={12} />
            </button>
          )}

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsBottomDockCollapsed(!isBottomDockCollapsed)}
            className="text-slate-400 hover:text-slate-200 transition p-1 rounded hover:bg-surface-card"
            title={isBottomDockCollapsed ? 'ขยายหน้าต่างล่าง' : 'ย่อเก็บหน้าต่างล่าง'}
          >
            {isBottomDockCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Dock Content */}
      {!isBottomDockCollapsed && (
        <div className="flex-1 overflow-hidden">
          {bottomDockTab === 'terminal' ? (
            <div className="h-full overflow-y-auto p-2.5 space-y-1 select-text">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs font-sans">
                  ไม่มีข้อความในหมวดหมู่นี้
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 leading-relaxed px-1.5 py-0.5 rounded hover:bg-surface-card/40 transition-colors ${
                      log.type === 'error'
                        ? 'text-rose-300'
                        : log.type === 'success'
                        ? 'text-emerald-300'
                        : log.type === 'warn'
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {getLogIcon(log.type)}
                    <span className="text-[10px] text-slate-500 shrink-0 select-none">
                      [{log.time}]
                    </span>
                    <span className="break-all whitespace-pre-wrap">{log.text}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          ) : bottomDockTab === 'serial' ? (
            <SerialMonitor />
          ) : (
            <SimulatorTelemetry />
          )}
        </div>
      )}
    </div>
  );
};