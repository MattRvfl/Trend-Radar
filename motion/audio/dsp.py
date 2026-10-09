"""Briques de synthèse pour la musique du film (numpy + numba). Tout est déterministe."""
import numpy as np
from numba import njit
from scipy import signal

SR = 48000


def S(sec):
    return int(round(sec * SR))


def hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def tvec(n):
    return np.arange(n) / SR


_rng = np.random.default_rng(20261008)


def noise(n, seed=None):
    g = np.random.default_rng(seed) if seed is not None else _rng
    return g.standard_normal(n).astype(np.float64)


# ---------------------------------------------------------------- oscillateurs anti-repliement (PolyBLEP)
@njit(cache=True)
def _blep(t, dt):
    if t < dt:
        x = t / dt
        return x + x - x * x - 1.0
    if t > 1.0 - dt:
        x = (t - 1.0) / dt
        return x * x + x + x + 1.0
    return 0.0


@njit(cache=True)
def saw(freq, phase0=0.0):
    n = freq.shape[0]
    out = np.empty(n)
    ph = phase0
    for i in range(n):
        dt = freq[i] / 48000.0
        out[i] = 2.0 * ph - 1.0 - _blep(ph, dt)
        ph += dt
        if ph >= 1.0:
            ph -= 1.0
    return out


@njit(cache=True)
def square(freq, phase0=0.0, pw=0.5):
    n = freq.shape[0]
    out = np.empty(n)
    ph = phase0
    for i in range(n):
        dt = freq[i] / 48000.0
        v = 1.0 if ph < pw else -1.0
        v += _blep(ph, dt)
        p2 = ph - pw
        if p2 < 0.0:
            p2 += 1.0
        v -= _blep(p2, dt)
        out[i] = v
        ph += dt
        if ph >= 1.0:
            ph -= 1.0
    return out


def sine(freq, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), freq.shape if np.ndim(freq) else (1,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase0)


# ---------------------------------------------------------------- filtre à variables d'état (TPT), coupure modulable
@njit(cache=True)
def svf(x, fc, q, mode):
    """mode 0 = passe-bas, 1 = passe-bande, 2 = passe-haut. fc : tableau (Hz) de même longueur que x."""
    n = x.shape[0]
    out = np.empty(n)
    ic1 = 0.0
    ic2 = 0.0
    k = 1.0 / q
    for i in range(n):
        f = fc[i]
        if f > 21000.0:
            f = 21000.0
        if f < 10.0:
            f = 10.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            out[i] = v2
        elif mode == 1:
            out[i] = v1
        else:
            out[i] = x[i] - k * v1 - v2
    return out


def lp(x, fc, q=0.707):
    return svf(x, np.full(len(x), float(fc)) if np.isscalar(fc) else fc.astype(np.float64), q, 0)


def bp(x, fc, q=1.0):
    return svf(x, np.full(len(x), float(fc)) if np.isscalar(fc) else fc.astype(np.float64), q, 1)


def hp(x, fc, q=0.707):
    return svf(x, np.full(len(x), float(fc)) if np.isscalar(fc) else fc.astype(np.float64), q, 2)


def butter(x, kind, f, order=2):
    sos = signal.butter(order, f, btype=kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x)


# ---------------------------------------------------------------- enveloppes
def adsr(n, a, d, s, r, gate):
    """gate : durée (s) avant relâchement. Courbes exponentielles douces."""
    t = tvec(n)
    env = np.zeros(n)
    a = max(a, 1e-4)
    att = t < a
    env[att] = (t[att] / a) ** 0.8
    dec = (t >= a) & (t < gate)
    env[dec] = s + (1 - s) * np.exp(-(t[dec] - a) / max(d, 1e-4))
    lvl = s + (1 - s) * np.exp(-(max(gate, a) - a) / max(d, 1e-4)) if gate > a else (gate / a) ** 0.8
    rel = t >= gate
    env[rel] = lvl * np.exp(-(t[rel] - gate) / max(r, 1e-4))
    return env


def fade(x, fin=0.002, fout=0.01):
    n = len(x)
    a, b = min(S(fin), n // 2), min(S(fout), n // 2)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def soft_clip(x, drive=1.0):
    return np.tanh(drive * x) / np.tanh(drive)


def pan_gains(p):
    """p ∈ [-1, 1] -> gains gauche/droite à puissance constante."""
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


# ---------------------------------------------------------------- limiteur à anticipation (crête échantillon)
@njit(cache=True)
def _limiter_gain(peak, ceil, la, rel):
    n = peak.shape[0]
    req = np.empty(n)
    for i in range(n):
        req[i] = 1.0 if peak[i] <= ceil else ceil / peak[i]
    # minimum glissant vers l'avant (anticipation)
    gmin = np.empty(n)
    for i in range(n):
        m = 1.0
        e = i + la
        if e > n:
            e = n
        for j in range(i, e):
            if req[j] < m:
                m = req[j]
        gmin[i] = m
    # attaque : moyenne glissante sur la fenêtre d'anticipation ; relâchement exponentiel
    out = np.empty(n)
    g = 1.0
    acc = float(la)
    buf = np.ones(la)
    for i in range(n):
        acc += gmin[i] - buf[i % la]
        buf[i % la] = gmin[i]
        target = acc / la
        if target < g:
            g = target
        else:
            g = g + (target - g) * rel
        if g > gmin[i]:
            g = gmin[i]
        out[i] = g
    return out


def limit(st, ceil_db=-1.0, lookahead_ms=2.0, release_ms=90.0):
    """st : tableau (2, n). Ramène toute crête sous ceil_db, sans coloration au-dessous."""
    ceil = 10 ** (ceil_db / 20)
    peak = np.max(np.abs(st), axis=0).astype(np.float64)
    la = max(1, int(SR * lookahead_ms / 1000))
    rel = 1.0 - np.exp(-1.0 / (SR * release_ms / 1000))
    g = _limiter_gain(peak, ceil, la, rel)
    return st * g[None, :]
