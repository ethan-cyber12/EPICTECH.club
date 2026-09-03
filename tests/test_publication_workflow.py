from __future__ import annotations

import unittest

from site_contracts import read_text


class PublicationWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = read_text(".github/workflows/deploy-pages.yml")

    def test_publication_requires_manual_dispatch(self) -> None:
        self.assertIn("  workflow_dispatch:\n", self.workflow)
        self.assertNotIn("  push:\n", self.workflow)
        self.assertNotIn("  pull_request:\n", self.workflow)
        self.assertIn("  group: pages-production\n", self.workflow)
        self.assertIn("  cancel-in-progress: false\n", self.workflow)

    def test_publication_requires_main_and_the_exact_approved_sha(self) -> None:
        self.assertIn("      expected_sha:\n", self.workflow)
        self.assertIn('if [ "$REF" != "refs/heads/main" ]; then', self.workflow)
        self.assertIn("'^[0-9a-f]{40}$'", self.workflow)
        self.assertIn('if [ "$EXPECTED_SHA" != "$ACTUAL_SHA" ]; then', self.workflow)
        self.assertIn("          ref: ${{ github.sha }}\n", self.workflow)
        self.assertIn("          persist-credentials: false\n", self.workflow)
        self.assertIn('if [ "$(git rev-parse HEAD)" != "$EXPECTED_SHA" ]; then', self.workflow)

    def test_publication_builds_and_uploads_only_the_allowlisted_artifact(self) -> None:
        self.assertIn("run: npm run site:build", self.workflow)
        self.assertIn("uses: actions/upload-pages-artifact@", self.workflow)
        self.assertIn("          path: _site\n", self.workflow)
        self.assertNotIn("          path: .\n", self.workflow)
        self.assertEqual(self.workflow.count("          path: _site\n"), 1)
        self.assertEqual(self.workflow.count("uses: actions/deploy-pages@"), 1)

    def test_deploy_job_has_only_the_required_pages_permissions(self) -> None:
        self.assertIn("      pages: write\n", self.workflow)
        self.assertIn("      id-token: write\n", self.workflow)
        self.assertIn("      name: github-pages\n", self.workflow)
        self.assertIn("uses: actions/deploy-pages@", self.workflow)
        self.assertEqual(self.workflow.count("  contents: read\n"), 1)
        self.assertEqual(self.workflow.count("      pages: write\n"), 1)
        self.assertEqual(self.workflow.count("      id-token: write\n"), 1)
        self.assertNotIn("actions: write", self.workflow)

    def test_publication_reruns_release_contracts_and_records_a_digest(self) -> None:
        self.assertIn("run: npm audit --audit-level=high", self.workflow)
        self.assertIn("run: npm run test:media", self.workflow)
        self.assertIn("npm run media:verify", self.workflow)
        self.assertIn("npm run media:originality", self.workflow)
        self.assertIn("npm run worker:check:staging", self.workflow)
        self.assertIn("python -m unittest discover", self.workflow)
        self.assertIn("$RUNNER_TEMP/publication-files.sha256", self.workflow)
        self.assertIn("needs.build.outputs.publication_digest", self.workflow)
        self.assertLess(
            self.workflow.index("$RUNNER_TEMP/publication-files.sha256"),
            self.workflow.index("uses: actions/upload-pages-artifact@"),
        )
        self.assertLess(
            self.workflow.index("uses: actions/upload-pages-artifact@"),
            self.workflow.index("uses: actions/deploy-pages@"),
        )

    def test_all_actions_are_pinned_to_full_commit_hashes(self) -> None:
        action_lines = [
            line.strip()
            for line in self.workflow.splitlines()
            if line.strip().startswith("uses:")
        ]
        expected_actions = {
            "actions/checkout",
            "actions/setup-python",
            "actions/setup-node",
            "actions/configure-pages",
            "actions/upload-pages-artifact",
            "actions/deploy-pages",
        }
        self.assertEqual({line.split("@", 1)[0].removeprefix("uses: ") for line in action_lines}, expected_actions)
        for line in action_lines:
            reference = line.split("@", 1)[1].split()[0]
            self.assertRegex(reference, r"^[0-9a-f]{40}$")


if __name__ == "__main__":
    unittest.main()
