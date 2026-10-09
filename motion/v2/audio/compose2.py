"""Relevé v2 (vertical, voix off) : musique originale sans voix chantée, bruitages et mixage avec la voix ElevenLabs.

118,4 BPM, fa mineur : le tempo est calé sur la voix (les deux « Relevé » tombent sur les temps 22 et 62).
Les bruitages sont posés sur les repères exportés par l'animation (src/cues.json).
La musique s'efface sous la voix (compression en bandes déclenchée par la voix : les médiums cèdent le plus).
    python3 motion/v2/audio/compose2.py  ->  motion/v2/out/releve-vertical-mix.wav (48 kHz, 24 bits, -14 LUFS)
"""
import json
import pathlib
import subprocess
import sys

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
from pedalboard.io import AudioFile
from scipy import signal

HERE = pathlib.Path(__file__).resolve().parent
V2 = HERE.parent
sys.path.insert(0, str(V2.parent / 'audio'))
from dsp import SR, S, hz, tvec, noise, svf, butter, pan_gains, soft_clip, limit, saw  # noqa: E402
import instruments as I  # noqa: E402

CUES = json.loads((V2 / 'src' / 'cues.json').read_text(encoding='utf-8'))
BEAT = 60 / CUES['bpm']
DUR = CUES['duration']
N = S(DUR)
OUT = V2 / 'out'
VO_FILE = V2 / 'assets' / 'vo-leo-takeB.mp3'
VO_OFFSET = 0.02


def B(b):
    return b * BEAT


def db(x):
    return 10 ** (x / 20)


# ---------------------------------------------------------------------------------------------- bus
class Bus:
    def __init__(self, name):
        self.name = name
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, x, t, gain=1.0, pan=0.0, rev=0.0, dly=0.0):
        i = S(t)
        if i >= N:
            return
        gl, gr = pan_gains(pan)
        if isinstance(x, tuple):
            l, r = x[0] * gl * 1.4142, x[1] * gr * 1.4142
        else:
            l, r = x * gl * 1.4142, x * gr * 1.4142
        if i < 0:
            l, r, i = l[-i:], r[-i:], 0
        e = min(N, i + len(l))
        self.L[i:e] += l[:e - i] * gain
        self.R[i:e] += r[:e - i] * gain
        if rev:
            REV.L[i:e] += l[:e - i] * gain * rev
            REV.R[i:e] += r[:e - i] * gain * rev
        if dly:
            DLY.L[i:e] += l[:e - i] * gain * dly
            DLY.R[i:e] += r[:e - i] * gain * dly

    def st(self):
        return np.vstack([self.L, self.R])


REV, DLY = Bus('rev'), Bus('dly')
KICK, DRUMS, BASS, PAD, ARP, KEYS, BELL, FX, SFX = (Bus(n) for n in ['kick', 'drums', 'bass', 'pad', 'arp', 'keys', 'bell', 'fx', 'sfx'])

# ---------------------------------------------------------------------------------------------- harmonie (fa mineur)
FM9 = ([53, 56, 60, 63, 67], 41)
DB9 = ([49, 53, 56, 60, 63], 37)
AB9 = ([55, 56, 60, 63, 70], 44)
EB6 = ([55, 58, 60, 63, 67], 43)
AB_C = ([56, 60, 63, 67, 72], 36)
BBM9 = ([53, 56, 60, 61, 65], 46)
C7SUS = ([53, 55, 58, 60, 65], 36)
C7B9 = ([52, 55, 58, 61, 64], 36)
PROG = [FM9, DB9, AB9, EB6]
FDRONE = ([41, 48, 53, 56, 60], 29)


def chord_at(b):
    """Accord au temps b (en battements)."""
    bar = int(b // 4)
    if b < 10:
        return [FM9, DB9, EB6][min(bar, 2)]
    if b < 18:
        return FDRONE
    if b < 20:
        return C7SUS if b < 19 else C7B9
    if b < 52:
        return PROG[(bar - 5) % 4]
    if b < 60:
        return [DB9, AB_C, BBM9, C7SUS][bar - 13]
    if b < 62:
        return C7B9
    if b < 64:
        return FM9
    if b < 68:
        return AB9
    if b < 70:
        return DB9
    return EB6


LOGO = [(0, 65), (1, 72), (1.75, 68), (3, 77)]          # signature : fa, do, la bémol, fa aigu
kicks = []


def add_kick(b, vel=1.0, punch=1.0):
    KICK.add(I.kick(vel, punch), B(b), db(-1))
    kicks.append(B(b))


def roll(a, z, gain_db, start_rate=2):
    b = a
    while b < z:
        p = (b - a) / (z - a)
        rate = start_rate * (8 / start_rate) ** p
        DRUMS.add(I.snare(0.35 + 0.65 * p, seed=int(b * 64)), B(b), db(gain_db + 6 * p), pan=0.1, rev=0.12)
        b += 1 / rate


GROOVE = [(0, 10.0), (20, 52), (62, 71.5)]          # sections avec le groove complet


def drums():
    # Crochet : tout de suite le groove (l'image et la voix démarrent à la première image).
    for b in range(0, 10):
        add_kick(b, 0.92, 1.0)
    for b in [1, 3, 5, 7, 9]:
        if b != 5:
            DRUMS.add(I.clap(0.9, seed=b), B(b), db(-8), rev=0.16)
    for b in np.arange(0.5, 10, 1.0):
        DRUMS.add(I.hat(False, 0.75, seed=int(b * 2)), B(b), db(-15), pan=0.15)
    for b in np.arange(0, 10, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.6, seed=int(b * 8)), B(b), db(-22), pan=-0.3)
    roll(4.0, 5.72, -14, start_rate=4)                 # l'ascension du rasoir
    DRUMS.add(I.crash(0.9, seed=6, length=2.0), B(5.75), db(-12), pan=-0.2, rev=0.25)
    # Problème : battement de cœur + horloge.
    for b in [12, 13, 14, 15]:
        add_kick(b, 0.55, 0.6)
    for b in np.arange(12, 15.4, 0.5):
        KEYS.add(I.tick(1.0 if (b * 2) % 2 == 0 else 0.84, 0.7), B(b), db(-12), pan=0.3 if (b * 2) % 2 else -0.3)
    for b in [16, 17]:
        add_kick(b, 0.5, 0.6)
    # Montée vers le drop : la grosse caisse se resserre, roulement, puis un silence (pause de la voix).
    for b in [18, 18.5, 19, 19.25, 19.5]:
        add_kick(b, 0.6 + 0.1 * (b - 18), 0.8)
    roll(18, 19.7, -13, start_rate=2)
    # Drop : groove complet jusqu'à la bascule claire.
    for b in range(20, 52):
        if 50 <= b < 52:
            continue                                   # la notification arrive dans un creux
        add_kick(b, 1.0, 1.1 if b % 16 == 4 else 1.0)
        if b % 4 in (1, 3):
            DRUMS.add(I.clap(1.0, seed=b), B(b), db(-7), rev=0.2)
            if b >= 36:
                DRUMS.add(I.snare(0.55, seed=b), B(b), db(-13))
    for b in np.arange(20.5, 50, 1.0):
        DRUMS.add(I.hat(b >= 36, 0.8, seed=int(b * 2)), B(b), db(-14 if b >= 36 else -15), pan=0.15)
    for b in np.arange(20, 50, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.75 if (b * 4) % 4 == 3 else 0.45, seed=int(b * 8)), B(b), db(-21), pan=-0.3)
    for b, v in [(20, 1.0), (36, 0.6), (42.9, 0.7)]:
        DRUMS.add(I.crash(v, seed=int(b)), B(b), db(-11), pan=-0.2, rev=0.25)
    roll(33.5, 34.45, -16, start_rate=4)
    roll(46.5, 47.9, -16, start_rate=4)
    # Méthode (thème clair) : percussions légères.
    for b in np.arange(52.5, 60, 1.0):
        DRUMS.add(I.hat(False, 0.5, seed=int(b * 3)), B(b), db(-20), pan=0.2)
    for b in [52.5, 54.5, 56, 58]:
        add_kick(b, 0.5, 0.6)
    for b in np.arange(56, 60, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.5, seed=int(b * 8)), B(b), db(-24), pan=-0.3)
    roll(60, 61.7, -13, start_rate=2)
    # Fin : le groove revient avec le logo.
    for b in range(62, 71):
        add_kick(b, 1.0, 1.15 if b == 62 else 1.0)
        if b % 4 in (1, 3):
            DRUMS.add(I.clap(1.0, seed=b), B(b), db(-7), rev=0.2)
            DRUMS.add(I.snare(0.55, seed=b), B(b), db(-13))
    for b in np.arange(62.5, 71, 1.0):
        DRUMS.add(I.hat(True, 0.75, seed=int(b * 2)), B(b), db(-15), pan=0.15)
    for b in np.arange(62, 71, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.55, seed=int(b * 8)), B(b), db(-22), pan=-0.3)
    DRUMS.add(I.crash(1.0, seed=62), B(62), db(-10), pan=-0.2, rev=0.3)
    DRUMS.add(I.crash(0.7, seed=68, length=3.0), B(68), db(-13), pan=0.2, rev=0.35)


def bass():
    def bar_line(b0, b1, bright=1.0, gain=-13, sub_gain=-7, octave=False):
        b = b0
        while b < b1 - 1e-6:
            notes, root = chord_at(b)
            seg = min(4 - (b % 4), b1 - b)
            BASS.add(I.sub_note(root - 12, B(seg) - 0.04, 0.85), B(b), db(sub_gain))
            k = 0.5
            while k < seg - 1e-6:
                BASS.add(I.reese_note(root, B(0.42), 0.85, bright), B(b + k), db(gain))
                if octave and int(b + k) % 2:
                    BASS.add(I.reese_note(root + 12, B(0.2), 0.45, 0.8), B(b + k + 0.25), db(gain - 3))
                k += 1.0
            b += seg
    bar_line(0, 10.05, 0.8, -14)
    BASS.add(I.sub_note(29, B(3.0), 0.7), B(10.6), db(-8))                 # bourdon grave sous le problème
    BASS.add(I.sub_note(29, B(4.0), 0.6), B(14), db(-8))
    BASS.add(I.sub_note(29, B(2.0), 0.7), B(18), db(-8))
    bar_line(20, 50, 1.0, -13, octave=True)
    BASS.add(I.sub_note(41 - 12, B(1.8), 0.6), B(50), db(-9))
    for bar in range(13, 15):                                                 # méthode : notes longues
        notes, root = chord_at(bar * 4)
        BASS.add(I.sub_note(root - 12, B(4) - 0.05, 0.55), B(bar * 4), db(-8))
    notes, root = chord_at(60)
    BASS.add(I.sub_note(root - 12, B(1.8), 0.6), B(60), db(-8))
    bar_line(62, 71, 1.0, -13, octave=True)


def pad():
    segs = [(0, 4), (4, 8), (8, 10.05), (10.5, 14), (14, 18), (18, 19), (19, 19.75)]
    segs += [(b, b + 4) for b in range(20, 48, 4)] + [(48, 52)]
    segs += [(52, 56), (56, 60), (60, 61.9), (62, 64), (64, 68), (68, 70), (70, 72)]
    for a, z in segs:
        notes, root = chord_at(a)
        atk = 0.5 if a in (10.5, 52) else (0.25 if a < 20 else 0.08)
        l, r = I.supersaw_chord(notes, B(z - a) + 0.03, 1.0, attack=atk, release=0.25 if z not in (10.05, 19.75, 61.9) else 0.04, seed=int(a * 3))
        PAD.add((l, r), B(a), 0.85 if 10 <= a < 20 else 1.0)


def pad_cutoff():
    t = tvec(N)
    b = t / BEAT
    fc = np.full(N, 3400.0)
    m = b < 4
    fc[m] = 900 + 1700 * b[m] / 4
    m = (b >= 4) & (b < 5.75)
    fc[m] = 2600 + 3000 * (b[m] - 4) / 1.75
    m = (b >= 10) & (b < 18)
    fc[m] = 900
    m = (b >= 18) & (b < 19.75)
    fc[m] = 900 * (6000 / 900) ** ((b[m] - 18) / 1.75)
    m = (b >= 50.2) & (b < 52.3)
    fc[m] = 3400 * (700 / 3400) ** np.clip((b[m] - 50.2) / 0.8, 0, 1)
    m = (b >= 52.3) & (b < 60)
    fc[m] = 1600 + 700 * (b[m] - 52.3) / 7.7
    m = (b >= 60) & (b < 61.9)
    fc[m] = 2300 * (7000 / 2300) ** ((b[m] - 60) / 1.9)
    return fc


PAT = [0, 2, 4, 1, 3, 5, 2, 4, 6, 3, 5, 1, 4, 2, 6, 3]


def arp():
    def play(b0, b1, step, vel, cut, rev=0.18, dly=0.2):
        b, k = b0, 0
        while b < b1 - 1e-6:
            notes, root = chord_at(b)
            pool = sorted(notes) + [sorted(notes)[1] + 12, sorted(notes)[2] + 12]
            m = pool[PAT[k % 16] % len(pool)] + 12
            v = vel(b) if callable(vel) else vel
            c = cut(b) if callable(cut) else cut
            acc = 1.0 if k % 4 == 0 else (0.8 if k % 2 == 0 else 0.62)
            ARP.add(I.pluck(m, B(step) * 0.9, v * acc, c, seed=k), B(b), 1.0, pan=0.35 * np.sin(k * 0.7), rev=rev, dly=dly)
            b += step
            k += 1
    play(0, 10, 0.25, 0.45, lambda b: 1200 + 2400 * min(1, b / 6))
    play(20, 50, 0.25, 0.62, 4200)
    play(52.5, 60, 0.5, 0.3, 1500, rev=0.35, dly=0.35)
    play(62, 71, 0.25, 0.62, 4400)


def keys():
    """Piano électrique pendant la méthode (thème clair)."""
    for a, z in [(52.4, 54.5), (54.5, 56), (56, 58), (58, 60), (60, 61.8)]:
        notes, root = chord_at(a)
        for j, m in enumerate(notes):
            KEYS.add(I.epiano(m, B(z - a) * 0.95, 0.8 - 0.06 * j), B(a) + j * 0.012, db(-7), pan=(j - 2) * 0.15, rev=0.35, dly=0.1)


def bells():
    for c in CUES['cues']:
        if c['type'] == 'logo_vertex':
            i = c['i']
            m = LOGO[i][1]
            v = 1.0 if i < 3 else 1.15
            BELL.add(I.fm_bell(m, 3.2, v), c['t'], db(-4), pan=[-0.2, 0.15, -0.05, 0.1][i], rev=0.45, dly=0.18)
            BELL.add(I.fm_bell(m + 12, 2.2, 0.5, ratio=2.0, index=1.2), c['t'], db(-13), pan=0.3, rev=0.5)
            if i == 0:
                l, r = I.supersaw_chord([m - 12, m - 5, m], 0.9, 1.0, attack=0.005, release=0.8, seed=5)
                FX.add((l, r), c['t'], db(-10), rev=0.35)
    for off, m in LOGO:                                           # écho final, très doux
        BELL.add(I.fm_bell(m + 12, 3.0, 0.5, bright=0.7), B(68 + off), db(-10), pan=0.1, rev=0.7, dly=0.3)


def transitions():
    l, r = I.riser(B(1.75), 1.0, seed=1, tone_from=53)
    FX.add((l, r), B(4.0), db(-16), rev=0.2)
    l, r = I.riser(B(1.75), 1.0, seed=2, tone_from=48)
    FX.add((l, r), B(18.0), db(-13), rev=0.25)
    FX.add(I.reverse_swell(B(1.0), 1.0, seed=3), B(18.75), db(-14))
    l, r = I.riser(B(1.9), 1.0, seed=4, tone_from=48)
    FX.add((l, r), B(60.0), db(-14), rev=0.25)
    FX.add(I.reverse_swell(B(1.0), 0.9, seed=6), B(71.0), db(-15))          # la boucle repart sur le crochet


SCALE = [53, 55, 56, 58, 60, 63, 65, 67, 68, 70, 72, 75, 77, 79, 80, 82, 84]
PENTA = [65, 68, 70, 72, 75, 77, 80, 82, 84]


def sfx():
    for c in CUES['cues']:
        t, ty = c['t'], c['type']
        pan = c.get('pan', 0.0)
        if ty == 'impact':
            FX.add(I.impact(1.0, 1.25), t, db(-4), rev=0.35)
        elif ty in ('slam', 'drop'):
            big = ty == 'drop' or c.get('size') == 'l'
            FX.add(I.impact(1.0, 1.3 if big else 1.0), t, db(-3 if big else -6), rev=0.3)
            SFX.add(I.whoosh(0.18, 1.0, seed=int(t * 10), peak=7000, low=1500), t - 0.12, db(-18))
        elif ty == 'rank_step':
            m = [72, 75, 77, 80, 84][c['i'] - 1]
            SFX.add(I.blip(m, m, 0.08, 1.0, fm=0.7), t, db(-17), pan=-0.3 + 0.15 * c['i'], rev=0.2)
            SFX.add(I.swish(0.05, 1.0, 3500, seed=c['i']), t, db(-24))
        elif ty == 'glitch':
            g = np.random.default_rng(10)
            for j in range(9):
                tt = t + j * 0.026
                if g.uniform() < 0.6:
                    SFX.add(I.blip(g.integers(60, 96), g.integers(48, 90), 0.03, 1.0, fm=3.0), tt, db(-21), pan=g.uniform(-0.6, 0.6))
                else:
                    SFX.add(I.swish(0.025, 1.0, g.uniform(1500, 7000), seed=j), tt, db(-17), pan=g.uniform(-0.6, 0.6))
            FX.add(I.impact(0.6, 0.7), t, db(-12), rev=0.2)
        elif ty == 'whoosh':
            d = max(0.25, c.get('dur', 0.4) * 1.15)
            x = I.whoosh(d, 1.0, seed=int(t * 100), peak=5200 if c.get('up') else 3600)
            pans = np.linspace(c.get('from', 0), c.get('to', 0), len(x))
            gl, gr = pan_gains(pans)
            SFX.add((x * gl * 1.41, x * gr * 1.41), t - d * 0.3, db(-20 if c.get('soft') else -16), rev=0.15)
        elif ty == 'dive':
            SFX.add(I.whoosh(c.get('dur', 0.5) * 1.1, 1.0, seed=3, peak=5200, low=250), t, db(-16), rev=0.2)
        elif ty == 'click':
            SFX.add(I.click(1.0), t, db(-12), pan=pan * 0.5)
        elif ty == 'pop_up':
            k = c.get('n', 0)
            SFX.add(I.blip(72 + k, 79 + k, 0.12, 1.0, fm=0.6), t, db(-15), pan=pan, rev=0.2)
        elif ty == 'pop_new':
            for j, m in enumerate([77, 80, 84]):
                SFX.add(I.blip(m, m, 0.1, 1.0, fm=1.0), t + j * 0.035, db(-17), pan=pan + (j - 1) * 0.2, rev=0.3)
        elif ty == 'pop':
            SFX.add(I.blip(70, 77, 0.1, 1.0, fm=0.3), t, db(-16), pan=pan, rev=0.2)
        elif ty in ('card', 'logo_pop'):
            g = db(-21 if c.get('soft') else -17)
            SFX.add(I.swish(0.09, 1.0, 1800, seed=int(t * 10)), t - 0.02, g, pan=pan)
            SFX.add(I.thock(1.0, 160), t, g * 1.3, pan=pan)
        elif ty == 'logo_hit':
            notes, root = chord_at(t / BEAT)
            l, r = I.supersaw_chord([n + 12 for n in notes[:4]], 0.16, 1.0, attack=0.003, release=0.12, seed=c['i'])
            FX.add((l, r), t, db(-12), rev=0.25)
            SFX.add(I.thock(1.0, 120), t, db(-12))
        elif ty == 'tick_hi':
            m = SCALE[(c.get('n', 0) * 2) % len(SCALE)] + 12
            SFX.add(I.blip(m, m, 0.05, 1.0, fm=0.8), t, db(-24 if c.get('soft') else -21), pan=pan, rev=0.15)
        elif ty == 'shuffle':
            for j in range(4):
                SFX.add(I.swish(0.05, 1.0, 2600 + 300 * j, seed=j + 10 * c.get('n', 0)), t - 0.09 + j * 0.03, db(-22), pan=pan)
            SFX.add(I.tick(1.5, 0.5), t, db(-20), pan=pan)
        elif ty == 'text_hit':
            SFX.add(I.thock(1.0, 90), t, db(-13))
            SFX.add(I.swish(0.3, 1.0, 1000, seed=5), t - 0.08, db(-23), rev=0.3)
        elif ty == 'rise':
            SFX.add(I.glide(60, 76, c['dur'] * 0.95, 1.0), t, db(-15), pan=0.2, rev=0.25, dly=0.15)
        elif ty == 'fall':
            SFX.add(I.glide(76, 55, c['dur'] * 0.95, 1.0), t, db(-15), pan=-0.2, rev=0.25, dly=0.15)
        elif ty == 'erase':
            SFX.add(I.crackle(c['dur'], 1.0, seed=7, density=700), t, db(-19), rev=0.2)
            SFX.add(I.scribble(c['dur'], 0.6, seed=8), t, db(-24))
        elif ty == 'accent_tick':
            SFX.add(I.blip(96, 96, 0.06, 1.0, fm=2.0), t, db(-18), pan=0.2, rev=0.3)
            SFX.add(I.tick(1.9, 0.8), t, db(-19), pan=0.2)
        elif ty == 'typing':
            g = np.random.default_rng(int(t * 1000))
            k = c.get('n', 12)
            for j in range(k):
                tt = t + c['dur'] * (j + g.uniform(-0.3, 0.3)) / k
                SFX.add(I.click(g.uniform(0.4, 0.8)), tt, db(-22), pan=g.uniform(-0.2, 0.2))
        elif ty == 'list_in':
            for j in range(c.get('n', 6)):
                SFX.add(I.tick(1.2 + 0.05 * j, 0.5), t + j * B(0.1), db(-23), pan=0.2)
        elif ty == 'point':
            r = c['rank']
            idx = int(round((30 - r) / 29 * (len(SCALE) - 1)))
            SFX.add(I.fm_bell(SCALE[idx] + 12, 1.0, 0.6, ratio=2.0, index=1.5), t, db(-16), pan=-0.4 + c['i'] * 0.16, rev=0.3)
        elif ty == 'morning':
            m = [65, 68, 72, 75, 77, 80][c['i']]
            SFX.add(I.fm_bell(m + 12, 1.2, 0.7, ratio=2.0, index=1.3), t, db(-14), pan=-0.5 + c['i'] * 0.2, rev=0.35, dly=0.12)
        elif ty == 'count':
            m = PENTA[c['n']]
            SFX.add(I.blip(m, m, 0.07, 1.0, fm=0.9), t, db(-17), pan=-0.3 + c['n'] * 0.1, rev=0.25)
        elif ty == 'sweep':
            SFX.add(I.whoosh(c['dur'] * 1.2, 1.0, seed=17, peak=6500, low=600), t - 0.05, db(-15), pan=0.3, rev=0.2)
        elif ty == 'snap_hit':
            SFX.add(I.thock(1.0, 110), t, db(-11))
            SFX.add(I.click(1.0), t, db(-14))
            FX.add(I.impact(0.5, 0.6), t, db(-14), rev=0.2)
        elif ty == 'notif':
            for m, dt in [(80, 0), (87, 0.11)]:
                SFX.add(I.fm_bell(m, 1.4, 0.75, ratio=2.0, index=1.0), t + dt, db(-11), pan=0.3, rev=0.25)
        elif ty == 'theme_switch':
            SFX.add(I.click(1.0), t, db(-10), pan=-0.4)
            SFX.add(I.thock(1.0, 70), t, db(-11))
            SFX.add(I.whoosh(B(0.9), 1.0, seed=9, peak=7000, low=600), t, db(-17), rev=0.3)
        elif ty == 'strike':
            SFX.add(I.scribble(c['dur'], 1.0, seed=int(t * 10)), t, db(-17), pan=-0.2)
        elif ty == 'soft_hit':
            FX.add(I.impact(0.6, 0.8), t, db(-11), rev=0.4)
        elif ty == 'reverse_swell':
            FX.add(I.reverse_swell(c['dur'], 1.0, seed=10), t, db(-12))
        elif ty in ('dot_echo', 'logo_vertex'):
            pass                                                   # joués par bells()
        else:
            print('  repère sans son :', ty)


# ---------------------------------------------------------------------------------------------- voix
def load_vo():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(VO_FILE), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    vo = np.zeros(N)
    i = S(VO_OFFSET)
    vo[i:i + len(x)] = x[:N - i]
    return vo


def process_vo(x):
    """Voix : coupe-bas, de-esser, compression douce, présence, air ; niveau de diffusion."""
    x = butter(x, 'highpass', 85, 2)
    # De-esser : la bande 5,5-10 kHz est atténuée quand elle dépasse son niveau habituel.
    hi = butter(x, 'highpass', 5500, 4)
    lo = x - hi
    sib = np.abs(butter(x, 'bandpass', [5500, 10000], 2))
    env = signal.lfilter([1 - np.exp(-1 / (SR * 0.004))], [1, -np.exp(-1 / (SR * 0.004))], sib)
    thr = np.percentile(env[env > 1e-5], 92)
    gr = np.minimum(1.0, (thr / np.maximum(env, 1e-9)) ** 0.6)
    gr = signal.lfilter([1 - np.exp(-1 / (SR * 0.012))], [1, -np.exp(-1 / (SR * 0.012))], gr)
    x = lo + hi * gr
    board = pb.Pedalboard([
        pb.PeakFilter(cutoff_frequency_hz=280, gain_db=-2.0, q=0.9),
        pb.PeakFilter(cutoff_frequency_hz=3400, gain_db=2.2, q=0.8),
        pb.HighShelfFilter(cutoff_frequency_hz=10000, gain_db=1.5),
        pb.Compressor(threshold_db=-22, ratio=3.0, attack_ms=6, release_ms=120),
        pb.Compressor(threshold_db=-12, ratio=6.0, attack_ms=1, release_ms=60),
    ])
    y = board(x.astype(np.float32)[None, :], SR)[0].astype(np.float64)
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(y)
    return y * db(-15.5 - lufs)


def vo_envelope(vo):
    """Enveloppe de la voix (attaque 15 ms, relâchement 260 ms), normalisée 0..1, pour faire céder la musique."""
    a = np.abs(vo)
    att, rel = np.exp(-1 / (SR * 0.015)), np.exp(-1 / (SR * 0.26))
    env = _follow(a, att, rel)
    ref = np.percentile(env[env > 1e-4], 75)
    return np.clip(env / ref, 0, 1) ** 0.7


def _follow(a, att, rel):
    from numba import njit

    @njit(cache=True)
    def f(a, att, rel):
        out = np.empty_like(a)
        e = 0.0
        for i in range(a.shape[0]):
            v = a[i]
            e = att * e + (1 - att) * v if v > e else rel * e + (1 - rel) * v
            out[i] = e
        return out
    return f(a, att, rel)


def duck(st, env, low_db, mid_db, high_db):
    """Compression en trois bandes pilotée par la voix : les médiums (où vit la voix) cèdent le plus."""
    lo = np.vstack([butter(c, 'lowpass', 220, 4) for c in st])
    hi = np.vstack([butter(c, 'highpass', 5200, 4) for c in st])
    mid = st - lo - hi
    g = lambda d: db(d * env)[None, :]  # noqa: E731
    return lo * g(low_db) + mid * g(mid_db) + hi * g(high_db)


def tape_stop(st, t0, dur, gap_to):
    """Arrêt de bande : la musique ralentit et descend jusqu'au silence (à t0, sur dur), puis silence jusqu'à gap_to."""
    i0, n = S(t0), S(dur)
    p = np.arange(n) / n
    rate = (1 - p) ** 1.6
    pos = i0 + np.cumsum(rate)
    out = st.copy()
    for c in range(2):
        out[c, i0:i0 + n] = np.interp(pos, np.arange(st.shape[1]), st[c]) * (1 - p) ** 0.5
    i1 = S(gap_to)
    out[:, i0 + n:i1] = 0
    return out


# ---------------------------------------------------------------------------------------------- mixage
def sidechain(depth, tau=0.12):
    env = np.zeros(N)
    t = tvec(S(0.6))
    shape = np.maximum((1 - np.exp(-t / 0.003)) * np.exp(-t / tau), 0)
    for tk in kicks:
        i = S(tk)
        e = min(N, i + len(shape))
        env[i:e] = np.maximum(env[i:e], shape[:e - i])
    return 1 - depth * env


def render():
    drums(); bass(); pad(); arp(); keys(); bells(); transitions(); sfx()
    fc = pad_cutoff()
    PAD.L = svf(PAD.L, fc, 0.8, 0)
    PAD.R = svf(PAD.R, fc * 1.02, 0.8, 0)
    REV.L += PAD.L * 0.25
    REV.R += PAD.R * 0.25
    for bus, sc in [(PAD, sidechain(0.55)), (BASS, sidechain(0.7, 0.1)), (ARP, sidechain(0.35)), (KEYS, sidechain(0.15))]:
        bus.L *= sc
        bus.R *= sc
    dr = pb.Pedalboard([pb.Compressor(threshold_db=-14, ratio=3, attack_ms=6, release_ms=90), pb.Gain(2.0)])(DRUMS.st().astype(np.float32), SR)
    # La note commune (sol) des accords tient d'un bout à l'autre : on creuse sa 4e harmonique (1,57 kHz), là où vit la voix.
    pd = pb.Pedalboard([pb.PeakFilter(cutoff_frequency_hz=1570, gain_db=-6.0, q=1.4), pb.PeakFilter(cutoff_frequency_hz=2400, gain_db=-2.5, q=0.8),
                        pb.Chorus(rate_hz=0.35, depth=0.18, centre_delay_ms=8, feedback=0.0, mix=0.35)])(PAD.st().astype(np.float32), SR)
    ARP.L, ARP.R = (pb.Pedalboard([pb.PeakFilter(cutoff_frequency_hz=1650, gain_db=-3.5, q=1.0)])(ARP.st().astype(np.float32), SR)).astype(np.float64)
    rv = pb.Pedalboard([pb.HighpassFilter(220), pb.Reverb(room_size=0.82, damping=0.45, wet_level=1.0, dry_level=0.0, width=1.0), pb.LowpassFilter(9000)])(REV.st().astype(np.float32), SR)
    dl = np.vstack([
        pb.Pedalboard([pb.Delay(delay_seconds=B(0.75), feedback=0.3, mix=1.0), pb.LowpassFilter(5000)])(DLY.L.astype(np.float32)[None, :], SR)[0],
        pb.Pedalboard([pb.Delay(delay_seconds=B(1.0), feedback=0.28, mix=1.0), pb.LowpassFilter(5000)])(DLY.R.astype(np.float32)[None, :], SR)[0],
    ])
    music = (KICK.st() * db(-5.5) + dr * db(1.0) + BASS.st() * db(-7) + pd * db(-6) + ARP.st() * db(-9)
             + KEYS.st() * db(-5) + BELL.st() * db(-3) + FX.st() * db(-4) + rv * db(-9) + dl * db(-14))
    # « Le problème ? » : la musique s'arrête comme une bande qu'on freine, puis reste suspendue.
    music = tape_stop(music, B(10.06), 0.42, B(10.5))
    # Silence avant le drop (pause de la voix), réverbes comprises.
    a, z = S(B(19.72)), S(B(20.0))
    music[:, a:z] *= np.linspace(1, 0, z - a)[None, :] ** 3
    vo = process_vo(load_vo())
    env = vo_envelope(vo)
    music = duck(music, env, -3.5, -9.0, -5.0)
    sfx_bus = duck(SFX.st(), env, -1.0, -4.0, -2.0)
    voice = np.vstack([vo, vo])
    MUS_G, SFX_G = -7.0, -2.5
    mix = music * db(MUS_G) + sfx_bus * db(SFX_G) + voice * db(0)
    master = pb.Pedalboard([
        pb.HighpassFilter(28),
        pb.LowShelfFilter(cutoff_frequency_hz=70, gain_db=-1.0),
        pb.HighShelfFilter(cutoff_frequency_hz=9000, gain_db=1.0),
        pb.Compressor(threshold_db=-18, ratio=1.6, attack_ms=20, release_ms=200),
    ])
    peak0 = np.abs(mix).max()
    mix = (mix / max(peak0, 1e-9) * db(-6)).astype(np.float32)
    y = master(mix, SR).astype(np.float64)
    meter = pyln.Meter(SR)
    gain = 0.0
    for _ in range(4):
        lufs = meter.integrated_loudness(limit(y * db(gain), -2.0).T)
        gain += -14 - lufs
    drive = y * db(gain)
    y = limit(drive, -2.0)          # marge pour l'AAC : crête vraie sous -1 dBTP après encodage
    lufs2 = meter.integrated_loudness(y.T)
    # Diagnostics : sonie pondérée K de la voix et du fond (musique + bruitages) pendant la parole, et bande 1-4 kHz.
    vm = env > 0.5
    bed = music * db(MUS_G) + sfx_bus * db(SFX_G)
    def kw(x):
        return meter.integrated_loudness(np.ascontiguousarray(x.T))
    seg_v, seg_b = voice[:, vm], bed[:, vm]
    lv, lb = kw(seg_v), kw(seg_b)
    band = lambda x: 10 * np.log10(np.mean(butter(x[0], 'bandpass', [1000, 4000], 2) ** 2) + 1e-20)  # noqa: E731
    print(f'  pendant la voix : voix {lv:.1f} LUFS, fond {lb:.1f} LUFS (écart {lv - lb:.1f} LU) ; bande 1-4 kHz écart {band(seg_v) - band(seg_b):.1f} dB')
    mm = ~vm
    print(f'  hors voix : fond {kw(bed[:, mm]):.1f} LUFS (avant gain final)')
    pk_in = np.max(np.abs(drive), axis=0)
    pk_out = np.max(np.abs(y), axis=0) + 1e-12
    gr = 20 * np.log10(np.maximum(pk_in, 1e-12) / pk_out)
    act = gr[pk_in > 0.05]
    print(f'  limiteur : réduction médiane {np.median(act):.1f} dB, 99e centile {np.percentile(act, 99):.1f} dB, max {gr.max():.1f} dB')
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in [('releve-vertical-mix.wav', y), ("releve-vertical-musique.wav", music * db(MUS_G) * db(gain))]:
        with AudioFile(str(OUT / name), 'w', samplerate=SR, num_channels=2, bit_depth=24) as f:
            f.write(np.clip(data, -1, 1).astype(np.float32))
    print(f'out/releve-vertical-mix.wav : {DUR:.2f} s, {lufs2:.1f} LUFS, crête {20 * np.log10(np.abs(y).max()):.2f} dBFS')


if __name__ == '__main__':
    render()
