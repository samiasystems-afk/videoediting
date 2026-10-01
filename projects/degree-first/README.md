# Degree First — launch promo (template)

A 66 s, 9:16, 60 fps product-launch video built entirely in code: kinetic type, real app UI (rebuilt from the approved
design system), spring camera zooms, a dot-matrix globe, and an original synthesised score + SFX timed to one cue sheet.

**Reuse it for another product:** swap the brand tokens in `src/theme.ts`, the screens in `src/scenes/Product.tsx`,
the copy, and the scene times in `src/timeline.json` (120 BPM, 1 bar = 2 s — picture and music share this clock).

```bash
python3 projects/degree-first/audio/score.py                       # score.wav + sfx.wav from timeline.json
npx tsx projects/degree-first/render.ts stills 3,25,41 /tmp/s      # spot-check frames (half res)
npx tsx projects/degree-first/render.ts video --draft --audio audio/score.wav   # ~1 min
npx tsx projects/degree-first/render.ts video --fps 60 --out projects/degree-first/out/video-60.mp4  # ~6 min
bash projects/degree-first/master.sh projects/degree-first/out/video-60.mp4 \
     projects/degree-first/public/audio/score.wav projects/degree-first/out/DegreeFirst-Promo-9x16.mp4   # -14 LUFS
```

Structure: pain (0–15) → turn + logo (15–19) → product (19–48) → recap (48–50) → globe (50–60) → CTA (60–66).
All scholarship names, people and deadlines are fictional (Degree First product rule 5). Brand kit: `brand/`.
