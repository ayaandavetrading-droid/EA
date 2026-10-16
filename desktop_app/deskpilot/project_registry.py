"""
DeskPilot AI - Persistent Project Registry & SQLite Task Store
Maintains project states, completed tasks, execution histories, and test results.
"""
import os
import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("deskpilot.project_registry")


class ProjectRegistry:
    def __init__(self, db_path: Optional[str] = None):
        if db_path:
            self.db_path = Path(db_path)
        else:
            appdata = os.environ.get("APPDATA")
            if appdata:
                base_dir = Path(appdata) / "DeskPilotAI"
            else:
                base_dir = Path.home() / ".deskpilot"
            base_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = base_dir / "registry.db"

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    path TEXT,
                    language TEXT,
                    category TEXT,
                    status TEXT DEFAULT 'IN_PROGRESS',
                    test_status TEXT DEFAULT 'UNTESTED',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    metadata_json TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    project_id TEXT,
                    title TEXT NOT NULL,
                    app_name TEXT,
                    resource_name TEXT,
                    status TEXT DEFAULT 'PENDING',
                    execution_output TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    FOREIGN KEY(project_id) REFERENCES projects(id)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS context_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    app_name TEXT,
                    resource_name TEXT,
                    context_hash TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def register_project(self, project_id: str, name: str, path: str, language: str, category: str = "General", metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO projects (id, name, path, language, category, status, metadata_json)
                VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', ?)
            """, (project_id, name, path, language, category, json.dumps(metadata or {})))
            conn.commit()
            return self.get_project(project_id)

    def mark_project_completed(self, project_id: str, test_status: str = "PASSED"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE projects
                SET status = 'COMPLETED', test_status = ?, completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (test_status, project_id))
            conn.commit()

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            row = cursor.fetchone()
            if row:
                d = dict(row)
                d["metadata"] = json.loads(d.get("metadata_json") or "{}")
                return d
            return None

    def list_projects(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects ORDER BY created_at DESC LIMIT ?", (limit,))
            results = []
            for row in cursor.fetchall():
                d = dict(row)
                d["metadata"] = json.loads(d.get("metadata_json") or "{}")
                results.append(d)
            return results

    def record_task(self, task_id: str, title: str, app_name: str, resource_name: str, status: str = "COMPLETED", output: str = "", project_id: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO tasks (id, project_id, title, app_name, resource_name, status, execution_output, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (task_id, project_id, title, app_name, resource_name, status, output))
            conn.commit()

    def list_recent_tasks(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]


registry = ProjectRegistry()
