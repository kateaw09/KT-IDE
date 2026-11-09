import JSZip from 'jszip';
import { SketchFile, ProjectSettings, ProjectData, ProjectFieldData, ProjectVersion } from '../types/ide';

export interface ExtractedZipProject {
  projectName: string;
  files: SketchFile[];
  activeFileId: string;
  boardId?: string;
  arenaJson?: string;
  settings?: ProjectSettings;
  field?: ProjectFieldData;
  versions?: ProjectVersion[];
}

// Known text/source file extensions in robotics & Arduino projects
const TEXT_EXTENSIONS = [
  '.ino',
  '.cpp',
  '.c',
  '.h',
  '.hpp',
  '.cc',
  '.cxx',
  '.txt',
  '.md',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
  '.csv',
  '.ktproj',
];

const IGNORED_PATHS = [
  '__macosx',
  '.ds_store',
  'thumbs.db',
  '.git/',
  '.vscode/',
  '.idea/',
  'build/',
  '.pio/',
];

/**
 * Filter whether a path inside the ZIP is a legitimate project text/source file
 */
function isValidProjectFile(relativePath: string): boolean {
  const lower = relativePath.toLowerCase();
  for (const ignored of IGNORED_PATHS) {
    if (lower.includes(ignored)) return false;
  }
  const basename = relativePath.split('/').pop() || '';
  if (basename.startsWith('.')) return false;

  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Extract and parse a multi-file project from a .zip File or ArrayBuffer
 */
export async function extractProjectFromZip(
  fileOrBuffer: File | ArrayBuffer | Blob,
  fallbackName = 'Imported_Zip_Project'
): Promise<ExtractedZipProject> {
  const zip = await JSZip.loadAsync(fileOrBuffer);
  const rawFiles: { path: string; text: string }[] = [];
  let foundArenaJson: string | undefined;
  let manifestData: any = null;
  const looseSettings: Partial<ProjectSettings> = {};

  // Extract all text files
  const entries: { path: string; obj: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && isValidProjectFile(relativePath)) {
      entries.push({ path: relativePath, obj: zipEntry });
    }
  });

  if (entries.length === 0) {
    throw new Error('ไม่พบไฟล์โค้ด (.ino, .c, .cpp, .h, .json) ในไฟล์ ZIP นี้');
  }

  for (const entry of entries) {
    const text = await entry.obj.async('text');
    const lower = entry.path.toLowerCase();

    // Check for KT-Robotics field file
    if (lower.endsWith('.field.json')) {
      foundArenaJson = text;
    }

    // Check for project manifest (.ktproj or project.json)
    if (lower.endsWith('.ktproj') || lower.endsWith('project.json')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.name || parsed.files || parsed.settings) {
          manifestData = parsed;
        }
      } catch (e) {
        // Not a valid json manifest, treat as regular file
      }
    }

    // Check for loose settings json files (backward compatibility)
    if (lower.includes('keybinding') || lower.includes('keymap')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
          looseSettings.fastKeyBindings = parsed;
        }
      } catch (e) {}
    } else if (lower.includes('function') && lower.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          looseSettings.customFunctions = parsed;
        }
      } catch (e) {}
    } else if (lower.endsWith('settings.json')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          Object.assign(looseSettings, parsed);
        }
      } catch (e) {}
    }

    rawFiles.push({ path: entry.path, text });
  }

  const mergedSettings: ProjectSettings | undefined = manifestData?.settings
    ? { ...looseSettings, ...manifestData.settings }
    : Object.keys(looseSettings).length > 0
    ? (looseSettings as ProjectSettings)
    : undefined;

  // If there's an embedded .ktproj with a files list, we can restore directly
  if (manifestData && Array.isArray(manifestData.files) && manifestData.files.length > 0) {
    const activeId = manifestData.activeFileId || manifestData.files[0]?.id || 'file_0';
    return {
      projectName: manifestData.name || fallbackName,
      files: manifestData.files,
      activeFileId: activeId,
      boardId: manifestData.boardId,
      arenaJson: foundArenaJson,
      settings: mergedSettings,
    };
  }

  // Normalize paths: Check if all files share a common single root folder (e.g. "MyProject/MyProject.ino")
  const splitPaths = rawFiles.map((f) => f.path.split('/').filter(Boolean));
  let rootFolderPrefix = '';
  if (splitPaths.length > 0 && splitPaths.every((p) => p.length > 1 && p[0] === splitPaths[0][0])) {
    rootFolderPrefix = splitPaths[0][0];
  }

  let finalProjectName = rootFolderPrefix || fallbackName.replace(/\.zip$/i, '');

  const sketchFiles: SketchFile[] = [];
  let entryFileIndex = -1;

  rawFiles.forEach((rf, idx) => {
    // Strip common root folder prefix if present
    let cleanPath = rf.path;
    if (rootFolderPrefix && cleanPath.startsWith(rootFolderPrefix + '/')) {
      cleanPath = cleanPath.slice(rootFolderPrefix.length + 1);
    }

    // Do not include the manifest json itself as a code file in the editor tabs
    if (cleanPath.endsWith('.ktproj') || (cleanPath === 'project.json' && manifestData)) {
      return;
    }

    // Also exclude arena file from editor tabs if detected as arena map
    if (cleanPath.endsWith('.field.json')) {
      return;
    }

    const basename = cleanPath.split('/').pop() || cleanPath;
    const isMainIno =
      basename.toLowerCase() === `${finalProjectName.toLowerCase()}.ino` ||
      basename.toLowerCase() === 'main.ino';

    const isAnyIno = basename.toLowerCase().endsWith('.ino');

    const fileItem: SketchFile = {
      id: `file_${Date.now()}_${idx}`,
      name: cleanPath, // Keep subpath (e.g. include/config.h) or basename
      content: rf.text,
      isEntry: false,
    };

    if (isMainIno && entryFileIndex === -1) {
      entryFileIndex = sketchFiles.length;
    } else if (isAnyIno && entryFileIndex === -1) {
      entryFileIndex = sketchFiles.length;
    }

    sketchFiles.push(fileItem);
  });

  if (sketchFiles.length === 0) {
    throw new Error('ไม่พบไฟล์โค้ดสำหรับการเขียนโปรแกรมในไฟล์ ZIP');
  }

  // If no .ino file matched, default to the first file (e.g. main.cpp or first code file)
  if (entryFileIndex === -1) {
    entryFileIndex = 0;
  }

  sketchFiles[entryFileIndex].isEntry = true;
  const activeFileId = sketchFiles[entryFileIndex].id;

  return {
    projectName: finalProjectName,
    files: sketchFiles,
    activeFileId,
    boardId: manifestData?.boardId,
    arenaJson: foundArenaJson,
    settings: mergedSettings,
    field: manifestData?.field,
    versions: manifestData?.versions,
  };
}

/**
 * Pack the entire multi-file project into a downloadable .zip archive
 */
export async function exportProjectToZipBlob(
  projectName: string,
  files: SketchFile[],
  boardId?: string,
  arenaJson?: string,
  settings?: ProjectSettings,
  field?: ProjectFieldData,
  versions?: ProjectVersion[]
): Promise<Blob> {
  const zip = new JSZip();
  const rootDirName = projectName.replace(/[\s/\\?%*:|"<>]/g, '_') || 'KT_Project';
  const folder = zip.folder(rootDirName) || zip;

  // Add all project code files
  files.forEach((file) => {
    folder.file(file.name, file.content);
  });

  // Add unified project manifest (.ktproj / project.json compatible)
  const projectManifest: ProjectData = {
    format: 'ktproj',
    version: '2.1.0',
    id: `proj_${Date.now()}`,
    name: projectName,
    files,
    activeFileId: files[0]?.id || 'file_0',
    boardId: boardId || 'ptbot_atom_vx',
    updatedAt: new Date().toISOString(),
    description: `KT-Robotics Unified Project Package (Code + Field + Versions)`,
    settings,
    field,
    versions,
  };
  folder.file('project.json', JSON.stringify(projectManifest, null, 2));
  folder.file(`${rootDirName}.ktproj`, JSON.stringify(projectManifest, null, 2));

  // Add custom arena field if present
  if (arenaJson) {
    folder.file(`${rootDirName}.field.json`, arenaJson);
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
