# AI Video Editor (Agent)

A personal AI video editor that **learns your editing style** from your own videos and assembles new ones to match — cuts, B-roll, transitions, animated captions, zooms, and your own sound effects.

There is no app to run. **You use it by talking to Claude** in a Claude Code session on this repo:

1. **Teach it your style (once):** upload 2–5 of your already-edited videos and say *"learn my style"*. The agent analyzes them and saves `style/style-profile.json` + your extracted sound-effects kit in `assets/sfx/`.
2. **Edit a video (any time):** upload your raw footage, B-roll clips, and transition assets and say *"edit this"*. The agent assembles a draft, you give feedback in plain language ("hold that B-roll longer", "captions higher"), and it renders the final video and sends it to you in chat.

## How it works

- Claude reads sampled video frames directly and writes the edit plan (`edl.json`) itself — no extra AI API keys needed.
- Deterministic tools do the heavy lifting: **ffmpeg** (probing, frames, silences, SFX detection) and **Remotion** (rendering captions/zooms/transitions as React components).
- Word-level captions need a Whisper transcription key: set `GROQ_API_KEY` (free tier, fast) or `OPENAI_API_KEY` in the environment settings.
- Videos are never committed to git. Uploads live in the session; keep finished videos by downloading them from chat (or attaching to a GitHub Release).

## Layout

```
.claude/skills/   the agent workflows (learn-style, edit-video)
lib/schemas.ts    StyleProfile + EDL contracts (Zod)
pipeline/         ingest, transcribe, render
remotion/         video render components
cli.ts            ingest | transcribe | cut-sfx | render | validate | info
style/            your learned style profile (committed)
assets/sfx/       your extracted sound-effect kit (committed)
```

See `CLAUDE.md` for agent-facing details.
