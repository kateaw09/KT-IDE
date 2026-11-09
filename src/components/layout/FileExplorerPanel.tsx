import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import {
  FileCode,
  FilePlus,
  FolderOpen,
  FolderPlus,
  X,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Cpu,
  Archive,
} from 'lucide-react';

export const FileExplorerPanel: React.FC = () => {
  const {
    projectName,
    projectFiles,
    activeFileId,
    setActiveFileId,
    createFile,
    deleteFile,
    renameFile,
    selectedBoard,
  } = useIDEStore();

  const [isFolderExpanded, setIsFolderExpanded] = useState(true);
  const [isNewFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      let finalName = newFileName.trim();
      if (!finalName.includes('.')) finalName += '.h';
      createFile(finalName);
      setNewFileName('');
      setNewFileModalOpen(false);
    }
  };

  const handleStartRename = (file: { id: string; name: string }) => {
    setEditingFileId(file.id);
    setEditFileName(file.name);
  };

  const handleFinishRename = (id: string) => {
    if (editFileName.trim()) {
      renameFile(id, editFileName.trim());
    }
    setEditingFileId(null);
  };

  const getFileBadgeColor = (name: string) => {
    if (name.endsWith('.ino')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (name.endsWith('.h') || name.endsWith('.hpp')) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    if (name.endsWith('.cpp') || name.endsWith('.c')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div className="flex flex-col h-full bg-surface-dark select-none text-slate-200">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-darker/80 border-b border-surface-border text-xs shrink-0">
        <span className="font-semibold text-slate-200 text-xs tracking-wide uppercase">
          Explorer / โครงสร้างไฟล์
        </span>
        <button
          onClick={() => setNewFileModalOpen(true)}
          title="สร้างไฟล์ใหม่ (+)"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
        >
          <FilePlus size={14} />
        </button>
      </div>

      {/* Project Root Folder */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        <div
          onClick={() => setIsFolderExpanded(!isFolderExpanded)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-surface-card/60 cursor-pointer text-xs font-semibold text-slate-300 transition"
        >
          {isFolderExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <HardDrive size={13} className="text-brand-400" />
          <span className="truncate">{projectName}</span>
          <span className="text-[10px] font-mono text-slate-500 ml-auto">
            ({projectFiles.length})
          </span>
        </div>

        {/* Files Tree */}
        {isFolderExpanded && (
          <div className="pl-4 space-y-0.5">
            {projectFiles.map((file) => {
              const isActive = file.id === activeFileId;
              const isEditing = editingFileId === file.id;

              return (
                <div
                  key={file.id}
                  onClick={() => !isEditing && setActiveFileId(file.id)}
                  onDoubleClick={() => handleStartRename(file)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all ${
                    isActive
                      ? 'bg-surface-card text-white border-l-2 border-l-brand-500 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded border font-mono ${getFileBadgeColor(
                        file.name
                      )}`}
                    >
                      {file.name.endsWith('.ino') ? 'INO' : file.name.endsWith('.h') ? 'H' : 'CPP'}
                    </span>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editFileName}
                        autoFocus
                        onChange={(e) => setEditFileName(e.target.value)}
                        onBlur={() => handleFinishRename(file.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(file.id)}
                        className="w-full bg-surface-darker border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                      />
                    ) : (
                      <span className="truncate">{file.name}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(file);
                      }}
                      title="เปลี่ยนชื่อไฟล์"
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <Edit2 size={11} />
                    </button>
                    {projectFiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(file.id);
                        }}
                        title="ลบไฟล์"
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target Board Info Footer */}
      <div className="p-3 bg-surface-darker/60 border-t border-surface-border text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Cpu size={12} className="text-amber-400" />
          <span>{selectedBoard.name}</span>
        </div>
        <div className="text-[10px] text-slate-500 truncate font-mono">
          {selectedBoard.architecture === 'esp32' ? 'Xtensa LX6 240MHz' : 'AVR 16MHz'}
        </div>
      </div>

      {/* New File Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-sm p-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <span className="font-semibold text-sm">เพิ่มไฟล์ใหม่ในโปรเจกต์</span>
              <button
                onClick={() => setNewFileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  ชื่อไฟล์ (เช่น sensors.h, pid.cpp):
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="เช่น mission_step2.h"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewFileModalOpen(false)}
                  className="px-3 py-1 rounded-lg bg-surface-card hover:bg-surface-hover text-slate-300 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  สร้างไฟล์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};