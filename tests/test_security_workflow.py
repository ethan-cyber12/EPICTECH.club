from __future__ import annotations

import re
import tomllib
import unittest

from tests.site_contracts import read_text


class SecurityWorkflowTests(unittest.TestCase):
    def test_synthetic_secret_allowlist_does_not_embed_provider_tokens(self) -> None:
        policy_text = read_text(".gitleaks.toml")
        policy = tomllib.loads(policy_text)
        allowlist_regexes = policy["allowlists"][1]["regexes"]
        # Assemble scanner fixtures at runtime so the policy regression test does
        # not itself introduce complete provider-shaped tokens into source.
        synthetic_values = (
            "AKIA" + "ABCDEFGHIJKLMNOP",
            "sk_" + "live_1234567890abcdef123456",
            "xoxb-" + "1234567890-abcdefghij",
            "eyJhbGciOiJIUzI1NiJ9." + "eyJzdWIiOiIxMjM0In0.signature123",
        )

        for value in synthetic_values:
            with self.subTest(value=value):
                self.assertTrue(any(re.search(pattern, value) for pattern in allowlist_regexes))
                self.assertNotIn(value, policy_text)

    def test_security_evidence_uses_node24_action_and_no_persisted_credentials(self) -> None:
        workflow = read_text(".github/workflows/security-baseline.yml")
        upload_pin = (
            "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a "
            "# v7.0.1"
        )
        self.assertEqual(workflow.count(upload_pin), 3)
        self.assertNotIn("actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02", workflow)
        self.assertEqual(workflow.count("persist-credentials: false"), 3)
        self.assertIn("--scanners vuln,secret,misconfig", workflow)

        site_contracts = read_text(".github/workflows/site-contracts.yml")
        self.assertIn("persist-credentials: false", site_contracts)


if __name__ == "__main__":
    unittest.main()
