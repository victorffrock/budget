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
TESSERACT_DIR = HERE / "node_modules" / "tesseract.js" / "dist"
TESSERACT_CORE = HERE / "node_modules" / "tesseract.js-core" / "tesseract-core-lstm.wasm.js"
TESSERACT_PORTUGUESE_DATA = (
    HERE / "node_modules" / "@tesseract.js-data" / "por" / "4.0.0_best_int" / "por.traineddata.gz"
)
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


def make_ocr_worker_source(worker_js: str, tesseract_core: str, portuguese_data_b64: str) -> str:
    """Serve o modelo de português dentro do Web Worker, sem rede.

    O Tesseract procura o arquivo de idioma usando fetch(). O pequeno adaptador
    abaixo atende apenas essa URL com os bytes já incorporados e encaminha todas
    as demais chamadas normalmente. Dessa forma, o pacote gerado continua
    totalmente offline e o modelo não precisa ser baixado no primeiro uso.
    """
    prelude = f"""/* Modelo OCR local incorporado pelo Somador de Contas. */
const SOMADOR_OCR_LANG_URL = 'https://somador.local/tessdata/por.traineddata.gz';
const SOMADOR_OCR_LANG_B64 = '{portuguese_data_b64}';
let somadorOcrLanguageBytes;
const somadorOriginalFetch = self.fetch.bind(self);
self.fetch = function (input, init) {{
  const url = typeof input === 'string' ? input : input && input.url;
  if (url === SOMADOR_OCR_LANG_URL) {{
    if (!somadorOcrLanguageBytes) {{
      const binary = atob(SOMADOR_OCR_LANG_B64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      somadorOcrLanguageBytes = bytes;
    }}
    return Promise.resolve(new Response(somadorOcrLanguageBytes, {{
      status: 200,
      headers: {{ 'Content-Type': 'application/gzip' }}
    }}));
  }}
  return somadorOriginalFetch(input, init);
}};
"""
    # O núcleo precisa estar no mesmo Worker. Uma URL blob não termina em
    # ".js" e faria o carregador do Tesseract tratá-la como uma pasta remota.
    # Ao defini-lo antes do worker, o carregador detecta TesseractCore e não
    # busca nenhum recurso fora do aplicativo.
    return prelude + tesseract_core + "\n" + worker_js


def main():
    pdf_lib = (PDFJS_DIR / "pdf.min.mjs").read_text(encoding="utf-8")
    pdf_worker = (PDFJS_DIR / "pdf.worker.min.mjs").read_text(encoding="utf-8")
    tesseract_lib = (TESSERACT_DIR / "tesseract.min.js").read_text(encoding="utf-8")
    tesseract_worker = (TESSERACT_DIR / "worker.min.js").read_text(encoding="utf-8")
    tesseract_core = TESSERACT_CORE.read_text(encoding="utf-8")
    portuguese_data_b64 = base64.b64encode(TESSERACT_PORTUGUESE_DATA.read_bytes()).decode("ascii")
    core = CORE.read_text(encoding="utf-8")

    pdf_lib_safe = safe_for_inline_script(pdf_lib)
    pdf_worker_safe = safe_for_inline_script(pdf_worker)
    tesseract_lib_safe = safe_for_inline_script(tesseract_lib)
    tesseract_worker_json = json.dumps(
        safe_for_inline_script(make_ocr_worker_source(tesseract_worker, tesseract_core, portuguese_data_b64))
    )
    core_safe = safe_for_inline_script(core)
    pdf_lib_json = json.dumps(pdf_lib_safe)
    pdf_worker_json = json.dumps(pdf_worker_safe)
    version = json.loads(PACKAGE.read_text(encoding="utf-8"))["version"]

    icon_b64 = base64.b64encode(ICON.read_bytes()).decode("ascii")
    icon_data_uri = "data:image/png;base64," + icon_b64

    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("__CORE_JS__", core_safe)
    html = html.replace("__TESSERACT_JS__", tesseract_lib_safe)
    html = html.replace("__PDFJS_LIB_JSON__", pdf_lib_json)
    html = html.replace("__PDFJS_WORKER_JSON__", pdf_worker_json)
    html = html.replace("__TESSERACT_WORKER_JSON__", tesseract_worker_json)
    html = html.replace("__APP_ICON_DATA_URI__", icon_data_uri)
    html = html.replace("__APP_VERSION__", version)

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUTPUT} ({len(html):,} bytes)")

    # Também atualiza o index.html da raiz (versão web + PWA)
    root_index = HERE.parent / "index.html"
    desktop_index = HERE.parent / "desktop" / "index.html"

    # Mantém a janela Electron pronta para desenvolvimento sem depender de
    # uma compilação de AppImage, que também copia este mesmo arquivo.
    desktop_index.write_text(html, encoding="utf-8")
    print(f"wrote {desktop_index} ({len(html):,} bytes)")

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
