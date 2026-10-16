"""
DeskPilot AI - Safe Windows Automation & Emergency Stop
Provides guarded mouse and keyboard interactions with emergency-stop interrupts.
"""
import sys
import time
import logging
from typing import Optional, Callable
from deskpilot.config import config

logger = logging.getLogger("deskpilot.automation")


class AutomationController:
    def __init__(self):
        self.is_windows = sys.platform == "win32"
        self._emergency_stop_triggered = False
        self._is_paused = False
        self._setup_emergency_hotkey()

    def _setup_emergency_hotkey(self):
        """Registers global hotkey for emergency stop"""
        if self.is_windows:
            try:
                import keyboard
                stop_key = config.get("emergency_stop_key", "ctrl+alt+s")
                keyboard.add_hotkey(stop_key, self.emergency_stop)
                logger.info(f"Emergency stop hotkey registered: {stop_key}")
            except Exception as e:
                logger.warning(f"Could not register global hotkey: {e}")

    def emergency_stop(self):
        """Immediately halts any in-progress automation"""
        self._emergency_stop_triggered = True
        logger.critical("EMERGENCY STOP TRIGGERED BY USER. Halting all automation.")

    def reset_stop(self):
        self._emergency_stop_triggered = False

    def is_stopped(self) -> bool:
        return self._emergency_stop_triggered

    def check_safety(self) -> bool:
        """Call before and during any automated action"""
        if self._emergency_stop_triggered:
            raise InterruptedError("Action cancelled by Emergency Stop.")
        if self._is_paused:
            time.sleep(0.2)
        return True

    def safe_send_keys(self, keys: str, delay: float = 0.05):
        """
        Sends keystrokes with pacing and emergency stop verification.
        """
        self.check_safety()
        logger.info(f"Automating keystrokes: {len(keys)} characters")
        if self.is_windows:
            try:
                import keyboard
                for ch in keys:
                    self.check_safety()
                    keyboard.write(ch)
                    time.sleep(delay)
            except Exception as e:
                logger.error(f"Keyboard automation failed: {e}")
        else:
            logger.info(f"[Mock Automation] Sent: {keys}")


automation = AutomationController()
