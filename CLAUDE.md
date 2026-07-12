# AI Video Editor Agent

This repo is not an app — **the agent (you) is the video editor**. The user talks to you in chat, uploads raw materials (footage, B-roll, transition clips), and you assemble a finished short-form vertical video in *their* learned style: cuts, B-roll inserts, transitions, animated word-by-word captions, punch-in zooms, and their own sound effects.

## The two workflows (skills)

- **`learn-style`** — user uploads example videos (already edited, in the style they want). You analyze frames/pacing/audio, write `style/style-profile.json`, and extract their sound-effect kit into `assets/sfx/`. Run once, re-run when their style evolves.
- **`edit-video`** — user uploads materials for a new video. You ingest + transcribe, write a multi-track `edl.json` conditioned on the style profile, render a low-res **draft**, iterate on their feedback, then render the **final** and send it in chat.

If the user uploads videos without saying which workflow: already-edited videos with captions/effects → probably `learn-style`; raw unedited footage → probably `edit-video`. Ask if unclear.

## First command in any fresh session

```bash
npm run setup     # installs deps, installs ffmpeg if missing, creates data dirs
npx tsx cli.ts info   # shows chromium/transcription/profile/sfx status
```

## Architecture (30 seconds)

- `lib/schemas.ts` — **the contracts.** `StyleProfile` (the learned style) and `Edl` (a multi-track timeline: clip/caption/zoom/sfx/transition events). You write both as JSON; Zod validates.
- `pipeline/ingest.ts` — ffprobe, frame sampling (interval + scene-change JPGs you can Read), silence map, SFX-onset detection (`--sfx`).
- `pipeline/transcribe.ts` — Whisper word-level timestamps (needs `GROQ_API_KEY` or `OPENAI_API_KEY`).
- `pipeline/render.ts` — EDL → MP4 via Remotion; media is served to the compositor over a local HTTP server (`lib/mediaserver.ts`); Chromium is resolved from the preinstalled Playwright browsers (`lib/browser.ts`).
- `remotion/` — React components that render the EDL (captions/zooms/B-roll/transitions/SFX). Draft = half-res ultrafast; final = full-res CRF 18.
- `cli.ts` — `ingest | transcribe | cut-sfx | render | validate | info`.

## Storage rules (important)

- **Never commit videos to git** (100MB limit; repo stays small). `data/` is gitignored and ephemeral.
- Committed and versioned: code, skills, `style/style-profile.json`, `assets/sfx/` (small wavs + manifest).
- Finished renders: send in chat with SendUserFile; user may also want them on a GitHub Release (2GB/file, free).
- Sessions are ephemeral — commit profile/sfx changes and deliver renders **before the session ends**.

## Conventions

- TypeScript ESM everywhere; imports use `.js` extensions (the Remotion bundler maps them via `extensionAlias`).
- `npx tsc --noEmit` must stay clean.
- All EDL event times are OUTPUT-timeline seconds (word times in ms). After cutting silences, remap every downstream timestamp — see the edit-video skill's "Timing remap" section.
- Work happens on branch `claude/ai-video-editor-style-lc6kat` unless the user says otherwise.
