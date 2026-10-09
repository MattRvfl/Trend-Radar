"""Instruments synthétisés (batterie, basses, nappes, arpège, cloche FM, piano électrique) et bruitages."""
import numpy as np
from dsp import (SR, S, hz, tvec, noise, saw, square, svf, lp, bp, hp, butter, adsr, fade, soft_clip)


# ======================================================================== batterie
def kick(vel=1.0, punch=1.0, length=0.55):
    n = S(length)
    t = tvec(n)
    f = 46 + 135 * np.exp(-t / 0.03) * punch + 420 * np.exp(-t / 0.0035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.21) * (1 - np.exp(-t / 0.0012))
    click = hp(noise(n, 11) * np.exp(-t / 0.0022), 1800)
    x = soft_clip(body * 1.15 + 0.22 * click, 1.7)
    return fade(x * vel, 0.0005, 0.03)


def clap(vel=1.0, seed=3):
    n = S(0.45)
    t = tvec(n)
    env = np.zeros(n)
    for k, d in enumerate([0.0, 0.0095, 0.019, 0.029]):
        m = t >= d
        env[m] += (0.75 if k < 3 else 1.0) * np.exp(-(t[m] - d) / 0.0055)
    m = t >= 0.029
    env[m] += 0.55 * np.exp(-(t[m] - 0.029) / 0.13)
    x = butter(noise(n, seed) * env, 'bandpass', [900, 4200])
    return fade(x * 2.2 * vel)


def snare(vel=1.0, seed=5):
    n = S(0.35)
    t = tvec(n)
    tone = np.sin(2 * np.pi * (185 + 40 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.06)
    nz = hp(noise(n, seed), 2500) * np.exp(-t / 0.11)
    return fade((0.7 * tone + 0.9 * nz) * vel)


_HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) * 1.73


def hat(open_=False, vel=1.0, seed=7):
    n = S(0.42 if open_ else 0.09)
    t = tvec(n)
    metal = np.zeros(n)
    for f in _HAT_F:
        metal += np.sign(np.sin(2 * np.pi * f * t))
    x = 0.55 * metal / len(_HAT_F) + 0.8 * noise(n, seed)
    x = butter(x, 'highpass', 7200, 3)
    env = np.exp(-t / (0.16 if open_ else 0.020)) * (1 - np.exp(-t / 0.0008))
    return fade(x * env * vel * 0.9)


def shaker(vel=1.0, seed=9):
    n = S(0.09)
    t = tvec(n)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.028)
    return fade(butter(noise(n, seed), 'bandpass', [4500, 11000]) * env * vel)


def crash(vel=1.0, seed=13, length=2.6):
    n = S(length)
    t = tvec(n)
    metal = np.zeros(n)
    for f in _HAT_F * 0.92:
        metal += np.sign(np.sin(2 * np.pi * f * t + f))
    x = butter(0.35 * metal / 6 + noise(n, seed), 'highpass', 3800, 2)
    env = np.exp(-t / 0.9) * (1 - np.exp(-t / 0.002))
    return fade(x * env * vel * 0.8, 0.0005, 0.3)


def tick(pitch=1.0, vel=1.0):
    """Tic d'horloge : bois sec, deux partiels inharmoniques."""
    n = S(0.10)
    t = tvec(n)
    x = (np.sin(2 * np.pi * 1760 * pitch * t) * np.exp(-t / 0.016)
         + 0.55 * np.sin(2 * np.pi * 2710 * pitch * t) * np.exp(-t / 0.010)
         + 0.35 * hp(noise(n, 17), 3000) * np.exp(-t / 0.0018))
    return fade(x * vel * 0.6)


# ======================================================================== basses
def sub_note(m, dur, vel=1.0):
    n = S(dur + 0.08)
    t = tvec(n)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(4 * np.pi * f * t)
    return fade(x * adsr(n, 0.004, 0.4, 0.85, 0.05, dur) * vel, 0.001, 0.02)


def reese_note(m, dur, vel=1.0, bright=1.0):
    n = S(dur + 0.1)
    f = hz(m)
    a = saw(np.full(n, f * 2 ** (8 / 1200)), 0.1)
    b = saw(np.full(n, f * 2 ** (-8 / 1200)), 0.6)
    c = square(np.full(n, f / 2), 0.3)
    env = adsr(n, 0.006, 0.18, 0.7, 0.05, dur)
    cut = 180 + 900 * bright * np.exp(-tvec(n) / 0.09)
    x = svf((a + b) * 0.5 + 0.35 * c, cut, 1.1, 0)
    return fade(soft_clip(x * 1.6, 1.4) * env * vel, 0.001, 0.02)


# ======================================================================== nappe (supersaw), arpège, lead
def supersaw_chord(notes, dur, vel=1.0, voices=7, detune=14.0, attack=0.35, release=0.9, seed=1):
    """Renvoie (gauche, droite)."""
    n = S(dur + release + 0.05)
    g = np.random.default_rng(seed)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f0 = hz(m)
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune + g.uniform(-2, 2)
            s = saw(np.full(n, f0 * 2 ** (cents / 1200)), g.uniform(0, 1))
            w = 1.0 if v == voices // 2 else 0.75
            if v % 2:
                L += s * w
                R += s * w * 0.45
            else:
                R += s * w
                L += s * w * 0.45
    env = adsr(n, attack, 1.2, 0.8, release, dur)
    k = vel / (len(notes) * voices) * 2.2
    return L * env * k, R * env * k


def pluck(m, dur=0.25, vel=1.0, cutoff=4200.0, decay=0.07, res=1.6, seed=0):
    n = S(dur + 0.25)
    f = hz(m)
    t = tvec(n)
    x = 0.65 * saw(np.full(n, f), 0.0) + 0.35 * square(np.full(n, f * 1.0015), 0.25)
    fc = 160 + cutoff * np.exp(-t / decay)
    y = svf(x, fc, res, 0)
    env = adsr(n, 0.002, 0.16, 0.0, 0.06, dur) * (1 - np.exp(-t / 0.001))
    return fade(y * env * vel * 0.9, 0.0005, 0.02)


def lead_line(events, n_total, vel=1.0):
    """events : liste (t0, durée, midi). Un seul oscillateur avec glissando (portamento 35 ms)."""
    if not events:
        return np.zeros(n_total)
    freq = np.zeros(n_total)
    gate = np.zeros(n_total)
    cur = hz(events[0][2])
    tau = 0.035
    for i, (t0, d, m) in enumerate(events):
        a, b = S(t0), min(n_total, S(t0 + d))
        target = hz(m)
        seg = np.arange(b - a) / SR
        freq[a:b] = target + (cur - target) * np.exp(-seg / tau)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * seg) * np.clip((seg - 0.18) / 0.25, 0, 1)
        freq[a:b] *= vib
        gate[a:b] = 1.0
        cur = target
    # garder une fréquence valide hors des notes
    last = hz(events[0][2])
    for i in range(n_total):
        if freq[i] == 0:
            freq[i] = last
        else:
            last = freq[i]
    x = 0.5 * saw(freq * 2 ** (6 / 1200), 0.2) + 0.5 * saw(freq * 2 ** (-6 / 1200), 0.7) + 0.25 * square(freq * 0.5, 0.1)
    env = butter(gate, 'lowpass', 40, 1)  # attaque/relâchement doux
    env = np.clip(env, 0, 1)
    y = svf(x, 900 + 2600 * env, 0.9, 0)
    return y * env * vel * 0.5


# ======================================================================== cloche FM (signature) et piano électrique
def fm_bell(m, dur=2.8, vel=1.0, ratio=3.5, index=3.2, bright=1.0):
    n = S(dur)
    t = tvec(n)
    f = hz(m)
    ienv = index * np.exp(-t / (0.55 * bright)) + 0.15
    mod = np.sin(2 * np.pi * f * ratio * t) * ienv
    car = np.sin(2 * np.pi * f * t + mod)
    glass = np.sin(2 * np.pi * f * 2 * t + 0.8 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.2))
    env = (1 - np.exp(-t / 0.0015)) * np.exp(-t / 1.15)
    return fade((car + 0.28 * glass * np.exp(-t / 0.5)) * env * vel * 0.5, 0.0005, 0.2)


def epiano(m, dur=1.6, vel=1.0):
    n = S(dur + 0.6)
    t = tvec(n)
    f = hz(m)
    mod1 = np.sin(2 * np.pi * f * t) * (1.6 * np.exp(-t / 0.35) + 0.35)
    tine = np.sin(2 * np.pi * f * 14 * t) * 0.9 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * f * t + mod1 + tine)
    env = adsr(n, 0.003, 0.9, 0.45, 0.45, dur)
    return fade(x * env * vel * 0.45, 0.0005, 0.05)


# ======================================================================== bruitages
def riser(dur, vel=1.0, seed=21, tone_from=None):
    n = S(dur)
    t = tvec(n)
    p = t / dur
    fc = 250 * (9000 / 250) ** (p ** 1.6)
    L = svf(noise(n, seed), fc, 2.2, 1)
    R = svf(noise(n, seed + 1), fc * 1.04, 2.2, 1)
    env = p ** 2.2
    if tone_from is not None:
        f = hz(tone_from) * 2 ** (24 * p ** 1.8 / 12)
        tone = svf(saw(f, 0.0) + saw(f * 1.005, 0.5), 400 + 5000 * p, 1.2, 0) * 0.35
        L = L + tone
        R = R + tone
    return fade(L * env * vel, 0.01, 0.004), fade(R * env * vel, 0.01, 0.004)


def reverse_swell(dur, vel=1.0, seed=23):
    n = S(dur)
    t = tvec(n)
    p = t / dur
    x = butter(noise(n, seed), 'highpass', 1200)
    env = np.exp((p - 1) * 5.0) * p
    y = svf(x, 600 + 9000 * p ** 2, 0.9, 0)
    return fade(y * env * vel, 0.01, 0.003)


def impact(vel=1.0, size=1.0, seed=31):
    n = S(3.2)
    t = tvec(n)
    f = 32 + 48 * np.exp(-t / 0.25)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.9 * size)) * (1 - np.exp(-t / 0.002))
    nz = noise(n, seed) * np.exp(-t / (0.25 * size))
    nz = svf(nz, 400 + 9000 * np.exp(-t / 0.18), 0.8, 0)
    thump = kick(1.0, 1.4, 0.8)
    x = soft_clip(1.25 * sub, 1.8) + 0.55 * nz
    x[:len(thump)] += 0.9 * thump
    return fade(x * vel, 0.0005, 0.5)


def whoosh(dur, vel=1.0, seed=41, peak=3200.0, low=350.0):
    n = S(dur)
    t = tvec(n)
    p = t / dur
    shape = np.sin(np.pi * np.clip(p, 0, 1)) ** 1.6
    fc = low + (peak - low) * shape
    x = svf(noise(n, seed), fc, 1.4, 1) + 0.5 * svf(noise(n, seed + 5), fc * 2.1, 2.0, 1)
    return fade(x * shape * vel * 1.4, 0.005, 0.01)


def click(vel=1.0):
    n = S(0.05)
    t = tvec(n)
    x = hp(noise(n, 51), 2500) * np.exp(-t / 0.0016) + 0.5 * np.sin(2 * np.pi * 3400 * t) * np.exp(-t / 0.006)
    x += 0.4 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.004)
    return fade(x * vel * 0.7)


def blip(m_from, m_to, dur=0.12, vel=1.0, fm=0.0):
    n = S(dur + 0.15)
    t = tvec(n)
    f = hz(m_to) + (hz(m_from) - hz(m_to)) * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph + fm * np.sin(2 * ph) * np.exp(-t / 0.05))
    env = (1 - np.exp(-t / 0.0015)) * np.exp(-t / (dur * 0.6))
    return fade(x * env * vel * 0.45)


def swish(dur=0.08, vel=1.0, fc=2400, seed=61):
    n = S(dur)
    t = tvec(n)
    env = np.sin(np.pi * t / dur) ** 2
    return fade(bp(noise(n, seed), fc, 1.2) * env * vel)


def thock(vel=1.0, f=180.0):
    n = S(0.08)
    t = tvec(n)
    return fade(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02) * vel)


def glide(m_from, m_to, dur, vel=1.0):
    n = S(dur + 0.2)
    t = tvec(n)
    p = np.clip(t / dur, 0, 1)
    pp = p * p * (3 - 2 * p)
    m = m_from + (m_to - m_from) * pp
    f = 440 * 2 ** ((m - 69) / 12)
    x = 0.6 * saw(f, 0.0) + 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    y = svf(x, 700 + 2400 * np.sin(np.pi * p), 1.3, 0)
    env = np.clip(t / 0.02, 0, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.06))
    return fade(y * env * vel * 0.35)


def crackle(dur, vel=1.0, seed=71, density=900.0):
    n = S(dur)
    g = np.random.default_rng(seed)
    x = np.zeros(n)
    t = 0.0
    while t < dur:
        p = t / dur
        rate = density * (1 - p) + 40
        t += g.exponential(1 / rate)
        i = S(t)
        if i >= n - 200:
            break
        L = g.integers(30, 160)
        grain = noise(L, int(g.integers(1, 1 << 30))) * np.hanning(L) * g.uniform(0.2, 1.0) * (1 - p)
        x[i:i + L] += grain
    return hp(x, 1500) * vel


def scribble(dur, vel=1.0, seed=81):
    n = S(dur)
    t = tvec(n)
    g = np.random.default_rng(seed)
    am = np.abs(np.sin(2 * np.pi * 26 * t + g.uniform(0, 6))) ** 0.5
    fc = 2200 + 1800 * np.sin(2 * np.pi * 7 * t) ** 2
    x = svf(noise(n, seed), fc, 2.5, 1) * am * np.sin(np.pi * t / dur) ** 0.7
    return fade(x * vel * 1.5)
