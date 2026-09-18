import * as path from 'path';

// Blocks shell/PowerShell metacharacters (quotes, $, backtick, ; | & < > ( ) { }),
// the PowerShell -Exclude list separator (,), control characters, and path
// separators — not an exhaustive charset allowlist, so ordinary unicode/
// punctuation in project names still works.
export const DANGEROUS_CHARS = /["'`$;|&<>(){},\x00-\x1f]/;

export function sanitizeFileNameSegment(value: string, settingName: string): string {
  if (!value || value === '.' || value === '..' || /[\/\\]/.test(value)) {
    throw new Error(`${settingName} must be a plain file name with no path separators, got: ${value}`);
  }
  if (DANGEROUS_CHARS.test(value)) {
    throw new Error(`${settingName} contains unsupported characters: ${value}`);
  }
  return value;
}

export function sanitizeOutputDir(projectRoot: string, value: string, settingName: string): string {
  if (DANGEROUS_CHARS.test(value)) {
    throw new Error(`${settingName} contains unsupported characters: ${value}`);
  }
  const resolved = path.resolve(projectRoot, value);
  const rel = path.relative(projectRoot, resolved);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`${settingName} must resolve to a directory inside the project root, got: ${value}`);
  }
  return rel.split(path.sep).join('/');
}
