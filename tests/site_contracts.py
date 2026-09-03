from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {
    ".git",
    ".media-review",
    ".private-media",
    ".superpowers",
    ".venv",
    "_site",
    "docs",
    "node_modules",
    "tests",
}


def read_text(path: str | Path) -> str:
    path = Path(path)
    if not path.is_absolute():
        path = ROOT / path
    return path.read_text(encoding="utf-8")


def html_files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*.html")
        if not EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts)
    )


def normalize_block(value: str) -> str:
    value = re.sub(r"[ \t]+$", "", value, flags=re.MULTILINE)
    return value.strip() + "\n"


def main_inner(path: str | Path) -> str:
    html = read_text(path)
    match = re.search(r"<main(?:\s[^>]*)?>(.*?)</main>", html, re.IGNORECASE | re.DOTALL)
    if match is None:
        raise AssertionError(f"{path} has no main element")
    return normalize_block(match.group(1))


def canonical_href(path: str | Path) -> str:
    match = re.search(
        r'<link\s+[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']',
        read_text(path),
        re.IGNORECASE,
    )
    if match is None:
        raise AssertionError(f"{path}: missing canonical")
    return match.group(1)


def hrefs(path: str | Path) -> list[str]:
    return re.findall(
        r'<a\s+[^>]*href=["\']([^"\']+)["\']',
        read_text(path),
        re.IGNORECASE,
    )


def element_ids(path: str | Path) -> set[str]:
    return set(re.findall(r'\bid=["\']([^"\']+)["\']', read_text(path), re.IGNORECASE))


def local_target(source_path: str | Path, href: str) -> tuple[Path, str] | None:
    parsed = urlparse(href)
    if parsed.scheme or parsed.netloc or href.startswith(("mailto:", "tel:", "javascript:")):
        return None

    source_path = Path(source_path)
    if not source_path.is_absolute():
        source_path = ROOT / source_path

    raw_path = unquote(parsed.path)
    if not raw_path:
        target = source_path
    elif raw_path.startswith("/"):
        target = ROOT / raw_path.lstrip("/")
    else:
        target = source_path.parent / raw_path

    if raw_path.endswith("/"):
        target = target / "index.html"
    elif target == ROOT:
        target = ROOT / "index.html"
    return target.resolve(), parsed.fragment


def json_ld_graph(path: str | Path) -> list[dict]:
    blocks = re.findall(
        r'<script\s+[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        read_text(path),
        re.DOTALL | re.IGNORECASE,
    )
    nodes: list[dict] = []
    for block in blocks:
        payload = json.loads(block)
        if isinstance(payload, dict) and isinstance(payload.get("@graph"), list):
            nodes.extend(payload["@graph"])
        elif isinstance(payload, list):
            nodes.extend(payload)
        else:
            nodes.append(payload)
    return nodes


def node_by_id(path: str | Path, node_id: str) -> dict:
    for node in json_ld_graph(path):
        if node.get("@id") == node_id:
            return node
    raise AssertionError(f"{path}: missing JSON-LD node {node_id}")


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
