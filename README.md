# LoveDist

Build distributable [LÖVE 2D](https://love2d.org) executables for Windows and Linux directly from VS Code.

LoveDist adds a heart-shaped action next to the editor title bar for `.lua` files and can package a game into:

- a `.love` archive,
- a Windows x64 executable,
- a Linux executable.

## Installation

1. Open the Extensions view in VS Code.
2. Search for `LoveDist`.
3. Install the extension.
4. Open a folder containing a LÖVE project with a `main.lua` file.

## Usage

1. Open a `.lua` file in the project.
2. Click the heart button in the editor title bar, or run `LoveDist: Build LÖVE Executables` from the Command Palette.
3. Choose a target platform or build for all supported platforms.
4. The files are written to the configured output directory, which defaults to `dist/`.

The generated outputs include:

- `<game>.love` — packaged game archive for any LÖVE runtime
- `<game>-win64.exe` — fused Windows 64-bit executable
- `<game>-linux` — fused Linux executable

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `lovedist.gameName` | workspace folder name | Base name for the built files |
| `lovedist.outputDir` | `dist` | Output directory relative to the project root |
| `lovedist.loveVersion` | `11.5` | LÖVE version used when auto-downloading the Windows binary |
| `lovedist.binaries.windows` | empty | Path to a local `love.exe` or directory containing it |
| `lovedist.binaries.linux` | `love` | Path to a local LÖVE ELF binary |

## Notes

- On first use, the Windows build downloads the official LÖVE win64 release into VS Code global storage.
- The Linux build fuses your project with the LÖVE binary available on the current machine.
- If you want a different runtime, point `lovedist.binaries.linux` at a specific ELF binary.

## Support

If you enjoy this extension and want to support its development, you can donate via Ko-fi:

- https://ko-fi.com/baealves

PIX donation:

- 

## License

This project is released under [CC0 1.0 Universal](LICENSE).
