---
name: edit-video
description: Assemble the user's raw materials (footage + B-roll + transition assets) into a finished video in their learned style — cuts, B-roll inserts, transitions, animated captions, zooms, and their own sound effects. Use when the user uploads a video to edit, or says "edit this", "make this video", "assemble this".
---

# Assemble a Video in the User's Style

You are the editor. The user gives you raw materials; you return a finished edit that looks like *they* made it. The creative decisions are yours to make — but every decision must be justified by `style/style-profile.json`.

## Setup

Run `npm run setup` if `node_modules` is missing. Check `npx tsx cli.ts info`. If `style/style-profile.json` is missing, offer to run the `learn-style` skill first (defaults will be used otherwise).

## Step 1 — Collect materials

The user uploads (in chat) some combination of:
- **Raw footage** — one or more main clips (usually talking to camera)
- **B-roll** — clips to cut away to
- **Transition assets** — their own transition clips/effects (optional)

Organize them under `data/uploads/<job>/` (e.g. `footage/`, `broll/`, `transitions/`). Ask which is which only if filenames don't make it obvious.

## Step 2 — Ingest and transcribe

For EVERY clip: `npx tsx cli.ts ingest <clip>` (no `--sfx`).
For footage with speech: `npx tsx cli.ts transcribe <clip>` → word-level timestamps in `data/transcripts/`.

Read a few sampled frames of each B-roll clip (Read tool) so you know what each one *shows* — you'll place them against transcript content.

## Step 3 — Write the EDL

Write `data/uploads/<job>/edl.json` matching the `Edl` schema in `lib/schemas.ts`. Multi-track timeline:

- **Cuts** (`clip`, track `main`): remove silences longer than `pacing.silenceCutThresholdSeconds` and filler words (find them in the transcript). Each kept span of source = one clip event; keep `timelineStartSeconds` contiguous (no gaps). The output timeline is compressed — recompute all downstream timings against it.
- **B-roll** (`clip`, track `broll`, `muted: true`): place each B-roll clip where the transcript talks about what it shows. Respect the profile's rhythm — typically 1.5–3s inserts. Never cover the speaker's key emotional moments.
- **Transitions** (`transition`): at segment boundaries per the profile. Use the user's transition assets via `overlaySrc` when provided; otherwise the profile's `kinds` (built-ins: cut/fade/flash).
- **Captions** (`caption`): group transcript words per `captions.wordsPerGroup`; word timings are ABSOLUTE output-timeline ms (remember to remap across cuts!). Set `emphasis: true` on the profile's keyword types.
- **Zooms** (`zoom`): per `zoom.perMinute` and `triggerNotes` — punch in on emphasized words/topic shifts.
- **SFX** (`sfx`): pull files from `assets/sfx/` at the moments the profile's `triggerNotes` describe (B-roll entries, transitions, emphasized beats).

Validate: `npx tsx cli.ts validate <edl.json>` — fix any errors before rendering.

### Timing remap (the one hard part)

Source time ≠ output time once you cut. For a word at source time `t` inside a kept span `[in, out)` that starts at `timelineStart` on the output: `outputT = timelineStart + (t - in)`. Words in removed spans are dropped. Double-check caption/zoom/sfx times all use OUTPUT time.

## Step 4 — Draft render → user review

```bash
npx tsx cli.ts render <edl.json> --draft --base data/uploads/<job>
```

Extract 2–3 frames from the draft (`ffmpeg -ss <t> -i draft.mp4 -frames:v 1 f.png`), Read them to self-check (captions on screen? B-roll where intended?), then send the draft MP4 to the user with a short summary of your choices.

## Step 5 — Feedback loop

The user replies in plain language ("hold that B-roll longer", "captions higher", "less zoom"). Edit `edl.json` directly (or `styleOverride` for one-off caption tweaks), re-validate, re-render draft. Repeat until happy. If a correction sounds like a *permanent* preference, offer to update `style/style-profile.json` too.

## Step 6 — Final render → deliver

```bash
npx tsx cli.ts render <edl.json> --base data/uploads/<job>
```

Send the final MP4 in chat. Remind the user the session is ephemeral: they should download it now (optionally also attach it to a GitHub Release). If the style profile changed, commit and push it.
