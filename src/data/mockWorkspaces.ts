import { ExcelGridData, WorkspaceState } from '../types/deskpilot';

export const INITIAL_VSCODE_WORKSPACE: WorkspaceState = {
  appType: 'vscode',
  appName: 'Visual Studio Code',
  activeResource: 'expense_tracker.py',
  isDirty: true,
  content: `"""
DeskPilot Starter: Python Expense Tracker
Tracks categorical expenditures and generates monthly summaries.
"""
import os
import json
from datetime import datetime

class ExpenseTracker:
    def __init__(self, storage_path="expenses.json"):
        self.storage_path = storage_path
        self.expenses = []
        self.load()

    def load(self):
        """Loads recorded expenses from JSON file"""
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r", encoding="utf-8") as f:
                self.expenses = json.load(f)

    def add_expense(self, category: str, amount: float, description: str = ""):
        # BUG: missing negative amount check and category whitespace trimming
        entry = {
            "category": category,
            "amount": amount,
            "description": description,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.expenses.append(entry)
        return entry

    def calculate_total(self) -> float:
        # Intentionally incomplete aggregation
        return sum(item["amount"] for item in self.expenses)

    def summary_by_category(self) -> dict:
        summary = {}
        for item in self.expenses:
            cat = item.get("category", "General")
            summary[cat] = summary.get(cat, 0.0) + item.get("amount", 0.0)
        return summary


if __name__ == "__main__":
    tracker = ExpenseTracker("test_expenses.json")
    tracker.add_expense("Travel", 45.50, "Metro pass")
    tracker.add_expense("Meals", 18.25, "Lunch team")
    print("Total:", tracker.calculate_total())
    print("Summary:", tracker.summary_by_category())
`,
  diagnostics: [
    'Warning: add_expense does not validate positive numeric bounds on amount.',
    'Missing unit tests for edge-case category grouping.',
    'Storage file handle not protected with error handling.'
  ],
  openFiles: ['expense_tracker.py', 'test_tracker.py', 'requirements.txt']
};

export const INITIAL_EXCEL_WORKSPACE: ExcelGridData = {
  title: 'Q3 Regional Sales & Invoices',
  sheetName: 'Sales_Data',
  headers: ['Order_ID', 'Date', 'Customer_Name', 'Region', 'Units', 'Unit_Price', 'Discount', 'Total_Amount', 'Margin_Rate'],
  rows: [
    ['ORD-101', '2026-03-01', 'Acme Logistics  ', 'North', 140, 45.0, 0.05, 5985.0, 0.32],
    ['ORD-102', '3/2/2026', 'Global Tech Inc', 'South', 80, 120.0, 0.10, 8640.0, 0.28],
    ['ORD-103', '2026-03-03', '  Vertex Health', 'East', 210, 35.0, 0.00, 7350.0, 0.40],
    ['ORD-104', '2026-03-04', 'Omni Corp', 'West', 95, 85.0, 0.05, 7671.25, 0.35],
    ['ORD-105', '03/05/2026', 'Acme Logistics  ', 'North', 140, 45.0, 0.05, 5985.0, 0.32], // Duplicate!
    ['ORD-106', '2026-03-06', 'Starlight Media', 'East', 300, 15.0, 0.15, 3825.0, 0.22],
    ['ORD-107', '2026-03-07', 'Delta Retail', 'South', 50, 65.0, 0.00, 3250.0, '#DIV/0!'], // Error!
    ['ORD-108', '2026-03-08', 'Pinnacle Systems', 'North', 180, 52.0, 0.08, 8611.2, 0.31],
    ['ORD-109', '2026-03-09', 'BlueWave Energy', 'West', 120, 95.0, 0.12, 10032.0, 0.34],
    ['ORD-110', '2026-03-10', 'Apex Industrial', 'East', 75, 110.0, 0.05, 7837.5, 0.29]
  ],
  formulas: {
    'H2': '=E2*F2*(1-G2)',
    'H3': '=E3*F3*(1-G3)',
    'H4': '=E4*F4*(1-G4)',
    'H5': '=E5*F5*(1-G5)',
    'H6': '=E6*F6*(1-G6)',
    'H7': '=E7*F7*(1-G7)',
    'H8': '=E8*F8*(1-G8)',
    'H9': '=E9*F9*(1-G9)',
    'H10': '=E10*F10*(1-G10)',
    'H11': '=E11*F11*(1-G11)'
  }
};

export const INITIAL_VS_WORKSPACE: WorkspaceState = {
  appType: 'visual_studio',
  appName: 'Visual Studio',
  activeResource: 'OrderProcessor.cs',
  isDirty: false,
  content: `using System;
using System.Collections.Generic;
using System.Linq;

namespace DeskPilot.Enterprise
{
    public class OrderProcessor
    {
        private readonly List<OrderRecord> _orders = new();

        public void Enqueue(OrderRecord order)
        {
            if (order == null) throw new ArgumentNullException(nameof(order));
            _orders.Add(order);
        }

        public decimal ComputeGrossRevenue()
        {
            return _orders.Sum(o => o.Amount);
        }
    }

    public record OrderRecord(string OrderId, decimal Amount, string Customer);
}
`,
  diagnostics: ['Build succeeded with 0 warnings (Debug | Any CPU)'],
  openFiles: ['OrderProcessor.cs', 'OrderProcessorTests.cs', 'App.config']
};
