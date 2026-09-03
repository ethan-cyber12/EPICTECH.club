import re
import unittest

from tests.site_contracts import read_text


class ContactReviewsRedesignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.contact = read_text("contact.html")
        cls.reviews = read_text("reviews.html")
        cls.styles = read_text("assets/css/styles.css")

    def test_contact_uses_the_approved_editorial_flow(self) -> None:
        for class_name in (
            "contact-hero",
            "assessment-path",
            "intake-layout",
            "form-surface",
            "intake-guide",
            "contact-channel",
            "faq-list",
        ):
            with self.subTest(class_name=class_name):
                self.assertRegex(
                    self.contact,
                    rf'class="[^"]*\b{re.escape(class_name)}\b',
                )

        for step in ("Tell us what is going on", "Assessment", "Written plan"):
            self.assertIn(step, self.contact)

    def test_review_page_uses_real_dynamic_proof_not_static_testimonials(self) -> None:
        for class_name in (
            "reviews-hero",
            "reviews-trust-rail",
            "reviews-proof",
            "reviews-feed",
            "review-process",
            "review-assurance",
        ):
            with self.subTest(class_name=class_name):
                self.assertRegex(
                    self.reviews,
                    rf'class="[^"]*\b{re.escape(class_name)}\b',
                )

        for hook in (
            "data-google-summary",
            "data-google-reviews",
            "data-onsite-reviews",
        ):
            self.assertEqual(self.reviews.count(hook), 1)
        self.assertNotIn("<blockquote", self.reviews)

    def test_rating_control_uses_a_fieldset_and_preserves_every_value(self) -> None:
        rating_group = re.search(
            r'<fieldset class="field rating-field">(.*?)</fieldset>',
            self.reviews,
            re.DOTALL,
        )
        self.assertIsNotNone(rating_group)
        markup = rating_group.group(1)
        self.assertIn("<legend>Your rating</legend>", markup)
        self.assertIn('role="radiogroup"', markup)
        for rating in range(1, 6):
            self.assertIn(
                f'id="review-star-{rating}" name="rating" value="{rating}"',
                markup,
            )

    def test_form_sizing_does_not_expand_hidden_rating_radios(self) -> None:
        self.assertRegex(
            self.styles,
            r"\.form-surface \.star-input input\s*\{[^}]*width:\s*1px",
        )

    def test_form_and_review_integrations_are_preserved(self) -> None:
        self.assertIn('data-intake-form', self.contact)
        self.assertIn(
            'data-endpoint="https://intake.epictech.club/lead-intake"',
            self.contact,
        )
        self.assertIn('id="qual-prompt"', self.contact)
        self.assertIn('href="https://wa.me/message/GO4FEQZBZN3VG1"', self.contact)

        self.assertIn('data-review-form', self.reviews)
        self.assertIn(
            'data-endpoint="https://intake.epictech.club/review-intake"',
            self.reviews,
        )
        self.assertIn('data-google-link', self.reviews)
        self.assertIn('data-client-reviews-section', self.reviews)
        for page in (self.contact, self.reviews):
            self.assertIn('https://challenges.cloudflare.com/turnstile/v0/api.js', page)

    def test_page_specific_styles_exist_without_new_palette_tokens(self) -> None:
        for selector in (
            ".contact-hero",
            ".assessment-path",
            ".intake-layout",
            ".form-surface",
            ".reviews-hero",
            ".reviews-trust-rail",
            ".reviews-proof",
            ".review-assurance",
        ):
            with self.subTest(selector=selector):
                self.assertIn(selector, self.styles)


if __name__ == "__main__":
    unittest.main()
