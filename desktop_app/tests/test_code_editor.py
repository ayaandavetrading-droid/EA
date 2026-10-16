"""
Tests for CodeEditor
"""
import unittest
from deskpilot.code_editor import CodeEditor


class TestCodeEditor(unittest.TestCase):
    def setUp(self):
        self.editor = CodeEditor()

    def test_generate_diff(self):
        old_text = "def calculate(x):\n    return x\n"
        new_text = "def calculate(x):\n    # add docstring\n    return x * 2\n"
        diff_res = self.editor.generate_diff(old_text, new_text, "calc.py")

        self.assertTrue(diff_res["has_changes"])
        self.assertGreater(diff_res["additions"], 0)
        self.assertIn("a/calc.py", diff_res["diff_text"])

    def test_no_changes_diff(self):
        text = "def foo():\n    pass\n"
        diff_res = self.editor.generate_diff(text, text, "foo.py")
        self.assertFalse(diff_res["has_changes"])
        self.assertEqual(diff_res["additions"], 0)
        self.assertEqual(diff_res["deletions"], 0)


if __name__ == "__main__":
    unittest.main()
