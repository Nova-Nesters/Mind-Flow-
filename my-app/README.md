# mindflow (my-app)

React + Vite application for student mental health tracking with measurement-theory-driven metrics.

## Prerequisites

- Node.js LTS installed (includes npm)
- Windows PowerShell or Command Prompt

## Install

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173/`).

If PowerShell blocks `npm` due execution policy, use:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Software Size Metrics

The repository includes `../software-size.js`, and this app exposes it with:

```bash
npm run software-size
```

PowerShell-safe version:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run software-size
```

What it reports:

- `LOC`: total lines
- `NCLOC`: non-comment lines
- `CLOC`: comment lines
- `Comment Density`: `(Total CLOC / Total LOC) * 100`

Latest measured output:

```text
src/App.jsx: LOC=527, NCLOC=472, CLOC=11
src/main.jsx: LOC=11, NCLOC=9, CLOC=0

=== Project Metrics Summary ===
Total LOC: 538
Total NCLOC: 481
Total CLOC: 11
Comment Density: 2.04%
```

## Available Scripts

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint
- `npm run software-size`: run size metrics script
