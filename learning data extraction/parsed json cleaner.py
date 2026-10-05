import json
import re
from pathlib import Path

INPUT_JSON = "assets/corpus.json"
OUTPUT_MIN_JS = "www/data/corpus.js"

data = json.load(open(INPUT_JSON, "r", encoding="utf-8"))
raw_chunks = data.get("chunks", [])

print(f"Initial raw chunks: {len(raw_chunks)}")

cleaned = []
seen_texts = set()

for c in raw_chunks:
    text = c.get("text", "").strip()
    
    # 1. Skip duplicate paragraphs
    text_signature = text[:80].lower()
    if text_signature in seen_texts:
        continue
    seen_texts.add(text_signature)
    
    # 2. Filter out tiny artifacts, footnotes, and headers (< 20 words)
    words = text.split()
    if len(words) < 20:
        continue
        
    # 3. Discard table of contents / index lines
    if re.search(r'\.{4,}|\bpage\s+\d+\b', text, re.I) and len(words) < 40:
        continue

    # 4. Strip verbose keys to keep payload light
    cleaned.append({
        "id": c.get("id"),
        "vol": c.get("volume", 1),
        "pg": c.get("page", 0),
        "ch": c.get("chapterRoman", "I"),
        "title": c.get("title", "Complete Works"),
        "text": text
    })

print(f"Cleaned high-value chunks: {len(cleaned)}")

# Output compact single-line JS
payload = {
    "meta": {
        "count": len(cleaned),
        "status": "VERBATIM_COMPACT"
    },
    "chunks": cleaned
}

js_str = "const VM_CORPUS=" + json.dumps(payload, separators=(',', ':'), ensure_ascii=False) + ";"
js_str = js_str.replace("</", "<\\/")

Path(OUTPUT_MIN_JS).parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_MIN_JS, "w", encoding="utf-8") as f:
    f.write(js_str)

size_mb = Path(OUTPUT_MIN_JS).stat().st_size / (1024 * 1024)
print(f"Done! Compressed into {OUTPUT_MIN_JS} ({size_mb:.2f} MB)")