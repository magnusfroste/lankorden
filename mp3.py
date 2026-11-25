#!/usr/bin/env python3
"""mp3.py — färdiga röstfiler för Länkorden.

Appen säger exakt:
  - r.a + ' ' + r.b           (engelska, en-US-AriaNeural)
  - r.forkl                   (svenska, sv-SE-SofieNeural)
  - 'Inte riktigt. Försök igen.'  (svenska)
  - 'Nivå N klar. Du fick K stjärnor.' (svenska, alla N=1..3, K=0..10)

Kör: python3 mp3.py   (skriver public/ljud/*.mp3, lines.js, rosten.js)
"""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "public")
LJUD = os.path.join(PUB, "ljud")
os.makedirs(LJUD, exist_ok=True)


def load_data():
    """Läs DATA ur public/data.js med node (den exporterar module.exports)."""
    out = subprocess.run(
        ["node", "-e",
         "const vm=require('vm'),fs=require('fs');const s={module:{exports:{}}};"
         "vm.createContext(s);vm.runInContext(fs.readFileSync('public/data.js','utf8'),s);"
         "process.stdout.write(JSON.stringify(s.module.exports.DATA))"],
        cwd=HERE, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def synth(text, voice, rate):
    fid = hashlib.sha1((voice + "|" + text).encode("utf-8")).hexdigest()[:10]
    path = os.path.join(LJUD, fid + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 400:
        return fid
    for _ in range(4):
        p = subprocess.run(
            ["edge-tts", "--text", text, "--voice", voice, "--rate", rate,
             "--write-media", path],
            capture_output=True, text=True, timeout=90)
        if p.returncode == 0 and os.path.exists(path) and os.path.getsize(path) > 400:
            return fid
    if os.path.exists(path):
        os.remove(path)
    return None


def main():
    data = load_data()
    rader = []
    for r in data:
        rader.append((r["a"] + " " + r["b"], "en-US-AriaNeural", "-4%"))
        rader.append((r["forkl"], "sv-SE-SofieNeural", "-4%"))
    rader.append(("Inte riktigt. Försök igen.", "sv-SE-SofieNeural", "-4%"))
    for n in (1, 2, 3):
        for k in range(0, 11):
            rader.append((f"Nivå {n} klar. Du fick {k} stjärnor."
                          if k != 1 else f"Nivå {n} klar. Du fick 1 stjärna.",
                          "sv-SE-SofieNeural", "-4%"))

    lines = {}
    miss = 0
    for i, (text, voice, rate) in enumerate(rader, 1):
        fid = synth(text, voice, rate)
        if not fid:
            miss += 1
            print("MISS", text[:60])
            continue
        lines[text] = fid
        if i % 20 == 0:
            print(f"{i}/{len(rader)}", flush=True)

    with open(os.path.join(LJUD, "lines.js"), "w", encoding="utf-8") as f:
        f.write("window.__ROST = " + json.dumps(lines, ensure_ascii=False) + ";\n")
    dst = os.path.join(LJUD, "rosten.js")
    src = os.path.join(HERE, "..", "tools", "rosten.js")
    open(dst, "w", encoding="utf-8").write(open(src, encoding="utf-8").read())
    print(f"lines: {len(lines)}  miss: {miss}")


if __name__ == "__main__":
    main()