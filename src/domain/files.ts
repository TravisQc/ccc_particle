import type { ParticleFile } from "./types";

const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp)$/i;

interface BrowserFileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
}

interface BrowserFileSystemFileEntry extends BrowserFileSystemEntry {
  file(successCallback: (file: ParticleFile) => void, errorCallback?: () => void): void;
}

interface BrowserFileSystemDirectoryReader {
  readEntries(successCallback: (entries: BrowserFileSystemEntry[]) => void, errorCallback?: () => void): void;
}

interface BrowserFileSystemDirectoryEntry extends BrowserFileSystemEntry {
  createReader(): BrowserFileSystemDirectoryReader;
}

interface DataTransferItemWithEntry {
  webkitGetAsEntry?: () => BrowserFileSystemEntry | null;
}

export function imageFilePath(file: ParticleFile): string {
  return (file.particleRelativePath || file.webkitRelativePath || file.name).replaceAll("\\", "/");
}

export function isImageFile(file: File | null | undefined): file is ParticleFile {
  return Boolean(file && IMAGE_FILE_PATTERN.test(file.name || ""));
}

export function firstImageFile(files: Iterable<File>): ParticleFile | undefined {
  return [...files].filter(isImageFile).sort((a, b) => imageFilePath(a).localeCompare(imageFilePath(b)))[0];
}

function readFileEntry(entry: BrowserFileSystemFileEntry, pathPrefix = ""): Promise<ParticleFile | null> {
  return new Promise((resolve) => {
    entry.file((file) => {
      Object.defineProperty(file, "particleRelativePath", {
        value: `${pathPrefix}${file.name}`,
        configurable: true,
      });
      resolve(file);
    }, () => resolve(null));
  });
}

function readDirectoryEntries(reader: BrowserFileSystemDirectoryReader): Promise<BrowserFileSystemEntry[]> {
  return new Promise((resolve) => reader.readEntries(resolve, () => resolve([])));
}

async function readDirectoryEntry(entry: BrowserFileSystemDirectoryEntry, pathPrefix = ""): Promise<ParticleFile[]> {
  const reader = entry.createReader();
  const files: ParticleFile[] = [];

  while (true) {
    const entries = await readDirectoryEntries(reader);
    if (!entries.length) break;
    for (const child of entries) {
      const childFiles = await readDataTransferEntry(child, `${pathPrefix}${entry.name}/`);
      files.push(...childFiles);
    }
  }

  return files;
}

async function readDataTransferEntry(entry: BrowserFileSystemEntry | null, pathPrefix = ""): Promise<ParticleFile[]> {
  if (!entry) return [];
  if (entry.isFile) {
    const file = await readFileEntry(entry as BrowserFileSystemFileEntry, pathPrefix);
    return file ? [file] : [];
  }
  if (entry.isDirectory) return readDirectoryEntry(entry as BrowserFileSystemDirectoryEntry, pathPrefix);
  return [];
}

export async function textureFilesFromDrop(dataTransfer: DataTransfer): Promise<ParticleFile[]> {
  const items = [...(dataTransfer.items || [])];
  let files: ParticleFile[] = [];

  if (items.length && items.some((item) => (item as DataTransferItemWithEntry).webkitGetAsEntry)) {
    for (const item of items) {
      const entry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.() || null;
      const entryFiles = await readDataTransferEntry(entry);
      files.push(...entryFiles);
    }
  } else {
    files = [...(dataTransfer.files || [])].filter(isImageFile);
  }

  return files.filter(isImageFile).sort((a, b) => imageFilePath(a).localeCompare(imageFilePath(b)));
}
