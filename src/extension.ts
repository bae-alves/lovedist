import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { sanitizeFileNameSegment, sanitizeOutputDir } from './sanitize';

const execFileAsync = promisify(execFile);

type TargetId = 'win64' | 'linux';

interface Target {
  id: TargetId;
  label: string;
  description: string;
}

const TARGETS: Target[] = [
  {
    id: 'win64',
    label: 'Windows (64-bit)',
    description: 'Fused .exe (auto-downloads the official LÖVE win64 build)',
  },
  {
    id: 'linux',
    label: 'Linux (x86_64)',
    description: 'Fused executable built from the LÖVE binary on this system',
  },
];

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('lovedist.build', async () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showErrorMessage('LoveDist: No workspace folder is open.');
      return;
    }
    const projectRoot = folders[0].uri.fsPath;

    const items: Array<{ label: string; description: string; ids: TargetId[] }> = [
      { label: 'All platforms', description: 'Windows .exe + Linux executable', ids: ['win64', 'linux'] },
      ...TARGETS.map(t => ({ label: t.label, description: t.description, ids: [t.id] })),
    ];
    const choice = await vscode.window.showQuickPick(items, {
      placeHolder: 'Build LÖVE executables for which platform?',
    });
    if (!choice) {
      return;
    }
    const ids = choice.ids;

    try {
      const outputs = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'LoveDist: building...',
          cancellable: false,
        },
        () => buildAll(projectRoot, context, ids)
      );
      vscode.window.showInformationMessage(
        `LoveDist: built ${outputs.map(o => path.basename(o)).join(', ')}`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`LoveDist: ${message}`);
    }
  });

  context.subscriptions.push(disposable);
}

async function buildAll(
  projectRoot: string,
  context: vscode.ExtensionContext,
  ids: TargetId[]
): Promise<string[]> {
  const config = vscode.workspace.getConfiguration('lovedist');
  const gameName = sanitizeFileNameSegment(
    config.get<string>('gameName') || path.basename(projectRoot),
    'lovedist.gameName'
  );
  const outputDirName = sanitizeOutputDir(
    projectRoot,
    config.get<string>('outputDir') || 'dist',
    'lovedist.outputDir'
  );
  const distDir = path.join(projectRoot, outputDirName);

  const mainLua = path.join(projectRoot, 'main.lua');
  try {
    await fs.access(mainLua);
  } catch {
    throw new Error(`main.lua not found in project root (${projectRoot}).`);
  }

  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

  const loveFile = path.join(distDir, `${gameName}.love`);
  await zipProject(projectRoot, loveFile, outputDirName);

  const outputs: string[] = [loveFile];
  for (const id of ids) {
    if (id === 'win64') {
      const exe = path.join(distDir, `${gameName}-win64.exe`);
      const winBinary = await resolveWindowsBinary(context, config);
      await fuse(winBinary, loveFile, exe, false);
      outputs.push(exe);
    } else {
      const bin = path.join(distDir, `${gameName}-linux`);
      const linuxBinary = await resolveLinuxBinary(config);
      await fuse(linuxBinary, loveFile, bin, true);
      outputs.push(bin);
    }
  }
  return outputs;
}

async function zipProject(
  projectRoot: string,
  lovePath: string,
  outputDirName: string
): Promise<void> {
  if (process.platform === 'win32') {
    const ps = `Compress-Archive -Path (Get-ChildItem -Path . -Exclude build,${outputDirName} | Select-Object -ExpandProperty FullName) -DestinationPath "${lovePath}" -Force`;
    const { stderr } = await execFileAsync(
      'powershell',
      ['-NoProfile', '-Command', ps],
      { cwd: projectRoot }
    );
    if (stderr) {
      throw new Error(stderr);
    }
  } else {
    const { stderr } = await execFileAsync(
      'zip',
      ['-r', '-X', lovePath, '.', '-x', `${outputDirName}/*`, 'build/*'],
      { cwd: projectRoot }
    );
    if (stderr) {
      throw new Error(stderr);
    }
  }
}

async function resolveWindowsBinary(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration
): Promise<string> {
  const configured = config.get<string>('binaries.windows') || '';
  if (configured) {
    let p = configured;
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        p = path.join(p, 'love.exe');
      }
    } catch {
      throw new Error(`lovedist.binaries.windows is set but does not exist: ${configured}`);
    }
    return p;
  }
  return ensureDownloadedWin64(context, config);
}

async function ensureDownloadedWin64(
  context: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration
): Promise<string> {
  const version = config.get<string>('loveVersion') || '11.5';
  const dir = path.join(context.globalStorageUri.fsPath, 'win64');
  const exe = path.join(dir, 'love.exe');

  try {
    await fs.access(exe);
    return exe;
  } catch {
    // download below
  }

  await fs.mkdir(dir, { recursive: true });
  const url = `https://github.com/love2d/love/releases/download/${version}/love-${version}-win64.zip`;
  const zipPath = path.join(dir, 'love-win64.zip');

  try {
    await execFileAsync('curl', ['-L', '--fail', '-o', zipPath, url]);
    if (process.platform === 'win32') {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Path '${zipPath}' -DestinationPath '${dir}' -Force`,
      ]);
    } else {
      await execFileAsync('unzip', ['-o', zipPath, '-d', dir]);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not download the LÖVE ${version} win64 build (${message}). Set lovedist.binaries.windows to a local love.exe instead.`);
  }

  const found = await findFile(dir, 'love.exe');
  if (!found) {
    throw new Error('Downloaded LÖVE win64 archive does not contain love.exe.');
  }
  return found;
}

async function findFile(root: string, name: string): Promise<string | undefined> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isFile() && entry.name === name) {
      return full;
    }
    if (entry.isDirectory()) {
      const nested = await findFile(full, name);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
}

async function resolveLinuxBinary(
  config: vscode.WorkspaceConfiguration
): Promise<string> {
  const configured = config.get<string>('binaries.linux') || 'love';

  if (path.isAbsolute(configured) || configured.includes('/') || configured.includes('\\')) {
    try {
      await fs.access(configured);
      return configured;
    } catch {
      throw new Error(`lovedist.binaries.linux is set but does not exist: ${configured}`);
    }
  }

  const which = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(which, [configured]);
    const resolved = stdout.trim().split('\n')[0];
    if (resolved) {
      return resolved;
    }
  } catch {
    // fall through to the error below
  }
  throw new Error(
    `No LÖVE binary found on this system. Install LÖVE (e.g. 'sudo apt install love') or set lovedist.binaries.linux to a LÖVE ELF binary.`
  );
}

async function fuse(
  binPath: string,
  loveFile: string,
  outPath: string,
  executable: boolean
): Promise<void> {
  const bin = await fs.readFile(binPath);
  const love = await fs.readFile(loveFile);
  await fs.writeFile(outPath, Buffer.concat([bin, love]));
  if (executable) {
    await fs.chmod(outPath, 0o755);
  }
}

export function deactivate() {}
