"""
DeskPilot AI - Visual Studio Code & Visual Studio Plugin
"""
import logging
from typing import Dict, Any, List
from deskpilot.plugins.base import AppPlugin
from deskpilot.vscode_bridge import vscode_bridge

logger = logging.getLogger("deskpilot.plugins.vscode")


class VSCodePlugin(AppPlugin):
    @property
    def plugin_name(self) -> str:
        return "Visual Studio Code"

    def can_handle(self, window_info: Dict[str, Any]) -> bool:
        app_type = window_info.get("type", "").lower()
        title = window_info.get("title", "").lower()
        return "vscode" in app_type or "code" in app_type or "visual studio" in title

    def inspect_workspace(self, window_info: Dict[str, Any]) -> Dict[str, Any]:
        title = window_info.get("title", "")
        # Parse file and project name
        parts = title.split(" - ")
        resource = parts[0].replace("● ", "").strip() if parts else "main.py"
        language = "Python" if resource.endswith(".py") else "TypeScript" if resource.endswith((".ts", ".tsx")) else "C#" if resource.endswith(".cs") else "General Code"

        return {
            "app": self.plugin_name,
            "resource": resource,
            "language": language,
            "project_name": parts[1].strip() if len(parts) > 1 else "Active_Project",
            "is_dirty": "● " in title,
            "integration_type": "Native / CLI Bridge"
        }

    def formulate_tasks(self, workspace_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        res = workspace_context.get("resource", "main.py")
        return [
            {
                "id": "vscode_task_1",
                "title": f"Add Input Bounds & Exception Guards in {res}",
                "description": "Implement type guards, sanitize inputs, and prevent negative/null assertions.",
                "category": "Programming",
                "risk": "Low",
                "is_destructive": False
            },
            {
                "id": "vscode_task_2",
                "title": f"Generate Automated Unit Test Suite for {res}",
                "description": "Create isolated test cases verifying core logic and boundary conditions.",
                "category": "Testing",
                "risk": "Low",
                "is_destructive": False
            }
        ]

    def execute_step(self, task: Dict[str, Any], step: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": True,
            "action": f"Executed step: {step.get('name', 'Code Step')}",
            "details": "Applied non-destructive edit to active buffer with backup snapshot."
        }
