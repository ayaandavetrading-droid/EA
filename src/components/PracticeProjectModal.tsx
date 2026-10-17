import React from 'react';
import { X, Sparkles, Code2, Database, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export interface PracticeProjectTemplate {
  id: string;
  title: string;
  language: 'python' | 'typescript' | 'javascript' | 'sql';
  category: string;
  description: string;
  primaryFile: string;
  files: Record<string, string>;
  testCommand: string;
  requirements: string[];
}

export const PRACTICE_PROJECTS: PracticeProjectTemplate[] = [
  {
    id: 'py_expense',
    title: 'Python Expense Tracker & CLI',
    language: 'python',
    category: 'Finance & CLI Automation',
    description: 'Categorical expenditure logger with JSON storage, bounds validation, and summary reports.',
    primaryFile: 'expense_tracker.py',
    testCommand: 'python3 -m unittest test_tracker.py',
    requirements: [
      'Positive numeric bounds validation',
      'Category whitespace trimming & defaults',
      'Category breakdown aggregation',
      'Automated unittest coverage'
    ],
    files: {
      'expense_tracker.py': `"""
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
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r", encoding="utf-8") as f:
                self.expenses = json.load(f)

    def add_expense(self, category: str, amount: float, description: str = ""):
        # DeskPilot Autonomous Task: Add validation guards
        if amount <= 0:
            raise ValueError("Expense amount must be strictly positive")
        cleaned_cat = category.strip() if isinstance(category, str) and category.strip() else "General"
        entry = {
            "category": cleaned_cat,
            "amount": float(amount),
            "description": description.strip(),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.expenses.append(entry)
        return entry

    def calculate_total(self) -> float:
        return round(sum(item["amount"] for item in self.expenses), 2)

    def summary_by_category(self) -> dict:
        summary = {}
        for item in self.expenses:
            cat = item.get("category", "General")
            summary[cat] = round(summary.get(cat, 0.0) + item.get("amount", 0.0), 2)
        return summary


if __name__ == "__main__":
    tracker = ExpenseTracker("test_expenses.json")
    tracker.add_expense("Office Supplies", 45.50, "Desk mat")
    tracker.add_expense("Travel", 18.25, "Subway ticket")
    print("Total:", tracker.calculate_total())
    print("Summary:", tracker.summary_by_category())
`,
      'test_tracker.py': `import unittest
from expense_tracker import ExpenseTracker

class TestExpenseTracker(unittest.TestCase):
    def setUp(self):
        self.tracker = ExpenseTracker("test_suite.json")

    def test_add_valid_expense(self):
        item = self.tracker.add_expense("Meals", 25.0, "Lunch")
        self.assertEqual(item["amount"], 25.0)
        self.assertEqual(item["category"], "Meals")
        self.assertEqual(self.tracker.calculate_total(), 25.0)

    def test_negative_amount_raises(self):
        with self.assertRaises(ValueError):
            self.tracker.add_expense("Travel", -10.0)

    def test_zero_amount_raises(self):
        with self.assertRaises(ValueError):
            self.tracker.add_expense("Travel", 0.0)

if __name__ == '__main__':
    unittest.main()
`,
      'README.md': `# Python Expense Tracker CLI
Autonomously designed and verified by DeskPilot AI.

## Usage
Run directly or execute automated tests:
\`\`\`bash
python3 expense_tracker.py
python3 -m unittest test_tracker.py
\`\`\`
`
    }
  },
  {
    id: 'ts_lru',
    title: 'TypeScript O(1) LRU Cache',
    language: 'typescript',
    category: 'Algorithms & Data Structures',
    description: 'High-performance Least Recently Used cache with doubly-linked list, capacity eviction, and generic typing.',
    primaryFile: 'lru_cache.ts',
    testCommand: 'tsx lru_cache.test.ts',
    requirements: [
      'Generic key/value type parameters <K, V>',
      'O(1) time complexity for get and put',
      'Automatic eviction of oldest item upon capacity breach'
    ],
    files: {
      'lru_cache.ts': `/**
 * TypeScript LRU Cache Implementation
 * Time Complexity: O(1) Get / Put
 */
class DNode<K, V> {
  key: K;
  value: V;
  prev: DNode<K, V> | null = null;
  next: DNode<K, V> | null = null;
  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, DNode<K, V>>();
  private head: DNode<K, V>;
  private tail: DNode<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) throw new Error("Capacity must be positive");
    this.capacity = capacity;
    this.head = new DNode<K, V>(null as any, null as any);
    this.tail = new DNode<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.remove(node);
    this.addFront(node);
    return node.value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) {
      this.remove(this.map.get(key)!);
    }
    const newNode = new DNode(key, value);
    this.addFront(newNode);
    this.map.set(key, newNode);

    if (this.map.size > this.capacity) {
      const lru = this.tail.prev!;
      this.remove(lru);
      this.map.delete(lru.key);
    }
  }

  size(): number {
    return this.map.size;
  }

  private remove(node: DNode<K, V>) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private addFront(node: DNode<K, V>) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }
}

const cache = new LRUCache<string, number>(2);
cache.put("A", 100);
cache.put("B", 200);
console.log("Cached A:", cache.get("A"));
cache.put("C", 300); // evicts B
console.log("Cached B (evicted):", cache.get("B") ?? "Evicted as expected");
console.log("Cached C:", cache.get("C"));
console.log("✔ TypeScript LRU Cache executed cleanly!");
`,
      'lru_cache.test.ts': `import { LRUCache } from './lru_cache';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error("Assertion failed: " + msg);
}

const c = new LRUCache<string, string>(3);
c.put("1", "one");
c.put("2", "two");
c.put("3", "three");

assert(c.get("1") === "one", "Should retrieve 'one'");
assert(c.size() === 3, "Size should be 3");

c.put("4", "four");
assert(c.get("2") === undefined, "'2' should be evicted");
assert(c.get("1") === "one", "'1' was accessed and kept");

console.log("✔ All TypeScript LRUCache unit tests passed cleanly!");
`,
      'README.md': `# TypeScript LRU Cache
Autonomously designed and verified by DeskPilot AI.
`
    }
  },
  {
    id: 'sql_retail',
    title: 'SQLite Store Inventory & Revenue Queries',
    language: 'sql',
    category: 'Relational Database & SQL',
    description: 'Relational schema with table constraints, sample seed transactions, and top-selling revenue reports.',
    primaryFile: 'schema.sql',
    testCommand: 'python3 -c "import sqlite3..."',
    requirements: [
      'Normalized schema for categories, products, and orders',
      'Check constraints on non-negative price and inventory',
      'Revenue aggregation grouped by category'
    ],
    files: {
      'schema.sql': `-- DeskPilot Autonomous SQL Project: Retail Inventory
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    title TEXT NOT NULL,
    price REAL NOT NULL CHECK(price > 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    order_date DATE NOT NULL,
    total_amount REAL NOT NULL
);

INSERT INTO categories (name) VALUES ('Electronics'), ('Apparel'), ('Office Supplies');

INSERT INTO products (category_id, title, price, stock_quantity, reorder_level) VALUES
(1, 'Noise-Cancelling Headphones', 149.99, 45, 15),
(1, 'Wireless Keyboard', 89.50, 8, 12),
(2, 'Merino Wool Sweater', 65.00, 22, 10),
(3, 'Mesh Office Chair', 220.00, 5, 8);

INSERT INTO orders (product_id, quantity, order_date, total_amount) VALUES
(1, 3, '2026-03-01', 449.97),
(2, 2, '2026-03-02', 179.00),
(1, 1, '2026-03-03', 149.99),
(4, 2, '2026-03-04', 440.00);

-- Inventory Status Query
SELECT p.title, p.stock_quantity, p.reorder_level,
       CASE WHEN p.stock_quantity <= p.reorder_level THEN 'REORDER_NOW' ELSE 'HEALTHY' END AS stock_status
FROM products p
ORDER BY p.stock_quantity ASC;

-- Revenue by Category
SELECT c.name AS category, SUM(o.total_amount) AS revenue, COUNT(o.order_id) AS total_orders
FROM orders o
JOIN products p ON o.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
GROUP BY c.name
ORDER BY revenue DESC;
`,
      'README.md': `# Retail Store Inventory Database
Autonomously designed and verified by DeskPilot AI in SQLite.
`
    }
  },
  {
    id: 'node_queue',
    title: 'Node.js Async Task Queue & Worker',
    language: 'javascript',
    category: 'Backend Web API & Microservices',
    description: 'Asynchronous task queue with priority weighting, idempotency safeguards, and sequential execution.',
    primaryFile: 'queue_worker.mjs',
    testCommand: 'node queue_worker.mjs',
    requirements: [
      'Task prioritization (higher priority executed first)',
      'Idempotency filter to prevent duplicate task execution',
      'Async execution with status logging'
    ],
    files: {
      'queue_worker.mjs': `/**
 * DeskPilot Node.js Autonomous Queue Worker
 */
export class TaskQueue {
  constructor() {
    this.queue = [];
    this.processed = new Set();
  }

  enqueue(taskId, payload, priority = 1) {
    if (this.processed.has(taskId)) {
      return { status: "ignored", reason: "duplicate_task_id" };
    }
    const item = { taskId, payload, priority, addedAt: Date.now() };
    this.queue.push(item);
    this.queue.sort((a, b) => b.priority - a.priority);
    return { status: "enqueued", taskId };
  }

  async processNext() {
    if (this.queue.length === 0) return null;
    const task = this.queue.shift();
    this.processed.add(task.taskId);
    return {
      taskId: task.taskId,
      result: \`Successfully executed \${task.payload.action}\`,
      processedAt: new Date().toISOString()
    };
  }

  getPendingCount() {
    return this.queue.length;
  }
}

async function main() {
  const q = new TaskQueue();
  q.enqueue("task-1", { action: "Generate Monthly Invoice" }, 1);
  q.enqueue("task-2", { action: "Emergency System Backup" }, 5);
  q.enqueue("task-1", { action: "Duplicate Test" }, 1);

  console.log("Pending items in queue:", q.getPendingCount());
  const res1 = await q.processNext();
  console.log("Processed highest priority task:", res1.taskId, "-", res1.result);
  const res2 = await q.processNext();
  console.log("Processed second task:", res2.taskId, "-", res2.result);
  console.log("✔ Node.js Queue Worker executed with 0 errors!");
}

main();
`,
      'README.md': `# Node.js Queue Worker
Autonomously created by DeskPilot AI.
`
    }
  },
  {
    id: 'py_cleaner',
    title: 'Python CSV Data Cleaner & Normalizer',
    language: 'python',
    category: 'Data Engineering & Analytics',
    description: 'Utility for normalising whitespace, standardising date formats to ISO-8601, and deduplicating record sets.',
    primaryFile: 'cleaner.py',
    testCommand: 'python3 -m unittest test_cleaner.py',
    requirements: [
      'Trim padding whitespace on text fields',
      'Remove exact duplicate rows by unique identifier',
      'Automated test assertions with unittest'
    ],
    files: {
      'cleaner.py': `"""
DeskPilot: Python CSV Cleaner Utility
"""
def clean_records(records, dedupe_key="id"):
    seen = set()
    cleaned = []
    for r in records:
        key = r.get(dedupe_key)
        if key in seen:
            continue
        seen.add(key)
        new_r = {}
        for k, v in r.items():
            if isinstance(v, str):
                new_r[k] = v.strip()
            else:
                new_r[k] = v
        cleaned.append(new_r)
    return cleaned

if __name__ == '__main__':
    raw = [
        {"id": 1, "name": " Acme  ", "val": 100},
        {"id": 1, "name": "Acme", "val": 100},
        {"id": 2, "name": "Beta Corp ", "val": 250}
    ]
    res = clean_records(raw)
    print(f"Cleaned {len(raw)} records down to {len(res)} deduplicated records.")
    print(res)
`,
      'test_cleaner.py': `import unittest
from cleaner import clean_records

class TestCleaner(unittest.TestCase):
    def test_deduplication(self):
        items = [{"id": 1, "name": "A "}, {"id": 1, "name": "A"}]
        res = clean_records(items)
        self.assertEqual(len(res), 1)
        self.assertEqual(res[0]["name"], "A")

if __name__ == '__main__':
    unittest.main()
`,
      'README.md': `# Python CSV Cleaner
Autonomously designed and verified by DeskPilot AI.
`
    }
  }
];

interface PracticeProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (template: PracticeProjectTemplate) => void;
}

export const PracticeProjectModal: React.FC<PracticeProjectModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#111622] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161C2C]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Practice Projects Studio
              </h3>
              <p className="text-xs text-slate-400">
                Select an isolated development sandbox to practice coding and testing without affecting your main work.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {PRACTICE_PROJECTS.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                onSelectProject(proj);
                onClose();
              }}
              className="p-4 bg-[#182030] hover:bg-[#1E273B] border border-slate-800 hover:border-sky-500/50 rounded-xl cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      {proj.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-sky-300 border border-slate-700">
                      {proj.language.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400">({proj.category})</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-slate-900/80 text-slate-300 rounded border border-slate-800"
                      >
                        ✓ {req}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                    <span>Entry File: {proj.primaryFile}</span>
                    <span>•</span>
                    <span>Test Command: {proj.testCommand}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="px-3 py-1.5 text-xs font-semibold bg-sky-500 group-hover:bg-sky-400 text-slate-950 rounded-lg shadow-sm transition-colors">
                    Load Sandbox
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
