"""Relevé : musique originale du film, synthétisée note par note (aucun échantillon, aucune voix).

120 BPM, fa mineur. La signature sonore suit la polyligne du logo (rythme = abscisses, hauteurs = ordonnées).
Les bruitages sont posés sur les repères exportés par l'animation (src/cues.json) : image et son tombent
sur la même milliseconde.
    python3 motion/audio/compose.py  ->  motion/out/releve-musique.wav (48 kHz, 24 bits, -14 LUFS)
"""
import json
import pathlib
import sys

import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
from pedalboard.io import AudioFile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from dsp import SR, S, hz, tvec, noise, svf, butter, pan_gains, soft_clip, limit  # noqa: E402
import instruments as I  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
CUES = json.loads((ROOT / 'src' / 'cues.json').read_text(encoding='utf-8'))
BEAT = 60 / CUES['bpm']
DUR = CUES['duration']
N = S(DUR)
OUT = ROOT / 'out'


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
        if isinstance(x, tuple):
            l, r = x
            gl, gr = pan_gains(pan)
            l, r = l * gl * 1.4142, r * gr * 1.4142
        else:
            gl, gr = pan_gains(pan)
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
KICK, DRUMS, BASS, PAD, ARP, LEAD, KEYS, BELL, FX, SFX = (Bus(n) for n in
                                                          ['kick', 'drums', 'bass', 'pad', 'arp', 'lead', 'keys', 'bell', 'fx', 'sfx'])

# ---------------------------------------------------------------------------------------------- harmonie
FM9 = ([53, 56, 60, 63, 67], 41)
DB9 = ([49, 53, 56, 60, 63], 37)
AB9 = ([55, 56, 60, 63, 70], 44)
EB6 = ([55, 58, 60, 63, 67], 43)
AB_C = ([56, 60, 63, 67, 72], 36)
BBM9 = ([53, 56, 60, 61, 65], 46)
C7SUS = ([53, 55, 58, 60, 65], 36)
C7B9 = ([52, 55, 58, 61, 64], 36)
AB_END = ([56, 60, 63, 67, 70, 75], 44)
PROG = [FM9, DB9, AB9, EB6]


def chord_at(bar):
    """Accord de la mesure (0 = première)."""
    if 24 <= bar <= 26:
        return [DB9, AB_C, BBM9][bar - 24]
    if bar == 27:
        return C7SUS
    if bar >= 31:
        return AB_END
    return PROG[bar % 4]


LOGO = [(0, 65), (1, 72), (1.75, 68), (3, 77)]          # signature : fa, do, la bémol, fa aigu

# ---------------------------------------------------------------------------------------------- batterie
kicks = []


def add_kick(b, vel=1.0, punch=1.0):
    KICK.add(I.kick(vel, punch), B(b), db(-1))
    kicks.append(B(b))


def drums():
    # Mesures 5-8 : la pulsation arrive.
    for b in range(16, 31):
        add_kick(b, 0.72 if b < 24 else 0.88, 0.8 if b < 24 else 1.0)
    for b in np.arange(16.5, 31, 1.0):
        DRUMS.add(I.hat(False, 0.8), B(b), db(-15), pan=0.15)
    for b in np.arange(20, 31, 0.25):
        if b % 1:
            DRUMS.add(I.shaker(0.7 if (b * 4) % 2 else 0.4, seed=int(b * 8)), B(b), db(-21), pan=-0.25)
    for b in range(24, 31):
        if b % 4 in (1, 3):
            DRUMS.add(I.clap(0.9, seed=b), B(b), db(-7), rev=0.18)
    # Roulement de caisse claire qui accélère (montée vers le drop 1).
    roll(28, 31.25, -12)
    # Drop 1 + Groove A + Groove B (mesures 9 à 24).
    for b in range(32, 95):
        add_kick(b, 1.0, 1.1 if b % 16 == 0 else 1.0)
        if b % 4 in (1, 3):
            DRUMS.add(I.clap(1.0, seed=b), B(b), db(-6), rev=0.2)
            if b >= 64:
                DRUMS.add(I.snare(0.6, seed=b), B(b), db(-12))
    for b in np.arange(32.5, 95, 1.0):
        DRUMS.add(I.hat(b >= 64, 0.85 if b >= 64 else 0.8, seed=int(b * 2)), B(b), db(-13 if b >= 64 else -14), pan=0.15)
    for b in np.arange(32, 95, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.8 if (b * 4) % 4 == 3 else 0.5, seed=int(b * 8)), B(b), db(-20), pan=-0.3)
        if b >= 64 and b % 1 == 0.75 and int(b) % 2:
            DRUMS.add(I.hat(False, 0.5, seed=int(b * 8)), B(b), db(-18), pan=-0.4)
    for b, v in [(32, 1.0), (48, 0.55), (64, 0.9), (80, 0.55)]:
        DRUMS.add(I.crash(v, seed=int(b)), B(b), db(-11), pan=-0.2, rev=0.25)
    for a, z in [(46.5, 47.9), (62.0, 63.9), (78.5, 79.9)]:
        roll(a, z, -14, start_rate=4)
    # Bascule de thème : la batterie s'arrête, respiration.
    # Pause : battement de cœur discret, puis montée.
    for b in [96, 100, 104, 106]:
        add_kick(b, 0.55, 0.7)
    for b in [108, 109, 110, 110.5, 111]:
        add_kick(b, 0.7, 0.9)
    roll(108, 111.3, -11, start_rate=2)
    # Drop final + appel à l'action.
    for b in range(112, 124):
        add_kick(b, 1.0, 1.1 if b == 112 else 1.0)
        if b % 4 in (1, 3):
            DRUMS.add(I.clap(1.0, seed=b), B(b), db(-6), rev=0.2)
            DRUMS.add(I.snare(0.6, seed=b), B(b), db(-12))
    for b in np.arange(112.5, 124, 1.0):
        DRUMS.add(I.hat(True, 0.8, seed=int(b * 2)), B(b), db(-13), pan=0.15)
    for b in np.arange(112, 124, 0.25):
        if b % 0.5:
            DRUMS.add(I.shaker(0.6, seed=int(b * 8)), B(b), db(-20), pan=-0.3)
    DRUMS.add(I.crash(1.0, seed=112), B(112), db(-10), pan=-0.2, rev=0.3)
    roll(122.5, 123.9, -14, start_rate=4)
    # Fin : dernier coup.
    add_kick(124, 1.0, 1.2)
    DRUMS.add(I.crash(0.9, seed=124, length=3.5), B(124), db(-10), pan=0.2, rev=0.35)


def roll(a, z, gain_db, start_rate=2):
    """Roulement de caisse claire : de start_rate coups par temps à 8, crescendo."""
    b = a
    while b < z:
        p = (b - a) / (z - a)
        rate = start_rate * (8 / start_rate) ** p
        DRUMS.add(I.snare(0.35 + 0.65 * p, seed=int(b * 64)), B(b), db(gain_db + 6 * p), pan=0.1, rev=0.12)
        b += 1 / rate


# ---------------------------------------------------------------------------------------------- basse
def bass():
    # Intro : sous-basse tenue, qui suit les fondamentales.
    for bar in range(0, 4):
        notes, root = chord_at(bar)
        BASS.add(I.sub_note(root - 12, B(4) - 0.02, 0.5 + 0.12 * bar), B(bar * 4), db(-6))
    for a, z in [(4, 8), (8, 24), (28, 31)]:
        for bar in range(a, z):
            notes, root = chord_at(bar)
            b0 = bar * 4
            # Mesure 8 : la basse se tait sur le dernier demi-temps (silence avant le drop) ; mesure 24 : avant la bascule de thème.
            BASS.add(I.sub_note(root - 12, B(3.5 if bar in (7, 23) else 4) - 0.05, 0.85), B(b0), db(-6))
            for k in range(4):
                if bar in (7, 23) and k >= 3:
                    continue
                vel = 0.9 if k % 2 else 0.75
                BASS.add(I.reese_note(root, B(0.42), vel, 1.0 if bar >= 8 else 0.55), B(b0 + k + 0.5), db(-13 if bar >= 8 else -17))
                if bar >= 16 and k in (1, 3):
                    BASS.add(I.reese_note(root + 12, B(0.2), 0.45, 0.8), B(b0 + k + 0.75), db(-16))
    # Pause : notes longues et douces.
    for bar in range(24, 28):
        notes, root = chord_at(bar)
        BASS.add(I.sub_note(root - 12, B(4) - 0.05, 0.55), B(bar * 4), db(-7))
    BASS.add(I.sub_note(AB_END[1] - 12, B(7), 0.8), B(124), db(-6))


# ---------------------------------------------------------------------------------------------- nappe
def pad():
    for bar in range(0, 32):
        notes, root = chord_at(bar)
        if bar == 27:
            # do7sus4 puis do7♭9 : tension avant le drop final.
            for (nt, a, d) in [(C7SUS[0], 0, 2), (C7B9[0], 2, 1.5)]:
                l, r = I.supersaw_chord(nt, B(d) + 0.05, 0.9, attack=0.08, release=0.25, seed=bar * 7 + a)
                PAD.add((l, r), B(bar * 4 + a), 1.0)
            continue
        if bar == 31:
            l, r = I.supersaw_chord(notes, B(4) + 1.6, 1.0, attack=0.06, release=1.4, seed=bar)
            PAD.add((l, r), B(bar * 4), 1.15)
            continue
        if bar == 7:
            l, r = I.supersaw_chord(notes, B(3.5) - 0.02, 1.0, attack=0.15, release=0.05, seed=bar)
        else:
            atk = 0.9 if bar < 4 else (0.12 if bar >= 8 else 0.3)
            l, r = I.supersaw_chord(notes, B(4) + 0.05, 1.0, attack=atk, release=0.35, seed=bar)
        PAD.add((l, r), B(bar * 4), 1.0)


def pad_cutoff():
    t = tvec(N)
    b = t / BEAT
    fc = np.full(N, 5200.0)
    m = b < 16
    fc[m] = 320 * (2400 / 320) ** (b[m] / 16)
    m = (b >= 16) & (b < 28)
    fc[m] = 2400 + (3800 - 2400) * (b[m] - 16) / 12
    m = (b >= 28) & (b < 31.5)
    fc[m] = 3800 * (650 / 3800) ** ((b[m] - 28) / 3.5)
    m = (b >= 96) & (b < 108)
    fc[m] = 1500 + 600 * (b[m] - 96) / 12
    m = (b >= 108) & (b < 111.5)
    fc[m] = 2100 * (7000 / 2100) ** ((b[m] - 108) / 3.5)
    m = b >= 124
    fc[m] = 5200 * (900 / 5200) ** np.clip((b[m] - 124) / 8, 0, 1)
    return fc


# ---------------------------------------------------------------------------------------------- arpège
PAT = [0, 2, 4, 1, 3, 5, 2, 4, 6, 3, 5, 1, 4, 2, 6, 3]


def arp():
    def play(b0, b1, step, vel, cut, rev=0.18, dly=0.22, every=1):
        b = b0
        k = 0
        while b < b1 - 1e-6:
            bar = int(b // 4)
            notes, root = chord_at(bar)
            pool = sorted(notes) + [sorted(notes)[1] + 12, sorted(notes)[2] + 12]
            if k % every == 0:
                m = pool[PAT[k % 16] % len(pool)] + 12
                v = vel(b) if callable(vel) else vel
                c = cut(b) if callable(cut) else cut
                acc = 1.0 if k % 4 == 0 else (0.8 if k % 2 == 0 else 0.62)
                ARP.add(I.pluck(m, B(step) * 0.9, v * acc, c, seed=k), B(b), 1.0, pan=0.35 * np.sin(k * 0.7), rev=rev, dly=dly)
            b += step
            k += 1

    play(8, 16, 0.25, lambda b: 0.25 + 0.35 * (b - 8) / 8, lambda b: 700 + 1600 * (b - 8) / 8)
    play(16, 28, 0.25, lambda b: 0.42 + 0.2 * (b - 16) / 12, lambda b: 1500 + 2600 * (b - 16) / 12)
    play(28, 31.5, 0.25, 0.55, lambda b: 4200 * (900 / 4200) ** ((b - 28) / 3.5))
    play(32, 64, 0.25, 0.68, 4200)
    play(64, 94, 0.25, 0.5, 3600)
    play(96, 108, 0.5, 0.3, 1600, rev=0.35, dly=0.35)
    play(108, 111.5, 0.25, lambda b: 0.3 + 0.35 * (b - 108) / 3.5, lambda b: 1600 * (6500 / 1600) ** ((b - 108) / 3.5))
    play(112, 124, 0.25, 0.68, 4400)


# ---------------------------------------------------------------------------------------------- lead (groove B)
def lead():
    mel = [
        # mesure 17 : la signature, une octave plus haut
        (64, 0.75, 77), (65, 0.6, 84), (65.75, 1.0, 80), (67, 0.9, 77),
        (68, 1.6, 75), (70, 0.45, 77), (70.5, 0.45, 80), (71, 0.9, 77),
        (72, 0.9, 84), (73, 0.6, 82), (73.75, 0.7, 80), (74.5, 0.45, 79), (75, 0.9, 75),
        (76, 1.4, 79), (77.5, 0.45, 77), (78, 0.9, 75), (79, 0.9, 77),
        (80, 0.75, 77), (81, 0.6, 84), (81.75, 1.0, 80), (83, 0.9, 89),
        (84, 0.9, 87), (85, 0.6, 85), (85.75, 0.7, 84), (86.5, 1.2, 80),
        (88, 0.9, 84), (89, 0.45, 82), (89.5, 0.45, 80), (90, 0.9, 79), (91, 0.9, 75),
        (92, 2.6, 80),
    ]
    ev = [(B(b), B(d), m) for b, d, m in mel]
    x = I.lead_line(ev, N, 1.0)
    LEAD.add(x, 0, db(-5), pan=0.05, rev=0.22, dly=0.3)


# ---------------------------------------------------------------------------------------------- cloche + piano
def bells():
    for c in CUES['cues']:
        if c['type'] == 'logo_vertex':
            i = c['i']
            m = LOGO[i][1]
            v = 1.0 if i < 3 else 1.15
            BELL.add(I.fm_bell(m, 3.2, v), c['t'], db(-3), pan=[-0.2, 0.15, -0.05, 0.1][i], rev=0.45, dly=0.18)
            BELL.add(I.fm_bell(m + 12, 2.2, 0.5, ratio=2.0, index=1.2), c['t'], db(-12), pan=0.3, rev=0.5)
            if i == 0:
                l, r = I.supersaw_chord([m - 12, m - 5, m], 0.9, 1.0, attack=0.005, release=0.8, seed=5)
                FX.add((l, r), c['t'], db(-9), rev=0.35)
    # Écho de la signature sur le point d'accent (fin), plus doux, très réverbéré.
    for off, m in LOGO:
        BELL.add(I.fm_bell(m + 12, 3.0, 0.55, bright=0.7), B(124 + off), db(-8), pan=0.1, rev=0.7, dly=0.3)


def keys():
    for bar in range(24, 28):
        notes, root = chord_at(bar)
        if bar == 27:
            groups = [(C7SUS[0], 0, 2), (C7B9[0], 2, 1.5)]
        else:
            groups = [(notes, 0, 2.6), (notes, 2.5, 1.4)]
        for nt, a, d in groups:
            for j, m in enumerate(nt):
                KEYS.add(I.epiano(m, B(d), 0.8 - 0.06 * j), B(bar * 4 + a) + j * 0.012, db(-6), pan=(j - 2) * 0.15, rev=0.35, dly=0.12)
    # Tic d'horloge discret pendant la pause : la mesure continue.
    for b in range(96, 108):
        KEYS.add(I.tick(1.0 if b % 2 == 0 else 0.84, 0.5), B(b), db(-16), pan=0.3)


def intro_ticks():
    for b in range(0, 16):
        DRUMS.add(I.tick(1.0 if b % 2 == 0 else 0.84, 0.75), B(b), db(-9), pan=0.25, rev=0.15)
    for b in np.arange(8.5, 16, 1.0):
        DRUMS.add(I.tick(1.26, 0.35), B(b), db(-14), pan=-0.3, rev=0.1)


# ---------------------------------------------------------------------------------------------- montées et impacts
def transitions():
    l, r = I.riser(B(4), 1.0, seed=1, tone_from=41)
    FX.add((l, r), B(12), db(-15), rev=0.2)
    l, r = I.riser(B(3.5), 1.0, seed=2, tone_from=53)
    FX.add((l, r), B(28), db(-12), rev=0.25)
    FX.add(I.reverse_swell(B(2), 1.0), B(29.5), db(-12), rev=0.2)
    l, r = I.riser(B(3.5), 1.0, seed=3, tone_from=48)
    FX.add((l, r), B(108), db(-12), rev=0.25)
    FX.add(I.reverse_swell(B(1.5), 1.0, seed=5), B(62.5), db(-16))
    FX.add(I.reverse_swell(B(1.0), 0.8, seed=6), B(15), db(-14))


# ---------------------------------------------------------------------------------------------- bruitages (repères)
SCALE = [53, 55, 56, 58, 60, 63, 65, 67, 68, 70, 72, 75, 77, 79, 80, 82, 84]


def sfx():
    for c in CUES['cues']:
        t, ty = c['t'], c['type']
        pan = c.get('pan', 0.0)
        if ty == 'impact':
            big = c.get('size') == 'xxl'
            FX.add(I.impact(1.0, 1.4 if big else 1.2), t, db(-2), rev=0.35)
        elif ty == 'whoosh':
            d = max(0.25, c.get('dur', 0.4) * 1.15)
            x = I.whoosh(d, 1.0, seed=int(t * 100), peak=5200 if c.get('up') else 3600)
            n = len(x)
            p0, p1 = c.get('from', 0), c.get('to', 0)
            pans = np.linspace(p0, p1, n)
            gl, gr = pan_gains(pans)
            g = db(-20 if c.get('soft') else -15)
            SFX.add((x * gl * 1.41, x * gr * 1.41), t - d * 0.55, g, rev=0.15)
        elif ty == 'dive':
            d = c.get('dur', 1.8)
            SFX.add(I.whoosh(d, 1.0, seed=3, peak=2600, low=180), t, db(-15), rev=0.2)
        elif ty == 'zoom_out':
            d = c.get('dur', 0.8)
            SFX.add(I.whoosh(d, 1.0, seed=4, peak=2200, low=200), t - 0.05, db(-15), rev=0.15)
        elif ty in ('swoosh_up',):
            SFX.add(I.whoosh(c.get('dur', 0.5), 1.0, seed=6, peak=6000), t - 0.1, db(-16), rev=0.2)
        elif ty == 'click':
            SFX.add(I.click(1.0), t, db(-11), pan=pan * 0.5)
        elif ty == 'pop_up':
            g = db(-19 if c.get('soft') else -15)
            k = c.get('n', 0)
            SFX.add(I.blip(72 + k, 79 + k, 0.12, 1.0, fm=0.6), t, g, pan=pan, rev=0.2)
        elif ty == 'pop_down':
            SFX.add(I.blip(79, 67, 0.16, 1.0, fm=0.5), t, db(-15), pan=pan, rev=0.2)
        elif ty == 'pop_new':
            g = db(-20 if c.get('soft') else -16)
            for j, m in enumerate([77, 80, 84]):
                SFX.add(I.blip(m, m, 0.1, 1.0, fm=1.0), t + j * 0.035, g, pan=pan + (j - 1) * 0.2, rev=0.3)
        elif ty == 'pop':
            SFX.add(I.blip(70, 77, 0.1, 1.0, fm=0.3), t, db(-17), pan=pan, rev=0.2)
        elif ty in ('card', 'logo_pop'):
            g = db(-21 if c.get('soft') else -17)
            SFX.add(I.swish(0.09, 1.0, 1800, seed=int(t * 10)), t - 0.02, g, pan=pan)
            SFX.add(I.thock(1.0, 160), t, g * 1.3, pan=pan)
        elif ty == 'tick_hi':
            m = SCALE[(c.get('n', 0) * 2) % len(SCALE)] + 12
            SFX.add(I.blip(m, m, 0.05, 1.0, fm=0.8), t, db(-22), pan=pan, rev=0.15)
        elif ty == 'shuffle':
            SFX.add(I.swish(0.07, 1.0, 3000, seed=int(t * 10)), t, db(-24), pan=pan)
            SFX.add(I.tick(1.5, 0.4), t, db(-22), pan=pan)
        elif ty == 'text':
            SFX.add(I.swish(0.25, 1.0, 1200, seed=int(t * 10)), t - 0.05, db(-27), pan=pan, rev=0.2)
        elif ty == 'text_hit':
            SFX.add(I.thock(1.0, 90), t, db(-14))
            SFX.add(I.swish(0.3, 1.0, 1000, seed=5), t - 0.08, db(-24), rev=0.3)
        elif ty == 'rise':
            SFX.add(I.glide(60, 72, c['dur'] * 0.95, 1.0), t, db(-17), pan=0.3, rev=0.25, dly=0.15)
        elif ty == 'fall':
            SFX.add(I.glide(72, 58, c['dur'] * 0.95, 1.0), t, db(-17), pan=0.3, rev=0.25, dly=0.15)
        elif ty == 'erase':
            SFX.add(I.crackle(c['dur'], 1.0, seed=7, density=500), t, db(-22), rev=0.2)
        elif ty == 'dissolve':
            SFX.add(I.crackle(c['dur'], 1.0, seed=8, density=1400), t, db(-20), pan=-0.3, rev=0.3)
        elif ty == 'accent_tick':
            SFX.add(I.blip(96, 96, 0.06, 1.0, fm=2.0), t, db(-17), pan=0.2, rev=0.3)
            SFX.add(I.tick(1.9, 0.8), t, db(-18), pan=0.2)
        elif ty == 'typing':
            g = np.random.default_rng(int(t * 1000))
            k = c.get('n', 12)
            for j in range(k):
                tt = t + c['dur'] * (j + g.uniform(-0.3, 0.3)) / k
                SFX.add(I.click(g.uniform(0.4, 0.8)), tt, db(-21), pan=g.uniform(-0.2, 0.2))
        elif ty == 'list_in':
            for j in range(c.get('n', 6)):
                SFX.add(I.tick(1.2 + 0.05 * j, 0.5), t + j * B(0.25), db(-22), pan=0.2)
        elif ty == 'snap':
            k = c.get('n', 0)
            m = [65, 68, 72, 75, 77, 80][k % 6]
            SFX.add(I.blip(m + 12, m + 12, 0.07, 1.0, fm=0.6), t, db(-18), pan=pan, rev=0.25)
            SFX.add(I.swish(0.05, 1.0, 3500, seed=k), t, db(-22), pan=pan)
        elif ty == 'point':
            r = c['rank']
            idx = int(round((30 - r) / 29 * (len(SCALE) - 1)))
            m = SCALE[idx]
            SFX.add(I.fm_bell(m + 12, 1.2, 0.7, ratio=2.0, index=1.5), t, db(-12), pan=-0.4 + c['i'] * 0.16, rev=0.3)
        elif ty == 'bars':
            SFX.add(I.glide(65, 77, 0.45, 1.0), t, db(-21), pan=0.2, rev=0.2)
        elif ty == 'flip':
            for j in range(c.get('n', 6)):
                SFX.add(I.swish(0.04, 1.0, 2600 + 120 * j, seed=j), t + j * 0.06, db(-22), pan=0.2)
        elif ty == 'notif':
            seq = [(80, 0), (87, 0.11)] if not c.get('second') else [(77, 0), (84, 0.11)]
            for m, dt in seq:
                SFX.add(I.fm_bell(m, 1.4, 0.7, ratio=2.0, index=1.0), t + dt, db(-12), pan=0.45, rev=0.25)
        elif ty == 'theme_switch':
            SFX.add(I.click(1.0), t, db(-9), pan=0.4)
            SFX.add(I.thock(1.0, 70), t, db(-10))
            SFX.add(I.whoosh(B(1.0), 1.0, seed=9, peak=7000, low=600), t, db(-15), rev=0.3)
        elif ty == 'strike':
            SFX.add(I.scribble(c['dur'], 1.0, seed=int(t * 10)), t, db(-19), pan=-0.2)
        elif ty == 'soft_hit':
            FX.add(I.impact(0.6, 0.8), t, db(-10), rev=0.4)
        elif ty == 'reverse_swell':
            FX.add(I.reverse_swell(c['dur'], 1.0, seed=10), t, db(-11))
        elif ty == 'dot_off':
            SFX.add(I.blip(84, 72, 0.25, 1.0, fm=0.4), t, db(-16), rev=0.5)
            SFX.add(I.tick(1.6, 0.6), t, db(-18))


# ---------------------------------------------------------------------------------------------- mixage
def sidechain(depth, tau=0.12):
    env = np.zeros(N)
    t = tvec(S(0.6))
    shape = (1 - np.exp(-t / 0.003)) * np.exp(-t / tau)
    shape = np.maximum(shape, 0)
    for tk in kicks:
        i = S(tk)
        e = min(N, i + len(shape))
        env[i:e] = np.maximum(env[i:e], shape[:e - i])
    return 1 - depth * env


def render():
    drums()
    bass()
    pad()
    arp()
    lead()
    bells()
    keys()
    intro_ticks()
    transitions()
    sfx()

    fc = pad_cutoff()
    PAD.L = svf(PAD.L, fc, 0.8, 0)
    PAD.R = svf(PAD.R, fc * 1.02, 0.8, 0)
    # Envoi réverbe de la nappe après filtrage (l'intro reste sombre jusque dans la réverbe).
    REV.L += PAD.L * 0.3
    REV.R += PAD.R * 0.3
    sc_pad, sc_bass, sc_arp = sidechain(0.55), sidechain(0.7, 0.1), sidechain(0.35)
    for bus, sc in [(PAD, sc_pad), (BASS, sc_bass), (ARP, sc_arp), (LEAD, sidechain(0.2)), (KEYS, sidechain(0.15))]:
        bus.L *= sc
        bus.R *= sc

    drums_bus = pb.Pedalboard([pb.Compressor(threshold_db=-14, ratio=3, attack_ms=6, release_ms=90), pb.Gain(2.0)])
    dr = drums_bus(DRUMS.st().astype(np.float32), SR)
    pad_fx = pb.Pedalboard([pb.Chorus(rate_hz=0.35, depth=0.18, centre_delay_ms=8, feedback=0.0, mix=0.35)])
    pd = pad_fx(PAD.st().astype(np.float32), SR)
    rev = pb.Pedalboard([pb.HighpassFilter(220), pb.Reverb(room_size=0.86, damping=0.45, wet_level=1.0, dry_level=0.0, width=1.0), pb.LowpassFilter(9000)])
    rv = rev(REV.st().astype(np.float32), SR)
    dl = np.vstack([
        pb.Pedalboard([pb.Delay(delay_seconds=B(0.75), feedback=0.32, mix=1.0), pb.LowpassFilter(5000)])(DLY.L.astype(np.float32)[None, :], SR)[0],
        pb.Pedalboard([pb.Delay(delay_seconds=B(1.0), feedback=0.30, mix=1.0), pb.LowpassFilter(5000)])(DLY.R.astype(np.float32)[None, :], SR)[0],
    ])
    mix = (KICK.st() * db(-5.5) + dr * db(1.5) + BASS.st() * db(-7) + pd * db(-5) + ARP.st() * db(-8)
           + LEAD.st() * db(-7) + KEYS.st() * db(-4) + BELL.st() * db(-3) + FX.st() * db(-4) + SFX.st() * db(0)
           + rv * db(-8) + dl * db(-13))
    # Fondu de sortie sur la queue.
    tt = tvec(N)
    tail = np.clip((DUR - tt) / 1.6, 0, 1) ** 1.5
    mix *= tail
    master = pb.Pedalboard([
        pb.HighpassFilter(28),
        pb.LowShelfFilter(cutoff_frequency_hz=70, gain_db=-1.5),
        pb.PeakFilter(cutoff_frequency_hz=320, gain_db=-1.5, q=0.8),
        pb.HighShelfFilter(cutoff_frequency_hz=8000, gain_db=2.5),
        pb.Compressor(threshold_db=-16, ratio=1.8, attack_ms=25, release_ms=220),
    ])
    peak0 = np.abs(mix).max()
    mix = (mix / max(peak0, 1e-9) * db(-6)).astype(np.float32)
    y = master(mix, SR).astype(np.float64)
    meter = pyln.Meter(SR)
    # Niveau cible -14 LUFS (web), crêtes sous -1 dBFS : deux passes gain + limiteur.
    pre = y
    gain = 0.0
    for _ in range(4):
        lufs = meter.integrated_loudness(limit(pre * db(gain), -1.0).T)
        gain += -14 - lufs
    drive = pre * db(gain)
    y = limit(drive, -1.0)
    lufs2 = meter.integrated_loudness(y.T)
    pk_in = np.max(np.abs(drive), axis=0)
    pk_out = np.max(np.abs(y), axis=0) + 1e-12
    gr = 20 * np.log10(np.maximum(pk_in, 1e-12) / pk_out)
    act = gr[pk_in > 0.05]
    corr = np.sum(y[0] * y[1]) / np.sqrt(np.sum(y[0] ** 2) * np.sum(y[1] ** 2))
    print(f'  limiteur : réduction médiane {np.median(act):.1f} dB, 99e centile {np.percentile(act, 99):.1f} dB, max {gr.max():.1f} dB')
    print(f'  corrélation G/D {corr:.2f}, continu {np.mean(y):.5f}')
    for name, bus in [('batterie', DRUMS), ('kick', KICK), ('basse', BASS), ('nappe', PAD), ('arpège', ARP), ('lead', LEAD),
                      ('piano', KEYS), ('cloche', BELL), ('fx', FX), ('bruitages', SFX)]:
        r = np.sqrt(np.mean(bus.st() ** 2)) + 1e-12
        print(f'  {name:10s} RMS {20 * np.log10(r):6.1f} dB')
    y = y.astype(np.float32)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / 'releve-musique.wav'
    with AudioFile(str(path), 'w', samplerate=SR, num_channels=2, bit_depth=24) as f:
        f.write(y)
    print(f'{path.relative_to(ROOT)} : {DUR:.2f} s, {lufs2:.1f} LUFS, crête {20 * np.log10(np.abs(y).max()):.2f} dBFS')


if __name__ == '__main__':
    render()
