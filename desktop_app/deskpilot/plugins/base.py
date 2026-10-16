"""
DeskPilot AI - Application Plugin Base Class
Defines the standard interface for application-specific integrations.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class AppPlugin(ABC):
    @property
    @abstractmethod
    def plugin_name(self) -> str:
        """Name of the plugin"""
        pass

    @abstractmethod
    def can_handle(self, window_info: Dict[str, Any]) -> bool:
        """Determines if this plugin can handle the active foreground window"""
        pass

    @abstractmethod
    def inspect_workspace(self, window_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts deep workspace context (files, AST, sheets, cells, charts)"""
        pass

    @abstractmethod
    def formulate_tasks(self, workspace_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Proposes achievable, high-value tasks ranked by relevance and safety"""
        pass

    @abstractmethod
    def execute_step(self, task: Dict[str, Any], step: Dict[str, Any]) -> Dict[str, Any]:
        """Executes a single step using supported application APIs"""
        pass
