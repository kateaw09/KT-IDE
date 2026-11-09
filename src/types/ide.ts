import { GridTile } from './simulator';

export type EditorMode = 'code' | 'macro';

export interface SketchFile {
  id: string;
  name: string;
  content: string;
  isEntry?: boolean;
  isModified?: boolean;
}

export interface BoardDefinition {
  id: string;
  name: string;
  fqbn?: string;
  mcu: string;
  fCpu: string;
  protocol: string;
  baudRate: number;
  core: string;
  variant: string;
  architecture?: 'esp32' | 'avr';
  flashSize?: string;
  uploadTool?: string;
  description?: string;
}

export interface BoardManagerPackage {
  name: string;
  maintainer: string;
  websiteURL: string;
  platforms: {
    name: string;
    architecture: string;
    version: string;
    category: string;
    boards: { name: string }[];
  }[];
  installed: boolean;
  indexUrl: string;
}

export interface SavedSketch {
  id: string;
  title: string;
  code: string;
  updatedAt: string;
  boardId?: string;
}

export interface ProjectSettings {
  robotDefaultSpeed?: number;
  robotDefaultDistance?: number;
  distancePresets?: number[];
  customFunctions?: FunctionTemplateItem[];
  isFastKeyboardMode?: boolean;
  fastKeyBindings?: FastKeyBinding[];
  isSimulationOnLine?: boolean;
  editorFontSize?: number;
  editorFontFamily?: string;
  uiFontFamily?: string;
  uiFontSize?: number;
  editorWordWrap?: boolean;
  editorMinimap?: boolean;
}

export interface ProjectFieldData {
  name: string;
  tiles: GridTile[];
  updatedAt?: string;
}

export interface ProjectVersion {
  id: string;
  versionTag: string; // e.g. "v1.0", "v1.1", "v2.0"
  name: string; // e.g. "รอบซ้อม 1", "สนามหลัก + สะพาน"
  timestamp: string;
  createdFrom: 'field' | 'code' | 'unified';
  field: {
    name: string;
    tiles: GridTile[];
    tileCount: number;
    description?: string;
  };
  code: {
    files: SketchFile[];
    activeFileId: string;
    fileCount: number;
    mainSnippet?: string;
  };
  notes?: string;
}

export interface ProjectData {
  format?: string;
  version?: string;
  id: string;
  name: string;
  files: SketchFile[];
  activeFileId: string;
  boardId: string;
  updatedAt: string;
  description?: string;
  settings?: ProjectSettings;
  field?: ProjectFieldData;
  versions?: ProjectVersion[];
}

export interface SerialPortInfo {
  portName: string;
  description: string;
  hardwareId?: string;
}

export interface LibraryItem {
  name: string;
  version: string;
  author: string;
  description: string;
  installed: boolean;
  headerFiles: string[];
}

export type BuildState = 'idle' | 'compiling' | 'linking' | 'uploading' | 'success' | 'error';

export interface ExecutionStepInfo {
  fileId: string;
  fileName: string;
  lineNumber: number;
  codeSnippet?: string;
}

export interface FunctionParamDef {
  name: string;
  type?: string;
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  options?: string[]; // E.g. ["'L'", "'R'", "'l'", "'r'"]
}

export interface FunctionTemplateItem {
  id: string;
  name: string;
  category: 'encoder' | 'gyro' | 'line' | 'servo' | 'time' | 'motor' | 'custom';
  categoryLabel?: string;
  description: string;
  exampleCall?: string;
  params: FunctionParamDef[];
  isCustom?: boolean;
  codeBody?: string;
}

export interface FastKeyBinding {
  key: string;
  functionId: string;
  name: string;
  description: string;
}

export type SidebarTab = 'files' | 'macro' | 'arena' | 'versions';

export type BottomDockTab = 'terminal' | 'serial' | 'telemetry';

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'incoming' | 'outgoing' | 'system' | 'error';
}


