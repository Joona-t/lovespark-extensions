"""Regression test for BUG-001: theme dropdown markup must use the element IDs
that the shared lib/lovespark-theme.js actually wires (themeToggle / themeMenu).

Run: python3 -m unittest discover -s tests -v
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
POPUP_HTML = (ROOT / "popup.html").read_text(encoding="utf-8")
THEME_JS = (ROOT / "lib" / "lovespark-theme.js").read_text(encoding="utf-8")


def html_ids(markup):
    return set(re.findall(r'\bid="([^"]+)"', markup))


def js_ids(source):
    return set(re.findall(r"getElementById\('([^']+)'\)", source))


class ThemeDropdownWiring(unittest.TestCase):
    def test_every_id_theme_js_looks_up_exists_in_popup(self):
        missing = js_ids(THEME_JS) - html_ids(POPUP_HTML)
        self.assertEqual(
            missing, set(),
            f"lib/lovespark-theme.js looks up IDs absent from popup.html: {sorted(missing)} "
            "(the theme dropdown is dead: init() bails when toggle/menu are null)",
        )

    def test_dropdown_uses_canonical_ids(self):
        self.assertIn('id="themeToggle"', POPUP_HTML)
        self.assertIn('id="themeMenu"', POPUP_HTML)
        self.assertNotIn("themeDropdownTrigger", POPUP_HTML)
        self.assertNotIn("themeDropdownMenu", POPUP_HTML)


if __name__ == "__main__":
    unittest.main()
