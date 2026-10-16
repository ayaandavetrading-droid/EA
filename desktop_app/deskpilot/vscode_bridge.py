"""
DeskPilot AI - Visual Studio Code & Visual Studio Bridge
Handles communication with VS Code via CLI, workspace analysis, and IPC bridge.
"""
import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("deskpilot.vscode_bridge")


class VSCodeBridge:
    def __init__(self):
        self.is_windows = sys.platform == "win32"

    def is_vscode_installed(self) -> bool:
        """Checks if 'code' command line interface is available"""
        try:
            res = subprocess.run(["code", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            return res.returncode == 0
        except Exception:
            return False

    def get_workspace_files(self, workspace_path: str) -> List[str]:
        """Lists files in the active project directory, ignoring git/node_modules/venv"""
        p = Path(workspace_path)
        if not p.exists():
            return []

        ignore_dirs = {".git", "node_modules", ".venv", "venv", "__pycache__", ".idea", ".vscode"}
        found_files = []

        try:
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if d not in ignore_dirs]
                for file in files:
                    if not file.startswith("."):
                        found_files.append(str(Path(root) / file))
                        if len(found_files) >= 100:
                            break
        except Exception as e:
            logger.error(f"Error scanning workspace: {e}")

        return found_files

    def open_file(self, filepath: str, line: Optional[int] = None) -> bool:
        """Opens a file in VS Code at an optional line number"""
        try:
            cmd = ["code"]
            if line:
                cmd.extend(["-g", f"{filepath}:{line}"])
            else:
                cmd.append(filepath)
            subprocess.run(cmd, check=True)
            return True
        except Exception as e:
            logger.error(f"Failed to open {filepath} in VS Code: {e}")
            return False


vscode_bridge = VSCodeBridge()
