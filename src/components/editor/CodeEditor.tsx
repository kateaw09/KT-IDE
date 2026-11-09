import React, { useRef, useState, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useIDEStore } from '../../store/useIDEStore';
import {
  FileCode,
  FilePlus,
  X,
  Save,
  Check,
  Code2,
  FolderOpen,
  FolderPlus,
  Edit2,
  Plus,
  Sparkles,
  Settings,
  Archive,
  Upload,
  Undo2,
  Redo2,
  AlignLeft,
  Bot,
  LocateFixed,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { formatCppCode } from '../../utils/codeFormatter';

// Configure monaco-editor to use locally bundled instance (Zero CDN)
loader.config({ monaco });

let isFormattingProviderRegistered = false;

export const CodeEditor: React.FC = () => {
  const {
    code,
    setCode,
    projectName,
    projectFiles,
    activeFileId,
    setActiveFileId,
    createFile,
    deleteFile,
    renameFile,
    setEditorInsertHandler,
    saveCurrentProject,
    createNewProject,
    addConsoleLog,
    editorFontSize,
    setEditorFontSize,
    editorFontFamily,
    editorWordWrap,
    editorMinimap,
    setSettingsOpen,
    importProjectFromZipFile,
    executionStep,
    isSimulationOnLine,
    toggleSimulationOnLine,
  } = useIDEStore();

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isNewFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');
  const autoSaveTimerRef = useRef<any>(null);
  const [isNewProjModalOpen, setNewProjModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('New_Robot_Project');
  const [newProjType, setNewProjType] = useState<'empty' | 'blank' | 'template'>('empty');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeFile = projectFiles.find((f) => f.id === activeFileId) || projectFiles[0];

  const handleSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    saveCurrentProject();
    setAutoSaveStatus('saved');
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 1500);
  };

  // Real-time Autosave on Typing (Debounced 800ms)
  const handleEditorCodeChange = (newVal: string | undefined) => {
    const newCode = newVal || '';
    setCode(newCode);
    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveCurrentProject(undefined, true);
      setAutoSaveStatus('saved');
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'undo', null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'redo', null);
      editorRef.current.focus();
    }
  };

  const handleFormatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      editorRef.current.focus();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Format Pattern: Alt + Shift + F
      if (e.altKey && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handleFormatDocument();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') {
          e.preventDefault();
          setEditorFontSize(useIDEStore.getState().editorFontSize + 1);
        } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          setEditorFontSize(useIDEStore.getState().editorFontSize - 1);
        } else if (e.key === '0' || e.code === 'Numpad0') {
          e.preventDefault();
          setEditorFontSize(14);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [saveCurrentProject, setEditorFontSize]);

  // Live Debugger Execution Line Highlighting & Auto-Scroll
  useEffect(() => {
    if (!editorRef.current) return;
    if (executionStep && executionStep.fileId === activeFileId && executionStep.lineNumber > 0) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(executionStep.lineNumber, 1, executionStep.lineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-execution-active-line',
            glyphMarginClassName: 'monaco-execution-active-glyph',
            overviewRuler: {
              color: '#f59e0b',
              position: monaco.editor.OverviewRulerLane.Full,
            },
          },
        },
      ]);
      editorRef.current.revealLineInCenterIfOutsideViewport(executionStep.lineNumber);
    } else {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [executionStep, activeFileId]);

  // When Simulation on Line is toggled ON or active file changes, immediately sync to cursor line
  useEffect(() => {
    if (isSimulationOnLine && editorRef.current) {
      const pos = editorRef.current.getPosition();
      if (pos) {
        useSimulatorStore.getState().teleportToLine(activeFileId, pos.lineNumber, projectFiles);
      }
    }
  }, [isSimulationOnLine, activeFileId]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Simulation on Line (Live Run-to-Cursor Instant Teleport)
    let lastTeleportLine = -1;
    let teleportTimer: any = null;

    const triggerLineSimulation = (lineNumber: number) => {
      const state = useIDEStore.getState();
      if (!state.isSimulationOnLine) return;
      if (lineNumber === lastTeleportLine) return;
      lastTeleportLine = lineNumber;

      if (teleportTimer) clearTimeout(teleportTimer);
      teleportTimer = setTimeout(() => {
        const curActiveFileId = useIDEStore.getState().activeFileId;
        const curFiles = useIDEStore.getState().projectFiles;
        useSimulatorStore.getState().teleportToLine(curActiveFileId, lineNumber, curFiles);
      }, 40);
    };

    editor.onDidChangeCursorPosition((e) => {
      triggerLineSimulation(e.position.lineNumber);
    });

    editor.onMouseDown((e) => {
      if (e.target?.position?.lineNumber) {
        triggerLineSimulation(e.target.position.lineNumber);
      }
    });

    // Register Undo: Ctrl + Z
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });

    // Register Redo: Ctrl + Shift + Z & Ctrl + Y
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger('keyboard', 'redo', null);
    });

    // Register Format Document: Alt + Shift + F
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // Register Offline C/C++ Document Formatting Provider (Zero CDN)
    if (!isFormattingProviderRegistered) {
      isFormattingProviderRegistered = true;
      monaco.languages.registerDocumentFormattingEditProvider('cpp', {
        provideDocumentFormattingEdits(model) {
          const current = model.getValue();
          const formatted = formatCppCode(current);
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        },
      });
    }

    // Register Ctrl+S shortcut inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Register Ctrl + / Ctrl - shortcuts to zoom editor font size while typing
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      setEditorFontSize(useIDEStore.getState().editorFontSize + 1);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.NumpadAdd, () => {
      setEditorFontSize(useIDEStore.getState().editorFontSize + 1);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      setEditorFontSize(useIDEStore.getState().editorFontSize - 1);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.NumpadSubtract, () => {
      setEditorFontSize(useIDEStore.getState().editorFontSize - 1);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      setEditorFontSize(14);
    });

    // Register offline insertion handler via executeEdits
    setEditorInsertHandler((snippet: string) => {
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits('function-builder', [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: snippet,
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      }
    });

    // Register Offline Autocomplete / Auto-Correct Provider (PTBOT + Arduino Core + Multi-File Project Scanner)
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monaco.languages.CompletionItem[] = [
          // --- PT_MIDDLE_ENC_2026UI & PTBOT Framework Commands ---
          {
            label: 'FFE',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'FFE(${1:100}, ${2:400});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'FFE(speed, distance, [turn], [ramp_up], [ramp_down])',
            documentation: 'เดินหน้าด้วย Encoder พร้อมทางเลือกหมุน (L, R, l, r) และปรับ Ramp',
            range,
          },
          {
            label: 'FFE_turn',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'FFE_turn(${1:100}, ${2:100}, ${3:\'R\'});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'FFE_turn(speed, distance, [turn])',
            documentation: 'เดินหน้าระยะสั้นก่อนเข้า Turn (ไม่มี Ramp)',
            range,
          },
          {
            label: 'BBE',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'BBE(${1:100}, ${2:400});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'BBE(speed, distance, [turn], [ramp_up], [ramp_down])',
            documentation: 'ถอยหลังด้วย Encoder พร้อมทางเลือกหมุนและปรับ Ramp',
            range,
          },
          {
            label: 'BBE_turn',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'BBE_turn(${1:100}, ${2:100}, ${3:\'L\'});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'BBE_turn(speed, distance, [turn])',
            documentation: 'ถอยหลังระยะสั้นก่อนเข้า Turn (ไม่มี Ramp)',
            range,
          },
          {
            label: 'spinDegree',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'spinDegree(${1:90});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'spinDegree(relative_degree, [threshold])',
            documentation: 'หมุนตัวอยู่กับที่ด้วยไจโร (90=ขวา, -90=ซ้าย, 45=ขวา45°, -45=ซ้าย45°)',
            range,
          },
          {
            label: 'turnDegreeFront',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'turnDegreeFront(${1:90});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'turnDegreeFront(relative_degree, [threshold])',
            documentation: 'เดินหน้าเลี้ยวตามองศาไจโร',
            range,
          },
          {
            label: 'turnDegreeBack',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'turnDegreeBack(${1:-90});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'turnDegreeBack(relative_degree, [threshold])',
            documentation: 'ถอยหลังเลี้ยวตามองศาไจโร',
            range,
          },
          {
            label: 'SetFront',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'SetFront(${1:20});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'SetFront(speed, [target], [turn])',
            documentation: 'หน้าหุ่นเข้าหาเส้น (ตรวจจับเซนเซอร์หน้าแล้วหยุด/ถอย/เลี้ยว)',
            range,
          },
          {
            label: 'SetBack',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'SetBack(${1:20});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'SetBack(speed, [target], [turn])',
            documentation: 'หลังหุ่นเข้าหาเส้น (ตรวจจับเซนเซอร์หลังแล้วหยุด/เดินหน้า/เลี้ยว)',
            range,
          },
          {
            label: 'SetFront_time',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'SetFront_time(${1:20}, ${2:150});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'SetFront_time(speed, timer_ms, [turn])',
            documentation: 'จัดหน้าหุ่นเข้าหาเส้นแล้วถอยตามเวลา (ms)',
            range,
          },
          {
            label: 'SetBack_time',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'SetBack_time(${1:20}, ${2:150});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'SetBack_time(speed, timer_ms, [turn])',
            documentation: 'จัดหลังหุ่นเข้าหาเส้นแล้วเดินหน้าตามเวลา (ms)',
            range,
          },
          {
            label: 'DropF',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'DropF();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'DropF([speed])',
            documentation: 'ปล่อยถุงยังชีพด้านหน้า (FRONT: DROP -> รอ -> กลับ LOCK อัตโนมัติ)',
            range,
          },
          {
            label: 'DropB',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'DropB();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'DropB([speed])',
            documentation: 'ปล่อยถุงยังชีพด้านหลัง (BACK: DROP -> รอ -> กลับ LOCK อัตโนมัติ)',
            range,
          },
          {
            label: 'FF',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'FF(${1:50}, ${2:500});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'FF(speed, timer_ms, [turn])',
            documentation: 'เดินหน้าด้วยความเร็วตามเวลา (ms) พร้อมทางเลือกหมุน',
            range,
          },
          {
            label: 'BB',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'BB(${1:50}, ${2:500});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'BB(speed, timer_ms, [turn])',
            documentation: 'ถอยหลังด้วยความเร็วตามเวลา (ms) พร้อมทางเลือกหมุน',
            range,
          },
          {
            label: 'STOP',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'STOP();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'STOP()',
            documentation: 'สั่งหยุดมอเตอร์และรอกดปุ่ม A หรือ B เพื่อทำงานต่อ',
            range,
          },
          {
            label: 'wait_start',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'wait_start();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'wait_start()',
            documentation: 'ส่งเสียงบัสเซอร์และรอให้กดปุ่ม A หรือ B บนบอร์ดเพื่อเริ่มภารกิจ',
            range,
          },
          {
            label: 'motorWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'motorWrite(${1:50}, ${2:50}, ${3:50}, ${4:50});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'motorWrite(m1, m2, m3, m4) หรือ motorWrite(channel, speed)',
            documentation: 'สั่งงานความเร็วมอเตอร์ (-100 ถึง 100)',
            range,
          },
          {
            label: 'motorStop',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'motorStop();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'motorStop()',
            documentation: 'สั่งหยุดมอเตอร์ทั้งหมดทันที',
            range,
          },
          {
            label: 'servoWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'servoWrite(${1:FRONT_SERVO}, ${2:FrontServo_Drop});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'servoWrite(channel, degree)',
            documentation: 'สั่งงานมุมองศาเซอร์โว',
            range,
          },
          {
            label: 'beep',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'beep(${1:50});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'beep(duration_ms)',
            documentation: 'ส่งเสียงบัสเซอร์เตือน (มิลลิวินาที)',
            range,
          },
          {
            label: 'switchRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'switchRead(${1:A})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'switchRead(A หรือ B)',
            documentation: 'อ่านค่าปุ่มกดสวิตช์ A หรือ B บนบอร์ด PTBOT',
            range,
          },
          {
            label: 'initialize',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'initialize();',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'initialize()',
            documentation: 'เริ่มต้นระบบบอร์ด PTBOT Atom VX (เซนเซอร์ มอเตอร์ จอภาพ)',
            range,
          },

          // --- Standard Arduino Core Functions ---
          {
            label: 'pinMode',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'pinMode(${1:pin}, ${2:OUTPUT});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'pinMode(pin, mode)',
            documentation: 'กำหนดโหมดของขา GPIO (INPUT, OUTPUT, INPUT_PULLUP)',
            range,
          },
          {
            label: 'digitalWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalWrite(${1:pin}, ${2:HIGH});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'digitalWrite(pin, value)',
            documentation: 'สั่งจ่ายลอจิก HIGH หรือ LOW ออกที่ขา GPIO',
            range,
          },
          {
            label: 'digitalRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalRead(${1:pin})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'digitalRead(pin)',
            documentation: 'อ่านค่าลอจิกดิจิทัล (HIGH/LOW) จากขา GPIO',
            range,
          },
          {
            label: 'delay',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'delay(${1:500});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'delay(ms)',
            documentation: 'หยุดการทำงานตามเวลาที่กำหนดเป็นมิลลิวินาที',
            range,
          },
          {
            label: 'millis',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'millis()',
            detail: 'unsigned long millis()',
            documentation: 'นับเวลาที่บอร์ดเริ่มทำงานเป็นมิลลิวินาที',
            range,
          },
          {
            label: 'Serial.begin',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'Serial.begin(${1:115200});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Serial.begin(baud)',
            documentation: 'เริ่มต้นใช้งานการสื่อสารผ่าน Serial Port',
            range,
          },
          {
            label: 'Serial.println',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'Serial.println(${1:msg});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: 'Serial.println(val)',
            documentation: 'ส่งข้อมูลออกทาง Serial Port พร้อมขึ้นบรรทัดใหม่',
            range,
          },
        ];

        // --- Multi-File Project Symbols Parser (ค้นหาฟังก์ชั่นและค่าคงที่ในทุกไฟล์ของโปรเจกต์!) ---
        try {
          const allProjectFiles = useIDEStore.getState().projectFiles;
          const seen = new Set<string>(suggestions.map((s) => s.label as string));

          allProjectFiles.forEach((file) => {
            // Find functions: void/int/bool FunctionName(...)
            const fnRegex = /(?:void|int|float|double|bool|char|long|unsigned\s+long|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;
            let m;
            while ((m = fnRegex.exec(file.content)) !== null) {
              const name = m[1];
              const paramStr = m[2].trim();
              if (name === 'setup' || name === 'loop' || seen.has(name)) continue;

              seen.add(name);
              let snippet = `${name}(`;
              if (paramStr) {
                const params = paramStr.split(',').map((p, idx) => {
                  const parts = p.trim().split(/\s+/);
                  const pName = parts[parts.length - 1].replace(/[*&]/g, '');
                  return `\${${idx + 1}:${pName}}`;
                });
                snippet += params.join(', ');
              }
              snippet += ');';

              suggestions.push({
                label: name,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `(ฟังก์ชั่นใน ${file.name})`,
                documentation: `ฟังก์ชั่นผู้ใช้จากไฟล์ ${file.name}:\n${m[0]}`,
                range,
              });
            }

            // Find #define Constants
            const defRegex = /#define\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(.*))?/g;
            while ((m = defRegex.exec(file.content)) !== null) {
              const defName = m[1];
              const defVal = (m[2] || '').trim();
              if (seen.has(defName)) continue;
              seen.add(defName);

              suggestions.push({
                label: defName,
                kind: monaco.languages.CompletionItemKind.Constant,
                insertText: defName,
                detail: `(ค่าคงที่ใน ${file.name})`,
                documentation: `#define ${defName} ${defVal}`,
                range,
              });
            }
          });
        } catch (e) {}

        return { suggestions };
      },
    });
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
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

  const handleFileProcess = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      await importProjectFromZipFile(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        createFile(file.name, content);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadNewFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileProcess(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Check if left to outside element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileProcess(file);
    }
  };

  const getFileBadgeColor = (name: string) => {
    if (name.endsWith('.ino')) return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
    if (name.endsWith('.h') || name.endsWith('.hpp')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    if (name.endsWith('.cpp') || name.endsWith('.c')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-full bg-[#12141c] overflow-hidden select-none"
    >
      {/* Drag & Drop ZIP Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-brand-950/90 backdrop-blur-sm border-2 border-dashed border-brand-400 flex flex-col items-center justify-center text-center p-6 pointer-events-none animate-in fade-in duration-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 mb-3 shadow-2xl">
            <Archive size={32} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            วางไฟล์ .ZIP เพื่อเปิดโปรเจกต์
          </h3>
          <p className="text-xs text-amber-200 max-w-md">
            ระบบจะแตกไฟล์และโหลดทุกไฟล์ในโปรเจกต์ (.ino, .h, .cpp) เข้ามาใน IDE ทันที
          </p>
        </div>
      )}

      {/* 1. Multi-File Tabs Bar (Tier 1) */}
      <div className="flex items-center justify-between bg-surface-darker/90 backdrop-blur-sm border-b border-surface-border px-2 text-xs overflow-x-auto select-none shrink-0 h-9">
        {/* Left: Tabs List */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {projectFiles.map((f) => {
            const isActive = f.id === activeFileId;
            const isEditing = editingFileId === f.id;

            return (
              <div
                key={f.id}
                onClick={() => !isEditing && setActiveFileId(f.id)}
                onDoubleClick={() => handleStartRename(f)}
                className={`group flex items-center gap-2 px-3 py-1 rounded-t-md text-xs font-mono transition-all cursor-pointer shrink-0 border-t-2 select-none ${
                  isActive
                    ? 'bg-surface-dark border-t-brand-500 text-slate-100 font-semibold shadow-sm'
                    : 'bg-transparent border-t-transparent text-slate-400 hover:text-slate-200 hover:bg-surface-card/40'
                }`}
              >
                {/* File Icon / Badge */}
                <span className={`text-[9px] font-bold px-1 py-0.2 rounded border uppercase font-mono ${getFileBadgeColor(f.name)}`}>
                  {f.name.endsWith('.ino') ? 'INO' : f.name.endsWith('.h') ? 'H' : 'CPP'}
                </span>

                {/* Name / Editable Input */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editFileName}
                    autoFocus
                    onChange={(e) => setEditFileName(e.target.value)}
                    onBlur={() => handleFinishRename(f.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(f.id)}
                    className="w-24 bg-surface-card border border-brand-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                  />
                ) : (
                  <span className={`font-medium ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                    {f.name}
                  </span>
                )}

                {/* Close Button */}
                {projectFiles.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(f.id);
                    }}
                    title="ปิดไฟล์"
                    className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {/* New File (+) Button */}
          <button
            onClick={() => setNewFileModalOpen(true)}
            title="เพิ่มไฟล์ใหม่ (เช่น robot_config.h, mission.cpp)"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-brand-300 hover:bg-surface-card/60 text-xs font-medium transition shrink-0 ml-0.5"
          >
            <Plus size={13} />
            <span>เพิ่มไฟล์</span>
          </button>
        </div>

        {/* Right: Quick Project File Actions */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2 whitespace-nowrap">
          {/* New Project Button */}
          <button
            onClick={() => setNewProjModalOpen(true)}
            title="สร้างโปรเจกต์ใหม่ (ว่างเปล่า / แม่แบบ)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-emerald-300 border border-surface-border text-xs font-medium transition whitespace-nowrap btn-press"
          >
            <FolderPlus size={12} className="text-emerald-400 shrink-0" />
            <span>โปรเจกต์ใหม่</span>
          </button>

          {/* Upload File / Open ZIP */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadNewFile}
            accept=".zip,.ktproj,.ino,.cpp,.c,.h,.hpp,.txt,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="เปิดไฟล์โค้ด หรือแตกไฟล์โปรเจกต์ .zip"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-dark hover:bg-surface-card text-slate-300 hover:text-brand-300 border border-surface-border text-xs font-medium transition whitespace-nowrap btn-press"
          >
            <FolderOpen size={12} className="text-brand-400 shrink-0" />
            <span>เปิดไฟล์/ZIP</span>
          </button>
        </div>
      </div>

      {/* 2. Editor Action & Sub-Toolbar (Tier 2) */}
      <div className="flex items-center justify-between bg-surface-dark border-b border-surface-border px-3 py-1 text-xs select-none shrink-0 gap-2">
        {/* Left: Breadcrumbs & Quick Code Tools */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 pr-1">
            <span className="text-slate-500">src</span>
            <span className="text-slate-600">/</span>
            <span className="text-brand-300 font-semibold">{activeFile?.name || 'main.ino'}</span>
          </div>

          <div className="w-[1px] h-3.5 bg-surface-border"></div>

          {/* Undo / Redo */}
          <div className="flex items-center bg-surface-card rounded-md border border-surface-border p-0.5">
            <button
              onClick={handleUndo}
              title="ย้อนกลับการแก้ไข (Undo: Ctrl+Z)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-hover transition"
            >
              <Undo2 size={12} />
            </button>
            <button
              onClick={handleRedo}
              title="ทำซ้ำ (Redo: Ctrl+Shift+Z / Ctrl+Y)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-hover transition"
            >
              <Redo2 size={12} />
            </button>
          </div>

          {/* Format Code */}
          <button
            onClick={handleFormatDocument}
            title="จัดรูปแบบโค้ดอัตโนมัติ (Alt+Shift+F)"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-amber-300 border border-surface-border text-[11px] font-medium transition whitespace-nowrap btn-press"
          >
            <AlignLeft size={12} className="text-amber-400 shrink-0" />
            <span>จัดหน้าโค้ด</span>
          </button>

          {/* Simulation on Line Toggle */}
          <button
            onClick={toggleSimulationOnLine}
            title={
              isSimulationOnLine
                ? 'Simulation on Line: เปิดอยู่ (คลิกบรรทัดไหน หุ่นจะวิ่งไปจำลองทันที)'
                : 'เปิด Simulation on Line (คลิกบรรทัดใด หุ่นยนต์จะจำลองไปยังตำแหน่งนั้นทันที)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap border btn-press ${
              isSimulationOnLine
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                : 'bg-surface-card text-slate-400 hover:text-slate-200 border-surface-border'
            }`}
          >
            <LocateFixed
              size={12}
              className={isSimulationOnLine ? 'text-brand-400 animate-pulse' : 'text-slate-400 shrink-0'}
            />
            <span>Sim on Line</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSimulationOnLine ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Right: Autosave Status, Quick Save, Font Size & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Autosave Status Indicator */}
          <div
            title="ระบบบันทึกโปรเจกต์อัตโนมัติขณะพิมพ์ (Auto-Save Enabled)"
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 select-none whitespace-nowrap"
          >
            {autoSaveStatus === 'saving' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-amber-300">กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-400">บันทึกอัตโนมัติแล้ว</span>
              </>
            )}
          </div>

          {/* Quick Save */}
          <button
            onClick={handleSave}
            title="บันทึกโปรเจกต์ทันที (Ctrl+S)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap btn-press ${
              saveFeedback
                ? 'bg-emerald-600 text-white'
                : 'bg-surface-card hover:bg-surface-hover text-slate-300 hover:text-emerald-400 border border-surface-border'
            }`}
          >
            {saveFeedback ? <Check size={12} className="text-white shrink-0" /> : <Save size={12} className="shrink-0 text-emerald-400" />}
            <span>{saveFeedback ? 'บันทึกแล้ว!' : 'บันทึก'}</span>
          </button>

          {/* Quick Font Size Controls */}
          <div className="flex items-center bg-surface-card rounded-md border border-surface-border p-0.5 text-xs whitespace-nowrap">
            <button
              onClick={() => setEditorFontSize(editorFontSize - 1)}
              title="ลดขนาดตัวอักษร (A-)"
              className="px-1.5 py-0.5 hover:text-white text-slate-400 font-semibold hover:bg-surface-hover rounded transition text-[11px]"
            >
              A-
            </button>
            <span className="font-mono text-[11px] font-semibold text-brand-300 px-1">
              {editorFontSize}
            </span>
            <button
              onClick={() => setEditorFontSize(editorFontSize + 1)}
              title="เพิ่มขนาดตัวอักษร (A+)"
              className="px-1.5 py-0.5 hover:text-white text-slate-400 font-semibold hover:bg-surface-hover rounded transition text-[11px]"
            >
              A+
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              title="ตั้งค่าฟอนต์เพิ่มเติม"
              className="ml-0.5 pl-1 pr-1 border-l border-surface-border text-slate-400 hover:text-brand-300 transition"
            >
              <Settings size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Monaco Code Editor Instance */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={activeFile?.content || code}
          onChange={handleEditorCodeChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: editorFontSize,
            fontFamily: editorFontFamily,
            fontLigatures: true,
            minimap: { enabled: editorMinimap, side: 'right' },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            lineNumbers: 'on',
            lineDecorationsWidth: 6,
            wordWrap: editorWordWrap ? 'on' : 'off',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* 3. New File Prompt Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-sm p-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <FilePlus size={16} className="text-brand-400" />
                <span className="font-semibold text-sm">สร้างไฟล์ Arduino / C ใหม่</span>
              </div>
              <button
                onClick={() => setNewFileModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  ชื่อไฟล์ (เช่น sensors.h, pid_controller.cpp, missions.h):
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="เช่น robot_pins.h"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewFileModalOpen(false)}
                  className="px-3 py-1 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-300 text-xs font-medium border border-surface-border"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm"
                >
                  สร้างไฟล์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. New Project Prompt Modal */}
      {isNewProjModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-md p-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-emerald-400" />
                <span className="font-semibold text-sm">สร้างโปรเจกต์ใหม่ (New Project)</span>
              </div>
              <button
                onClick={() => setNewProjModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProjName.trim()) return;
                createNewProject(newProjName.trim(), newProjType);
                setNewProjModalOpen(false);
              }}
              className="mt-3 space-y-3"
            >
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">
                  ชื่อโปรเจกต์:
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="เช่น Maze_Runner_Bot"
                  className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 block font-medium">
                  รูปแบบโปรเจกต์:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setNewProjType('empty')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition select-none flex flex-col items-center justify-center ${
                      newProjType === 'empty'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-surface-border bg-surface-card text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode size={20} className="mb-1 text-emerald-400" />
                    <div className="text-[11px] font-semibold">ว่างเปล่า</div>
                    <div className="text-[9px] opacity-75">setup & loop</div>
                  </div>

                  <div
                    onClick={() => setNewProjType('blank')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition select-none flex flex-col items-center justify-center ${
                      newProjType === 'blank'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                        : 'border-surface-border bg-surface-card text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles size={20} className="mb-1 text-brand-400" />
                    <div className="text-[11px] font-semibold">Blank 100%</div>
                    <div className="text-[9px] opacity-75">ว่างสนิท</div>
                  </div>

                  <div
                    onClick={() => setNewProjType('template')}
                    className={`p-2.5 rounded-lg border text-center cursor-pointer transition select-none flex flex-col items-center justify-center ${
                      newProjType === 'template'
                        ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                        : 'border-surface-border bg-surface-card text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bot size={20} className="mb-1 text-cyan-400" />
                    <div className="text-[11px] font-semibold">แม่แบบสนาม 3D</div>
                    <div className="text-[9px] opacity-75">3 ไฟล์ครบชุด</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setNewProjModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-slate-700 text-slate-300 text-xs font-medium border border-surface-border"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition"
                >
                  <FolderPlus size={14} />
                  <span>สร้างโปรเจกต์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
