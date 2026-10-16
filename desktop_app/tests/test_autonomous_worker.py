"""
Tests for AutonomousWorker
"""
import unittest
import time
from deskpilot.autonomous_worker import AutonomousWorker, AutonomousStatus


class TestAutonomousWorker(unittest.TestCase):
    def setUp(self):
        self.worker = AutonomousWorker()

    def tearDown(self):
        self.worker.stop()

    def test_initial_state(self):
        self.assertFalse(self.worker.is_active)
        self.assertEqual(self.worker.status, AutonomousStatus.STOPPED)

    def test_start_and_stop_toggle(self):
        self.worker.start()
        self.assertTrue(self.worker.is_active)
        self.assertNotEqual(self.worker.status, AutonomousStatus.STOPPED)

        # Toggle OFF
        self.worker.stop()
        self.assertFalse(self.worker.is_active)
        self.assertEqual(self.worker.status, AutonomousStatus.STOPPED)

    def test_status_listener_receives_updates(self):
        received_statuses = []
        self.worker.add_status_listener(lambda status, task: received_statuses.append(status))

        self.worker.start()
        time.sleep(0.3)
        self.worker.stop()

        self.assertIn(AutonomousStatus.SCANNING, received_statuses)
        self.assertIn(AutonomousStatus.STOPPED, received_statuses)


if __name__ == "__main__":
    unittest.main()
