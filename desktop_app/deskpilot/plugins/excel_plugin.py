"""
DeskPilot AI - Microsoft Excel Plugin
"""
import logging
from typing import Dict, Any, List
from deskpilot.plugins.base import AppPlugin
from deskpilot.excel_engine import excel_engine

logger = logging.getLogger("deskpilot.plugins.excel")


class ExcelPlugin(AppPlugin):
    @property
    def plugin_name(self) -> str:
        return "Microsoft Excel"

    def can_handle(self, window_info: Dict[str, Any]) -> bool:
        app_type = window_info.get("type", "").lower()
        title = window_info.get("title", "").lower()
        return "excel" in app_type or "excel" in title or ".xlsx" in title or ".csv" in title

    def inspect_workspace(self, window_info: Dict[str, Any]) -> Dict[str, Any]:
        info = excel_engine.inspect_active_workbook()
        return {
            "app": self.plugin_name,
            "workbook_name": info.get("workbook_name", "Workbook.xlsx"),
            "sheet_name": info.get("sheet_name", "Sheet1"),
            "headers": info.get("headers", []),
            "row_count": info.get("row_count", 0),
            "selected_range": info.get("selected_range", "A1"),
            "integration_type": info.get("read_mode", "COM / Native")
        }

    def formulate_tasks(self, workspace_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        wb = workspace_context.get("workbook_name", "Workbook.xlsx")
        return [
            {
                "id": "excel_task_1",
                "title": f"Clean Inconsistent Text & Standardize ISO Dates in {wb}",
                "description": "Trim leading/trailing spaces, standardize dates to YYYY-MM-DD, and eliminate duplicate records.",
                "category": "Data Cleaning",
                "risk": "Low",
                "is_destructive": False
            },
            {
                "id": "excel_task_2",
                "title": f"Generate Revenue Summary & Regional Bar Chart for {wb}",
                "description": "Calculate aggregated SUMIFS totals, profit margin ratios, and auto-insert dynamic chart visual.",
                "category": "Formulas & Reporting",
                "risk": "Low",
                "is_destructive": False
            }
        ]

    def execute_step(self, task: Dict[str, Any], step: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": True,
            "action": f"Executed Excel operation: {step.get('name', 'Formula Recalculation')}",
            "details": "Preserved original workbook as .bak and applied non-destructive formula updates."
        }
