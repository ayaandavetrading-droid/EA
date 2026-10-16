"""
DeskPilot AI - Task Planner & Workflow Orchestrator
Plans 9-stage deliberate workflows for coding & Excel tasks using Gemini.
"""
import os
import json
import logging
from typing import Dict, Any, List
from deskpilot.config import config

logger = logging.getLogger("deskpilot.task_planner")


class TaskPlanner:
    def __init__(self):
        self.api_key = config.get("gemini_api_key")

    def plan_task_stages(self, task: Dict[str, Any], workspace_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Creates the standardized 9-stage workflow:
        1. Inspect current project
        2. Identify useful objective
        3. Outline implementation plan
        4. Open or create relevant file
        5. Write small section of code
        6. Review result
        7. Run appropriate checks
        8. Fix genuine errors
        9. Summarize completed work
        """
        task_title = task.get("title", "Execute Productivity Task")
        target_file = workspace_context.get("resource_name", "main.py")

        stages = [
            {
                "stage_number": 1,
                "name": "Inspect current project",
                "description": f"Scan {target_file} structure, check syntax, and identify active symbols.",
                "status": "completed",
                "requires_approval": False
            },
            {
                "stage_number": 2,
                "name": "Identify useful objective",
                "description": f"Target: {task_title}. Define expected input/output and behavior.",
                "status": "current",
                "requires_approval": False
            },
            {
                "stage_number": 3,
                "name": "Outline implementation plan",
                "description": "Formulate minimal modification plan preserving existing architecture.",
                "status": "pending",
                "requires_approval": True
            },
            {
                "stage_number": 4,
                "name": "Open or create relevant file",
                "description": f"Ensure {target_file} is active in editor with backup snapshot.",
                "status": "pending",
                "requires_approval": False
            },
            {
                "stage_number": 5,
                "name": "Write small section of code",
                "description": "Draft concise, functional implementation with explanatory comments.",
                "status": "pending",
                "requires_approval": True
            },
            {
                "stage_number": 6,
                "name": "Review result",
                "description": "Inspect unified diff preview; user can approve, reject, or request adjustments.",
                "status": "pending",
                "requires_approval": True
            },
            {
                "stage_number": 7,
                "name": "Run appropriate checks",
                "description": "Execute automated unit tests or formula recalculation in verified sandbox.",
                "status": "pending",
                "requires_approval": False
            },
            {
                "stage_number": 8,
                "name": "Fix genuine errors",
                "description": "Inspect exit code and test assertion output; patch any edge-case tracebacks.",
                "status": "pending",
                "requires_approval": False
            },
            {
                "stage_number": 9,
                "name": "Summarize completed work",
                "description": "Provide scannable bullet points of verified deliverables and status.",
                "status": "pending",
                "requires_approval": False
            }
        ]
        return stages


task_planner = TaskPlanner()
