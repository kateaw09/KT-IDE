import React from 'react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useIDEStore } from '../../store/useIDEStore';
import { Play, Pause, RotateCcw, Eraser, Sparkles, Dices, RotateCw, MapPin, Undo2 } from 'lucide-react';

export const SimulatorControls: React.FC = () => {
  const { code, addConsoleLog, getMainCode, setRandomArenaModalOpen } = useIDEStore();
  const {
    simStatus,
    startSimulationWithCode,
    pauseSimulation,
    resumeSimulation,
    resetRobot,
    clearTrail,
    robotState,
    placementMode,
    setPlacementMode,
    rotateRobot,
    customStartPose,
    resetRobotToStartTile,
  } = useSimulatorStore();

  const handleRun = () => {
    const mainSource = getMainCode() || code;
    addConsoleLog('Parsing code & launching 3D Field Simulation...', 'info');
    startSimulationWithCode(mainSource);
  };

  const headingDeg = Math.round((((robotState.theta * 180) / Math.PI) % 360 + 360) % 360);
  const getDirectionArrow = (deg: number) => {
    if (deg >= 45 && deg < 135) return '↓ ใต้';
    if (deg >= 135 && deg < 225) return '← ตก';
    if (deg >= 225 && deg < 315) return '↑ เหนือ';
    return '→ ออก';
  };

  const getStatusBadge = () => {
    switch (simStatus) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            กำลังจำลอง
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            หยุดชั่วคราว
          </span>
        );
      case 'foul':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ฟาวล์ (ตกหลุม)
          </span>
        );
      case 'finished':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            เสร็จสิ้นภารกิจ
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-card text-slate-400 border border-surface-border text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            พร้อมจำลอง
          </span>
        );
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-surface-darker/95 backdrop-blur-sm border-t border-surface-border text-xs gap-2 select-none shrink-0 h-10 overflow-x-auto">
      {/* Simulation Playback Actions */}
      <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
        {simStatus === 'running' ? (
          <button
            onClick={pauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium transition-all shadow-sm btn-press"
          >
            <Pause size={12} />
            <span>หยุดชั่วคราว</span>
          </button>
        ) : simStatus === 'paused' ? (
          <button
            onClick={resumeSimulation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-sm btn-press"
          >
            <Play size={12} fill="currentColor" />
            <span>เล่นต่อ</span>
          </button>
        ) : (
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm hover:shadow-glow-emerald transition-all btn-press"
          >
            <Play size={12} fill="currentColor" />
            <span>เริ่มจำลอง</span>
          </button>
        )}

        <button
          onClick={() => {
            resetRobot();
            addConsoleLog(
              customStartPose
                ? 'Simulator robot reset to custom start pose.'
                : 'Simulator robot reset to starting dock.',
              'info'
            );
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-white border border-surface-border transition-all btn-press"
          title="รีเซ็ตตำแหน่งหุ่นยนต์ไปที่จุด Start (หรือจุดเริ่มต้นที่กำหนดย้ายไว้)"
        >
          <RotateCcw size={12} />
          <span>รีเซ็ตหุ่น</span>
        </button>

        <button
          onClick={clearTrail}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-400 hover:text-slate-200 border border-surface-border transition-all btn-press"
          title="ล้างเส้นทางเดินของหุ่นยนต์ (Breadcrumbs)"
        >
          <Eraser size={12} />
          <span>ล้างเส้นทาง</span>
        </button>

        <div className="w-[1px] h-4 bg-surface-border/60 mx-0.5" />

        {/* Robot Placement & Rotation Controls */}
        <button
          onClick={() => setPlacementMode(placementMode === 'robot' ? 'tile' : 'robot')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all btn-press ${
            placementMode === 'robot'
              ? 'bg-amber-500 text-slate-950 font-semibold border border-amber-300 shadow-sm shadow-amber-500/20 animate-pulse'
              : 'bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-white border border-surface-border'
          }`}
          title={
            placementMode === 'robot'
              ? 'คลิกบนช่องในสนามเพื่อวางหุ่นยนต์ หรือคลิกปุ่มนี้อีกครั้งเพื่อปิด'
              : 'โหมดย้ายหุ่น: คลิกบนช่องในสนามเพื่อย้ายจุดวางหุ่นยนต์'
          }
        >
          <MapPin size={12} className={placementMode === 'robot' ? 'text-slate-950' : 'text-amber-400'} />
          <span>{placementMode === 'robot' ? 'คลิกที่สนามเพื่อวาง' : 'ย้ายหุ่น'}</span>
        </button>

        <button
          onClick={() => {
            rotateRobot(90);
            addConsoleLog(`Rotated robot 90° (Heading: ${((headingDeg + 90) % 360)}°)`, 'info');
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-white border border-surface-border transition-all btn-press"
          title="หมุนตัวหุ่นยนต์ครั้งละ 90 องศา (หรือคลิกขวาที่สนามในโหมดย้ายหุ่น)"
        >
          <RotateCw size={12} className="text-teal-400" />
          <span>หมุนหุ่น ({headingDeg}° {getDirectionArrow(headingDeg)})</span>
        </button>

        {customStartPose && (
          <button
            onClick={() => {
              resetRobotToStartTile();
              addConsoleLog('Robot returned to official START tile dock.', 'info');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] transition-all btn-press"
            title="คืนค่าตำแหน่งและมุมหุ่นยนต์กลับไปที่แผ่น START ของสนามแข่งขัน"
          >
            <Undo2 size={11} className="text-rose-400" />
            <span>จุด START เดิม</span>
          </button>
        )}

        <div className="w-[1px] h-4 bg-surface-border/60 mx-0.5" />

        <button
          onClick={() => setRandomArenaModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all btn-press"
          title="สุ่มสนามแข่งขันอัตโนมัติ (ระดับง่าย-ยาก) พร้อมบันทึกเป็น HTML และ PDF"
        >
          <Dices size={12} className="text-cyan-400" />
          <span>สุ่มสนาม</span>
        </button>
      </div>

      {/* Status & Realtime Time display */}
      <div className="flex items-center gap-2 shrink-0">
        {getStatusBadge()}
        <span className="font-mono text-slate-300 bg-surface-dark px-2 py-0.5 rounded border border-surface-border text-[11px]">
          ⏱ {robotState.simTimeSec.toFixed(2)}s
        </span>
      </div>
    </div>
  );
};
