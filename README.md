# LoveDist

A VS Code extension that builds distributable [LÖVE 2D](https://love2d.org) executables for **Windows** and **Linux** with one click, sitting as a pastel blue heart next to the LÖVE Runner play button.

## Usage

1. Open a LÖVE project (a folder with `main.lua`).
2. Click the pastel blue heart in the editor title bar (on a `.lua` file), or run **LoveDist: Build LÖVE Executables** from the Command Palette.
3. Pick a platform (Windows, Linux, or both).

Output lands in the `dist/` folder:

- `<game>.love` — the packaged game, playable anywhere LÖVE is installed
- `<game>-win64.exe` — fused Windows executable (works on 64-bit Windows)
- `<game>-linux` — fused Linux executable (built from the LÖVE binary on your system)

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `lovedist.gameName` | workspace folder name | Base name for the built files |
| `lovedist.outputDir` | `dist` | Output directory, relative to the project root |
| `lovedist.loveVersion` | `11.5` | LÖVE version used when auto-downloading the Windows binary |
| `lovedist.binaries.windows` | *(empty = auto-download)* | Path to a `love.exe` (or a folder containing it) |
| `lovedist.binaries.linux` | `love` | Path to a Linux LÖVE ELF binary (not an AppImage) |

## Notes

- The Windows build auto-downloads the official LÖVE win64 release from [love2d/love](https://github.com/love2d/love/releases) on first use and caches it in VS Code's global storage.
- The Linux build fuses your game with the LÖVE binary installed on this system, so the resulting executable expects similar libraries at runtime. Point `lovedist.binaries.linux` at another ELF `love` binary if you need to.

## License

[MIT](LICENSE)
