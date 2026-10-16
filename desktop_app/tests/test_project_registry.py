"""
Tests for ProjectRegistry SQLite Persistence
"""
import unittest
import tempfile
import os
from deskpilot.project_registry import ProjectRegistry


class TestProjectRegistry(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.registry = ProjectRegistry(db_path=self.temp_db.name)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_register_and_get_project(self):
        p = self.registry.register_project(
            project_id="proj_1",
            name="Expense Tracker",
            path="/workspace/expense_tracker",
            language="Python",
            category="Finance"
        )
        self.assertIsNotNone(p)
        self.assertEqual(p["name"], "Expense Tracker")
        self.assertEqual(p["status"], "IN_PROGRESS")

    def test_mark_project_completed(self):
        self.registry.register_project("proj_2", "CSV Cleaner", "/path", "Python")
        self.registry.mark_project_completed("proj_2", test_status="PASSED")
        p = self.registry.get_project("proj_2")
        self.assertEqual(p["status"], "COMPLETED")
        self.assertEqual(p["test_status"], "PASSED")

    def test_record_and_list_tasks(self):
        self.registry.record_task("t1", "Validate Amount", "VS Code", "main.py", "COMPLETED")
        tasks = self.registry.list_recent_tasks(limit=5)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["title"], "Validate Amount")


if __name__ == "__main__":
    unittest.main()
