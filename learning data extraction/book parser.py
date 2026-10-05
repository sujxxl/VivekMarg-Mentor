import fitz # PyMuPDF
import json
import re
from pathlib import Path

PDF_PATH = r"C:\Users\SUJAL\Desktop\VivekMarg Mentor\Complete_Works_of_Swami_Vivekananda_all_volumes.pdf"
OUTPUT_JSON = "assets/corpus.json"
OUTPUT_JS = "www/data/corpus.js"

# Configure book structure
START_PAGE_INDEX = 4     # 0-indexed: skip preface, contents, introduction
DEFAULT_VOLUME = 1

def is_running_folio(bbox, page_height, text):
    """Detect headers and footers based on their vertical page coordinates."""
    y0, y1 = bbox[1], bbox[3]
    clean = text.strip()
    
    # Top 8% of page is running header / book title
    if y1 < page_height * 0.08:
        return True
    
    # Bottom 8% of page is footer / page numbering
    if y0 > page_height * 0.92:
        return True
        
    # Standalone numbers (folios)
    if clean.isdigit() and len(clean) <= 4:
        return True
        
    return False

def extract_book_corpus(pdf_path: str):
    doc = fitz.open(pdf_path)
    chunks = []
    chunk_counter = 1
    
    current_title = "General Teachings"
    current_chapter = "I"

    for page_idx in range(START_PAGE_INDEX, len(doc)):
        page = doc[page_idx]
        page_height = page.rect.height
        
        # Printed page number proxy (or calibrate to actual book folio)
        printed_page = (page_idx - START_PAGE_INDEX) + 1
        
        # Extract structured text blocks (returns: x0, y0, x1, y1, text, block_no, block_type)
        blocks = page.get_text("blocks")
        
        for b in blocks:
            # block_type 0 is text (ignore embedded vector graphics/images)
            if b[6] != 0:
                continue
                
            raw_text = b[4]
            bbox = (b[0], b[1], b[2], b[3])
            
            # 1. Discard running headers/footers
            if is_running_folio(bbox, page_height, raw_text):
                continue
                
            # 2. Rejoin line-break hyphens ("con- \n centration" -> "concentration")
            clean_block = re.sub(r'(\w+)-\n\s*(\w+)', r'\1\2', raw_text)
            
            # 3. Flatten remaining line breaks into continuous paragraph prose
            clean_block = re.sub(r'\s+', ' ', clean_block).strip()
            
            if not clean_block:
                continue
            
            # Detect Chapter markers
            ch_match = re.match(r'^(CHAPTER|SECTION)\s+([IVXLCDM\d]+)', clean_block, re.I)
            if ch_match:
                current_chapter = ch_match.group(2)
                continue
                
            # Detect Lecture / Section Titles (short, all-caps or title case blocks)
            if len(clean_block.split()) < 9 and (clean_block.isupper() or clean_block.istitle()):
                # Exclude incidental labels
                if not re.search(r'^(note|footnote|index)', clean_block, re.I):
                    current_title = clean_block.title()
                    continue

            # 4. Discard footnotes and publishing metadata artifacts
            words = clean_block.split()
            if len(words) < 18:
                continue
                
            chunks.append({
                "id": f"cw-{chunk_counter:04d}",
                "volume": DEFAULT_VOLUME,
                "page": printed_page,
                "chapterRoman": current_chapter,
                "title": current_title,
                "paragraph": chunk_counter,
                "text": clean_block
            })
            chunk_counter += 1

    payload = {
        "meta": {
            "totalChunks": len(chunks),
            "source": Path(pdf_path).name,
            "volumesCovered": [DEFAULT_VOLUME],
            "textStatus": "VERBATIM_EXTRACTED"
        },
        "chunks": chunks
    }
    return payload

def main():
    print(f"Reading book PDF: {PDF_PATH}...")
    data = extract_book_corpus(PDF_PATH)
    
    # 1. Output assets/corpus.json
    Path(OUTPUT_JSON).parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    # 2. Output www/data/corpus.js for offline Android WebViews
    Path(OUTPUT_JS).parent.mkdir(parents=True, exist_ok=True)
    js_content = "/* Verbatim Verified Book Corpus */\nconst VM_CORPUS = " + \
                 json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ";\n"
    js_content = js_content.replace("</", "<\\/")
    
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"Done. Extracted {data['meta']['totalChunks']} paragraphs into {OUTPUT_JS}")

if __name__ == "__main__":
    main()