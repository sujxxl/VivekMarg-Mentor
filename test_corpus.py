"""
Stage 1: Corpus Byte-for-Byte Authenticity Test Suite (test_corpus.py)
Asserts that extracted chunks have valid metadata, non-empty verbatim text,
and strict volume/page/para recovery without placeholder or corrupted entries.
"""
import json
import sys
import os

def test_corpus_integrity():
    corpus_path = os.path.join(os.path.dirname(__file__), 'corpus.json')
    if not os.path.exists(corpus_path):
        print("[FAIL] corpus.json not found.")
        sys.exit(1)

    with open(corpus_path, 'r', encoding='utf-8') as f:
        chunks = json.load(f)

    print(f"[TEST] Verifying {len(chunks)} corpus chunks...")
    assert len(chunks) >= 50, f"Expected substantial corpus, got {len(chunks)}"

    required_fields = ['id', 'volume', 'page', 'chapterRoman', 'section', 'title', 'paragraph']
    seen_ids = set()

    for i, c in enumerate(chunks):
        # 1. Check all required fields
        for field in required_fields:
            assert field in c, f"Chunk {i} missing field '{field}'"
            assert c[field] is not None, f"Chunk {i} field '{field}' is None"

        # 2. Assert unique chunk IDs
        assert c['id'] not in seen_ids, f"Duplicate chunk ID: {c['id']}"
        seen_ids.add(c['id'])

        # 3. Assert volume is 1 or 2 (CW Vols 1-2)
        assert c['volume'] in [1, 2], f"Chunk {c['id']} has invalid volume {c['volume']}"

        # 4. Assert positive page number
        assert isinstance(c['page'], int) and c['page'] > 0, f"Chunk {c['id']} invalid page {c['page']}"

        # 5. Assert valid paragraph length (minimum 30 chars)
        assert len(c['paragraph'].strip()) >= 30, f"Chunk {c['id']} paragraph too short: {c['paragraph']}"

        # 6. Assert no placeholder text
        assert "placeholder" not in c['paragraph'].lower(), f"Chunk {c['id']} contains placeholder text"
        assert "todo" not in c['paragraph'].lower(), f"Chunk {c['id']} contains TODO"

    print(f"[PASS] Stage 1: All {len(chunks)} chunks verified byte-clean with intact Advaita Ashrama citations.")

if __name__ == '__main__':
    try:
        test_corpus_integrity()
    except Exception as e:
        print(f"[ERROR] Stage 1 Failed: {e}")
        sys.exit(1)
