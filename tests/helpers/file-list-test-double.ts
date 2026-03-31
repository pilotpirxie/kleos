/**
 * Node often has `File` but not `FileList`; axios detects FileList via `Object.prototype.toString` (kindOf),
 * and Kleos uses `instanceof FileList`. This double satisfies both so postForm(FileList) parity tests mirror browsers.
 */
class FileListTestDouble {
  readonly length: number;
  private readonly files: readonly File[];

  constructor(files: readonly File[]) {
    this.files = files;
    this.length = files.length;
    for (let i = 0; i < files.length; i++) {
      Object.defineProperty(this, String(i), {
        value: files[i],
        enumerable: true,
        configurable: true,
      });
    }
  }

  item(i: number): File | null {
    return this.files[i] ?? null;
  }
}

Object.defineProperty(FileListTestDouble.prototype, Symbol.toStringTag, {
  value: "FileList",
  configurable: true,
});

/**
 * Replaces global FileList for the duration of the callback so `instanceof` and axios `isFileList` match.
 */
export async function withFileListGlobal<T>(fn: () => Promise<T>): Promise<T> {
  const Original = globalThis.FileList;
  (globalThis as unknown as { FileList: typeof FileList }).FileList =
    FileListTestDouble as unknown as typeof FileList;
  try {
    return await fn();
  } finally {
    globalThis.FileList = Original;
  }
}

/**
 * Builds a value that behaves like a browser FileList for multipart postForm tests.
 */
export function createTestFileList(...files: File[]): FileList {
  return new FileListTestDouble(files) as unknown as FileList;
}
