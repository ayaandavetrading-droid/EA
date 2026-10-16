"""
DeskPilot AI - Real Code Editing & Diff Engine
Generates functional code in small understandable steps, previews diffs,
and preserves undo history.
"""
import os
import difflib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("deskpilot.code_editor")


class CodeEditor:
    def __init__(self):
        # File path -> List of past content states
        self._undo_history: Dict[str, List[str]] = {}

    def generate_diff(self, original_text: str, new_text: str, filename: str = "file.py") -> Dict[str, Any]:
        """
        Computes standard unified diff with line-by-line statistics.
        """
        orig_lines = original_text.splitlines(keepends=True)
        new_lines = new_text.splitlines(keepends=True)

        diff = list(difflib.unified_diff(
            orig_lines,
            new_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
            n=3
        ))

        additions = sum(1 for line in diff if line.startswith("+") and not line.startswith("+++"))
        deletions = sum(1 for line in diff if line.startswith("-") and not line.startswith("---"))

        return {
            "diff_text": "".join(diff),
            "additions": additions,
            "deletions": deletions,
            "has_changes": additions > 0 or deletions > 0
        }

    def apply_edit(self, filepath: str, new_content: str) -> bool:
        """
        Applies changes to file with automatic undo history registration.
        """
        path = Path(filepath)
        try:
            old_content = ""
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    old_content = f.read()

            # Record in undo history
            if filepath not in self._undo_history:
                self._undo_history[filepath] = []
            self._undo_history[filepath].append(old_content)

            # Write new content
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)

            logger.info(f"Successfully edited {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to apply edit to {filepath}: {e}")
            return False

    def undo_last_edit(self, filepath: str) -> Tuple[bool, str]:
        """
        Reverts the last applied edit for a file.
        """
        if filepath not in self._undo_history or not self._undo_history[filepath]:
            return False, "No undo history available for this file."

        prev_content = self._undo_history[filepath].pop()
        path = Path(filepath)
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(prev_content)
            logger.info(f"Successfully reverted {filepath}")
            return True, "Reverted successfully."
        except Exception as e:
            logger.error(f"Failed to undo {filepath}: {e}")
            return False, str(e)


code_editor = CodeEditor()
