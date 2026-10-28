"""Fabrique le mémo chuchoté de 3h12 (tél. 2) avec le mot TOI caché en haut du spectre.

Usage : python3 outils/memo-312.py <voix.onnx> <sortie.mp3> [--sans-mot]
Voix conseillée : fr_FR-tom-medium (huggingface.co/rhasspy/piper-voices).
"""
import io, subprocess, sys, wave
import numpy as np

SR = 44100
PHRASES = [  # (texte, silence après en s)
    ("Je crois que j'ai vu quelque chose.", 2.6),
    ("Je ne sais plus quoi.", 1.8),
]

def tts(onnx, text):
    from piper import PiperVoice, SynthesisConfig
    v = PiperVoice.load(onnx)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        v.synthesize_wav(text, w, SynthesisConfig(length_scale=1.25, noise_scale=0.8, noise_w_scale=0.9))
    buf.seek(0)
    with wave.open(buf) as w:
        sr, x = w.getframerate(), np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    return np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)

def stft(x, n=1024, hop=256):
    win = np.hanning(n)
    x = np.pad(x, (n, n))
    return np.array([np.fft.rfft(win * x[i:i + n]) for i in range(0, len(x) - n, hop)]), win

def istft(S, win, length, n=1024, hop=256):
    y = np.zeros(len(S) * hop + n); norm = np.zeros_like(y)
    for k, f in enumerate(S):
        y[k * hop:k * hop + n] += win * np.fft.irfft(f, n); norm[k * hop:k * hop + n] += win ** 2
    return (y / np.maximum(norm, 1e-6))[n:n + length]

def whisper(x):
    # garde l'enveloppe de la voix, remplace la vibration des cordes vocales par du souffle
    S, win = stft(x)
    rng = np.random.default_rng(312)
    S = np.abs(S) * np.exp(2j * np.pi * rng.random(S.shape))
    y = istft(S, win, len(x))
    return y / (np.abs(y).max() + 1e-9)

def hidden_word(dur, word="TOI", f0=15500, f1=19500):
    # trace les lettres en blocs de fréquences : visible seulement sur un spectrogramme
    from PIL import Image, ImageDraw, ImageFont
    W, H = 120, 40
    img = Image.new("L", (W, H)); d = ImageDraw.Draw(img)
    try: font = ImageFont.truetype("DejaVuSans-Bold.ttf", 36)
    except OSError: font = ImageFont.load_default()
    d.text((W / 2, H / 2), word, fill=255, font=font, anchor="mm")
    m = np.array(img)[::-1] / 255  # ligne 0 = grave
    hop = 512; frames = int(dur * SR / hop)
    cols = np.interp(np.linspace(0, W - 1, frames), np.arange(W), np.arange(W)).astype(int)
    freqs = np.linspace(f0, f1, H)
    t = np.arange(hop) / SR; out = np.zeros(frames * hop); ph = np.zeros(H)
    for k, c in enumerate(cols):
        a = m[:, c]
        seg = (a[:, None] * np.sin(2 * np.pi * freqs[:, None] * t + ph[:, None])).sum(0)
        out[k * hop:(k + 1) * hop] = seg; ph += 2 * np.pi * freqs * hop / SR
    return out / (np.abs(out).max() + 1e-9)

def main(onnx, dest, mot=True):
    rng = np.random.default_rng(3)
    parts = [np.zeros(int(1.4 * SR))]
    for txt, pause in PHRASES:
        parts += [whisper(tts(onnx, txt)) * 0.5, np.zeros(int(pause * SR))]
    voice = np.concatenate(parts)
    room = np.convolve(rng.normal(0, 1, len(voice)), np.ones(40) / 40, "same") * 0.02  # souffle de pièce, nuit
    mix = voice + room
    # TOI pendant la pause après « quelque chose », assez faible pour ne pas s'entendre
    start = int((1.4 + len(parts[1]) / SR + 0.3) * SR)
    if mot:
        tag = hidden_word(2.0) * 0.035
        mix[start:start + len(tag)] += tag
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-b:a", "192k", "-cutoff", "20000", dest], input=pcm, check=True)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], "--sans-mot" not in sys.argv)
