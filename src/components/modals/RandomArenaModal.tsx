import React, { useState, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { ArenaDifficulty, ArenaCompetitionMode, GeneratedArenaResult } from '../../types/simulator';
import {
  generateRandomArena,
  downloadArenaHtml,
  printArenaMap,
  generateFullArenaSvg,
  renderTileSvgString,
  DIFFICULTY_CONFIG,
} from '../../utils/arenaGenerator';
import {
  Dices,
  Download,
  Printer,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  Trophy,
  GraduationCap,
  School,
  Hash,
  RotateCw,
} from 'lucide-react';

export const RandomArenaModal: React.FC = () => {
  const { isRandomArenaModalOpen, setRandomArenaModalOpen, addConsoleLog } = useIDEStore();
  const { setTiles } = useSimulatorStore();

  const [selectedMode, setSelectedMode] = useState<ArenaCompetitionMode>('pt_version');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ArenaDifficulty>('medium');
  const [currentSeed, setCurrentSeed] = useState<number>(() => Math.floor(100000 + Math.random() * 900000));
  const [currentArena, setCurrentArena] = useState<GeneratedArenaResult | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Generate initial random arena when modal opens
  useEffect(() => {
    if (isRandomArenaModalOpen) {
      const initialSeed = Math.floor(100000 + Math.random() * 900000);
      setCurrentSeed(initialSeed);
      handleGenerate(selectedMode, selectedDifficulty, initialSeed);
      setAppliedSuccess(false);
    }
  }, [isRandomArenaModalOpen]);

  const handleGenerate = (
    mode: ArenaCompetitionMode = selectedMode,
    diff: ArenaDifficulty = selectedDifficulty,
    seed: number = currentSeed
  ) => {
    const generated = generateRandomArena(mode, diff, customName.trim() ? customName : undefined, seed);
    setCurrentArena(generated);
    setCustomName(generated.name);
    setAppliedSuccess(false);
  };

  const handleRerollSeed = () => {
    const nextSeed = Math.floor(100000 + Math.random() * 900000);
    setCurrentSeed(nextSeed);
    setCustomName('');
    handleGenerate(selectedMode, selectedDifficulty, nextSeed);
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
    if (!isNaN(val)) {
      setCurrentSeed(val);
      handleGenerate(selectedMode, selectedDifficulty, val);
    }
  };

  const handleModeChange = (mode: ArenaCompetitionMode) => {
    setSelectedMode(mode);
    setCustomName('');
    const nextSeed = Math.floor(100000 + Math.random() * 900000);
    setCurrentSeed(nextSeed);
    handleGenerate(mode, selectedDifficulty, nextSeed);
  };

  const handleDifficultyChange = (diff: ArenaDifficulty) => {
    setSelectedDifficulty(diff);
    handleGenerate(selectedMode, diff, currentSeed);
  };

  const handleApplyToSimulator = () => {
    if (!currentArena) return;
    setIsApplying(true);
    setTiles(currentArena.tiles, currentArena.name);
    addConsoleLog(
      `[Arena Generator] โหลดสนาม "${currentArena.name}" (${currentArena.competitionModeLabel} - ${currentArena.difficultyLabel} Seed #${currentArena.seed}) เข้าสู่ 3D Simulator สำเร็จ!`,
      'success'
    );
    setAppliedSuccess(true);
    setTimeout(() => {
      setIsApplying(false);
      setRandomArenaModalOpen(false);
    }, 600);
  };

  const handleDownloadHtml = () => {
    if (!currentArena) return;
    downloadArenaHtml(currentArena);
    addConsoleLog(
      `[Arena Generator] ส่งออกไฟล์ HTML สนาม "${currentArena.name}" เรียบร้อย (เปิดดูแบบ Offline ได้ 100%)`,
      'info'
    );
  };

  const handlePrintPdf = () => {
    if (!currentArena) return;
    printArenaMap(currentArena);
  };

  if (!isRandomArenaModalOpen || !currentArena) return null;

  const currentCfg = DIFFICULTY_CONFIG[selectedDifficulty];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-surface-darker border border-surface-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-dark shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
              <Dices size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ระบบสุ่มสนามแข่งขันอัตโนมัติ (Robotics Arena Generator)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  4x8 Grid (120x240cm)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                สุ่มผังสนามแข่งขันอัตโนมัติ พร้อมระบบ Seed คำนวณเส้นทางถูกต้อง 100% ไม่มีทางตัน
              </p>
            </div>
          </div>

          <button
            onClick={() => setRandomArenaModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* 1. Competition Game Mode Selector (3 โหมดกติกาหลัก) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" />
              <span>เลือกโหมดการแข่งขันและกติกาภารกิจ (Competition Mode):</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Mode 1: PT-Version */}
              <button
                onClick={() => handleModeChange('pt_version')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedMode === 'pt_version'
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                    : 'border-surface-border bg-surface-card/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      <Trophy size={13} className="text-amber-400" />
                      <span>หุ่นยนต์ขนส่งถุงยังชีพ</span>
                    </span>
                    {selectedMode === 'pt_version' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                        เลือกอยู่
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 mb-1">PT-Robotics Version</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    START สู่ FINISH | Checkpoint 2 จุด (20 คะแนน) | ปล่อยถุงยังชีพ 4 สี แดง/เขียว/น้ำเงิน/เหลือง บนพื้นและบนเนิน (60 คะแนน) | จบที่ FINISH (20 คะแนน) รวม 100 คะแนน
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 border-t border-surface-border pt-1.5">
                  อุปสรรค: สะพาน 3 แผ่น, อุโมงค์, ไม้กระดก, ลูกระนาด, หลุมดำ, ระเบิด
                </div>
              </button>

              {/* Mode 2: OBEC Junior (สพฐ. ม.ต้น) */}
              <button
                onClick={() => handleModeChange('obec_junior')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedMode === 'obec_junior'
                    ? 'border-brand-500 bg-brand-950/30 shadow-lg shadow-brand-500/10'
                    : 'border-surface-border bg-surface-card/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      <School size={13} className="text-brand-400" />
                      <span>สพฐ. มัธยมศึกษาตอนต้น</span>
                    </span>
                    {selectedMode === 'obec_junior' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold">
                        เลือกอยู่
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-brand-300 mb-1">ศิลปหัตถกรรมนักเรียน ครั้งที่ 70</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    START สู่ START | Checkpoint 2 จุด (30 คะแนน) | ปล่อยถุงยังชีพพื้นที่สีเขียว 4 จุด (60 คะแนน) | <b>เดินวนกลับมาหยุดที่จุด START เดิม</b> (10 คะแนน) รวม 100 คะแนน
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 border-t border-surface-border pt-1.5">
                  อุปสรรค ม.ต้น: หลุมดำ 1 แผ่น + ลูกระนาด 1 แผ่น (ไม่มีสะพาน)
                </div>
              </button>

              {/* Mode 3: OBEC Senior (สพฐ. ม.ปลาย) */}
              <button
                onClick={() => handleModeChange('obec_senior')}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedMode === 'obec_senior'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                    : 'border-surface-border bg-surface-card/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      <GraduationCap size={14} className="text-emerald-400" />
                      <span>สพฐ. มัธยมศึกษาตอนปลาย</span>
                    </span>
                    {selectedMode === 'obec_senior' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        เลือกอยู่
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-300 mb-1">ศิลปหัตถกรรมนักเรียน ครั้งที่ 70</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    START สู่ START | Checkpoint 2 จุด (30 คะแนน) | ปล่อยถุงยังชีพพื้นที่สีเขียว 4 จุด (60 คะแนน) | <b>เดินวนกลับมาหยุดที่จุด START เดิม</b> (10 คะแนน) รวม 100 คะแนน
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 border-t border-surface-border pt-1.5">
                  อุปสรรค ม.ปลาย ครบ 3 ชนิด: หลุมดำ + ลูกระนาด + <b>สะพานลาดชัน 5 ซม.</b>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Difficulty Level Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              เลือกระดับความยากง่าย (Select Difficulty):
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['very_easy', 'easy', 'medium', 'hard', 'very_hard'] as ArenaDifficulty[]).map((diff) => {
                const cfg = DIFFICULTY_CONFIG[diff];
                const isSelected = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyChange(diff)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/15 text-white shadow-lg shadow-brand-500/20'
                        : 'border-surface-border bg-surface-card/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mb-1"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span className="font-bold text-xs">{cfg.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{cfg.enName}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 bg-surface-card p-2 rounded-lg border border-surface-border flex items-start gap-2">
              <Info size={14} className="text-brand-400 mt-0.5 shrink-0" />
              <span>{currentCfg.description}</span>
            </p>
          </div>

          {/* 3. Arena Name, Seed & Randomize Action */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-6">
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  if (currentArena) currentArena.name = e.target.value;
                }}
                placeholder="ชื่อสนามแข่งขัน..."
                className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Seed Input & Reroll Button */}
            <div className="md:col-span-3 flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-xl px-2.5 py-1 text-xs">
              <Hash size={13} className="text-purple-400 shrink-0" />
              <span className="text-[10px] text-slate-400 shrink-0">Seed:</span>
              <input
                type="text"
                value={currentSeed}
                onChange={handleSeedChange}
                className="w-full bg-transparent font-mono font-bold text-purple-300 outline-none text-xs"
                title="เลข Seed สำหรับสุ่มผังสนาม (สามารถพิมพ์เลขเพื่อโหลดผังเดิมได้)"
              />
            </div>

            <div className="md:col-span-3">
              <button
                onClick={handleRerollSeed}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20 shrink-0"
              >
                <Dices size={14} />
                <span>สุ่มผังสนามใหม่ (Reroll)</span>
              </button>
            </div>
          </div>

          {/* 4. Top-Down Visual Map Preview (White Modular Vinyl Background) */}
          <div className="bg-[#f8fafc] p-3 rounded-2xl border border-surface-border flex flex-col items-center justify-center overflow-x-auto shadow-inner">
            <div className="flex items-center justify-between w-full mb-2 text-[11px] text-slate-600 px-1 font-semibold">
              <span className="text-slate-800 font-bold">ผังสนามมุมสูง (Top-Down Visual Preview 4x8 ช่อง = 32 แผ่น)</span>
              <span className="text-[10px] text-slate-500">ทิศทางเลี้ยวและสะพานเชื่อมต่อสมบูรณ์ เข้าได้จริงทุกจุด</span>
            </div>
            <div
              className="w-full overflow-x-auto flex justify-center py-1"
              dangerouslySetInnerHTML={{
                __html: generateFullArenaSvg(currentArena.tiles, 56),
              }}
            />
          </div>

          {/* 5. Mission Scoring & Rules Summary */}
          <div className="grid grid-cols-3 gap-2">
            {currentArena.scoringBreakdown.map((s) => (
              <div
                key={s.item}
                className="bg-surface-card border border-surface-border rounded-xl p-2.5 text-center flex flex-col justify-center"
              >
                <div className="text-[11px] text-slate-400 font-medium">{s.item}</div>
                <div className="text-base font-extrabold text-cyan-300 mt-0.5">{s.points} คะแนน</div>
              </div>
            ))}
          </div>

          {/* 6. Tile Inventory Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Layers size={13} className="text-cyan-400" />
                <span>แผ่นกระเบื้องที่ใช้ในสนามนี้ ({currentArena.summary.length} ชนิด / วางครบ 32 แผ่น):</span>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {currentArena.summary.map((item) => (
                <div
                  key={item.type}
                  className="bg-surface-card border border-surface-border rounded-xl p-2 flex flex-col items-center text-center gap-1 hover:border-brand-500/40 transition group"
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg p-0.5 border border-slate-200"
                    dangerouslySetInnerHTML={{
                      __html: renderTileSvgString(item.type, 0, 36),
                    }}
                  />
                  <div className="text-[10px] font-semibold text-slate-200 line-clamp-1 w-full" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    x {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-surface-border bg-surface-dark shrink-0 flex-wrap gap-2">
          {/* Export Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              title="บันทึกเป็นไฟล์ HTML เปิดดูได้แบบออฟไลน์ 100% ไม่ต้องต่อเน็ต"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-slate-700 text-slate-200 border border-surface-border text-xs font-semibold transition"
            >
              <Download size={13} className="text-emerald-400" />
              <span>บันทึกเป็น HTML (ออฟไลน์)</span>
            </button>

            <button
              onClick={handlePrintPdf}
              title="เปิดหน้าต่างสั่งพิมพ์ หรือบันทึกเป็นไฟล์ PDF ขนาด A4 แนวตั้ง"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-slate-700 text-slate-200 border border-surface-border text-xs font-semibold transition"
            >
              <Printer size={13} className="text-cyan-400" />
              <span>พิมพ์ / บันทึก PDF (แนวตั้ง)</span>
            </button>
          </div>

          {/* Apply to Simulator & Cancel */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRandomArenaModalOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-surface-card hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              ปิดหน้าต่าง
            </button>

            <button
              onClick={handleApplyToSimulator}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/30"
            >
              {appliedSuccess ? (
                <>
                  <Check size={13} className="text-emerald-300" />
                  <span>ใช้งานสนามสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>ใช้งานสนามนี้ในจำลอง 3D</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
