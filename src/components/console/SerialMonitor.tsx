import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  Send,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  Clock,
  ArrowDown,
  Plug,
  PlugZap,
  Radio,
  Terminal as TerminalIcon,
  HelpCircle,
  AlertCircle,
  Cpu,
} from 'lucide-react';

const BAUD_RATES = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 460800, 921600,
];

const LINE_ENDINGS: Array<{ id: 'none' | 'nl' | 'cr' | 'nlcr'; label: string; value: string }> = [
  { id: 'none', label: 'No line ending', value: '' },
  { id: 'nl', label: 'Newline (\\n)', value: '\n' },
  { id: 'cr', label: 'Carriage return (\\r)', value: '\r' },
  { id: 'nlcr', label: 'Both NL & CR (\\r\\n)', value: '\r\n' },
];

export const SerialMonitor: React.FC = () => {
  const {
    serialLogs,
    addSerialLog,
    clearSerialLogs,
    serialBaudRate,
    setSerialBaudRate,
    serialLineEnding,
    setSerialLineEnding,
    isSerialConnected,
    setIsSerialConnected,
    isSerialAutoscroll,
    setIsSerialAutoscroll,
    showSerialTimestamps,
    setShowSerialTimestamps,
    selectedPort,
    selectedBoard,
  } = useIDEStore();

  const [inputMessage, setInputMessage] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isVirtualMode, setIsVirtualMode] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const serialPortRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const keepReadingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom if enabled
  useEffect(() => {
    if (isSerialAutoscroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, isSerialAutoscroll]);

  // Clean disconnect helper
  const disconnectSerial = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close().catch(() => {});
        serialPortRef.current = null;
      }
    } catch (e: any) {
      console.warn('Error during serial close:', e);
    }
    setIsSerialConnected(false);
    setIsVirtualMode(false);
    addSerialLog('ตัดการเชื่อมต่อ Serial Port เรียบร้อย', 'system');
  }, [addSerialLog, setIsSerialConnected]);

  // Web Serial connect handler
  const handleConnect = async () => {
    if (isSerialConnected) {
      await disconnectSerial();
      return;
    }

    // Check Web Serial API support
    const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

    if (hasWebSerial) {
      try {
        addSerialLog('กำลังรอผู้ใช้เลือกพอร์ต Serial ผ่าน Web Serial API...', 'system');
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: serialBaudRate });
        serialPortRef.current = port;
        setIsSerialConnected(true);
        setIsVirtualMode(false);
        addSerialLog(
          `เชื่อมต่อ Serial Port สำเร็จ (${selectedBoard?.name || 'ESP32/MCU'}) ความเร็ว ${serialBaudRate} baud`,
          'system'
        );

        // Start reading loop
        keepReadingRef.current = true;
        const textDecoder = new TextDecoderStream();
        port.readable.pipeTo(textDecoder.writable).catch(() => {});
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        (async () => {
          let lineBuffer = '';
          try {
            while (keepReadingRef.current) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                lineBuffer += value;
                const lines = lineBuffer.split(/\r?\n/);
                lineBuffer = lines.pop() || '';
                for (const line of lines) {
                  if (line.trim().length > 0) {
                    addSerialLog(line, 'incoming');
                  }
                }
              }
            }
          } catch (readErr: any) {
            if (keepReadingRef.current) {
              addSerialLog(`เกิดข้อผิดพลาดในการอ่าน Serial: ${readErr.message}`, 'error');
            }
          } finally {
            if (lineBuffer.trim().length > 0) {
              addSerialLog(lineBuffer, 'incoming');
            }
          }
        })();
        return;
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          addSerialLog('ยกเลิกการเลือกพอร์ต Serial', 'system');
          return;
        }
        addSerialLog(
          `ไม่สามารถเปิดพอร์ตผ่าน Web Serial ได้ (${err.message}) สลับสู่โหมดจำลอง (Virtual MCU)`,
          'error'
        );
      }
    }

    // Fallback: Virtual MCU Simulation Mode
    setIsSerialConnected(true);
    setIsVirtualMode(true);
    addSerialLog(
      `[Virtual Serial] เปิดโหมดจำลอง MCU (Baud: ${serialBaudRate}) สามารถพิมพ์คำสั่งเพื่อทดสอบการสื่อสารได้ทันที`,
      'system'
    );
    addSerialLog(`[MCU] PTBOT Atom VX Dual-Core Ready. Type "help" or "status" to test.`, 'incoming');
  };

  // Virtual response simulator
  const handleVirtualResponse = (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    setTimeout(() => {
      if (!isSerialConnected) return;

      if (clean === 'help') {
        addSerialLog('--- PTBOT Serial Command Help ---', 'incoming');
        addSerialLog('  status   - แสดงสถานะบอร์ดและการประมวลผล', 'incoming');
        addSerialLog('  sensors  - อ่านค่าเซนเซอร์เส้นและ Gyro ปัจจุบัน', 'incoming');
        addSerialLog('  battery  - ตรวจสอบระดับแรงดันแบตเตอรี่ LiPo', 'incoming');
        addSerialLog('  ping     - ทดสอบการตอบสนองของบอร์ด', 'incoming');
        addSerialLog('  reset    - ซอฟต์แวร์รีเซ็ตระบบหุ่นยนต์', 'incoming');
      } else if (clean === 'status') {
        addSerialLog(`[PTBOT] Board: ${selectedBoard?.name || 'ESP32 PTBOT Atom VX'} | CPU: 240MHz`, 'incoming');
        addSerialLog(`[PTBOT] State: READY | Free Heap: 284KB | LoopRate: 1000Hz`, 'incoming');
      } else if (clean === 'sensors') {
        addSerialLog(`[PTBOT] Sensor Values: L2:450 | L1:480 | C:2240(LINE) | R1:500 | R2:470`, 'incoming');
        addSerialLog(`[PTBOT] IMU/Gyro: Yaw=0.00° | Pitch=0.12° | Roll=-0.04°`, 'incoming');
      } else if (clean === 'battery') {
        addSerialLog(`[PTBOT] Battery: 8.32V (LiPo 2S - 94% Full)`, 'incoming');
      } else if (clean === 'ping') {
        addSerialLog(`[PTBOT] PONG! (Latency < 1ms)`, 'incoming');
      } else if (clean === 'reset') {
        addSerialLog(`[PTBOT] Rebooting MCU...`, 'system');
        setTimeout(() => {
          addSerialLog(`=== PTBOT Atom VX System Boot Complete (115200 baud) ===`, 'incoming');
        }, 300);
      } else {
        addSerialLog(`[PTBOT ACK] Received (${clean.length} chars): "${cmd}"`, 'incoming');
      }
    }, 60);
  };

  // Send message
  const handleSendMessage = async () => {
    const trimmed = inputMessage;
    if (!trimmed.trim()) return;

    const ending = LINE_ENDINGS.find((e) => e.id === serialLineEnding)?.value ?? '\n';
    const payload = trimmed + ending;

    // Log outgoing in monitor
    addSerialLog(`>> ${trimmed}`, 'outgoing');

    // Add to command history
    setCommandHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 30));
    setHistoryIndex(-1);
    setInputMessage('');

    if (isVirtualMode || !serialPortRef.current) {
      handleVirtualResponse(trimmed);
      return;
    }

    // Real Web Serial write
    try {
      if (serialPortRef.current.writable) {
        const textEncoder = new TextEncoderStream();
        textEncoder.readable.pipeTo(serialPortRef.current.writable).catch(() => {});
        const writer = textEncoder.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();
      }
    } catch (writeErr: any) {
      addSerialLog(`ส่งข้อมูลไม่สำเร็จ: ${writeErr.message}`, 'error');
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(nextIdx);
      setInputMessage(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputMessage(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputMessage('');
      }
    }
  };

  // Copy logs
  const handleCopyLogs = () => {
    const text = serialLogs
      .map((l) => (showSerialTimestamps ? `[${l.timestamp}] ` : '') + l.text)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Export / Download logs
  const handleDownloadLogs = () => {
    const text = serialLogs
      .map((l) => (showSerialTimestamps ? `[${l.timestamp}] ` : '') + l.text)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial_monitor_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = filterQuery.trim()
    ? serialLogs.filter((l) => l.text.toLowerCase().includes(filterQuery.toLowerCase()))
    : serialLogs;

  return (
    <div className="h-full flex flex-col bg-[#0b0f17] text-xs font-mono select-none overflow-hidden">
      {/* Sub-toolbar: Connection & Serial Options */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-dark border-b border-surface-border text-xs gap-2 flex-wrap shrink-0">
        {/* Left: Connect button & Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleConnect}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition shadow-sm ${
              isSerialConnected
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/30'
            }`}
          >
            {isSerialConnected ? (
              <>
                <PlugZap size={13} className="text-rose-400" />
                <span>ตัดการเชื่อมต่อ</span>
              </>
            ) : (
              <>
                <Plug size={13} />
                <span>เชื่อมต่อ Serial</span>
              </>
            )}
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-card border border-surface-border text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isSerialConnected
                  ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className={isSerialConnected ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
              {isSerialConnected
                ? isVirtualMode
                  ? 'Virtual MCU (จำลอง)'
                  : selectedPort || 'Connected'
                : 'ไม่ได้เชื่อมต่อ'}
            </span>
          </div>

          {/* Baud Rate selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Baud:</span>
            <select
              value={serialBaudRate}
              disabled={isSerialConnected}
              onChange={(e) => setSerialBaudRate(Number(e.target.value))}
              className="bg-surface-card border border-surface-border text-slate-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-brand-500 disabled:opacity-60 cursor-pointer"
            >
              {BAUD_RATES.map((b) => (
                <option key={b} value={b}>
                  {b} {b === 115200 ? '(แนะนำ)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Line ending selector */}
          <div className="flex items-center gap-1">
            <select
              value={serialLineEnding}
              onChange={(e: any) => setSerialLineEnding(e.target.value)}
              className="bg-surface-card border border-surface-border text-slate-200 rounded px-1.5 py-0.5 text-xs outline-none focus:border-brand-500 cursor-pointer"
            >
              {LINE_ENDINGS.map((ending) => (
                <option key={ending.id} value={ending.id}>
                  {ending.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Search, Autoscroll, Timestamps, Clear, Copy */}
        <div className="flex items-center gap-1.5">
          {/* Quick Filter */}
          <div className="relative flex items-center">
            <Search size={11} className="absolute left-2 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="ค้นหาใน Serial..."
              className="bg-surface-card border border-surface-border rounded-md pl-6 pr-2 py-0.5 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 w-32 focus:w-44 transition-all"
            />
          </div>

          {/* Timestamp Toggle */}
          <button
            onClick={() => setShowSerialTimestamps(!showSerialTimestamps)}
            title="แสดง/ซ่อน เวลาในแต่ละบรรทัด"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
              showSerialTimestamps
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
            }`}
          >
            <Clock size={11} />
            <span>เวลา</span>
          </button>

          {/* Autoscroll Toggle */}
          <button
            onClick={() => setIsSerialAutoscroll(!isSerialAutoscroll)}
            title="เลื่อนหน้าจอลงอัตโนมัติเมื่อมีข้อมูลใหม่"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition ${
              isSerialAutoscroll
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
            }`}
          >
            <ArrowDown size={11} />
            <span>เลื่อนจอ</span>
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownloadLogs}
            title="ดาวน์โหลดข้อความทั้งหมดเป็นไฟล์ .txt"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-card transition"
          >
            <Download size={13} />
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="คัดลอกข้อความทั้งหมด"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-surface-card transition"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearSerialLogs}
            title="ล้างข้อความทั้งหมดใน Serial Monitor"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-surface-card transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5 select-text font-mono text-[11px] leading-relaxed">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 py-6">
            <Radio size={24} className="opacity-40" />
            <p className="text-xs">ยังไม่มีข้อมูล Serial เข้ามาในขณะนี้</p>
            <p className="text-[10px] text-slate-600">
              กด &ldquo;เชื่อมต่อ Serial&rdquo; ด้านบน หรือพิมพ์คำสั่งส่งด้านล่างเพื่อเริ่มการสื่อสาร
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let textColor = 'text-slate-200';
            if (log.type === 'outgoing') textColor = 'text-cyan-400 font-semibold';
            else if (log.type === 'system') textColor = 'text-amber-400 italic';
            else if (log.type === 'error') textColor = 'text-rose-400';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-white/[0.03] px-1 py-0.5 rounded transition-colors group"
              >
                {showSerialTimestamps && (
                  <span className="text-[10px] text-slate-500 select-none shrink-0 font-mono">
                    [{log.timestamp}]
                  </span>
                )}
                <span className={`break-all whitespace-pre-wrap ${textColor}`}>
                  {log.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Send Command Input Bar */}
      <div className="p-2 bg-surface-dark border-t border-surface-border flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isSerialConnected
                ? 'พิมพ์ข้อความหรือคำสั่ง Serial ที่ต้องการส่ง... (กด Enter เพื่อส่ง, ลูกศรขึ้นเพื่อดูประวัติ)'
                : 'เชื่อมต่อ Serial ด้านบนก่อนเพื่อส่งคำสั่งไปยังบอร์ดหุ่นยนต์...'
            }
            className="w-full bg-[#070a10] border border-surface-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500 transition shadow-inner font-mono"
          />
          {inputMessage && (
            <button
              onClick={() => setInputMessage('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-brand-600/20 shrink-0"
        >
          <Send size={12} />
          <span>ส่ง</span>
        </button>
      </div>
    </div>
  );
};
