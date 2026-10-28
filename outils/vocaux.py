"""Fabrique les messages vocaux (répondeur) des téléphones avec Piper.

Usage : python3 outils/vocaux.py <dossier des voix> <dossier de sortie> [nom ...]
Voix (huggingface.co/rhasspy/piper-voices, fr/fr_FR) : siwis-medium, upmc-medium.
Les voix mls (mls-medium, mls_1840-low) bafouillent avec piper-tts récent : à éviter.
ton : décalage de hauteur en demi-tons, pour tirer plusieurs personnages d'une même voix.
Chaque réplique : (texte, silence après en s). Un texte entre crochets est un rire ou un souffle.
"""
import io, subprocess, sys, wave
import numpy as np

SR = 44100

VOCAUX = {
    # tél. 3, appel manqué du samedi 24 à 11 h 05
    "maman-24-10": dict(voix="fr_FR-siwis-medium", speaker=None, vitesse=0.95, ton=-2.5, fond="cuisine", lignes=[
        ("Allô, mon chéri ? C'est maman.", 0.5),
        ("Bon, tu ne réponds pas, tu dois encore dormir, toi.", 0.6),
        ("Je voulais te dire, pour la Toussaint, dimanche premier, on va voir papy au cimetière. Papa voudrait partir vers dix heures, alors tu nous dis.", 0.7),
        ("Et je sors de chez mamie. Elle était en forme, tu sais !", 0.4),
        ("Elle a chanté avec moi. Le temps des cerises, du début à la fin. Elle se souvenait de toutes les paroles, je n'en revenais pas.", 0.6),
        ("Elle a demandé après le petit, évidemment.", 0.5),
        ("Bon. Je t'embrasse fort. Rappelle-moi quand tu peux. Bisous, bisous.", 0.4),
    ]),
    # tél. 4, troisième appel manqué du lundi 26 à 19 h 30
    "lucile-26-10": dict(voix="fr_FR-siwis-medium", speaker=None, vitesse=1.05, ton=1, fond="rue", lignes=[
        ("Euh, salut.", 0.6),
        ("C'est Lucile.", 0.9),
        ("Lucile, du ciné, samedi.", 0.4),
        ("[rire]", 0.3),
        ("Pardon, c'est bête, je sais pas pourquoi je précise.", 0.7),
        ("Bref. Je t'ai écrit, t'as pas répondu, alors, euh, je tente.", 0.6),
        ("Rappelle-moi. Si tu veux.", 0.3),
    ]),
    # tél. 4, appel manqué du vendredi 30 à 19 h 15
    "nora-30-10": dict(voix="fr_FR-upmc-medium", speaker=0, vitesse=0.92, fond="hopital", souffle=0.15, lignes=[
        ("Théo. Décroche.", 1.2),
        ("Bon. Je peux pas parler, je suis de garde.", 0.4),
        ("Je passe à sept heures.", 0.5),
        ("Ne fais rien d'ici là.", 0.6),
        ("Rien. Tu m'entends ?", 0.3),
    ]),
}

def tts(path, text, speaker, vitesse):
    from piper import PiperVoice, SynthesisConfig
    v = PiperVoice.load(path)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        v.synthesize_wav(text, w, SynthesisConfig(speaker_id=speaker, length_scale=1 / vitesse, noise_scale=0.7, noise_w_scale=0.9))
    buf.seek(0)
    with wave.open(buf) as w:
        sr, x = w.getframerate(), np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    return np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)

def rire(rng):
    # trois petites expirations par le nez, plus crédible qu'un « haha » de synthèse
    out = []
    for k in range(3):
        n = int(SR * 0.09)
        env = np.sin(np.linspace(0, np.pi, n)) ** 2
        b = np.convolve(rng.normal(0, 1, n), np.ones(6) / 6, "same") * env * (0.25 - 0.06 * k)
        out += [b, np.zeros(int(SR * 0.07))]
    return np.concatenate(out)

def souffle_voix(x, dose, rng):
    S = np.fft.rfft(x)
    y = np.fft.irfft(np.abs(S) * np.exp(2j * np.pi * rng.random(len(S))), len(x))
    return x * (1 - dose) + y / (np.abs(y).max() + 1e-9) * np.abs(x).max() * dose

def fond(kind, n, rng):
    t = np.arange(n) / SR
    base = np.convolve(rng.normal(0, 1, n), np.ones(30) / 30, "same")
    if kind == "hopital":  # couloir : souffle, bip de moniteur au loin
        bip = np.sin(2 * np.pi * 980 * t) * ((t % 1.3) < 0.12) * 0.015
        return base * 0.03 + bip
    if kind == "rue":
        return base * 0.05 * (1 + 0.5 * np.sin(2 * np.pi * 0.2 * t))
    return base * 0.025

def fabrique(nom, cfg, voix_dir, out_dir):
    rng = np.random.default_rng(len(nom))
    path = f"{voix_dir}/{cfg['voix']}.onnx"
    parts = [np.zeros(int(0.4 * SR))]
    for txt, pause in cfg["lignes"]:
        if txt == "[rire]":
            seg = rire(rng)
        else:
            seg = tts(path, txt, cfg["speaker"], cfg["vitesse"])
            if cfg.get("souffle"): seg = souffle_voix(seg, cfg["souffle"], rng)
            seg = seg / (np.abs(seg).max() + 1e-9) * 0.6
        parts += [seg, np.zeros(int(pause * SR))]
    voice = np.concatenate(parts)
    mix = voice + fond(cfg.get("fond"), len(voice), rng)
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes()
    # son de répondeur : bande téléphone et légère compression
    r = 2 ** (cfg.get("ton", 0) / 12)
    pitch = f"asetrate={SR * r:.0f},aresample={SR},atempo={1 / r:.4f}," if r != 1 else ""
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", pitch + "highpass=f=280,lowpass=f=3600,acompressor=threshold=0.1:ratio=3,volume=1.4",
                    "-b:a", "128k", f"{out_dir}/{nom}.mp3"], input=pcm, check=True)

if __name__ == "__main__":
    voix_dir, out_dir, *noms = sys.argv[1:]
    for nom in noms or VOCAUX:
        fabrique(nom, VOCAUX[nom], voix_dir, out_dir)
        print(nom)
