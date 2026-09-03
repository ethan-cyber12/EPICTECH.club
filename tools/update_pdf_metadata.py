from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "assets" / "projects"
KEYWORDS = "EPIC TECH LLC, public case study, Central Florida, small business IT"
TITLES = {
    "epic-cloud-security-automation-public-sample.pdf": "Cloud Security & Automation",
    "epic-cybersecurity-compliance-public-sample.pdf": "Cybersecurity & Compliance Assessment",
    "epic-disa-stig-hardening-public-sample.pdf": "DISA STIG-Aligned System Hardening",
    "epic-managed-it-patch-management-public-sample.pdf": "Managed IT & Patch Management",
    "epic-network-infrastructure-public-sample.pdf": "Business Network Infrastructure Design",
    "epic-secure-web-and-sdlc-public-sample.pdf": "Secure Website & Application Practices",
    "epic-vulnerability-remediation-public-sample.pdf": "Vulnerability Assessment & Remediation",
    "epic-zero-trust-access-control-public-sample.pdf": "Zero Trust Access Control",
}


def expected_metadata(title: str) -> dict[str, str]:
    return {
        "/Title": title,
        "/Author": "EPIC TECH LLC",
        "/Subject": f"EPIC TECH LLC public case study: {title}",
        "/Keywords": KEYWORDS,
        "/Creator": "EPIC TECH LLC",
    }


def update(path: str | Path, title: str) -> bool:
    """Update only document metadata; return False when no rewrite is needed."""
    path = Path(path)
    reader = PdfReader(path)
    desired = expected_metadata(title)
    current = reader.metadata or {}
    if all(current.get(key) == value for key, value in desired.items()):
        return False

    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.add_metadata(desired)

    temporary = path.with_name(f"{path.name}.metadata")
    try:
        with temporary.open("wb") as stream:
            writer.write(stream)
        temporary.replace(path)
    finally:
        if temporary.exists():
            temporary.unlink()
    return True


def main() -> None:
    for filename, title in TITLES.items():
        update(PDF_DIR / filename, title)


if __name__ == "__main__":
    main()
