#!/usr/bin/env bash
# Two-pass loudnorm a WAV to -14 LUFS / -1 dBTP and mux it under a rendered video.
#   bash master.sh <video.mp4> <audio.wav> <out.mp4>
set -euo pipefail
V="$1"; A="$2"; OUT="$3"
J=$(ffmpeg -hide_banner -i "$A" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -y -i "$V" -i "$A" -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -shortest -movflags +faststart "$OUT" 2>&1 | tail -1
