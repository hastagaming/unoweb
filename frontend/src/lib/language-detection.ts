const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  ino: 'cpp',
  rs: 'rust',
  py: 'python',
  json: 'json',
  md: 'markdown',
  toml: 'ini',
  yaml: 'yaml',
  yml: 'yaml',
  txt: 'plaintext',
};

export function detectLanguageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_LANGUAGE_MAP[extension] ?? 'plaintext';
}

// Monaco only ships a built-in formatter for these languages.
// C/C++/Rust formatting needs a real server-side formatter
// (clang-format / rustfmt) that does not exist until the
// Toolchain Manager (Phase 6) is built.
export const FORMATTABLE_LANGUAGES = new Set(['json', 'markdown', 'yaml']);
