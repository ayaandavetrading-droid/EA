"""
Tests for TaskPlanner
"""
import unittest
from deskpilot.task_planner import TaskPlanner


class TestTaskPlanner(unittest.TestCase):
    def setUp(self):
        self.planner = TaskPlanner()

    def test_plan_task_stages(self):
        task = {"title": "Write Unit Tests for Expense Tracker"}
        context = {"resource_name": "expense_tracker.py", "app": "Visual Studio Code"}
        stages = self.planner.plan_task_stages(task, context)

        self.assertEqual(len(stages), 9)
        self.assertEqual(stages[0]["name"], "Inspect current project")
        self.assertEqual(stages[1]["name"], "Identify useful objective")
        self.assertEqual(stages[8]["name"], "Summarize completed work")
        self.assertTrue(stages[4]["requires_approval"])  # Writing code step


if __name__ == "__main__":
    unittest.main()
