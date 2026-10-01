"""
Degree First promo — original score + sound design, synthesised from scratch.

Everything is timed to src/timeline.json (120 BPM, one bar = 2 s), so picture and
sound share one clock. Output: public/audio/score.wav (48 kHz stereo, pre-master).

    python3 projects/degree-first/audio/score.py
"""
import json
import os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, sawtooth, square

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
SR = 48000
DUR = TL["duration"] + 0.5
N = int(DUR * SR)
rng = np.random.default_rng(7)

def buf():
    return np.zeros((N, 2))

def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def tt(n):
    return np.arange(n) / SR

def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low", output="sos"), x, axis=0)

def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), "high", output="sos"), x, axis=0)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x, axis=0)

def add(bus, t0, sig, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into bus at t0 seconds. pan -1..1."""
    i0 = int(round(t0 * SR))
    if i0 >= N:
        return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), N - i0)
    bus[i0:i0 + n] += sig[:n] * gain

def env(n, a=0.005, r=0.1, hold=None):
    """Attack / hold / release envelope over n samples."""
    e = np.ones(n)
    na = max(1, int(a * SR))
    nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e

def noise(n):
    return rng.standard_normal(n)

# ------------------------------------------------------------------ instruments

def kick(gain=1.0, punch=1.0):
    n = int(0.45 * SR)
    t = tt(n)
    f = 46 + 120 * punch * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 9.5)
    click = hp(noise(n), 2500) * np.exp(-t * 400) * 0.35
    return np.tanh((body + click) * 1.6) * gain

def clap():
    n = int(0.35 * SR)
    t = tt(n)
    nz = bp(noise(n), 900, 3500)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: n - i]) * 180) * (0.8 if k < 2 else 1)
    e += np.exp(-t * 18) * 0.35
    return nz * e * 0.9

def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    t = tt(n)
    return hp(noise(n), 7500) * np.exp(-t * (14 if open_ else 90)) * 0.5

def supersaw(m_list, dur, cutoff=2400, a=0.25, r=0.6, voices=7, detune=0.012):
    n = int((dur + r) * SR)
    t = tt(n)
    out = np.zeros((n, 2))
    for m in m_list:
        f = midi(m)
        for v in range(voices):
            d = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            ph0 = rng.random()
            s = sawtooth(2 * np.pi * (f * (1 + d) * t + ph0))
            pan = (v / (voices - 1)) * 2 - 1
            out[:, 0] += s * (1 - pan) * 0.5
            out[:, 1] += s * (1 + pan) * 0.5
    out = lp(out, cutoff, 2)
    e = env(n, a, r)
    return out * e[:, None] / (len(m_list) * voices) * 2.2

def pluck(m, dur=0.22, bright=3200, decay=9.0):
    n = int((dur + 0.2) * SR)
    t = tt(n)
    f = midi(m)
    s = 0.6 * sawtooth(2 * np.pi * f * t) + 0.4 * square(2 * np.pi * f * t, 0.3)
    hi = lp(s, bright) * np.exp(-t * decay * 1.6)
    lo = lp(s, bright * 0.25) * np.exp(-t * decay * 0.6)
    return (hi * 0.6 + lo * 0.5) * env(n, 0.002, 0.08)

def bell(m, dur=2.5, gain=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = midi(m)
    s = np.zeros(n)
    for k, (mult, amp, dec) in enumerate([(1, 1, 1.4), (2.0, 0.45, 2.2), (3.01, 0.22, 3.5), (4.2, 0.12, 5), (5.43, 0.06, 7)]):
        s += amp * np.sin(2 * np.pi * f * mult * t + k) * np.exp(-t * dec)
    return s * env(n, 0.003, 0.2) * 0.35 * gain

def sub(m, dur, gain=1.0):
    n = int((dur + 0.05) * SR)
    t = tt(n)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    return s * env(n, 0.006, 0.05) * gain

def growl(m, dur, cutoff=420):
    """Dark detuned saw bass for the pain act."""
    n = int((dur + 0.03) * SR)
    t = tt(n)
    f = midi(m)
    s = sawtooth(2 * np.pi * f * t) + sawtooth(2 * np.pi * f * 1.007 * t)
    return lp(s, cutoff, 2) * env(n, 0.004, 0.04) * np.exp(-t * 3) * 0.6

# ------------------------------------------------------------------ sound effects

def whoosh(dur=0.5, up=True, gain=1.0):
    n = int(dur * SR)
    t = tt(n)
    x = noise(n)
    out = np.zeros(n)
    # swept band-pass in blocks
    blocks = 24
    for b in range(blocks):
        i0, i1 = b * n // blocks, (b + 1) * n // blocks
        p = b / blocks
        fc = 300 * (20 ** (p if up else 1 - p))
        seg = bp(x[max(0, i0 - 2000):i1], fc * 0.6, min(fc * 1.8, 20000))[-(i1 - i0):]
        out[i0:i1] = seg
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return out * shape * 0.9 * gain

def riser(dur=1.7):
    n = int(dur * SR)
    t = tt(n)
    p = t / dur
    nz = whoosh(dur, True) * (p ** 2) * 1.2
    f = 200 * 2 ** (p * 3)
    tone = sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.12 * p ** 2
    return lp(nz + tone, 9000)

def impact(gain=1.0):
    n = int(2.2 * SR)
    t = tt(n)
    f = 30 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    crack = lp(noise(n), 5000) * np.exp(-t * 14) * 0.5
    return np.tanh((boom * 1.4 + crack) * 1.3) * gain

def tap():
    n = int(0.06 * SR)
    t = tt(n)
    return np.sin(2 * np.pi * (1800 - 900 * t / 0.06) * t) * np.exp(-t * 110) * 0.55 + hp(noise(n), 4000) * np.exp(-t * 400) * 0.2

def pop(pitch=1.0):
    n = int(0.12 * SR)
    t = tt(n)
    f = (900 + 500 * np.exp(-t * 60)) * pitch
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * 0.55

def ding(m=84, gain=1.0):
    return bell(m, 1.4, gain) * 1.2

def slam(i):
    n = int(0.5 * SR)
    t = tt(n)
    thud = np.sin(2 * np.pi * np.cumsum(90 + 140 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)
    snap = bp(noise(n), 1500, 6000) * np.exp(-t * 60) * 0.5
    return np.tanh((thud + snap) * 1.5) * 0.7

def typing(nkeys=6, gap=0.08):
    out = np.zeros(int((nkeys * gap + 0.1) * SR))
    for k in range(nkeys):
        c = hp(noise(int(0.03 * SR)), 2000) * np.exp(-tt(int(0.03 * SR)) * 200) * (0.35 + 0.15 * rng.random())
        i = int(k * gap * SR)
        out[i:i + len(c)] += c
    return out

def stamp():
    return impact(0.8) * 0.9 + np.pad(slam(0), (0, int(2.2 * SR) - int(0.5 * SR)))

def shimmer():
    n = int(1.2 * SR)
    t = tt(n)
    s = np.zeros(n)
    for k, m in enumerate([88, 91, 95, 100]):
        i = int(k * 0.06 * SR)
        b = bell(m, 1.2)[: n - i]
        s[i:i + len(b)] += b * 0.5
    return s

def notify():
    a = bell(84, 0.9)
    b = bell(91, 0.75)
    i = int(0.13 * SR)
    a[i:i + len(b)] += b[: len(a) - i]
    return a * 1.1

def success():
    s = np.zeros(int(1.3 * SR))
    for k, m in enumerate([72, 76, 79, 84]):
        b = bell(m, 1.0, 0.9)
        i = int(k * 0.07 * SR)
        s[i:i + len(b)] += b[: len(s) - i]
    return s

def suck():
    w = whoosh(1.0, True, 1.2)
    return w[::-1] * np.linspace(0.2, 1, len(w)) ** 2

# ------------------------------------------------------------------ arrangement

music = buf()   # tonal bus (gets sidechain + reverb send)
drums = buf()
fx = buf()
send = buf()    # reverb send

B = 0.5  # one beat

def chord_at(sec, prog, start, bar=2.0):
    k = int((sec - start) // bar)
    return prog[k % len(prog)]

AM, F_, DM, E_, C_, G_ = (57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59), (60, 64, 67), (55, 59, 62)
ROOTS = {AM: 33, F_: 29, DM: 38, E_: 28, C_: 36, G_: 31}

# --- Act 1: pain (0–12), A minor, tense
pain_prog = [AM, AM, F_, F_, DM, E_]
for i in range(int(12 / (B / 2))):
    s = i * B / 2
    if 2.95 < s < 4.0:
        continue
    ch = chord_at(s, pain_prog, 0)
    add(music, s, growl(ROOTS[ch] + 12, B / 2 - 0.01, 500 + 1400 * (s / 12)), 0.4 + 0.25 * (s / 12))
for i in range(int(12 / B)):
    s = i * B
    if 3.0 <= s < 4.0:
        continue
    add(drums, s, kick(1.0, 1.2), 0.9)
    if s >= 4.0:
        add(drums, s + B / 2, hat(True), 0.25 + 0.2 * (s - 4) / 8, 0.3)
for i in range(int(8 / (B / 2))):
    s = 4.0 + i * B / 2
    add(drums, s, hat(), 0.18 + 0.25 * i / 32, -0.3)
for s in np.arange(8.5, 12.0, 1.0):
    add(drums, s, clap(), 0.55)
    add(send, s, clap(), 0.25)
for k, ch in enumerate(pain_prog):
    pad = supersaw([m - 12 for m in ch], 2.0, cutoff=900 + 150 * k, a=0.05, r=0.3, detune=0.008)
    add(music, k * 2.0, pad, 0.35)
# ticking clock in the questions scene
for s in np.arange(4.0, 8.0, B / 2):
    c = bp(noise(int(0.03 * SR)), 2500, 4500) * np.exp(-tt(int(0.03 * SR)) * 150)
    add(fx, s, c, 0.35 if int(s * 4) % 2 == 0 else 0.22, 0.5)
# "And one of you." — a lonely bell
add(music, 3.05, bell(69, 2.0), 0.8, 0.0)
add(send, 3.05, bell(69, 2.0), 0.6)

# --- Reflect (12–15): air
pad = supersaw([57, 64, 71, 72], 3.4, cutoff=1400, a=0.6, r=0.6, detune=0.01)
add(music, 12.0, pad, 0.4)
add(send, 12.0, pad, 0.35)
for s in [12.0, 12.25, 13.0, 13.25, 14.0, 14.25]:
    add(drums, s, kick(0.45 if s % 1 else 0.6, 0.6), 0.45)
for k, m in enumerate([76, 72, 69, 71]):
    add(music, 12.3 + k * 0.7, bell(m, 2.0, 0.6), 0.55)
    add(send, 12.3 + k * 0.7, bell(m, 2.0, 0.6), 0.5)

# --- Reveal (16–19): C major, bright, no drums
main_prog = [C_, G_, AM, F_]
CMAJ9 = (60, 64, 67, 71, 74)
pad = supersaw(CMAJ9, 2.9, cutoff=3000, a=0.08, r=1.2)
add(music, 16.0, pad, 0.45)
add(send, 16.0, pad, 0.4)
add(music, 16.0, sub(36, 3.0), 0.35)

def arps(t0, t1, prog, prog_start, octave=12, gain=0.32, pattern=(0, 1, 2, 3, 2, 1, 2, 3)):
    s = t0
    k = 0
    while s < t1 - 1e-6:
        ch = chord_at(s, prog, prog_start)
        tones = list(ch) + [ch[0] + 12]
        m = tones[pattern[k % len(pattern)]] + octave
        p = pluck(m, 0.2)
        add(music, s, p, gain, 0.35 if k % 2 else -0.35)
        add(send, s, p, gain * 0.5)
        s += B / 2
        k += 1

arps(16.0, 19.0, main_prog, 16.0, gain=0.28)

# --- Product (19–48): four-on-the-floor, uplifting
for s in np.arange(19.0, 47.5, B):
    add(drums, s, kick(1.0), 0.95)
for s in np.arange(19.5, 47.5, 1.0):
    add(drums, s, clap(), 0.5)
    add(send, s, clap(), 0.2)
for s in np.arange(23.25, 47.5, B):
    add(drums, s, hat(True), 0.22, 0.25)
for s in np.arange(29.0, 47.5, B / 2):
    add(drums, s, hat(), 0.14 if int(s * 4) % 2 else 0.2, -0.25)
for bar_s in np.arange(16.0, 48.0, 2.0):
    ch = chord_at(bar_s, main_prog, 16.0)
    if bar_s >= 18.0:
        pad = supersaw(list(ch) + [ch[0] + 12], 2.0, cutoff=2600 if bar_s < 33 else 3600, a=0.02, r=0.25)
        add(music, bar_s, pad, 0.3 if bar_s < 33 else 0.36)
        add(send, bar_s, pad, 0.18)
    # offbeat sub bass
    if bar_s >= 18.0:
        for b8 in range(8):
            s = bar_s + b8 * B / 2
            if s >= 47.5:
                break
            if b8 % 2 == 1 or s < 19.0:
                add(music, s, sub(ROOTS[ch] + 12, B / 2 - 0.02), 0.3)
arps(19.0, 47.5, main_prog, 16.0, gain=0.26)

LEAD = {
    C_: [76, None, 79, 76, 74, None, 72, None],
    G_: [74, None, None, 71, 74, None, 79, None],
    AM: [72, None, 76, 72, 71, None, 69, None],
    F_: [69, None, 72, None, 77, None, 76, 74],
}
for bar_s in np.arange(32.0, 48.0, 2.0):
    ch = chord_at(bar_s, main_prog, 16.0)
    for k, m in enumerate(LEAD[ch]):
        s = bar_s + k * B / 2
        if m is None or s < 33.0 or s >= 47.5:
            continue
        p = pluck(m, 0.3, bright=5000, decay=5)
        add(music, s, p, 0.3)
        add(send, s, p, 0.3)
# snare roll into the recap
for k, s in enumerate(np.arange(47.0, 48.0, 1 / 16)):
    add(drums, s, clap(), 0.15 + 0.35 * k / 16)

# --- Recap (48–50): four stabs
for k, (s, ch) in enumerate(zip([48.0, 48.5, 49.0, 49.5], [F_, G_, AM, C_])):
    st = supersaw(list(ch) + [ch[0] + 12], 0.35, cutoff=5000, a=0.005, r=0.15)
    add(music, s, st, 0.6)
    add(send, s, st, 0.3)
    add(drums, s, kick(1.1, 1.3), 1.0)
    add(music, s, sub(ROOTS[ch] + 12, 0.4), 0.4)

# --- Globe (50–60): breakdown, emotional
glob_prog = [AM, F_, C_, G_, F_]
for k, ch in enumerate(glob_prog):
    s = 50.0 + k * 2.0
    pad = supersaw(list(ch) + [ch[1] + 12], 2.0, cutoff=1800 + 300 * k, a=0.3 if k == 0 else 0.05, r=0.5)
    add(music, s, pad, 0.26 if s < 55 else 0.4)
    add(send, s, pad, 0.4)
    if s >= 54.0:
        add(music, max(s, 55.2), sub(ROOTS[ch] + 12, 2.0 - max(0, 55.2 - s)), 0.3)
    for j, m in enumerate([ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24]):
        add(music, s + j * 0.5, bell(m, 1.8, 0.7), 0.4, -0.4 + 0.27 * j)
        add(send, s + j * 0.5, bell(m, 1.8, 0.7), 0.4)
arps(55.2, 60.0, glob_prog, 50.0, gain=0.22)
for s in np.arange(56.0, 60.0, 1.0):
    add(drums, s, kick(0.8), 0.7)
for k, s in enumerate(np.arange(58.2, 60.0, 1 / 8)):
    add(drums, s, clap(), 0.08 + 0.4 * (k / 14) ** 2)

# --- CTA (60–66): the drop, then a held chord
cta_prog = [C_, G_]
for s in np.arange(60.0, 64.0, B):
    add(drums, s, kick(1.0), 0.95)
for s in np.arange(60.5, 64.0, 1.0):
    add(drums, s, clap(), 0.5)
for s in np.arange(60.25, 64.0, B):
    add(drums, s, hat(True), 0.2, 0.25)
for k, ch in enumerate(cta_prog):
    pad = supersaw(list(ch) + [ch[0] + 12], 2.0, cutoff=3800, a=0.01, r=0.25)
    add(music, 60.0 + k * 2, pad, 0.38)
    add(send, 60.0 + k * 2, pad, 0.2)
    for b8 in range(8):
        if b8 % 2:
            add(music, 60.0 + k * 2 + b8 * B / 2, sub(ROOTS[ch] + 12, B / 2 - 0.02), 0.3)
arps(60.0, 64.0, cta_prog, 60.0, gain=0.26)
final = supersaw(CMAJ9 + (79,), 2.0, cutoff=4200, a=0.01, r=2.0)
add(music, 64.0, final, 0.5)
add(send, 64.0, final, 0.6)
add(music, 64.0, sub(36, 2.4), 0.4)
add(drums, 64.0, kick(1.1, 1.2), 1.0)
add(music, 64.0, bell(84, 2.5), 0.5)
add(send, 64.0, bell(84, 2.5), 0.5)

# ------------------------------------------------------------------ SFX from the cue sheet
slam_n = 0
for c in TL["sfx"]:
    s, k = c["t"], c["k"]
    if k == "slam":
        add(fx, s, slam(slam_n), 0.55, (slam_n % 3 - 1) * 0.4); slam_n += 1
    elif k == "hush":
        add(fx, s, whoosh(0.6, False), 0.35)
    elif k == "ding":
        m = [84, 88, 81, 86, 83, 89, 80, 87][int((s - 4) / 0.45) % 8]
        add(fx, s, ding(m), 0.45, 0.4 if int(s * 10) % 2 else -0.4); add(send, s, ding(m), 0.2)
    elif k == "flood":
        for j in range(14):
            add(fx, s + j * 0.035, ding(80 + (j * 5) % 14, 0.6), 0.22, (j % 5 - 2) * 0.3)
    elif k == "cut":
        add(fx, s - 0.15, whoosh(0.3, True), 0.4)
    elif k == "type":
        add(fx, s, typing(), 0.5)
    elif k == "stamp":
        add(fx, s, stamp(), 0.8); add(send, s, slam(0), 0.3)
    elif k == "boomsoft":
        add(fx, s, impact(0.5), 0.5)
    elif k == "riser":
        r = riser(1.6 if s < 20 else 1.8)
        add(fx, s, r, 0.5); add(send, s, r, 0.2)
    elif k == "suck":
        add(fx, s, suck(), 0.6)
    elif k == "impact":
        add(fx, s, impact(), 0.85); add(send, s, impact(0.6), 0.35)
    elif k == "whoosh":
        add(fx, s - 0.05, whoosh(0.4, True), 0.4)
    elif k == "tap":
        add(fx, s, tap(), 0.6)
    elif k == "tapbig":
        add(fx, s, tap(), 0.7); add(fx, s, pop(0.8), 0.4)
    elif k == "pop":
        add(fx, s, pop(1.0 + 0.1 * (int(s * 10) % 3)), 0.45)
    elif k == "zoom":
        add(fx, s - 0.05, whoosh(0.35, True, 0.6), 0.3)
    elif k == "tick":
        add(fx, s, pop(1.6), 0.4)
    elif k == "pick":
        add(fx, s, pop(0.7), 0.4)
    elif k == "drop":
        add(fx, s, tap(), 0.6); add(fx, s, pop(0.6), 0.35)
    elif k == "success":
        add(fx, s, success(), 0.45); add(send, s, success(), 0.3)
    elif k == "shimmer":
        add(fx, s, shimmer(), 0.4); add(send, s, shimmer(), 0.35)
    elif k == "notify":
        add(fx, s, notify(), 0.55); add(send, s, notify(), 0.25)
    elif k == "hit":
        add(fx, s - 0.06, whoosh(0.12, True), 0.25)
    elif k == "spark":
        add(fx, s, bell(88, 1.2, 0.7), 0.35, 0.2); add(send, s, bell(88, 1.2), 0.3)
        add(fx, s, whoosh(0.8, True, 0.5), 0.25)
    elif k == "swell":
        add(fx, s - 0.8, whoosh(1.0, True), 0.3)

# ------------------------------------------------------------------ mix
# sidechain the tonal bus to every kick
side = np.ones(N)
kick_times = []
for s in np.concatenate([np.arange(0, 12, B), np.arange(19, 47.5, B), [48, 48.5, 49, 49.5], np.arange(56, 60, 1.0), np.arange(60, 64, B), [64.0]]):
    if 3.0 <= s < 4.0:
        continue
    i0 = int(s * SR)
    n = int(0.35 * SR)
    t = tt(n)
    side[i0:i0 + n] = np.minimum(side[i0:i0 + n], 1 - 0.55 * np.exp(-t * 10)[: max(0, min(n, N - i0))])
music *= side[:, None]

# reverb: decorrelated decaying noise IR
irn = int(2.4 * SR)
ir_t = tt(irn)
ir = np.stack([noise(irn), noise(irn)], 1) * np.exp(-ir_t * 2.6)[:, None]
ir = lp(ir, 6500)
ir /= np.sqrt((ir ** 2).sum(0))
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1)

mix = music * 0.9 + drums * 0.75 + fx * 0.9 + wet * 0.55
mix = hp(mix, 30)
# gentle low-shelf trim (~-3 dB under 120 Hz) so the mids carry
low = lp(mix, 120)
mix = mix - 0.3 * low
# normalise, then soft-knee clip only the top transients
mix = mix / np.percentile(np.abs(mix), 99.97) * 0.8
a = np.abs(mix)
mix = np.where(a < 0.7, mix, np.sign(mix) * (0.7 + 0.3 * np.tanh((a - 0.7) / 0.3)))
fade = np.ones(N)
fi = int((DUR - 0.6) * SR)
fade[fi:] = np.linspace(1, 0, N - fi)
mix *= fade[:, None]
mix /= max(1e-9, np.abs(mix).max()) / 0.89

import wave

def write(name, x):
    out = os.path.join(ROOT, "public", "audio", name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print("wrote", out, f"{DUR:.1f}s")

write("score.wav", mix)

# SFX-only stem (no music), for posting with a trending sound underneath
fx_only = hp(fx * 0.9 + wet * 0.25, 30)
fx_only = fx_only / max(1e-9, np.abs(fx_only).max()) * 0.89
write("sfx.wav", fx_only * fade[:, None])
