"""
DeskPilot AI - Configuration and Local Settings Store
"""
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger("deskpilot.config")

DEFAULT_SETTINGS = {
    "gemini_api_key": "",
    "model": "gemini-3.8-flash",
    "autonomous_enabled": False,
    "workflow_pace": "standard",  # "swift", "standard", "deliberate"
    "preferred_languages": ["Python", "JavaScript", "C#", "SQL"],
    "auto_approve_safe_actions": True,
    "require_auth_for_destructive": True,
    "emergency_stop_key": "ctrl+alt+s",
    "always_on_top": True,
    "theme": "dark",
    "window_opacity": 0.96,
    "screen_capture_permission_granted": True,
    "auto_backup_workbooks": True,
    "vscode_ipc_port": 49152,
    "task_history": [],
    "supported_apps": [
        "Visual Studio Code",
        "Visual Studio",
        "Microsoft Excel",
        "Cursor",
        "PyCharm"
    ]
}


class ConfigManager:
    def __init__(self, custom_path: Path = None):
        if custom_path:
            self.settings_file = Path(custom_path)
        else:
            appdata = os.environ.get("APPDATA")
            if appdata:
                self.config_dir = Path(appdata) / "DeskPilotAI"
            else:
                self.config_dir = Path.home() / ".deskpilot"
            self.config_dir.mkdir(parents=True, exist_ok=True)
            self.settings_file = self.config_dir / "settings.json"

        self.settings: Dict[str, Any] = self._load_settings()

    def _load_settings(self) -> Dict[str, Any]:
        if self.settings_file.exists():
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    merged = DEFAULT_SETTINGS.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                logger.error(f"Failed to load settings from {self.settings_file}: {e}")
                return DEFAULT_SETTINGS.copy()
        return DEFAULT_SETTINGS.copy()

    def get(self, key: str, default: Any = None) -> Any:
        # Check environment variable first for secrets
        if key == "gemini_api_key":
            env_key = os.environ.get("GEMINI_API_KEY")
            if env_key:
                return env_key
        return self.settings.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self.settings[key] = value
        self.save()

    def save(self) -> bool:
        try:
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save settings: {e}")
            return False


config = ConfigManager()
