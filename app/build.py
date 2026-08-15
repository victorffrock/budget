"""
Gera o arquivo único somador-de-contas.html, embutindo o pdf.js, o worker
do pdf.js e o ícone do app — tudo inline, para que o resultado funcione
100% offline (basta abrir o .html, sem servidor e sem internet).

Uso:
    npm install                 # baixa o pdfjs-dist (só usado no build)
    python3 build.py

Gera: ./somador-de-contas.html
"""
import base64
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
PDFJS_DIR = HERE / "node_modules" / "pdfjs-dist" / "build"
TEMPLATE = HERE / "src" / "template.html"
CORE = HERE / "src" / "core.js"
ICON = HERE.parent / "desktop" / "assets" / "icon.png"
OUTPUT = HERE / "somador-de-contas.html"
PACKAGE = HERE / "package.json"


def safe_for_inline_script(js_text: str) -> str:
    """Break up any literal '</script' sequence so it can't prematurely
    terminate an HTML <script> element when embedded verbatim. Safe for
    any JS source: the sequence can only legally appear inside a string,
    regex or comment, where inserting a backslash is a no-op escape."""
    return re.sub(r"</(script)", r"<\\/\1", js_text, flags=re.IGNORECASE)


def main():
    pdf_lib = (PDFJS_DIR / "pdf.min.mjs").read_text(encoding="utf-8")
    pdf_worker = (PDFJS_DIR / "pdf.worker.min.mjs").read_text(encoding="utf-8")
    core = CORE.read_text(encoding="utf-8")

    pdf_lib_safe = safe_for_inline_script(pdf_lib)
    pdf_worker_safe = safe_for_inline_script(pdf_worker)
    core_safe = safe_for_inline_script(core)
    pdf_lib_json = json.dumps(pdf_lib_safe)
    pdf_worker_json = json.dumps(pdf_worker_safe)
    version = json.loads(PACKAGE.read_text(encoding="utf-8"))["version"]

    icon_b64 = base64.b64encode(ICON.read_bytes()).decode("ascii")
    icon_data_uri = "data:image/png;base64," + icon_b64

    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("__CORE_JS__", core_safe)
    html = html.replace("__PDFJS_LIB_JSON__", pdf_lib_json)
    html = html.replace("__PDFJS_WORKER_JSON__", pdf_worker_json)
    html = html.replace("__APP_ICON_DATA_URI__", icon_data_uri)
    html = html.replace("__APP_VERSION__", version)

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUTPUT} ({len(html):,} bytes)")

    # Também atualiza o index.html da raiz (versão web + PWA)
    root_index = HERE.parent / "index.html"
    pwa_head = """<link rel="icon" href="icon.png" type="image/png">
<link rel="apple-touch-icon" href="icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#f6f5f4">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Somador de Contas">
"""
    if 'rel="manifest"' not in html:
        html = html.replace("</title>", "</title>\n" + pwa_head, 1)
    root_index.write_text(html, encoding="utf-8")
    print(f"wrote {root_index} ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
