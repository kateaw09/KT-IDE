import React from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { TILE_SIZE_CM } from '../../sim-engine/physics';
import { Compass, Gauge, MapPin, Cpu } from 'lucide-react';

export const SimulatorTelemetry: React.FC = () => {
  const { robotState, simStatus } = useSimulatorStore();

  const currentRow = Math.floor(robotState.y / TILE_SIZE_CM);
  const currentCol = Math.floor(robotState.x / TILE_SIZE_CM);
  const headingDeg = Math.round(((robotState.theta * 180) / Math.PI) % 360);

  return (
    <div className="flex flex-col h-full bg-surface-dark p-3 select-none overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Metric 1: Position */}
        <div className="bg-surface-card/80 border border-surface-border rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-sans font-medium">พิกัดหุ่น (X, Y)</span>
            <MapPin size={13} className="text-brand-400" />
          </div>
          <div className="font-mono text-sm font-semibold text-slate-100">
            {robotState.x.toFixed(1)} <span className="text-xs text-slate-400 font-normal">cm</span>, {robotState.y.toFixed(1)} <span className="text-xs text-slate-400 font-normal">cm</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            ระยะห่างจากจุดอ้างอิง
          </div>
        </div>

        {/* Metric 2: Grid Cell */}
        <div className="bg-surface-card/80 border border-surface-border rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-sans font-medium">ตำแหน่งช่องสนาม</span>
            <span className="text-[10px] font-mono bg-brand-500/15 text-brand-300 px-1.5 py-0.2 rounded border border-brand-500/25">
              4x8 Grid
            </span>
          </div>
          <div className="font-mono text-sm font-semibold text-brand-300">
            แถว {currentRow} <span className="text-slate-500">:</span> คอลัมน์ {currentCol}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Grid [R{currentRow}, C{currentCol}]
          </div>
        </div>

        {/* Metric 3: Heading & Pitch */}
        <div className="bg-surface-card/80 border border-surface-border rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-sans font-medium">มุมไจโร & ความชัน</span>
            <Compass size={13} className="text-amber-400" />
          </div>
          <div className="font-mono text-sm font-semibold text-slate-100">
            {headingDeg}° <span className="text-slate-500 text-xs">/</span> <span className={robotState.pitch !== 0 ? 'text-amber-400' : 'text-slate-300'}>{robotState.pitch > 0 ? `+${robotState.pitch}°` : `${robotState.pitch}°`}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            {robotState.pitch > 2 ? 'กำลังขึ้นสะพาน' : robotState.pitch < -2 ? 'กำลังลงสะพาน' : 'พื้นระนาบปกติ'}
          </div>
        </div>

        {/* Metric 4: Left / Right Motor Speed */}
        <div className="bg-surface-card/80 border border-surface-border rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-sans font-medium">กำลังมอเตอร์ (L / R)</span>
            <Gauge size={13} className="text-emerald-400" />
          </div>
          <div className="font-mono text-sm font-semibold text-emerald-400">
            {robotState.vLeft.toFixed(0)}% <span className="text-slate-500 text-xs">/</span> {robotState.vRight.toFixed(0)}%
          </div>
          {/* Mini progress bars for motor speed */}
          <div className="flex gap-1.5 items-center mt-1.5">
            <div className="flex-1 bg-surface-dark h-1 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, Math.abs(robotState.vLeft)))}%` }}
              />
            </div>
            <div className="flex-1 bg-surface-dark h-1 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, Math.abs(robotState.vRight)))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};