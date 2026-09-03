from __future__ import annotations

import hashlib
import html
import importlib.util
import ipaddress
import json
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from pypdf.generic import IndirectObject

from tests.site_contracts import (
    ROOT,
    canonical_href,
    element_ids,
    html_files,
    hrefs,
    json_ld_graph,
    local_target,
    main_inner,
    node_by_id,
    read_text,
)


WEBSITE = "https://epictech.club/#website"
BUSINESS = "https://epictech.club/#business"
KEYWORDS = "EPIC TECH LLC, public case study, Central Florida, small business IT"
PUBLIC_EMAILS = {"info@epictech.club"}
PDF_BASELINE = ROOT / "tests/fixtures/case_study_pdf_baseline.json"
BOX_NAMES = ("mediabox", "cropbox", "bleedbox", "trimbox", "artbox")
CONFIDENCE_NOTE = (
    "This document is designed to give website visitors confidence in EPIC TECH LLC "
    "capability without publishing full implementation playbooks or reusable client "
    "deliverables."
)

CASES = {
    "cloud-security-automation": {
        "title": "Cloud Security & Automation",
        "pdf": "epic-cloud-security-automation-public-sample.pdf",
        "service": "/services/automation.html",
        "visual": "epic-service-automation",
        "sections": {
            "Overview": [
                "EPIC TECH LLC demonstrates the ability to plan, provision, and harden cloud-hosted infrastructure using automation-first practices. This public sample summarizes a cloud deployment and security hardening project without exposing runnable code, secrets, or exact implementation procedures."
            ],
            "Business challenge": [
                "Small businesses need cloud systems that are deployed consistently, secured from the start, and maintainable over time. Manual builds increase the chance of configuration drift, missed updates, and weak security defaults."
            ],
            "Example solution": [
                "A repeatable automation workflow was developed to provision Linux-based cloud resources, prepare secure access, apply baseline server configuration, and establish a security-focused foundation for hosted services."
            ],
            "Technologies and methods demonstrated": [
                "Ansible",
                "Linux",
                "DigitalOcean",
                "SSH",
                "Infrastructure as Code",
                "LAMP Stack",
                "Security Baselines",
            ],
            "Business outcomes": [
                "Improved deployment consistency across cloud systems.",
                "Reduced manual setup steps and repeatable build errors.",
                "Established a stronger baseline before services are exposed publicly.",
            ],
            "What this shows a client": [
                "Shows cloud automation capability.",
                "Shows comfort with Linux server administration.",
                "Shows ability to translate security requirements into deployable infrastructure.",
            ],
            "Details intentionally not published": [
                "Full playbooks and scripts.",
                "Exact command sequence.",
                "API tokens, IP addresses, and hostnames.",
                "Configuration values that could be copied into another environment.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "cybersecurity-compliance": {
        "title": "Cybersecurity & Compliance Assessment",
        "pdf": "epic-cybersecurity-compliance-public-sample.pdf",
        "service": "/services/firewalls.html",
        "visual": "epic-service-firewalls-security",
        "sections": {
            "Overview": [
                "This case study shows the ability to assess business security gaps, organize findings, and recommend remediation steps in a format business leaders can understand."
            ],
            "Business challenge": [
                "Businesses that handle sensitive data need documented security controls, access policies, firewall rules, monitoring, and compliance awareness. Gaps can lead to downtime, data exposure, fines, and loss of customer trust."
            ],
            "Example solution": [
                "A security assessment approach was used to review access control, firewall configuration, authentication practices, monitoring, and data protection requirements. Findings were converted into practical remediation themes."
            ],
            "Technologies and methods demonstrated": [
                "PCI DSS Concepts",
                "Risk Assessment",
                "Firewall Review",
                "MFA",
                "Policy Development",
                "Access Control",
                "Security Documentation",
            ],
            "Business outcomes": [
                "Identified compliance and operational risk areas.",
                "Converted technical findings into business-impact language.",
                "Created a remediation path focused on access, segmentation, documentation, and monitoring.",
            ],
            "What this shows a client": [
                "Shows compliance awareness.",
                "Shows ability to communicate risk clearly.",
                "Shows business-focused cybersecurity thinking.",
            ],
            "Details intentionally not published": [
                "Full audit worksheets.",
                "Client-sensitive findings.",
                "Exact infrastructure weaknesses.",
                "Internal questionnaires and scoring details.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "disa-stig-hardening": {
        "title": "DISA STIG-Aligned System Hardening",
        "pdf": "epic-disa-stig-hardening-public-sample.pdf",
        "service": "/services/firewalls.html",
        "visual": "epic-service-firewalls-security",
        "sections": {
            "Overview": [
                "This case study summarizes a Linux system hardening project using DISA STIG-aligned concepts. The public version highlights the security categories and business value while removing exact implementation details that should stay private."
            ],
            "Business challenge": [
                "Unhardened cloud servers can expose unnecessary services, weak authentication settings, insecure remote access, and logging gaps. Businesses need stronger configurations before systems are placed into production."
            ],
            "Example solution": [
                "Security controls were organized into high, medium, and low priority categories. The work emphasized SSH hardening, removal of unnecessary services, password policy strengthening, session timeout settings, audit readiness, and secure baseline documentation."
            ],
            "Technologies and methods demonstrated": [
                "DISA STIG Concepts",
                "Linux Hardening",
                "Ansible",
                "SSH Security",
                "Audit Logging",
                "Password Policy",
                "Service Reduction",
            ],
            "Business outcomes": [
                "Improved defensive posture for Linux cloud systems.",
                "Reduced attack surface by focusing on unnecessary services and remote access controls.",
                "Created a repeatable security baseline approach suitable for future deployments.",
            ],
            "What this shows a client": [
                "Shows familiarity with security control frameworks.",
                "Shows practical system hardening knowledge.",
                "Shows troubleshooting ability across automation and Linux environments.",
            ],
            "Details intentionally not published": [
                "Exact STIG playbook logic.",
                "Screenshots containing tokens, addresses, or internal names.",
                "Step-by-step hardening procedure.",
                "Full list of implementation commands.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "managed-it-patch-management": {
        "title": "Managed IT & Patch Management",
        "pdf": "epic-managed-it-patch-management-public-sample.pdf",
        "service": "/services/infrastructure.html",
        "visual": "epic-service-network-wifi",
        "sections": {
            "Overview": [
                "This public sample shows how EPIC TECH LLC frames patch management as an ongoing operational security process rather than a one-time update task."
            ],
            "Business challenge": [
                "Unpatched endpoints, servers, VPN-connected laptops, web platforms, and network devices can expose businesses to avoidable attacks and downtime."
            ],
            "Example solution": [
                "A patch management model was created with severity-based timelines, owner responsibilities, testing expectations, documentation, exception handling, and verification requirements."
            ],
            "Technologies and methods demonstrated": [
                "Patch Management",
                "Windows/Linux Systems",
                "WordPress Updates",
                "Network Devices",
                "AWS Systems",
                "Change Control",
                "Compliance Evidence",
            ],
            "Business outcomes": [
                "Improved update accountability.",
                "Prioritized critical and high-risk fixes.",
                "Created audit-friendly records for maintenance and compliance.",
            ],
            "What this shows a client": [
                "Shows managed IT operations capability.",
                "Shows practical security maintenance knowledge.",
                "Shows ability to create repeatable service processes.",
            ],
            "Details intentionally not published": [
                "Full internal update schedules.",
                "Specific client systems.",
                "Administrative procedures.",
                "Exception records and internal approvals.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "network-infrastructure": {
        "title": "Business Network Infrastructure Design",
        "pdf": "epic-network-infrastructure-public-sample.pdf",
        "service": "/services/infrastructure.html",
        "visual": "epic-service-network-wifi",
        "sections": {
            "Overview": [
                "This public sample demonstrates EPIC TECH LLC capability in designing a small-business network architecture. It focuses on planning, documentation, and infrastructure choices without publishing exact client-style diagrams or internal addressing details."
            ],
            "Business challenge": [
                "A growing business needs reliable connectivity, organized endpoint access, secure file/service access, wireless coverage, and room to scale without creating unmanaged network sprawl."
            ],
            "Example solution": [
                "A network design was prepared covering workstations, server infrastructure, VoIP phones, wireless access, printer/shared devices, user access planning, and deployment documentation."
            ],
            "Technologies and methods demonstrated": [
                "Network Design",
                "Windows Server",
                "VoIP",
                "Wireless Access",
                "RAID Storage",
                "IP Planning",
                "User Provisioning",
            ],
            "Business outcomes": [
                "Created a clear infrastructure plan for business operations.",
                "Supported future growth through organized addressing and device planning.",
                "Improved manageability by documenting systems and access needs.",
            ],
            "What this shows a client": [
                "Shows ability to design business networks.",
                "Shows documentation and project planning capability.",
                "Shows understanding of endpoints, servers, voice, wireless, and storage.",
            ],
            "Details intentionally not published": [
                "Full IP addressing tables.",
                "Exact topology diagrams.",
                "Client names or employee names.",
                "Detailed device configuration steps.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "secure-web-and-sdlc": {
        "title": "Secure Website & Application Practices",
        "pdf": "epic-secure-web-and-sdlc-public-sample.pdf",
        "service": "/services/webhosting.html",
        "visual": "epic-service-websites",
        "sections": {
            "Overview": [
                "This case study demonstrates how EPIC TECH LLC approaches website and application work with security built into planning, deployment, maintenance, and change control."
            ],
            "Business challenge": [
                "Websites and business applications can become risky when plugins, themes, access permissions, backups, logging, and code changes are not managed consistently."
            ],
            "Example solution": [
                "A secure development and maintenance model was documented covering planning, design review, development, testing, deployment approval, logging, vendor review, and rollback planning."
            ],
            "Technologies and methods demonstrated": [
                "Secure SDLC",
                "Website Security",
                "Change Control",
                "Logging",
                "Backups",
                "Vendor Review",
                "Rollback Planning",
            ],
            "Business outcomes": [
                "Reduced risk from unmanaged website changes.",
                "Improved reliability through approval and rollback planning.",
                "Created a security-first approach to web maintenance.",
            ],
            "What this shows a client": [
                "Shows website work can be paired with security.",
                "Shows governance and technical planning.",
                "Shows ability to support business sites beyond basic design.",
            ],
            "Details intentionally not published": [
                "Full SDLC policy document.",
                "Detailed deployment workflow.",
                "Client plugin and system inventory.",
                "Internal change approval templates.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "vulnerability-remediation": {
        "title": "Vulnerability Assessment & Remediation",
        "pdf": "epic-vulnerability-remediation-public-sample.pdf",
        "service": "/services/firewalls.html",
        "visual": "epic-service-firewalls-security",
        "sections": {
            "Overview": [
                "This public sample summarizes vulnerability management work including scan review, prioritization, patching, and validation. It is designed to show capability without releasing raw vulnerability reports."
            ],
            "Business challenge": [
                "Organizations often have outdated packages, exposed services, and untracked remediation work. Without a process, high and critical vulnerabilities can remain open longer than necessary."
            ],
            "Example solution": [
                "A remediation workflow was followed: identify critical and high-risk items, apply updates, validate fixes through follow-up scanning, and document closure evidence."
            ],
            "Technologies and methods demonstrated": [
                "Vulnerability Scanning",
                "Nessus Concepts",
                "Linux Updates",
                "Patch Management",
                "Remediation Tracking",
                "Validation Scans",
            ],
            "Business outcomes": [
                "Reduced critical/high vulnerability exposure.",
                "Documented the remediation process.",
                "Created evidence that fixes were validated after patching.",
            ],
            "What this shows a client": [
                "Shows security operations workflow knowledge.",
                "Shows patching and validation discipline.",
                "Shows ability to communicate vulnerability risk.",
            ],
            "Details intentionally not published": [
                "Raw scan exports.",
                "Plugin lists tied to exact hosts.",
                "Hostnames, IP addresses, and system fingerprints.",
                "Step-by-step exploit or remediation details.",
                CONFIDENCE_NOTE,
            ],
        },
    },
    "zero-trust-access-control": {
        "title": "Zero Trust Access Control",
        "pdf": "epic-zero-trust-access-control-public-sample.pdf",
        "service": "/services/firewalls.html",
        "visual": "epic-service-firewalls-security",
        "sections": {
            "Overview": [
                "This case study demonstrates how EPIC TECH LLC approaches access control using least privilege, role-based access, MFA, logging, and access revocation principles."
            ],
            "Business challenge": [
                "Businesses can expose sensitive systems when employees, contractors, or vendors have broad or outdated permissions. Access should be approved, limited, monitored, and removed when no longer needed."
            ],
            "Example solution": [
                "A structured access enforcement model was documented using authorization workflows, role-based access concepts, MFA, audit logging, and immediate revocation expectations."
            ],
            "Technologies and methods demonstrated": [
                "Zero Trust",
                "RBAC",
                "MFA",
                "IAM Concepts",
                "Access Reviews",
                "Audit Logging",
                "Vendor Access Control",
            ],
            "Business outcomes": [
                "Reduced unnecessary access.",
                "Improved accountability for sensitive systems.",
                "Created a repeatable access governance model for business environments.",
            ],
            "What this shows a client": [
                "Shows identity and access control understanding.",
                "Shows policy-to-technical-control thinking.",
                "Shows focus on least privilege and auditability.",
            ],
            "Details intentionally not published": [
                "Full internal policy templates.",
                "Exact access groups and role maps.",
                "Client-specific workflow approvals.",
                "Internal audit log structure.",
                CONFIDENCE_NOTE,
            ],
        },
    },
}

SECTIONS = (
    "Overview",
    "Business challenge",
    "Example solution",
    "Technologies and methods demonstrated",
    "Business outcomes",
    "What this shows a client",
    "Details intentionally not published",
)


def visible_text(markup: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", markup)).split())


def section_markup(source: str, heading: str) -> str:
    match = re.search(
        rf"<section[^>]*>\s*<h2>{re.escape(heading)}</h2>(.*?)</section>",
        source,
        re.IGNORECASE | re.DOTALL,
    )
    if match is None:
        raise AssertionError(f"missing section: {heading}")
    return match.group(1)


def normalized_pdf_text(path: Path) -> str:
    text = "\n".join((page.extract_text() or "") for page in PdfReader(path).pages)
    return " ".join(text.split())


def annotation_snapshot(page) -> list[str]:
    annotations = page.get("/Annots") or []
    return [
        hashlib.sha256(repr(annotation.get_object()).encode()).hexdigest()
        for annotation in annotations
    ]


def acroform_snapshot(reader: PdfReader) -> dict | None:
    reference = reader.trailer["/Root"].get("/AcroForm")
    if reference is None:
        return None
    form = reference.get_object()
    return {
        "fields": sorted((reader.get_fields() or {}).keys()),
        "need_appearances": bool(form.get("/NeedAppearances", False)),
        "sig_flags": int(form.get("/SigFlags", 0)),
    }


def ppm_pixel_snapshot(path: Path) -> dict[str, object]:
    with path.open("rb") as stream:
        def token() -> bytes:
            while True:
                char = stream.read(1)
                if not char:
                    raise AssertionError(f"unexpected end of PPM header: {path}")
                if char == b"#":
                    stream.readline()
                elif not char.isspace():
                    break
            value = bytearray(char)
            while True:
                char = stream.read(1)
                if not char or char.isspace():
                    return bytes(value)
                value.extend(char)

        if token() != b"P6":
            raise AssertionError(f"expected binary RGB PPM: {path}")
        width = int(token())
        height = int(token())
        maximum = int(token())
        pixels = stream.read()
    if maximum != 255 or len(pixels) != width * height * 3:
        raise AssertionError(f"unexpected PPM pixel payload: {path}")
    return {
        "size": [width, height],
        "rgb_sha256": hashlib.sha256(pixels).hexdigest(),
    }


def rendered_page_snapshots(path: Path, dpi: int = 96) -> list[dict[str, object]]:
    renderer = shutil.which("pdftoppm")
    if renderer is None:
        raise AssertionError("pdftoppm is required for PDF preservation tests")
    with tempfile.TemporaryDirectory() as directory:
        temporary = Path(directory)
        cache = temporary / "font-cache"
        cache.mkdir()
        font_directories = [
            candidate
            for candidate in (
                Path("/System/Library/Fonts"),
                Path("/Library/Fonts"),
                Path("/usr/share/fonts"),
                Path("/usr/local/share/fonts"),
            )
            if candidate.exists()
        ]
        font_config = temporary / "fonts.conf"
        font_config.write_text(
            "<fontconfig>"
            + "".join(f"<dir>{html.escape(str(item))}</dir>" for item in font_directories)
            + f"<cachedir>{html.escape(str(cache))}</cachedir>"
            + "</fontconfig>",
            encoding="utf-8",
        )
        prefix = temporary / path.stem
        environment = os.environ.copy()
        environment["FONTCONFIG_FILE"] = str(font_config)
        subprocess.run(
            [renderer, "-r", str(dpi), str(path), str(prefix)],
            check=True,
            capture_output=True,
            env=environment,
        )
        pages = sorted(
            temporary.glob(f"{path.stem}-*.ppm"),
            key=lambda item: int(item.stem.rsplit("-", 1)[1]),
        )
        return [ppm_pixel_snapshot(page) for page in pages]


def pdf_object_snapshot(value, ancestry: frozenset[tuple[int, int]] = frozenset()):
    if isinstance(value, IndirectObject):
        reference = (value.idnum, value.generation)
        if reference in ancestry:
            return {"cycle": True}
        return pdf_object_snapshot(value.get_object(), ancestry | {reference})
    if isinstance(value, dict):
        snapshot = {
            str(key): pdf_object_snapshot(nested, ancestry)
            for key, nested in sorted(value.items(), key=lambda item: str(item[0]))
        }
        if hasattr(value, "get_data"):
            snapshot["$stream_sha256"] = hashlib.sha256(value.get_data()).hexdigest()
        return snapshot
    if isinstance(value, (list, tuple)):
        return [pdf_object_snapshot(item, ancestry) for item in value]
    if isinstance(value, bytes):
        return {"$bytes_sha256": hashlib.sha256(value).hexdigest()}
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def resource_hash(page) -> str:
    snapshot = pdf_object_snapshot(page.get("/Resources") or {})
    payload = json.dumps(snapshot, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def sensitive_findings(source: str) -> list[str]:
    findings = []
    emails = re.findall(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", source)
    findings.extend(
        f"private-email:{address}"
        for address in emails
        if address.lower() not in PUBLIC_EMAILS
    )

    patterns = {
        "ipv4": r"(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)",
        "phone": r"(?<!\d)(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]\d{3}[ .-]\d{4}(?!\d)|(?<!\d)(?:\+?1)?\d{10}(?!\d)",
        "cloud-access-key": r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b",
        "github-token": r"\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{20,255})\b",
        "google-api-key": r"\bAIza[0-9A-Za-z_-]{35}\b",
        "stripe-secret": r"\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b",
        "slack-token": r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b",
        "jwt": r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b",
        "private-key": r"BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY",
        "assigned-secret": r"\b(?:api[_-]?key|access[_-]?token|password|secret|private[_-]?key)\s*[=:]\s*[\"']?[^\s\"'<>]{4,}",
        "bearer-token": r"\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~-]{8,}",
        "private-identifier": r"\b(?:client|school|student|employee)[ _-]*(?:id|identifier|name)\s*(?:[:=#]|\bis\b)\s*[\"']?[A-Za-z0-9][A-Za-z0-9 _.-]{2,}",
        "sensitive-record": r"\b(?:SSN|social security|date of birth|DOB|driver'?s license|military unit|duty station|security clearance|GPA|cohort)\s*(?:[:=#]|\bis\b)\s*[\"']?[A-Za-z0-9][A-Za-z0-9 /_.-]{1,}",
        "street-address": r"\b\d{1,6}\s+(?:[A-Z][A-Za-z.'-]*\s+){1,5}(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b",
    }
    for label, pattern in patterns.items():
        findings.extend(
            f"{label}:{match.group(0)}"
            for match in re.finditer(pattern, source, re.IGNORECASE)
        )

    ipv6_candidates = re.findall(
        r"(?<![0-9A-Fa-f:.])[0-9A-Fa-f:.]{2,}(?![0-9A-Fa-f:.])",
        source,
    )
    for candidate in ipv6_candidates:
        if candidate.count(":") < 2:
            continue
        try:
            ipaddress.IPv6Address(candidate)
        except ValueError:
            continue
        findings.append(f"ipv6:{candidate}")
    return findings


def content_snapshot(path: Path) -> dict:
    reader = PdfReader(path)
    pages = []
    for page in reader.pages:
        contents = page.get_contents()
        pages.append(
            {
                "boxes": {
                    name: [float(value) for value in getattr(page, name)]
                    for name in BOX_NAMES
                },
                "rotation": int(page.get("/Rotate", 0)),
                "annotations": annotation_snapshot(page),
                "content_stream_sha256": hashlib.sha256(
                    contents.get_data() if contents is not None else b""
                ).hexdigest(),
                "resource_sha256": resource_hash(page),
            }
        )
    return {
        "page_count": len(reader.pages),
        "normalized_text_sha256": hashlib.sha256(
            normalized_pdf_text(path).encode()
        ).hexdigest(),
        "pages": pages,
        "attachments": sorted(reader.attachments),
        "acroform": acroform_snapshot(reader),
    }


class CaseStudyTests(unittest.TestCase):
    def test_all_nine_case_study_pages_are_discoverable(self) -> None:
        discovered = {path.relative_to(ROOT).as_posix() for path in html_files()}
        expected = {"case-studies/index.html"} | {
            f"case-studies/{slug}.html" for slug in CASES
        }
        self.assertTrue(expected.issubset(discovered), sorted(expected - discovered))

    def test_case_study_index_links_every_companion_and_has_stable_graph(self) -> None:
        path = ROOT / "case-studies/index.html"
        self.assertTrue(path.exists(), "case-study index must exist")
        source = read_text(path)
        self.assertEqual(canonical_href(path), "https://epictech.club/case-studies/")
        self.assertEqual(
            {href for href in hrefs(path) if href.startswith("/case-studies/")},
            {f"/case-studies/{slug}.html" for slug in CASES},
        )
        page = node_by_id(path, "https://epictech.club/case-studies/#webpage")
        self.assertEqual(page["@type"], "WebPage")
        self.assertEqual(page["isPartOf"], {"@id": WEBSITE})
        self.assertEqual(page["about"], {"@id": BUSINESS})
        breadcrumb = node_by_id(path, "https://epictech.club/case-studies/#breadcrumb")
        self.assertEqual(breadcrumb["@type"], "BreadcrumbList")
        self.assertEqual(len(breadcrumb["itemListElement"]), 2)

    def test_companions_have_exact_accessible_shell_content_links_and_graph(self) -> None:
        for slug, case in CASES.items():
            path = ROOT / "case-studies" / f"{slug}.html"
            canonical = f"https://epictech.club/case-studies/{slug}.html"
            with self.subTest(slug=slug):
                self.assertTrue(path.exists(), f"missing companion: {slug}")
                source = read_text(path)
                main = main_inner(path)
                self.assertEqual(canonical_href(path), canonical)
                self.assertEqual(len(re.findall(r"<h1\b", main, re.IGNORECASE)), 1)
                self.assertIn(f"<h1>{case['title'].replace('&', '&amp;')}</h1>", main)
                self.assertIn('<nav class="breadcrumb" aria-label="Breadcrumb">', main)
                self.assertIn('aria-current="page"', main)
                self.assertEqual(
                    re.findall(r"<h2>(.*?)</h2>", main, re.IGNORECASE | re.DOTALL),
                    list(SECTIONS),
                )
                self.assertIn(f'href="/assets/projects/{case["pdf"]}"', main)
                self.assertIn(f'href="{case["service"]}"', main)
                self.assertIn(f"{case['visual']}-640.avif 640w", source)
                self.assertIn(f"{case['visual']}-1200.webp 1200w", source)
                image = re.search(
                    rf'<img[^>]+{case["visual"]}-1200\.webp[^>]*>',
                    source,
                )
                self.assertIsNotNone(image)
                self.assertIn('alt=""', image.group(0))
                self.assertIn('width="1200"', image.group(0))
                self.assertIn('height="750"', image.group(0))

                page = node_by_id(path, canonical + "#webpage")
                self.assertEqual(page["@type"], "WebPage")
                self.assertEqual(page["url"], canonical)
                self.assertEqual(page["name"], case["title"])
                self.assertEqual(page["isPartOf"], {"@id": WEBSITE})
                self.assertEqual(page["about"], {"@id": BUSINESS})
                self.assertEqual(page["breadcrumb"], {"@id": canonical + "#breadcrumb"})
                breadcrumb = node_by_id(path, canonical + "#breadcrumb")
                self.assertEqual(
                    [item["item"] for item in breadcrumb["itemListElement"]],
                    ["https://epictech.club/", "https://epictech.club/case-studies/", canonical],
                )

    def test_all_seven_public_pdf_sections_are_transcribed_exactly(self) -> None:
        for slug, case in CASES.items():
            path = ROOT / "case-studies" / f"{slug}.html"
            self.assertTrue(path.exists(), f"missing companion: {slug}")
            main = main_inner(path)
            self.assertEqual(list(case["sections"]), list(SECTIONS))
            for heading in SECTIONS:
                with self.subTest(slug=slug, heading=heading):
                    self.assertEqual(
                        visible_text(section_markup(main, heading)),
                        " ".join(case["sections"][heading]),
                    )

    def test_exact_section_contract_rejects_mutation_reordering_and_extra_text(self) -> None:
        case = CASES["cloud-security-automation"]
        main = main_inner(ROOT / "case-studies/cloud-security-automation.html")
        mutations = {
            "mutation": (
                "Overview",
                main.replace("plan, provision, and harden", "plan, provision, and expose", 1),
            ),
            "reordering": (
                "Technologies and methods demonstrated",
                main.replace(
                    "<li>Ansible</li><li>Linux</li>",
                    "<li>Linux</li><li>Ansible</li>",
                    1,
                ),
            ),
            "extra-text": (
                "Overview",
                main.replace(
                    "</p></section>",
                    "</p><p>Unapproved extra claim.</p></section>",
                    1,
                ),
            ),
        }
        for mutation, (heading, mutated) in mutations.items():
            with self.subTest(mutation=mutation):
                self.assertNotEqual(
                    visible_text(section_markup(mutated, heading)),
                    " ".join(case["sections"][heading]),
                )

    def test_companions_resolve_local_destinations_and_contain_no_private_or_runnable_values(self) -> None:
        for slug in CASES:
            path = ROOT / "case-studies" / f"{slug}.html"
            self.assertTrue(path.exists(), f"missing companion: {slug}")
            main = main_inner(path)
            source = read_text(path)
            text = visible_text(source)
            with self.subTest(slug=slug):
                for href in hrefs(path):
                    target = local_target(path, href)
                    if target is not None:
                        destination, fragment = target
                        self.assertTrue(destination.exists(), href)
                        if fragment:
                            self.assertIn(fragment, element_ids(destination), href)
                self.assertEqual(sensitive_findings(source), [])
                self.assertNotRegex(main, r"<(?:pre|code)\b")
                self.assertIsNone(
                    re.search(
                        r"(?:^|\s)(?:sudo|curl|wget|chmod|chown)\s+(?:--?|/|\./|https?://)|\bssh\s+\S+@",
                        text,
                        re.I,
                    )
                )

    def test_leakage_gate_detects_representative_private_values(self) -> None:
        self.assertEqual(
            sensitive_findings(
                "Public examples omit client or school identifiers. "
                "Contact info@epictech.club or visit https://epictech.club/case-studies/."
            ),
            [],
        )
        samples = (
            ("private-email", "owner.private@example.net"),
            ("ipv4", "198.51.100.24"),
            ("ipv6", "2001:db8:1234::42"),
            ("phone", "(407) 555-0123"),
            ("phone", "+1 407.555.0123"),
            ("phone", "4075550123"),
            ("cloud-access-key", "AKIA" + "ABCDEFGHIJKLMNOP"),
            ("github-token", "ghp_" + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJ"),
            ("google-api-key", "AIza" + "abcdefghijklmnopqrstuvwxyz123456789"),
            ("stripe-secret", "sk_" + "live_1234567890abcdef123456"),
            ("slack-token", "xoxb-" + "1234567890-abcdefghij"),
            ("jwt", "eyJhbGciOiJIUzI1NiJ9." + "eyJzdWIiOiIxMjM0In0.signature123"),
            ("private-key", "-----BEGIN OPENSSH PRIVATE KEY-----"),
            ("assigned-secret", "api_key = secretvalue123"),
            ("bearer-token", "Authorization: Bearer abcdefghijklmnop"),
            ("private-identifier", "school identifier = HCC-10482"),
            ("private-identifier", "client_id: ACME-42"),
            ("sensitive-record", "military unit: Example Unit 42"),
            ("street-address", "123 Example Street"),
        )
        for label, sample in samples:
            with self.subTest(label=label):
                self.assertTrue(
                    any(item.startswith(f"{label}:") for item in sensitive_findings(sample)),
                    sensitive_findings(sample),
                )

    def test_full_document_leakage_gate_covers_head_and_json_ld(self) -> None:
        source = read_text("case-studies/cloud-security-automation.html")
        mutations = {
            "head": source.replace(
                "</head>",
                '<meta name="private-contact" content="+1 407-555-0123"></head>',
                1,
            ),
            "json-ld": source.replace(
                '"@graph":[',
                '"privateToken":"ghp_' + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ","@graph":[',
                1,
            ),
        }
        for location, mutated in mutations.items():
            with self.subTest(location=location):
                self.assertTrue(sensitive_findings(mutated))

    def test_pdf_metadata_and_original_content_contract(self) -> None:
        fixture = json.loads(PDF_BASELINE.read_text(encoding="utf-8"))
        baselines = fixture["pdfs"]
        self.assertEqual(set(baselines), {case["pdf"] for case in CASES.values()})
        for case in CASES.values():
            path = ROOT / "assets/projects" / case["pdf"]
            with self.subTest(pdf=case["pdf"]):
                reader = PdfReader(path)
                metadata = reader.metadata
                self.assertEqual(metadata.title, case["title"])
                self.assertEqual(metadata.author, "EPIC TECH LLC")
                self.assertEqual(metadata.subject, f"EPIC TECH LLC public case study: {case['title']}")
                self.assertEqual(metadata.get("/Keywords"), KEYWORDS)
                self.assertEqual(metadata.creator, "EPIC TECH LLC")
                snapshot = content_snapshot(path)
                baseline = baselines[case["pdf"]]
                self.assertEqual(snapshot["page_count"], baseline["page_count"])
                self.assertEqual(
                    snapshot["normalized_text_sha256"],
                    baseline["normalized_text_sha256"],
                )
                self.assertEqual(
                    [page["content_stream_sha256"] for page in snapshot["pages"]],
                    baseline["content_stream_sha256"],
                )
                self.assertIn("resource_sha256", baseline)
                self.assertEqual(
                    [page["resource_sha256"] for page in snapshot["pages"]],
                    baseline["resource_sha256"],
                )
                self.assertEqual(
                    [page["boxes"] for page in snapshot["pages"]],
                    [fixture["page_boxes"]] * baseline["page_count"],
                )
                self.assertEqual(
                    [page["rotation"] for page in snapshot["pages"]],
                    baseline["rotations"],
                )
                self.assertEqual(
                    [page["annotations"] for page in snapshot["pages"]],
                    baseline["annotations"],
                )
                self.assertEqual(snapshot["attachments"], baseline["attachments"])
                self.assertEqual(snapshot["acroform"], baseline["acroform"])

    def test_pdf_artifacts_are_treated_as_binary_by_repository_checks(self) -> None:
        path = "assets/projects/epic-cloud-security-automation-public-sample.pdf"
        result = subprocess.run(
            ["git", "check-attr", "diff", "--", path],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.stdout.strip(), f"{path}: diff: unset")

    def test_metadata_updater_is_content_preserving_deterministic_and_idempotent(self) -> None:
        script = ROOT / "tools/update_pdf_metadata.py"
        self.assertTrue(script.exists(), "metadata updater must exist")
        spec = importlib.util.spec_from_file_location("update_pdf_metadata", script)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            for case in CASES.values():
                with self.subTest(pdf=case["pdf"]):
                    source = ROOT / "assets/projects" / case["pdf"]
                    seed = temporary / f"seed-{case['pdf']}"
                    writer = PdfWriter()
                    writer.clone_document_from_reader(PdfReader(source))
                    writer.add_metadata(
                        {
                            "/Title": "Anonymous public sample",
                            "/Author": "Anonymous",
                            "/Subject": "Unspecified",
                            "/Keywords": "Unspecified",
                            "/Creator": "Unspecified",
                        }
                    )
                    with seed.open("wb") as stream:
                        writer.write(stream)

                    first = temporary / f"first-{case['pdf']}"
                    second = temporary / f"second-{case['pdf']}"
                    shutil.copyfile(seed, first)
                    shutil.copyfile(seed, second)
                    original = content_snapshot(seed)
                    rendered_before = rendered_page_snapshots(seed)

                    self.assertTrue(module.update(first, case["title"]))
                    self.assertTrue(module.update(second, case["title"]))
                    self.assertEqual(first.read_bytes(), second.read_bytes())
                    self.assertEqual(content_snapshot(first), original)
                    self.assertEqual(rendered_page_snapshots(first), rendered_before)
                    metadata = PdfReader(first).metadata
                    self.assertEqual(metadata.title, case["title"])
                    self.assertEqual(metadata.author, "EPIC TECH LLC")
                    self.assertEqual(
                        metadata.subject,
                        f"EPIC TECH LLC public case study: {case['title']}",
                    )
                    self.assertEqual(metadata.get("/Keywords"), KEYWORDS)
                    self.assertEqual(metadata.creator, "EPIC TECH LLC")
                    once = first.read_bytes()
                    self.assertFalse(module.update(first, case["title"]))
                    self.assertEqual(first.read_bytes(), once)

    def test_case_pages_use_only_local_runtime_assets_and_unique_json_ld_ids(self) -> None:
        for page in [ROOT / "case-studies/index.html"] + [
            ROOT / "case-studies" / f"{slug}.html" for slug in CASES
        ]:
            self.assertTrue(page.exists(), f"missing case-study page: {page.name}")
            source = read_text(page)
            with self.subTest(page=page.name):
                self.assertEqual(
                    re.findall(r'<script[^>]+src="([^"]+)"', source),
                    ["../assets/js/main.js"],
                )
                ids = [node.get("@id") for node in json_ld_graph(page) if node.get("@id")]
                self.assertEqual(len(ids), len(set(ids)))


if __name__ == "__main__":
    unittest.main()
