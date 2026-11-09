import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { FunctionTemplateItem, FunctionParamDef } from '../../types/ide';
import {
  Code,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Search,
  Check,
  ChevronRight,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Sliders,
  Play,
  X,
  FileCode,
  Activity,
  RotateCw,
  Crosshair,
  Package,
  Clock,
  Cpu,
  Zap,
  Settings,
  Keyboard,
  GripVertical,
} from 'lucide-react';

export const FunctionBuilderPanel: React.FC = () => {
  const {
    customFunctions,
    addCustomFunction,
    deleteCustomFunction,
    importCustomFunctions,
    exportCustomFunctions,
    resetCustomFunctions,
    insertCodeAtCursor,
    robotDefaultSpeed,
    robotDefaultDistance,
    distancePresets,
    selectedDistancePresetIndex,
    setSelectedDistancePresetIndex,
    isFastKeyboardMode,
    toggleFastKeyboardMode,
    fastKeyBindings,
    addFastKeyBinding,
    deleteFastKeyBinding,
    resetFastKeyBindings,
    setSettingsOpen,
  } = useIDEStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeParamValues, setActiveParamValues] = useState<Record<string, Record<string, string>>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fast Key Custom Binding Modal State
  const [isFastKeyModalOpen, setFastKeyModalOpen] = useState(false);
  const [newKeyChar, setNewKeyChar] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyFnId, setNewKeyFnId] = useState('');
  const [newKeyDesc, setNewKeyDesc] = useState('');

  // Fast Keyboard Interactive Mode State
  const [fastActiveFnId, setFastActiveFnId] = useState<string | null>(null);
  const [fastParamIndex, setFastParamIndex] = useState<number>(0);
  const [fastParamBuffer, setFastParamBuffer] = useState<string>('');
  const [fastTempValues, setFastTempValues] = useState<string[]>([]);
  const [fastNotice, setFastNotice] = useState<string | null>(null);
  const [isWaitingForQNumber, setIsWaitingForQNumber] = useState<boolean>(false);
  const fastInputRef = useRef<HTMLInputElement>(null);

  // Create Function Modal state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newFnName, setNewFnName] = useState('');
  const [newFnCategory, setNewFnCategory] = useState<'encoder' | 'gyro' | 'line' | 'servo' | 'time' | 'motor' | 'custom'>('custom');
  const [newFnDesc, setNewFnDesc] = useState('');
  const [newFnParams, setNewFnParams] = useState<string>('');
  const [newFnBody, setNewFnBody] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean Categories config (Zero emojis, 100% Lucide Icons)
  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers, count: customFunctions.length },
    { id: 'encoder', label: 'Encoder', icon: Activity, count: customFunctions.filter((f) => f.category === 'encoder').length },
    { id: 'gyro', label: 'Gyro', icon: RotateCw, count: customFunctions.filter((f) => f.category === 'gyro').length },
    { id: 'line', label: 'จัดเส้น', icon: Crosshair, count: customFunctions.filter((f) => f.category === 'line').length },
    { id: 'servo', label: 'ทิ้งกล่อง', icon: Package, count: customFunctions.filter((f) => f.category === 'servo').length },
    { id: 'time', label: 'จับเวลา', icon: Clock, count: customFunctions.filter((f) => f.category === 'time').length },
    { id: 'motor', label: 'มอเตอร์', icon: Cpu, count: customFunctions.filter((f) => f.category === 'motor').length },
    { id: 'custom', label: 'ฟังก์ชั่นของฉัน', icon: Sparkles, count: customFunctions.filter((f) => f.isCustom || f.category === 'custom').length },
  ];

  // Filtered function list
  const filteredFunctions = useMemo(() => {
    return customFunctions.filter((fn) => {
      const matchCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'custom'
          ? fn.isCustom || fn.category === 'custom'
          : fn.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        fn.name.toLowerCase().includes(q) ||
        fn.description.toLowerCase().includes(q) ||
        (fn.categoryLabel && fn.categoryLabel.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [customFunctions, selectedCategory, searchQuery]);

  // Resolve default parameter value based on robot settings or definition
  const getParamDefaultValue = (p: FunctionParamDef): string => {
    const lower = p.name.toLowerCase();
    if (lower.includes('speed') || lower.includes('spd')) {
      return String(robotDefaultSpeed || 60);
    }
    if (lower.includes('dist') || lower.includes('target') || lower.includes('pulse')) {
      return String(distancePresets[0] || robotDefaultDistance || 400);
    }
    if (p.defaultValue !== undefined && p.defaultValue !== '') {
      return p.defaultValue;
    }
    return '';
  };

  // Handle parameter value change for a specific function
  const handleParamChange = (fnId: string, paramName: string, val: string) => {
    setActiveParamValues((prev) => {
      const fn = customFunctions.find((f) => f.id === fnId);
      const existing = prev[fnId] || {};
      const updated: Record<string, string> = {
        ...existing,
        [paramName]: val,
      };

      // If user changed turn, preset or any parameter, ensure that other parameters
      // that have default values (like speed and distance) are not lost!
      if (fn) {
        fn.params.forEach((p) => {
          if (updated[p.name] === undefined) {
            const def = getParamDefaultValue(p);
            if (def) {
              updated[p.name] = def;
            }
          }
        });
      }

      return {
        ...prev,
        [fnId]: updated,
      };
    });
  };

  // Build the generated function call string based on filled parameters
  const generateFunctionCall = (fn: FunctionTemplateItem): string => {
    if (fn.params.length === 0) {
      return `${fn.name}();`;
    }

    const currentValues = activeParamValues[fn.id] || {};
    const values: string[] = fn.params.map((p) => {
      const v = currentValues[p.name];
      if (v !== undefined) {
        return v;
      }
      return getParamDefaultValue(p);
    });

    // Trim trailing empty parameters
    let lastNonEmptyIndex = -1;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== '' && values[i] !== "''") {
        lastNonEmptyIndex = i;
        break;
      }
    }

    if (lastNonEmptyIndex === -1) {
      const defValues = fn.params.map((p) => getParamDefaultValue(p)).filter(Boolean);
      return `${fn.name}(${defValues.join(', ')});`;
    }

    const actualArgs = values.slice(0, lastNonEmptyIndex + 1);
    return `${fn.name}(${actualArgs.join(', ')});`;
  };

  // Insert code into editor at cursor
  const handleInsertCode = (fn: FunctionTemplateItem) => {
    const codeLine = generateFunctionCall(fn);
    insertCodeAtCursor(`  ${codeLine}\n`);
    setCopiedId(fn.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Handle Export to JSON
  const handleExport = () => {
    exportCustomFunctions();
  };

  // Handle Import from JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importCustomFunctions(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Save New Custom Function
  const handleSaveNewFunction = () => {
    const cleanName = newFnName.trim();
    if (!cleanName) return;

    const parsedParams: FunctionParamDef[] = newFnParams
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({
        name: p,
        type: 'text',
        placeholder: p,
        description: `พารามิเตอร์ ${p}`,
      }));

    const newFn: FunctionTemplateItem = {
      id: 'custom_' + Date.now(),
      name: cleanName,
      category: newFnCategory,
      categoryLabel: 'ฟังก์ชั่นผู้ใช้',
      description: newFnDesc.trim() || `ฟังก์ชั่นกำหนดเอง: ${cleanName}`,
      exampleCall: `${cleanName}(${parsedParams.map((p) => p.name).join(', ')});`,
      params: parsedParams,
      isCustom: true,
      codeBody: newFnBody.trim(),
    };

    addCustomFunction(newFn);
    setCreateModalOpen(false);
    setNewFnName('');
    setNewFnDesc('');
    setNewFnParams('');
    setNewFnBody('');
    setSelectedCategory('custom');
  };

  // Handle Save Custom Fast Key
  const handleSaveFastKey = () => {
    const keyChar = newKeyChar.trim().toLowerCase();
    if (!keyChar || !newKeyFnId) return;

    const targetFn = customFunctions.find((f) => f.id === newKeyFnId);
    if (!targetFn) return;

    addFastKeyBinding({
      key: keyChar,
      functionId: targetFn.id,
      name: newKeyName.trim() || targetFn.name,
      description: newKeyDesc.trim() || targetFn.description || `เรียก ${targetFn.name}`,
    });

    setNewKeyChar('');
    setNewKeyName('');
    setNewKeyFnId('');
    setNewKeyDesc('');
  };

  // -------------------------------------------------------------
  // Fast Keyboard Entry Mode Handling
  // -------------------------------------------------------------
  const activeFastFn = useMemo(() => {
    if (!fastActiveFnId) return null;
    return customFunctions.find((f) => f.id === fastActiveFnId) || null;
  }, [fastActiveFnId, customFunctions]);

  const commitFastCommand = (fn: FunctionTemplateItem, finalValues: string[]) => {
    // Fill in default values for any parameters that were left blank or empty!
    const resolvedValues = fn.params.map((p, idx) => {
      const v = finalValues[idx];
      if (v !== undefined && v.trim() !== '') {
        return v;
      }
      return getParamDefaultValue(p);
    });

    let lastIdx = -1;
    for (let i = resolvedValues.length - 1; i >= 0; i--) {
      if (resolvedValues[i] && resolvedValues[i].trim() !== '' && resolvedValues[i] !== "''") {
        lastIdx = i;
        break;
      }
    }
    const cleanArgs = lastIdx >= 0 ? resolvedValues.slice(0, lastIdx + 1) : [];
    const statement = `${fn.name}(${cleanArgs.join(', ')});`;
    insertCodeAtCursor(`  ${statement}\n`);

    setFastNotice(`แทรก: ${statement}`);
    setTimeout(() => setFastNotice(null), 2000);

    setFastActiveFnId(null);
    setFastParamIndex(0);
    setFastParamBuffer('');
    setFastTempValues([]);
    setIsWaitingForQNumber(false);
  };

  const advanceFastParam = (fn: FunctionTemplateItem, paramVal: string) => {
    const updatedValues = [...fastTempValues];
    updatedValues[fastParamIndex] = paramVal;
    setFastTempValues(updatedValues);

    if (fastParamIndex + 1 < fn.params.length) {
      setFastParamIndex(fastParamIndex + 1);
      setFastParamBuffer('');
      setIsWaitingForQNumber(false);
    } else {
      // All parameters filled!
      commitFastCommand(fn, updatedValues);
    }
  };

  const handleStartFastCommand = (key: string) => {
    const binding = fastKeyBindings.find((b) => b.key.toLowerCase() === key.toLowerCase());
    if (!binding) return;

    const fn = customFunctions.find((f) => f.id === binding.functionId || f.name.toLowerCase() === binding.name.toLowerCase());
    if (!fn) return;

    if (fn.params.length === 0) {
      commitFastCommand(fn, []);
      return;
    }

    setFastActiveFnId(fn.id);
    setFastParamIndex(0);
    setFastParamBuffer('');
    setFastTempValues(new Array(fn.params.length).fill(''));
    setIsWaitingForQNumber(false);
    if (fastInputRef.current) fastInputRef.current.focus();
  };

  const handleFastInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Detect 'q2' to 'q8' typed directly -> auto advance!
    if (activeFastFn) {
      const qMatch = val.match(/^q([2-8])$/i);
      if (qMatch) {
        const digit = parseInt(qMatch[1], 10);
        setSelectedDistancePresetIndex(digit - 1);
        const presetVal = String(distancePresets[digit - 1]);
        setIsWaitingForQNumber(false);
        setFastNotice(`เลือกช่อง #${digit}: ${presetVal}`);
        setTimeout(() => setFastNotice(null), 1200);
        advanceFastParam(activeFastFn, presetVal);
        return;
      }
    }

    setFastParamBuffer(val);
  };

  const handleFastInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeFastFn) {
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        const binding = fastKeyBindings.find((b) => b.key.toLowerCase() === key);
        if (binding) {
          e.preventDefault();
          handleStartFastCommand(key);
        }
      }
      return;
    }

    const currentParam = activeFastFn.params[fastParamIndex];

    // Escape cancels
    if (e.key === 'Escape') {
      e.preventDefault();
      setFastActiveFnId(null);
      setFastParamBuffer('');
      setIsWaitingForQNumber(false);
      return;
    }

    // Q Mode Handling: if waiting for a number 2 to 8 -> auto advance!
    if (isWaitingForQNumber) {
      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 2 && digit <= 8) {
        e.preventDefault();
        const presetVal = String(distancePresets[digit - 1]);
        setSelectedDistancePresetIndex(digit - 1);
        setIsWaitingForQNumber(false);
        setFastNotice(`เลือกช่อง #${digit}: ${presetVal}`);
        setTimeout(() => setFastNotice(null), 1200);
        advanceFastParam(activeFastFn, presetVal);
        return;
      } else {
        setIsWaitingForQNumber(false);
      }
    }

    // Pressing 'q' or 'Q': triggers preset 2-8 selection mode
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      setIsWaitingForQNumber(true);
      setFastNotice('โหมด Q: กดเลข 2 ถึง 8 เพื่อเลือกระยะทางลัด');
      return;
    }

    // Direction shortcuts: 'l', 'r', 'L', 'R' -> auto fills default preceding params and auto advances/commits!
    const isTurnKey = e.key === 'l' || e.key === 'L' || e.key === 'r' || e.key === 'R';
    const turnParamIndex = activeFastFn.params.findIndex(
      (p) =>
        p.name.toLowerCase().includes('turn') ||
        p.name.toLowerCase().includes('dir') ||
        Boolean(p.options?.some((o) => o.includes('L') || o.includes('R') || o.includes('l') || o.includes('r')))
    );

    if (isTurnKey && turnParamIndex !== -1) {
      e.preventDefault();
      const dirVal = `'${e.key}'`;
      const updatedValues = [...fastTempValues];

      // Ensure any parameter prior to turn takes its default value if empty
      activeFastFn.params.forEach((p, idx) => {
        if (idx < turnParamIndex) {
          if (!updatedValues[idx] || updatedValues[idx].trim() === '') {
            updatedValues[idx] = getParamDefaultValue(p);
          }
        }
      });

      updatedValues[turnParamIndex] = dirVal;
      setFastNotice(`เลือกเลี้ยว: ${dirVal}`);
      setTimeout(() => setFastNotice(null), 1200);

      // If turn is the last parameter or all following params are optional, commit immediately!
      if (turnParamIndex + 1 >= activeFastFn.params.length) {
        commitFastCommand(activeFastFn, updatedValues);
      } else {
        setFastTempValues(updatedValues);
        setFastParamIndex(turnParamIndex + 1);
        setFastParamBuffer('');
        setIsWaitingForQNumber(false);
      }
      return;
    }

    // Default shortcut: 'd' or 'D' -> Uses default value (e.g. speed or Preset 1 distance) and auto advances!
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      const pName = currentParam ? currentParam.name.toLowerCase() : '';
      let defaultVal = '';
      if (pName.includes('speed')) {
        defaultVal = String(robotDefaultSpeed);
        setFastNotice(`ความเร็วเริ่มต้น: ${robotDefaultSpeed}%`);
      } else {
        // Uses Preset 1!
        defaultVal = String(distancePresets[0]);
        setSelectedDistancePresetIndex(0);
        setFastNotice(`ใช้ค่าช่อง #1 (Default): ${defaultVal}`);
      }
      setTimeout(() => setFastNotice(null), 1200);
      advanceFastParam(activeFastFn, defaultVal);
      return;
    }

    // Comma (,) advances to next parameter (takes default if empty)
    if (e.key === ',') {
      e.preventDefault();
      const raw = fastParamBuffer.trim();
      const val = raw !== '' ? raw : (currentParam ? getParamDefaultValue(currentParam) : '');
      advanceFastParam(activeFastFn, val);
      return;
    }

    // Enter commits current or finishes command
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = fastParamBuffer.trim();
      const updatedValues = [...fastTempValues];
      updatedValues[fastParamIndex] = val;
      commitFastCommand(activeFastFn, updatedValues);
    }
  };

  // Render a Single Function Card
  const renderFunctionCard = (fn: FunctionTemplateItem) => {
    const currentVals = activeParamValues[fn.id] || {};
    const codePreview = generateFunctionCall(fn);
    const isInserted = copiedId === fn.id;

    // Detect distance parameter (e.g. distance, target)
    const distanceParam = fn.params.find(
      (p) => p.name.toLowerCase().includes('dist') || p.name.toLowerCase().includes('target')
    );

    return (
      <div
        key={fn.id}
        className="bg-surface-card rounded-xl border border-surface-border hover:border-slate-600 transition p-3 flex flex-col gap-2.5 group shadow-sm"
      >
        {/* Header: Name, Category & Delete */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-100 font-mono text-[13px] text-brand-300 group-hover:text-brand-400 transition truncate">
              {fn.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-dark border border-surface-border text-slate-400 font-mono shrink-0">
              {fn.categoryLabel || fn.category}
            </span>
          </div>

          {fn.isCustom && (
            <button
              onClick={() => deleteCustomFunction(fn.id)}
              title="ลบฟังก์ชั่นนี้ออกจากคลัง"
              className="text-slate-500 hover:text-red-400 p-0.5 transition"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 leading-tight">
          {fn.description}
        </p>

        {/* 1. DEDICATED DISTANCE PRESETS 1-8 PAD INSIDE THIS CARD (Placed First) */}
        {distanceParam && (
          <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-surface-darker/90 border border-surface-border">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Sliders size={12} className="text-amber-400" />
                <span>ระยะทางด่วน (Presets 1 - 8):</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {currentVals[distanceParam.name] !== undefined
                  ? currentVals[distanceParam.name]
                  : getParamDefaultValue(distanceParam)}{' '}
                <span className="text-[8px] font-normal text-slate-400">
                  pulses (
                  {(
                    (parseFloat(
                      currentVals[distanceParam.name] !== undefined
                        ? currentVals[distanceParam.name]
                        : getParamDefaultValue(distanceParam)
                    ) || 0) / (robotDefaultDistance || 400)
                  ).toFixed(1)}{' '}
                  ช่อง)
                </span>
              </span>
            </div>

            {/* 4x2 Grid of 8 Presets (Row 1: 1-4, Row 2: 5-8) */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {distancePresets.map((presetVal, idx) => {
                const currentValStr = String(
                  currentVals[distanceParam.name] !== undefined
                    ? currentVals[distanceParam.name]
                    : getParamDefaultValue(distanceParam)
                );
                const isSelected = currentValStr === String(presetVal);
                const gridRatio = presetVal / (robotDefaultDistance || 400);
                const gridText = Number.isInteger(gridRatio) ? `${gridRatio} ช่อง` : `${gridRatio.toFixed(1)} ช่อง`;
                const cmText = Math.round(gridRatio * 30);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleParamChange(fn.id, distanceParam.name, String(presetVal));
                      setSelectedDistancePresetIndex(idx);
                    }}
                    title={`เลือกช่อง #${idx + 1}: ${presetVal} pulses = ${gridText} (${cmText} ซม.)`}
                    className={`p-1.5 rounded-lg border text-center transition flex flex-col items-center justify-between select-none ${
                      isSelected
                        ? 'bg-slate-700 border-slate-400 text-white shadow-inner ring-1 ring-slate-400/80 font-bold scale-[0.98]'
                        : 'bg-surface-card border-surface-border text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[9px] font-mono">
                      <span className={`px-1 rounded ${isSelected ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                    <span className="font-mono font-bold text-[11px] mt-0.5">{presetVal}</span>
                    <span className="text-[8px] text-slate-400 font-sans tracking-tight mt-0.5">{gridText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PARAMETERS SETTINGS BELOW (ความเร็ว, ระยะทางตัวเลข, เลี้ยวปุ่มกด, Ramp) */}
        {fn.params.length > 0 && (
          <div className="grid grid-cols-2 gap-2 bg-surface-darker/60 p-2 rounded-xl border border-white/5">
            {fn.params.map((p) => {
              const val = currentVals[p.name] !== undefined ? currentVals[p.name] : getParamDefaultValue(p);
              const isDistanceParam =
                p.name.toLowerCase().includes('dist') || p.name.toLowerCase().includes('target');
              const isSpeedParam = p.name.toLowerCase().includes('speed');

              return (
                <div
                  key={p.name}
                  className={`flex flex-col gap-1 ${
                    p.options ? 'col-span-2' : isDistanceParam ? 'col-span-1' : 'col-span-2 sm:col-span-1'
                  }`}
                >
                  {/* Parameter Label with Quick Shortcuts */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-slate-400 truncate" title={p.description}>
                      {p.name}
                    </label>

                    {/* Speed Default Pill */}
                    {isSpeedParam && (
                      <button
                        type="button"
                        onClick={() => handleParamChange(fn.id, p.name, String(robotDefaultSpeed))}
                        title={`ใช้ความเร็วเริ่มต้นที่ตั้งไว้ (${robotDefaultSpeed}%)`}
                        className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
                      >
                        d:{robotDefaultSpeed}%
                      </button>
                    )}
                  </div>

                  {/* Turn / Direction: BUTTONS INSTEAD OF DROPDOWN (ว่าง, L, R, l, r) */}
                  {p.options ? (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {p.options.map((opt) => {
                        const isSelected = val === opt;
                        const displayLabel = opt === '' ? 'ว่าง' : opt.replace(/['"]/g, '');

                        const getTurnTitle = (raw: string) => {
                          if (!raw) return 'ไม่หมุน (เว้นว่าง)';
                          if (raw.includes('L')) return 'Spin ซ้าย 90° (หมุนรอบตัวเอง จุดศูนย์กลางอยู่ที่เดิม)';
                          if (raw.includes('R')) return 'Spin ขวา 90° (หมุนรอบตัวเอง จุดศูนย์กลางอยู่ที่เดิม)';
                          if (raw.includes('l')) return 'Turn เลี้ยวซ้าย 90° (เทิร์นล้อข้างนึงเร็วข้างนึงช้า ขยับตำแหน่ง หุ่นหันตรง)';
                          if (raw.includes('r')) return 'Turn เลี้ยวขวา 90° (เทิร์นล้อข้างนึงเร็วข้างนึงช้า ขยับตำแหน่ง หุ่นหันตรง)';
                          return `เลือกหมุน ${raw}`;
                        };

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleParamChange(fn.id, p.name, opt)}
                            title={getTurnTitle(opt)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition shadow-sm ${
                              isSelected
                                ? 'bg-amber-500 text-black shadow-amber-500/30 ring-1 ring-amber-300 scale-[0.98]'
                                : 'bg-surface-dark border border-surface-border text-slate-300 hover:text-white hover:border-slate-500 hover:bg-surface-card'
                            }`}
                          >
                            {displayLabel}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleParamChange(fn.id, p.name, e.target.value)}
                      placeholder={p.placeholder || p.name}
                      className="bg-surface-dark border border-surface-border rounded-lg px-2 py-1 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-brand-500 transition"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Live Code Preview & Insert Button */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="flex-1 bg-surface-darker px-2.5 py-1 rounded-lg border border-surface-border font-mono text-[11px] text-emerald-400 truncate select-all"
            title="โค้ดที่จะถูกสร้างและแทรกลงใน Monaco Editor"
          >
            {codePreview}
          </div>

          <button
            onClick={() => handleInsertCode(fn)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm shrink-0 ${
              isInserted
                ? 'bg-emerald-600 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
            }`}
            title="กดสร้างและแทรกคำสั่งนี้ลงในโค้ดตรงตำแหน่งเคอร์เซอร์"
          >
            {isInserted ? <Check size={12} /> : <Plus size={12} />}
            <span>{isInserted ? 'แทรกแล้ว' : 'สร้างโค้ด'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-surface-dark flex flex-col h-full w-full select-none text-slate-200 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-3 bg-surface-darker/95 backdrop-blur-sm border-b border-surface-border flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-100">
            <Sparkles size={14} className="text-amber-400" />
            <span>ชุดคำสั่ง & สร้างฟังก์ชั่น</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Fast Keyboard Mode Toggle Button */}
            <button
              onClick={toggleFastKeyboardMode}
              title="เปิด/ปิดโหมดพิมพ์คำสั่งด่วนด้วยคีย์บอร์ด (Fast Keyboard Mode)"
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all btn-press ${
                isFastKeyboardMode
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-surface-card hover:bg-surface-hover text-slate-300 border border-surface-border'
              }`}
            >
              <Zap size={11} className={isFastKeyboardMode ? 'text-black fill-current' : 'text-amber-400'} />
              <span>พิมพ์ด่วน</span>
            </button>

            {/* Create Function Button */}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold shadow-sm transition-all btn-press"
              title="สร้างฟังก์ชั่นใหม่ (Create Function)"
            >
              <Plus size={12} />
              <span>สร้าง</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              title="ส่งออกชุดฟังก์ชั่น (.json)"
              className="p-1 rounded-md bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-white border border-surface-border transition btn-press"
            >
              <Download size={12} />
            </button>

            {/* Import Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="นำเข้าชุดฟังก์ชั่น (.json)"
              className="p-1 rounded-md bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-white border border-surface-border transition btn-press"
            >
              <Upload size={12} />
            </button>

            {/* Reset to Default Button */}
            <button
              onClick={resetCustomFunctions}
              title="รีเซ็ตชุดคำสั่งเริ่มต้นทั้งหมด"
              className="p-1 rounded-md bg-surface-card hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-surface-border transition btn-press"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาคำสั่ง (เช่น FFE, spin, SetFront)..."
            className="w-full pl-8 pr-7 py-1.5 bg-surface-card border border-surface-border rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Fast Keyboard Interactive HUD Bar (When Enabled) */}
      {isFastKeyboardMode && (
        <div className="p-2 bg-cyan-950/30 border-b border-cyan-500/30 flex flex-col gap-1.5 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Zap size={13} className="text-cyan-400" />
              <span>โหมดพิมพ์คำสั่งด่วน (Fast Macro)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFastKeyModalOpen(true)}
                title="ตั้งค่าและเพิ่มปุ่มลัดคำสั่งด่วน"
                className="text-cyan-300 hover:text-white flex items-center gap-1 text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 px-2 py-0.5 rounded border border-cyan-500/40 transition font-medium"
              >
                <Plus size={11} />
                <span>+ จัดการ/เพิ่มปุ่มด่วน</span>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                title="ตั้งค่าระบบหุ่นยนต์"
                className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
              >
                <Settings size={11} />
                <span>ตั้งค่าหุ่นยนต์</span>
              </button>
            </div>
          </div>

          {/* Quick Keys Chips */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none text-[10px]">
            {fastKeyBindings.map((kb) => (
              <button
                key={kb.key}
                onClick={() => handleStartFastCommand(kb.key)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-dark border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition shrink-0"
              >
                <kbd className="px-1 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase text-[9px]">
                  {kb.key}
                </kbd>
                <span>{kb.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive Fast Input Prompt */}
          <div className="flex flex-col gap-1 bg-surface-dark p-2 rounded-lg border border-cyan-500/40 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              {activeFastFn ? (
                <span className="font-bold text-cyan-300">
                  กำลังป้อน: <span className="font-mono text-white">{activeFastFn.name}</span> (
                  {fastParamIndex + 1}/{activeFastFn.params.length})
                </span>
              ) : (
                <span className="text-slate-400">กดปุ่มลัด (เช่น F, B, S) เพื่อเริ่มคำสั่ง</span>
              )}

              {activeFastFn && (
                <span className="text-[9px] text-amber-300 font-mono">
                  [ , ] ถัดไป | [Enter] สั่งรัน
                </span>
              )}
            </div>

            {activeFastFn && (
              <div className="text-[10px] text-slate-300 flex items-center justify-between flex-wrap gap-1">
                <span>
                  พารามิเตอร์:{' '}
                  <span className="font-bold text-amber-300 font-mono">
                    {activeFastFn.params[fastParamIndex]?.name}
                  </span>
                </span>
                <span className="text-[9px] text-cyan-300 font-mono">
                  กด <kbd className="px-1 rounded bg-surface-card text-white">d</kbd>=ช่อง 1 | กด <kbd className="px-1 rounded bg-surface-card text-white">q</kbd>+<kbd className="px-1 rounded bg-surface-card text-white">2..8</kbd>=ช่อง 2-8
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                ref={fastInputRef}
                type="text"
                autoFocus
                value={fastParamBuffer}
                onChange={handleFastInputChange}
                onKeyDown={handleFastInputKeyDown}
                placeholder={
                  activeFastFn
                    ? isWaitingForQNumber
                      ? 'กดเลข 2 ถึง 8 เพื่อเลือกระยะทางลัด...'
                      : 'ป้อนค่า, กด d (ช่อง 1), หรือกด q แล้วตามด้วย 2-8...'
                    : 'พิมพ์ F, B, S, T หรือคลิกปุ่มด้านบน...'
                }
                className={`flex-1 bg-surface-card border rounded px-2 py-1 text-xs font-mono outline-none shadow-sm transition ${
                  isWaitingForQNumber
                    ? 'border-amber-400 text-amber-300 bg-amber-950/20 animate-pulse'
                    : 'border-cyan-500/50 text-cyan-200 focus:border-cyan-400'
                }`}
              />

              {activeFastFn && (
                <button
                  onClick={() => {
                    setFastActiveFnId(null);
                    setFastParamBuffer('');
                    setIsWaitingForQNumber(false);
                  }}
                  title="ยกเลิกคำสั่งนี้ (Esc)"
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {fastNotice && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
              <Check size={11} />
              <span>{fastNotice}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 bg-surface-dark border-b border-surface-border overflow-x-auto no-scrollbar text-xs whitespace-nowrap shrink-0">
        {categories.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/60'
              }`}
            >
              <IconComp size={12} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-darker text-slate-500'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Commands List (Grouped by Category in "All" view) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        {filteredFunctions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Code size={24} className="mx-auto mb-2 opacity-50" />
            <p>ไม่พบคำสั่งที่ค้นหา</p>
          </div>
        ) : selectedCategory === 'all' && !searchQuery.trim() ? (
          /* ======================================================= */
          /* GROUPED BY CATEGORY IN "ALL" VIEW                      */
          /* ======================================================= */
          <div className="space-y-4">
            {categories
              .filter((c) => c.id !== 'all')
              .map((cat) => {
                const groupFns = filteredFunctions.filter((f) =>
                  cat.id === 'custom' ? f.isCustom || f.category === 'custom' : f.category === cat.id
                );
                if (groupFns.length === 0) return null;

                const CatIcon = cat.icon;

                return (
                  <div key={cat.id} className="space-y-2">
                    {/* Category Group Header */}
                    <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-surface-darker/90 border border-surface-border text-xs font-bold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <CatIcon size={13} className="text-brand-400" />
                        <span>หมวดหมู่: {cat.label}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-dark text-slate-400 border border-white/5">
                        {groupFns.length} คำสั่ง
                      </span>
                    </div>

                    {/* Cards in this category */}
                    <div className="space-y-2.5">
                      {groupFns.map((fn) => renderFunctionCard(fn))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* ======================================================= */
          /* FILTERED OR SEARCHED VIEW                               */
          /* ======================================================= */
          <div className="space-y-2.5">
            {filteredFunctions.map((fn) => renderFunctionCard(fn))}
          </div>
        )}
      </div>

      {/* 5. Modal: Create New Custom Function */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-darker border border-surface-border rounded-2xl w-full max-w-md shadow-2xl p-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                <FileCode size={16} className="text-brand-400" />
                <span>สร้างฟังก์ชั่นใหม่ (Create Function)</span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  ชื่อฟังก์ชั่น (Function Name) *
                </label>
                <input
                  type="text"
                  value={newFnName}
                  onChange={(e) => setNewFnName(e.target.value)}
                  placeholder="เช่น Box1, RunToBridge, MissionDrop"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    หมวดหมู่ (Category)
                  </label>
                  <select
                    value={newFnCategory}
                    onChange={(e: any) => setNewFnCategory(e.target.value)}
                    className="w-full bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="custom">ฟังก์ชั่นของฉัน (Custom)</option>
                    <option value="encoder">Encoder เคลื่อนที่</option>
                    <option value="gyro">Gyro เลี้ยว/หมุน</option>
                    <option value="line">จัดตำแหน่งเส้น</option>
                    <option value="servo">ทิ้งกล่อง & เซอร์โว</option>
                    <option value="time">จับเวลา</option>
                    <option value="motor">มอเตอร์ & ระบบ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    พารามิเตอร์ (คั่นด้วยจุลภาค)
                  </label>
                  <input
                    type="text"
                    value={newFnParams}
                    onChange={(e) => setNewFnParams(e.target.value)}
                    placeholder="เช่น speed, distance, turn"
                    className="w-full bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  คำอธิบายฟังก์ชั่น (Description)
                </label>
                <input
                  type="text"
                  value={newFnDesc}
                  onChange={(e) => setNewFnDesc(e.target.value)}
                  placeholder="เช่น วิ่งไปปล่อยกล่องจุดที่ 1 แล้วกลับสู่จุดเริ่ม"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  โค้ดการทำงานของฟังก์ชั่น (Code Body)
                </label>
                <textarea
                  rows={4}
                  value={newFnBody}
                  onChange={(e) => setNewFnBody(e.target.value)}
                  placeholder={`FFE(100, 400, 'R');\nDropF(20);\nBBE(100, 400);`}
                  className="w-full bg-surface-card border border-surface-border rounded-lg p-2 text-xs font-mono text-emerald-300 outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border mt-1">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveNewFunction}
                disabled={!newFnName.trim()}
                className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
              >
                บันทึกฟังก์ชั่น
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 6. Modal: Manage Fast Key Bindings */}
      {isFastKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-darker border border-surface-border rounded-2xl w-full max-w-xl shadow-2xl p-4 flex flex-col gap-3 text-xs max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                <Zap size={16} className="text-cyan-400" />
                <span>ตั้งค่าและเพิ่มปุ่มลัดพิมพ์ด่วน (Fast Key Bindings)</span>
              </div>
              <button
                onClick={() => setFastKeyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Form to add or update key */}
              <div className="bg-surface-card/60 p-3 rounded-xl border border-cyan-500/20 space-y-3">
                <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Plus size={13} />
                  <span>เพิ่มหรือแก้ไขปุ่มลัด (Add / Edit Fast Key)</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      ปุ่มลัด (Key Trigger) *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={newKeyChar}
                      onChange={(e) => setNewKeyChar(e.target.value.toLowerCase())}
                      placeholder="เช่น x, z, 1"
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold uppercase outline-none focus:border-cyan-400 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      ชื่อแสดงบนปุ่ม (Name)
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="เช่น Drop, Turn45"
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      ฟังก์ชั่นเป้าหมาย (Target Function) *
                    </label>
                    <select
                      value={newKeyFnId}
                      onChange={(e) => {
                        setNewKeyFnId(e.target.value);
                        if (!newKeyName) {
                          const fn = customFunctions.find((f) => f.id === e.target.value);
                          if (fn) setNewKeyName(fn.name);
                        }
                      }}
                      className="w-full bg-surface-dark border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="">-- เลือกฟังก์ชั่น --</option>
                      {customFunctions.map((fn) => (
                        <option key={fn.id} value={fn.id}>
                          {fn.name} ({fn.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    คำอธิบายเพิ่มเติม (Description)
                  </label>
                  <input
                    type="text"
                    value={newKeyDesc}
                    onChange={(e) => setNewKeyDesc(e.target.value)}
                    placeholder="เช่น กดเพื่อหมุนตัว 45 องศาไปทางขวา หรือปล่อยกล่อง"
                    className="w-full bg-surface-dark border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSaveFastKey}
                    disabled={!newKeyChar.trim() || !newKeyFnId}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    <span>บันทึกปุ่มลัด</span>
                  </button>
                </div>
              </div>

              {/* List of currently bound keys */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>รายการปุ่มลัดที่มีอยู่ในระบบ ({fastKeyBindings.length})</span>
                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการรีเซ็ตปุ่มลัดทั้งหมดกลับสู่ค่าเริ่มต้นหรือไม่?')) {
                        resetFastKeyBindings();
                      }
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
                  >
                    <RotateCcw size={10} />
                    <span>รีเซ็ตค่าเริ่มต้น</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {fastKeyBindings.map((kb) => {
                    const targetFn = customFunctions.find(
                      (f) => f.id === kb.functionId || f.name.toLowerCase() === kb.name.toLowerCase()
                    );
                    return (
                      <div
                        key={kb.key}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-card border border-surface-border hover:border-cyan-500/30 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <kbd className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase text-xs border border-cyan-500/40">
                            {kb.key}
                          </kbd>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{kb.name}</span>
                              {targetFn && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({targetFn.name})
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">{kb.description}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteFastKeyBinding(kb.key)}
                          title="ลบปุ่มลัดนี้"
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-surface-border">
              <button
                onClick={() => setFastKeyModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
