import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { ProjectVersion } from '../../types/ide';
import {
  GitBranch,
  X,
  Plus,
  Clock,
  Check,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Grid,
  Code2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bot,
  Zap,
} from 'lucide-react';

export const ProjectVersionModal: React.FC = () => {
  const {
    projectName,
    isVersionModalOpen,
    setVersionModalOpen,
    projectVersions,
    activeVersionId,
    createProjectVersion,
    restoreProjectVersion,
    deleteProjectVersion,
    renameProjectVersion,
  } = useIDEStore();

  const { tiles, fieldName } = useSimulatorStore();

  const [versionNameInput, setVersionNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isVersionModalOpen) return null;

  // Active non-empty tiles count in current simulator
  const currentActiveTilesCount = tiles.filter((t) => t.type !== 'normal').length;

  const handleCreateVersion = () => {
    const defaultTitle = `เวอร์ชัน v1.${projectVersions.length}`;
    const titleToUse = versionNameInput.trim() || defaultTitle;
    const newVer = createProjectVersion(titleToUse, 'unified');
    setVersionNameInput('');
    setSaveSuccessMsg(`บันทึกเวอร์ชัน "${newVer.versionTag}: ${newVer.name}" สำเร็จ!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const startEditing = (ver: ProjectVersion) => {
    setEditingId(ver.id);
    setEditingName(ver.name);
  };

  const saveEditing = (id: string) => {
    if (editingName.trim()) {
      renameProjectVersion(id, editingName.trim());
    }
    setEditingId(null);
  };

  const filteredVersions = projectVersions.filter((v) => {
    return (
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.versionTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.field.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-surface-dark border border-surface-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-darker shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 shadow-inner">
              <GitBranch size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  จัดการเวอร์ชันสนาม & โค้ด (Field & Code Versions)
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  {projectVersions.length} เวอร์ชัน
                </span>
              </div>
              <p className="text-xs text-slate-400">
                โครงการ: <span className="text-brand-300 font-semibold">{projectName}</span> — บันทึกสนามแข่งและโค้ดย่อย ลิ้งค์สองทาง และดึงเวอร์ชันเก่ามาแสดงได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={() => setVersionModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Creator Box */}
        <div className="p-4 bg-surface-card/60 border-b border-surface-border shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={versionNameInput}
              onChange={(e) => setVersionNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateVersion();
              }}
              placeholder="ตั้งชื่อเวอร์ชัน เช่น: รอบซ้อม 1, ด่านสะพาน + ทางแยก, ทดสอบ PID..."
              className="flex-1 bg-surface-dark border border-surface-border rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 transition shadow-inner font-sans"
            />

            <button
              onClick={handleCreateVersion}
              title="บันทึกสภาพสนามแข่งและโค้ดโปรแกรมปัจจุบันเข้าด้วยกันเป็นเวอร์ชันใหม่"
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950 transition shrink-0"
            >
              <Plus size={15} />
              <span>บันทึกเวอร์ชัน (สนาม + โค้ด)</span>
            </button>
          </div>

          {/* Quick status feedback */}
          {saveSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in">
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Status & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Layers size={13} className="text-violet-400" />
                <span>ประวัติทั้งหมด ({projectVersions.length} เวอร์ชัน)</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400">
                สถานะปัจจุบัน: สนาม ({currentActiveTilesCount} ชิ้นส่วน)
              </span>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเวอร์ชัน..."
              className="bg-surface-darker border border-surface-border rounded-lg px-3 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 w-52"
            />
          </div>
        </div>

        {/* Version Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredVersions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-surface-border bg-surface-card/30 flex flex-col items-center justify-center gap-2.5">
              <div className="p-3 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <GitBranch size={28} />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {projectVersions.length === 0 ? 'ยังไม่มีเวอร์ชันที่บันทึกไว้' : 'ไม่พบเวอร์ชันที่ค้นหา'}
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                กดปุ่ม <strong>"+ บันทึกเวอร์ชันสนาม"</strong> หรือ <strong>"+ บันทึกเวอร์ชันโค้ด"</strong> ด้านบนเพื่อสร้าง Snapshot เก็บไว้ เมื่อต้องการย้อนกลับมาดูหรือใช้งาน สามารถคลิกดึงสนามหรือโค้ดกลับมาแสดงผลได้ทันที
              </p>
            </div>
          ) : (
            filteredVersions.map((ver) => {
              const isEditing = editingId === ver.id;
              const isActive = activeVersionId === ver.id;

              return (
                <div
                  key={ver.id}
                  className={`p-4 rounded-xl border transition flex flex-col gap-3 ${
                    isActive
                      ? 'border-violet-500/60 bg-violet-500/5 shadow-md shadow-violet-950/30'
                      : 'border-surface-border bg-surface-card/70 hover:border-slate-600'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        {ver.versionTag}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing(ver.id);
                            }}
                            className="bg-surface-dark border border-violet-500 rounded-md px-2 py-0.5 text-xs text-white outline-none flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditing(ver.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-sm text-slate-100 truncate">
                            {ver.name}
                          </span>
                          <button
                            onClick={() => startEditing(ver)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                            title="แก้ไขชื่อเวอร์ชัน"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <ArrowRightLeft size={10} className="text-violet-400" />
                        <span>ลิ้งค์สนาม & โค้ด</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        <span>{ver.timestamp}</span>
                      </span>

                      <button
                        onClick={() => {
                          if (confirm(`คุณต้องการลบเวอร์ชัน "${ver.name}" ใช่หรือไม่?`)) {
                            deleteProjectVersion(ver.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="ลบเวอร์ชันนี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Dual Linked Panels (Field <-> Code) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {/* Left: Field Snapshot */}
                    <div className="p-3 rounded-xl bg-surface-darker/80 border border-surface-border flex flex-col justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                            <Grid size={13} />
                            <span>ข้อมูลสนาม (Field Snapshot)</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-surface-card px-1.5 py-0.2 rounded">
                            {ver.field.tileCount} ชิ้นส่วน
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 font-medium truncate">
                          {ver.field.name}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {ver.field.description || 'สนามขนาด 4x8 พร้อมตำแหน่งอุปกรณ์'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          restoreProjectVersion(ver.id, 'field');
                          setSaveSuccessMsg(`ดึงสนามจาก "${ver.name}" มาแสดงเรียบร้อย!`);
                          setTimeout(() => setSaveSuccessMsg(null), 2500);
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                      >
                        <Grid size={12} />
                        <span>ดึงเฉพาะสนามนี้มาแสดง</span>
                      </button>
                    </div>

                    {/* Right: Code Snapshot */}
                    <div className="p-3 rounded-xl bg-surface-darker/80 border border-surface-border flex flex-col justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                            <Code2 size={13} />
                            <span>โค้ดที่ลิ้งค์ไว้ (Linked Code)</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-surface-card px-1.5 py-0.2 rounded">
                            {ver.code.fileCount} ไฟล์
                          </span>
                        </div>
                        <div className="text-xs text-slate-200 font-medium truncate">
                          ไฟล์หลัก: {ver.code.files[0]?.name || 'main.ino'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 bg-surface-dark/90 p-1 rounded border border-white/5 truncate">
                          {ver.code.mainSnippet ? ver.code.mainSnippet.split('\n')[0] : '// โค้ดโปรแกรมหุ่นยนต์'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          restoreProjectVersion(ver.id, 'code');
                          setSaveSuccessMsg(`ดึงโค้ดที่ลิ้งค์จาก "${ver.name}" เรียบร้อย!`);
                          setTimeout(() => setSaveSuccessMsg(null), 2500);
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition"
                      >
                        <Code2 size={12} />
                        <span>ดึงเฉพาะโค้ดที่ลิ้งค์ไว้</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom: Load Both Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-surface-border/50">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ArrowRightLeft size={11} className="text-violet-400" />
                      <span>สนามและโค้ดของเวอร์ชันนี้เชื่อมโยงกันสมบูรณ์</span>
                    </span>

                    <button
                      onClick={() => {
                        restoreProjectVersion(ver.id, 'both');
                        setSaveSuccessMsg(`ดึงทั้งสนามและโค้ดของ "${ver.name}" เรียบร้อย!`);
                        setTimeout(() => setSaveSuccessMsg(null), 2500);
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-950 transition"
                    >
                      <Zap size={13} />
                      <span>ดึงทั้งสนามและโค้ดพร้อมกัน</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-surface-border bg-surface-darker flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>ทุกเวอร์ชันจะถูกบันทึกรวมในไฟล์โปรเจกต์ .ktproj และไฟล์ .zip โดยอัตโนมัติ</span>
          </div>

          <button
            onClick={() => setVersionModalOpen(false)}
            className="px-5 py-1.5 rounded-xl bg-surface-card hover:bg-slate-700 text-white text-xs font-bold border border-surface-border transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
