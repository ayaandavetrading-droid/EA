"""
Tests for Application Plugins
"""
import unittest
from deskpilot.plugins.vscode_plugin import VSCodePlugin
from deskpilot.plugins.excel_plugin import ExcelPlugin
from deskpilot.plugins.trading_plugin import TradingPlugin


class TestPlugins(unittest.TestCase):
    def test_vscode_plugin_routing(self):
        plugin = VSCodePlugin()
        self.assertTrue(plugin.can_handle({"type": "vscode", "title": "app.py - project - Visual Studio Code"}))
        self.assertFalse(plugin.can_handle({"type": "excel", "title": "Sales.xlsx"}))

        ctx = plugin.inspect_workspace({"title": "● order.py - my_store - Visual Studio Code"})
        self.assertEqual(ctx["language"], "Python")
        self.assertTrue(ctx["is_dirty"])

    def test_excel_plugin_routing(self):
        plugin = ExcelPlugin()
        self.assertTrue(plugin.can_handle({"type": "excel", "title": "Finance.xlsx - Excel"}))
        self.assertFalse(plugin.can_handle({"type": "vscode", "title": "test.py"}))

    def test_trading_plugin_routing(self):
        plugin = TradingPlugin()
        self.assertTrue(plugin.can_handle({"type": "browser", "title": "BTCUSD 4h Chart — TradingView"}))
        ctx = plugin.inspect_workspace({"title": "EURUSD Chart — MetaTrader 5"})
        self.assertEqual(ctx["ticker"], "EUR/USD")


if __name__ == "__main__":
    unittest.main()
