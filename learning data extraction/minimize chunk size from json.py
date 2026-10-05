import json
from pathlib import Path

INPUT_JSON = "assets/corpus.json"
OUTPUT_MIN_JS = "www/data/corpusminimized.js"

CORE_THEMES = [
    "karma yoga", "raja yoga", "practical vedanta", "work", 
    "character", "strength", "mind", "concentration", "faith", 
    "fear", "education", "chicago", "secret of work"
]

data = json.load(open(INPUT_JSON, "r", encoding="utf-8"))
filtered = []

for c in data.get("chunks", []):
    t = (c.get("title", "") + " " + c.get("text", "")).lower()
    if any(k in t for k in CORE_THEMES):
        filtered.append(c)

print(f"Retained {len(filtered)} targeted core chunks out of {len(data['chunks'])}")

payload = {
    "meta": {"count": len(filtered), "status": "VERBATIM_CORE_FOCUS"},
    "chunks": filtered
}

js_str = "const VM_CORPUS=" + json.dumps(payload, separators=(',', ':'), ensure_ascii=False) + ";"
js_str = js_str.replace("</", "<\\/")

Path(OUTPUT_MIN_JS).parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_MIN_JS, "w", encoding="utf-8") as f:
    f.write(js_str)

size_mb = Path(OUTPUT_MIN_JS).stat().st_size / (1024 * 1024)
print(f"Final focused size: {size_mb:.2f} MB")