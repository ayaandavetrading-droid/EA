"""
DeskPilot AI - Intelligent Screen & Application Detector
Identifies active Windows foreground windows: VS Code, Visual Studio, Excel.
"""
import sys
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("deskpilot.app_detector")


class AppDetector:
    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self._last_detected = None

    def get_active_window(self) -> Dict[str, Any]:
        """
        Returns info on the currently focused foreground window.
        """
        if not self.is_windows:
            # Fallback for non-windows testing environments
            return self._fallback_active_window()

        try:
            import win32gui
            import win32process
            import win32con

            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return {"app": "Unknown", "title": "", "hwnd": 0, "type": "unknown"}

            window_title = win32gui.GetWindowText(hwnd)
            _, pid = win32process.GetWindowThreadProcessId(hwnd)

            app_type, canonical_name = self.classify_window(window_title)
            
            rect = win32gui.GetWindowRect(hwnd)
            width = rect[2] - rect[0]
            height = rect[3] - rect[1]

            result = {
                "app": canonical_name,
                "type": app_type,
                "title": window_title,
                "pid": pid,
                "hwnd": hwnd,
                "geometry": {"x": rect[0], "y": rect[1], "width": width, "height": height},
                "is_supported": app_type in ["vscode", "visual_studio", "excel"]
            }
            self._last_detected = result
            return result
        except ImportError:
            logger.warning("pywin32 not installed. Using cross-platform detection fallback.")
            return self._fallback_active_window()
        except Exception as e:
            logger.error(f"Error reading foreground window: {e}")
            return {"app": "Error", "title": str(e), "hwnd": 0, "type": "unknown"}

    def classify_window(self, title: str) -> tuple[str, str]:
        """
        Analyzes window title to identify application and extract open files/sheets.
        """
        lower = title.lower()
        if "visual studio code" in lower or lower.endswith("- code"):
            return "vscode", "Visual Studio Code"
        elif "visual studio" in lower and "code" not in lower:
            return "visual_studio", "Visual Studio"
        elif "excel" in lower or ".xlsx" in lower or ".csv - excel" in lower:
            return "excel", "Microsoft Excel"
        elif "pycharm" in lower or "intellij" in lower:
            return "jetbrains", "JetBrains IDE"
        elif "notepad" in lower:
            return "editor", "Notepad"
        elif "terminal" in lower or "powershell" in lower or "cmd.exe" in lower:
            return "terminal", "Windows Terminal"
        return "other", title.split(" - ")[-1] if " - " in title else title

    def parse_workspace_context(self, window_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts open file name, language, or active workbook from window title.
        """
        title = window_info.get("title", "")
        app_type = window_info.get("type", "unknown")
        
        context = {
            "app": window_info.get("app", "Unknown"),
            "app_type": app_type,
            "resource_name": "Unknown",
            "file_extension": "",
            "is_dirty": False,
            "project_name": ""
        }

        if app_type == "vscode":
            # Typical VS Code title: "● main.py - project_folder - Visual Studio Code"
            parts = title.split(" - ")
            if parts:
                file_part = parts[0].strip()
                if file_part.startswith("● "):
                    context["is_dirty"] = True
                    file_part = file_part[2:].strip()
                context["resource_name"] = file_part
                if "." in file_part:
                    context["file_extension"] = file_part.split(".")[-1]
                if len(parts) > 1 and parts[1] != "Visual Studio Code":
                    context["project_name"] = parts[1].strip()

        elif app_type == "excel":
            # Typical Excel title: "Q3_Sales.xlsx - Excel" or "Book1 - Excel"
            parts = title.split(" - ")
            if parts:
                context["resource_name"] = parts[0].strip()
                context["file_extension"] = "xlsx"

        elif app_type == "visual_studio":
            # Typical Visual Studio title: "MyProject - Microsoft Visual Studio"
            parts = title.split(" - ")
            if parts:
                context["project_name"] = parts[0].strip()
                context["resource_name"] = parts[0].strip()

        return context

    def _fallback_active_window(self) -> Dict[str, Any]:
        """Fallback for non-Windows or headless testing"""
        return {
            "app": "Visual Studio Code",
            "type": "vscode",
            "title": "expense_tracker.py - my_project - Visual Studio Code",
            "pid": 1234,
            "hwnd": 1001,
            "geometry": {"x": 100, "y": 100, "width": 1200, "height": 800},
            "is_supported": True
        }


detector = AppDetector()
