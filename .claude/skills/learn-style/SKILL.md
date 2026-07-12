---
name: learn-style
description: Learn the user's editing style from their example videos (already-edited videos in the style they want). Analyzes captions, pacing, zooms, transitions, and extracts their sound-effect kit. Use when the user uploads example/reference videos and wants the agent to learn their style, or says "learn my style", "train on these videos", "analyze my videos".
---

# Learn the User's Editing Style

You are analyzing the user's **example videos** — videos they already edited in the style they love. Your job is to produce two committed artifacts:

1. `style/style-profile.json` — a human-readable description of their style (validated by `StyleProfile` in `lib/schemas.ts`)
2. `assets/sfx/` — their **sound kit**: the actual sound effects clipped out of the example videos, plus `assets/sfx/manifest.json`

## Setup

Run `npm run setup` first if `node_modules` is missing. Check capabilities with `npx tsx cli.ts info`.

## Step 1 — Collect the example videos

The user uploads them in chat (they land in the session filesystem) or points you to a GitHub Release. Move/copy them into `data/uploads/`. 2–5 videos is ideal.

## Step 2 — Ingest every example video

```bash
npx tsx cli.ts ingest data/uploads/<video> --sfx
```

This writes `data/frames/<name>/ingest.json` with: metadata, sampled frames (interval + scene-change), scene-cut timestamps, silence map, and **SFX onset candidates** (sharp audio transients with timestamps).

If a transcription key is available (`cli.ts info` says so), also run:

```bash
npx tsx cli.ts transcribe data/uploads/<video>
```

## Step 3 — READ the frames with your own eyes

This is the heart of the skill. Use the Read tool on a good spread of the sampled JPGs in `data/frames/<name>/` (interval + scene frames, at least 10–15 per video). You are looking for:

- **Captions**: font vibe (bold? rounded? condensed?), uppercase?, text color, highlight/emphasis color, stroke color and thickness, shadow, vertical position (estimate 0–1 from top), words visible at once, do emphasized words look bigger/different color?
- **Caption animation**: compare consecutive interval frames — do words pop in one-by-one (pop/bounce), fade, slide? If you can't tell, default to "pop".
- **Zooms**: same shot appearing at different scales across nearby frames = punch-in zoom. Estimate frequency and scale.
- **Visual transitions**: flash frames, motion blur smears, black dips between scenes.
- **Overall vibe**: colors, energy, framing — capture it in `summary`.

## Step 4 — Compute pacing from the data

From each `ingest.json`: median gap between scene-change timestamps → `pacing.medianShotSeconds`. Frequent short silences with cuts right after them → aggressive silence-cutting (`silenceCutThresholdSeconds` ≈ 0.4–0.8). Count zooms you spotted per minute → `zoom.perMinute`.

## Step 5 — Build the sound kit

For each strong SFX onset in `ingest.json` (high `strength`, not during speech if you can tell):

```bash
npx tsx cli.ts cut-sfx data/uploads/<video> <timeSeconds> <label>
```

Listen-check isn't possible — instead be conservative: prefer onsets with `strength > 3`, skip onsets within 0.3s of each other, and give descriptive names (`whoosh_1`, `pop_1`, `ding_1` — you can often guess the type from what's happening in the frames at that moment). Then write `assets/sfx/manifest.json` as an array of `{file, label, sourceVideo, atSeconds, triggerNotes}` and mirror each entry into the profile's `sfx` array with `triggerNotes` describing when the user deploys that sound (e.g. "on B-roll entry", "when a keyword pops").

## Step 6 — Write the profile

Write `style/style-profile.json` matching the `StyleProfile` schema (see `lib/schemas.ts` — every field has a default, so only include what you observed; validate mentally against the schema). Include a vivid `summary` and put anything the schema can't express into `notes` (this text conditions future EDL generation, so be specific: "hard cuts only, zoom on product names, whoosh on every B-roll entry").

## Step 7 — Review with the user, then commit

Show the user a compact summary of what you learned (colors as swatch descriptions, pacing numbers, sound kit list). Apply their corrections. Then commit `style/style-profile.json` + `assets/sfx/` and push to the working branch — future sessions must find them.
