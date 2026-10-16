"""
DeskPilot AI - PySide6 Floating Desktop Interface
A streamlined, dark-themed floating widget featuring a single prominent ON/OFF toggle,
real-time status indicator, current task description, and persistent task history.
"""
import sys
import logging
from deskpilot.config import config
from deskpilot.app_detector import detector
from deskpilot.automation import automation
from deskpilot.autonomous_worker import autonomous_worker, AutonomousStatus

logger = logging.getLogger("deskpilot.gui")


def create_floating_app():
    """Initializes and launches the PySide6 single-toggle desktop assistant."""
    try:
        from PySide6.QtWidgets import (
            QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
            QLabel, QPushButton, QTextEdit, QFrame, QListWidget, QListWidgetItem
        )
        from PySide6.QtCore import Qt, QTimer, QPoint
        from PySide6.QtGui import QColor, QFont, QIcon
    except ImportError:
        logger.warning("PySide6 not installed. Run 'pip install PySide6' to launch desktop GUI.")
        return None

    class SingleToggleOverlay(QMainWindow):
        def __init__(self):
            super().__init__()
            self.setWindowFlags(
                Qt.WindowStaysOnTopHint |
                Qt.FramelessWindowHint |
                Qt.Tool
            )
            self.setAttribute(Qt.WA_TranslucentBackground)
            self.resize(360, 520)
            self.old_pos = QPoint()

            self._init_ui()
            self._connect_worker()

        def _init_ui(self):
            container = QFrame(self)
            container.setObjectName("container")
            container.setStyleSheet("""
                #container {
                    background-color: #0F172A;
                    border: 1px solid #334155;
                    border-radius: 14px;
                    color: #F8FAFC;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                }
                QLabel {
                    color: #E2E8F0;
                }
                QPushButton {
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 13px;
                }
            """)

            layout = QVBoxLayout(container)
            layout.setContentsMargins(16, 14, 16, 14)
            layout.setSpacing(12)

            # Header / Title Bar
            header = QHBoxLayout()
            title = QLabel("DeskPilot AI")
            title.setStyleSheet("font-weight: 800; font-size: 15px; color: #38BDF8; letter-spacing: -0.5px;")
            header.addWidget(title)

            self.status_pill = QLabel("STOPPED")
            self.status_pill.setStyleSheet("""
                background-color: #1E293B;
                color: #94A3B8;
                border: 1px solid #334155;
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 10px;
                font-weight: 700;
                font-family: monospace;
            """)
            header.addWidget(self.status_pill)
            header.addStretch()

            close_btn = QPushButton("✕")
            close_btn.setFixedSize(24, 24)
            close_btn.setStyleSheet("background: transparent; color: #64748B; border: none; font-size: 13px;")
            close_btn.clicked.connect(self.close)
            header.addWidget(close_btn)
            layout.addLayout(header)

            # Large Single ON/OFF Toggle Button
            self.toggle_btn = QPushButton("TURN ON ASSISTANT")
            self.toggle_btn.setFixedHeight(48)
            self.toggle_btn.setStyleSheet("""
                QPushButton {
                    background-color: #0284C7;
                    color: white;
                    border: 1px solid #38BDF8;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                QPushButton:hover {
                    background-color: #0369A1;
                }
            """)
            self.toggle_btn.clicked.connect(self._on_toggle_clicked)
            layout.addWidget(self.toggle_btn)

            # Detected Application Box
            app_box = QHBoxLayout()
            app_label = QLabel("Active Application:")
            app_label.setStyleSheet("font-size: 11px; color: #94A3B8;")
            app_box.addWidget(app_label)

            self.app_name_label = QLabel("Visual Studio Code")
            self.app_name_label.setStyleSheet("font-size: 11px; font-weight: 600; color: #F1F5F9;")
            app_box.addWidget(self.app_name_label)
            app_box.addStretch()
            layout.addLayout(app_box)

            # Active Task Card
            task_card = QFrame()
            task_card.setStyleSheet("background-color: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 10px;")
            task_layout = QVBoxLayout(task_card)
            task_layout.setContentsMargins(8, 8, 8, 8)
            task_layout.setSpacing(4)

            task_title_hdr = QLabel("CURRENT AUTONOMOUS TASK")
            task_title_hdr.setStyleSheet("font-size: 10px; font-weight: 700; color: #38BDF8; font-family: monospace;")
            task_layout.addWidget(task_title_hdr)

            self.task_desc = QLabel("Assistant is stopped. Turn ON to begin autonomous work.")
            self.task_desc.setWordWrap(True)
            self.task_desc.setStyleSheet("font-size: 12px; color: #E2E8F0; line-height: 1.4;")
            task_layout.addWidget(self.task_desc)

            layout.addWidget(task_card)

            # Task History Section
            hist_header = QHBoxLayout()
            hist_title = QLabel("Recent Task History")
            hist_title.setStyleSheet("font-size: 11px; font-weight: 600; color: #94A3B8;")
            hist_header.addWidget(hist_title)
            hist_header.addStretch()
            layout.addLayout(hist_header)

            self.history_list = QListWidget()
            self.history_list.setFixedHeight(120)
            self.history_list.setStyleSheet("""
                QListWidget {
                    background-color: #020617;
                    border: 1px solid #1E293B;
                    border-radius: 6px;
                    color: #CBD5E1;
                    font-size: 11px;
                    padding: 4px;
                }
                QListWidget::item {
                    padding: 4px;
                    border-bottom: 1px solid #0F172A;
                }
            """)
            layout.addWidget(self.history_list)

            # Emergency Stop Button (Ctrl+Alt+S)
            self.emergency_btn = QPushButton("EMERGENCY STOP (Ctrl+Alt+S)")
            self.emergency_btn.setFixedHeight(34)
            self.emergency_btn.setStyleSheet("""
                QPushButton {
                    background-color: #7F1D1D;
                    color: #FCA5A5;
                    border: 1px solid #DC2626;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                }
                QPushButton:hover {
                    background-color: #991B1B;
                    color: white;
                }
            """)
            self.emergency_btn.clicked.connect(self._on_emergency_stop)
            layout.addWidget(self.emergency_btn)

            self.setCentralWidget(container)

        def _connect_worker(self):
            autonomous_worker.add_status_listener(self._update_status)
            self._timer = QTimer(self)
            self._timer.timeout.connect(self._poll_ui)
            self._timer.start(1000)

        def _on_toggle_clicked(self):
            if autonomous_worker.is_active:
                autonomous_worker.stop()
                self._set_ui_stopped()
            else:
                autonomous_worker.start()
                self._set_ui_running()

        def _set_ui_running(self):
            self.toggle_btn.setText("TURN OFF ASSISTANT")
            self.toggle_btn.setStyleSheet("""
                QPushButton {
                    background-color: #DC2626;
                    color: white;
                    border: 1px solid #EF4444;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                }
                QPushButton:hover {
                    background-color: #B91C1C;
                }
            """)
            self.status_pill.setText("RUNNING")
            self.status_pill.setStyleSheet("background-color: #064E3B; color: #34D399; border: 1px solid #059669; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; font-family: monospace;")

        def _set_ui_stopped(self):
            self.toggle_btn.setText("TURN ON ASSISTANT")
            self.toggle_btn.setStyleSheet("""
                QPushButton {
                    background-color: #0284C7;
                    color: white;
                    border: 1px solid #38BDF8;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                }
                QPushButton:hover {
                    background-color: #0369A1;
                }
            """)
            self.status_pill.setText("STOPPED")
            self.status_pill.setStyleSheet("background-color: #1E293B; color: #94A3B8; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; font-family: monospace;")
            self.task_desc.setText("Assistant is stopped. Turn ON to begin autonomous work.")

        def _update_status(self, status: str, task):
            self.status_pill.setText(status)
            if task:
                self.task_desc.setText(f"{task.get('title')}: {task.get('description', '')}")

        def _poll_ui(self):
            win = detector.get_active_window()
            self.app_name_label.setText(win.get("app", "Visual Studio Code"))

            # Update history list
            self.history_list.clear()
            for h in autonomous_worker.task_history[:10]:
                self.history_list.addItem(f"[{h.get('timestamp')}] {h.get('app')}: {h.get('title')}")

        def _on_emergency_stop(self):
            automation.emergency_stop()
            autonomous_worker.stop()
            self._set_ui_stopped()
            self.status_pill.setText("EMERGENCY STOP")
            self.status_pill.setStyleSheet("background-color: #7F1D1D; color: #FCA5A5; border: 1px solid #DC2626; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; font-family: monospace;")

        # Window Dragging implementation
        def mousePressEvent(self, event):
            if event.button() == Qt.LeftButton:
                self.old_pos = event.globalPosition().toPoint()

        def mouseMoveEvent(self, event):
            if not self.old_pos.isNull():
                delta = QPoint(event.globalPosition().toPoint() - self.old_pos)
                self.move(self.x() + delta.x(), self.y() + delta.y())
                self.old_pos = event.globalPosition().toPoint()

        def mouseReleaseEvent(self, event):
            self.old_pos = QPoint()

    app = QApplication.instance() or QApplication(sys.argv)
    window = SingleToggleOverlay()
    window.show()
    return app, window
