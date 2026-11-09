import React, { useRef, useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  FolderOpen,
  Save,
  Upload,
  Download,
  Trash2,
  FileCode,
  Check,
  X,
  Plus,
  Clock,
  HardDrive,
  FolderPlus,
  Layers,
  Sparkles,
  FileText,
  FileCheck,
  Cpu,
  ChevronRight,
  Archive,
  FileArchive,
  Loader2,
  Bot,
  Sliders,
  Keyboard,
  Gauge,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';

interface SketchManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SketchManagerModal: React.FC<SketchManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    projectName,
    setProjectName,
    projectFiles,
    savedProjects,
    saveCurrentProject,
    createNewProject,
    loadSavedProject,
    deleteSavedProject,
    exportProjectBundle,
    importProjectBundle,
    selectedBoard,
    importSketchCode,
    importProjectFromZipFile,
    exportProjectAsZip,
    projectVersions,
    setVersionModalOpen,
  } = useIDEStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bundleInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'projects' | 'new' | 'save'>('projects');
  const [newProjectNameInput, setNewProjectNameInput] = useState('My_Robot_Project');
  const [newProjectType, setNewProjectType] = useState<'empty' | 'blank' | 'template'>('empty');
  const [saveTitleInput, setSaveTitleInput] = useState(projectName);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectNameInput.trim()) return;
    createNewProject(newProjectNameInput.trim(), newProjectType);
    onClose();
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitleInput.trim()) return;
    saveCurrentProject(saveTitleInput.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleProcessFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      setIsProcessingZip(true);
      const success = await importProjectFromZipFile(file);
      setIsProcessingZip(false);
      if (success) {
        onClose();
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (file.name.endsWith('.ktproj') || file.name.endsWith('.json')) {
          importProjectBundle(content);
        } else {
          importSketchCode(content, file.name);
        }
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleBundleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingZip(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border bg-surface-darker">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <span>จัดการโปรเจกต์ (Project & Sketch Manager)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-card border border-surface-border text-emerald-400">
                  {projectName}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">สร้างโปรเจกต์ใหม่ว่างเปล่า บันทึกโครงงานลงเครื่อง หรือเปิดโปรเจกต์เดิม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-card transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-darker border-b border-surface-border px-5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'projects'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen size={14} />
            <span>โปรเจกต์ของฉัน ({savedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'new'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderPlus size={14} className="text-emerald-400" />
            <span className="text-emerald-300 font-semibold">+ สร้างโปรเจกต์ใหม่ (ว่างเปล่า)</span>
          </button>

          <button
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'save'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save size={14} />
            <span>บันทึกโปรเจกต์ปัจจุบัน</span>
          </button>

          <button
            onClick={() => {
              onClose();
              setVersionModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2.5 px-3 border-b-2 border-transparent text-slate-400 hover:text-violet-300 font-medium transition ml-auto"
            title="จัดการเวอร์ชันสนามแข่งและโค้ด"
          >
            <GitBranch size={14} className="text-violet-400" />
            <span>ประวัติเวอร์ชันสนาม & โค้ด ({projectVersions.length})</span>
          </button>
        </div>

        {/* Tab 1: Saved Projects List */}
        {activeTab === 'projects' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Quick action bar */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <span className="text-xs text-slate-300 font-medium">
                รายการโปรเจกต์ทั้งหมดที่บันทึกไว้ในเครื่อง
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={bundleInputRef}
                  onChange={handleBundleUpload}
                  accept=".zip,.ktproj,.json,.ino,.c,.cpp,.h"
                  className="hidden"
                />
                <button
                  onClick={() => bundleInputRef.current?.click()}
                  disabled={isProcessingZip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 border border-brand-500/40 text-xs font-semibold transition shadow-sm"
                  title="เปิดไฟล์โปรเจกต์แบบ .zip (หลายไฟล์) หรือ .ktproj จากเครื่อง"
                >
                  {isProcessingZip ? (
                    <Loader2 size={13} className="animate-spin text-amber-400" />
                  ) : (
                    <Archive size={13} className="text-amber-400" />
                  )}
                  <span>{isProcessingZip ? 'กำลังเปิด ZIP...' : 'เปิดโปรเจกต์ ZIP / .ktproj'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus size={13} />
                  <span>สร้างโปรเจกต์ใหม่</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop ZIP Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingZip(true);
              }}
              onDragLeave={() => setIsDraggingZip(false)}
              onDrop={handleDrop}
              onClick={() => bundleInputRef.current?.click()}
              className={`p-3 rounded-xl border border-dashed transition cursor-pointer flex items-center justify-between text-xs select-none ${
                isDraggingZip
                  ? 'border-brand-400 bg-brand-500/20 text-brand-200'
                  : 'border-surface-border/80 hover:border-brand-500/60 bg-surface-card/40 hover:bg-surface-card/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Archive size={18} />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>เปิดโปรเจกต์จากไฟล์ ZIP หรือ .ktproj</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      .ZIP / .KTPROJ
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ลากไฟล์ <code className="text-amber-300 font-mono">.zip</code> หรือ <code className="text-cyan-300 font-mono">.ktproj</code> มาปล่อยที่นี่ (ดึงโค้ดทุกไฟล์ พร้อมคืนค่าการตั้งค่าหุ่นยนต์ ความเร็ว ระยะ 1-8 และปุ่มลัดครบถ้วน)
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-brand-300 font-semibold px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 shrink-0">
                เลือกไฟล์โปรเจกต์
              </span>
            </div>

            {/* List of Projects */}
            <div className="space-y-2">
              {savedProjects.map((p) => {
                const isCurrent = p.name === projectName;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-brand-500/10 border-brand-500/40 shadow-sm'
                        : 'bg-surface-card border-surface-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-surface-darker text-slate-300 border border-surface-border shrink-0 mt-0.5">
                        <FolderOpen size={18} className={isCurrent ? 'text-brand-400' : 'text-slate-400'} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {p.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              กำลังเปิดอยู่
                            </span>
                          )}
                          <span className="text-[10px] font-mono bg-surface-darker text-slate-400 px-1.5 py-0.2 rounded border border-surface-border">
                            {p.files.length} ไฟล์
                          </span>
                        </div>

                        {/* File tags preview */}
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                          {p.files.map((f) => (
                            <span
                              key={f.id}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-dark text-slate-300 border border-surface-border"
                            >
                              {f.name}
                            </span>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{p.updatedAt}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-500">
                            <Cpu size={10} />
                            <span>{p.boardId}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <button
                        onClick={() => {
                          loadSavedProject(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition"
                      >
                        เปิดโปรเจกต์
                      </button>

                      <button
                        onClick={() => deleteSavedProject(p.id)}
                        disabled={savedProjects.length <= 1}
                        title="ลบโปรเจกต์นี้"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create New Project */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center gap-3">
              <FolderPlus size={24} className="text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-emerald-300">สร้างโปรเจกต์ใหม่ (New Project)</h3>
                <p className="text-[11px] text-slate-300">
                  เลือกสร้างโปรเจกต์ใหม่แบบว่างเปล่าเพื่อเริ่มต้นเขียนเอง หรือสร้างจากแม่แบบมาตรฐานสนามแข่ง
                </p>
              </div>
            </div>

            {/* Project Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                ชื่อโปรเจกต์ (Project Name)
              </label>
              <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs">
                <FileCode size={15} className="text-brand-400 shrink-0" />
                <input
                  type="text"
                  value={newProjectNameInput}
                  onChange={(e) => setNewProjectNameInput(e.target.value)}
                  placeholder="เช่น Robot_Challenge_2026"
                  required
                  className="bg-transparent flex-1 text-xs text-white outline-none placeholder-slate-500"
                />
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">
                เลือกรูปแบบโปรเจกต์เริ่มต้น
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* 1. Empty Arduino Setup/Loop */}
                <div
                  onClick={() => setNewProjectType('empty')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    newProjectType === 'empty'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10'
                      : 'border-surface-border bg-surface-card hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <FileCode size={20} className="text-emerald-400" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        แนะนำ
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200">ว่างเปล่า (Empty)</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      มีเฉพาะ <code className="text-teal-400 font-mono">main.ino</code> พร้อมฟังก์ชัน <code className="font-mono">setup()</code> และ <code className="font-mono">loop()</code>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-emerald-400">1 ไฟล์</div>
                </div>

                {/* 2. Blank 100% */}
                <div
                  onClick={() => setNewProjectType('blank')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    newProjectType === 'blank'
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-500/10'
                      : 'border-surface-border bg-surface-card hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Sparkles size={20} className="text-brand-400" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-darker text-slate-400">
                        100% ว่าง
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200">ว่างเปล่าสมบูรณ์ (Blank)</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      ไฟล์ <code className="text-teal-400 font-mono">main.ino</code> เปล่าสนิท ไม่มีโค้ดเริ่มต้น เหมาะกับเขียนเองจากศูนย์
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-slate-400">1 ไฟล์ (Blank)</div>
                </div>

                {/* 3. Competition Template */}
                <div
                  onClick={() => setNewProjectType('template')}
                  className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                    newProjectType === 'template'
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-500/10'
                      : 'border-surface-border bg-surface-card hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Bot size={20} className="text-cyan-400" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                        สนาม 3D
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200">แม่แบบสนามแข่ง 3D</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      มี 3 ไฟล์ครบชุด: <code className="font-mono">main.ino</code>, <code className="font-mono">robot_config.h</code>, <code className="font-mono">missions.h</code>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-brand-400">3 ไฟล์</div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className="px-3.5 py-2 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-300 text-xs font-medium border border-surface-border transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition"
              >
                <FolderPlus size={15} />
                <span>สร้างโปรเจกต์ทันที</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Save Current Project */}
        {activeTab === 'save' && (
          <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <HardDrive size={20} className="text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-100">บันทึกและส่งออกโปรเจกต์รวม (Unified Project Package)</h3>
                  <p className="text-[11px] text-slate-400">
                    รวมไฟล์โค้ดทั้งหมด พร้อมการตั้งค่าหุ่นยนต์ ค่าระยะทาง 1-8 ฟังก์ชั่นที่สร้างเอง และปุ่มลัดคีย์บอร์ดทั้งหมดไว้ในโปรเจกต์เดียว
                  </p>
                </div>
              </div>

              {/* Project Rename Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">ชื่อโปรเจกต์</label>
                <div className="flex items-center gap-2 bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-xs">
                  <FileCode size={14} className="text-brand-400" />
                  <input
                    type="text"
                    value={saveTitleInput}
                    onChange={(e) => setSaveTitleInput(e.target.value)}
                    placeholder="ตั้งชื่อโปรเจกต์ เช่น PTBOT_Maze_v1"
                    className="bg-transparent flex-1 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Files in this project */}
              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-semibold text-slate-300">
                  ไฟล์โค้ดในโปรเจกต์ ({projectFiles.length} ไฟล์):
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 bg-surface-darker rounded-lg border border-surface-border">
                  {projectFiles.map((f) => (
                    <span
                      key={f.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-200"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Unified Settings Included in this Package */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>การตั้งค่าที่ถูกบันทึกรวมในไฟล์โปรเจกต์นี้ (เปิดเครื่องอื่นค่าจะมาครบทั้งหมด):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-darker border border-surface-border">
                    <Gauge size={13} className="text-amber-400 shrink-0" />
                    <span>ความเร็ว & ระยะทางปุ่มลัด 1-8</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-darker border border-surface-border">
                    <Keyboard size={13} className="text-cyan-400 shrink-0" />
                    <span>ปุ่มลัดคีย์บอร์ดพิมพ์เร็ว (Keymaps)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-darker border border-surface-border">
                    <Sliders size={13} className="text-emerald-400 shrink-0" />
                    <span>ชุดฟังก์ชั่นที่สร้างเองทั้งหมด</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-darker border border-surface-border">
                    <Cpu size={13} className="text-purple-400 shrink-0" />
                    <span>บอร์ดหุ่นยนต์ & ตัวจำลอง Line-Scrub</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  * แยกเฉพาะระบบสนามแข่ง 3D (Arena) ที่แยกจัดการอิสระในระบบสนาม
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                >
                  {saveSuccess ? <Check size={14} /> : <Save size={14} />}
                  <span>{saveSuccess ? 'บันทึกเรียบร้อยแล้ว!' : 'บันทึกโปรเจกต์'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportProjectAsZip}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                  title="ส่งออกโค้ดทุกไฟล์ + การตั้งค่าทั้งหมด บีบอัดเป็น .zip สำหรับนำไปเปิดเครื่องอื่นได้ทันที"
                >
                  <Archive size={14} className="text-amber-400" />
                  <span>ส่งออกเป็น ZIP รวมโปรเจกต์ (.zip)</span>
                </button>

                <button
                  type="button"
                  onClick={exportProjectBundle}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-200 text-xs font-medium border border-surface-border transition"
                  title="ส่งออกเป็นไฟล์แพ็กเกจ .ktproj (โค้ด + ตั้งค่าทั้งหมดในไฟล์เดียว)"
                >
                  <Download size={13} className="text-brand-400" />
                  <span>ส่งออกเป็น .ktproj</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-darker flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Sparkles size={13} className="text-amber-400" /> สามารถกด <kbd className="px-1.5 py-0.5 rounded bg-surface-card border border-surface-border font-mono text-[10px] text-slate-200">Ctrl+S</kbd> ในหน้าเขียนโค้ดเพื่อบันทึกโปรเจกต์ได้ตลอดเวลา</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-200 text-xs font-medium border border-surface-border transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
