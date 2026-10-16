# DeskPilot AI — Autonomous Desktop Work Assistant

DeskPilot AI is an autonomous Windows desktop productivity assistant that performs real programming and Excel tasks in the background with an ultra-simple **Single ON/OFF Toggle** interface.

---

## 1. Single-Toggle Autonomous Experience

- **ON**: Starts the autonomous background workflow. DeskPilot continuously monitors your active window (VS Code, Visual Studio, or Microsoft Excel), understands the workspace, formulates practical tasks, writes real code or spreadsheet formulas, reviews diffs, runs validation tests, and logs completed work into a persistent Task History without interrupting you for routine approvals.
- **OFF**: Instantly stops new actions, cancels pending operations, and safely finishes or rolls back any uncommitted changes.
- **Hands-Free Operation**: Ordinary reversible tasks execute autonomously; destructive or irreversible actions automatically pause and request authorization.
- **Global Emergency Stop**: Press `Ctrl+Alt+S` or `Esc` to immediately halt all background operations, keystrokes, and file modifications.
- **Rollback & Undo**: Revert any completed autonomous task with 1-click snapshot restoration.

---

## 2. Key Features

1. **Intelligent Screen & Workspace Awareness**
   - Detects active Windows foreground application (`win32gui`, UI Automation).
   - Identifies whether you are working in VS Code, Visual Studio, or Microsoft Excel.
   - Automatically adapts strategy: code analysis, lint diagnostics, or Excel formula/data auditing.

2. **Autonomous Background Worker (`autonomous_worker.py`)**
   - Manages state cycle: `SCANNING` -> `PLANNING` -> `EXECUTING` -> `TESTING` -> `COMPLETED`.
   - Thread-safe cancellation token with graceful shutdown on toggle OFF.
   - Configurable work pace: **Swift** (~1.2s/stage), **Standard** (~2.5s/stage), or **Deliberate** (~4s/stage).

3. **Autonomous Programming in VS Code**
   - Writes clean, incremental Python functions and unit test suites.
   - Fixes genuine bugs and bounds validation issues.
   - Executes tests in a sandboxed runner and verifies exit code 0.

4. **Autonomous Excel Operations**
   - Generates and corrects formulas (`XLOOKUP`, `SUMIFS`, `IFERROR`).
   - Standardizes messy dates (ISO YYYY-MM-DD), trims text, and removes duplicates.
   - Automates regional summary reports and chart generation.
   - Creates timestamped `.bak` recovery files before modifying workbooks.

5. **Streamlined Single-Toggle PySide6 Interface**
   - Large prominent ON/OFF toggle switch.
   - Real-time status badge (`STOPPED`, `SCANNING`, `PLANNING`, `EXECUTING`, `TESTING`, `COMPLETED`).
   - Active application name and current task description card.
   - Persistent task history with timestamps and rollback capabilities.

---

## Project Structure

```
desktop_app/
├── deskpilot/
│   ├── __init__.py
│   ├── config.py             # Settings store (%APPDATA%\DeskPilotAI)
│   ├── app_detector.py       # Active window detection (VS Code, Excel, Visual Studio)
│   ├── screen_reader.py      # UI Automation & privacy-filtered screen reading
│   ├── excel_engine.py       # Excel COM/openpyxl automation & data cleaning
│   ├── vscode_bridge.py      # VS Code CLI & extension communication
│   ├── task_planner.py       # 9-stage AI workflow planner
│   ├── code_editor.py        # Diff engine, small-step code editor, undo history
│   ├── automation.py         # Safe keyboard/mouse automation & emergency stop
│   └── gui/
│       └── floating_window.py # PySide6 floating dark overlay widget
├── tests/
│   ├── test_app_detector.py
│   ├── test_excel_engine.py
│   ├── test_task_planner.py
│   └── test_code_editor.py
├── requirements.txt
├── run.py                    # Main launcher (GUI or CLI mode)
└── README.md
```

---

## Installation & Setup on Windows

### 1. Prerequisites
- **Windows 10 or 11**
- **Python 3.10+** (ensure "Add Python to PATH" is checked during installation)
- Visual Studio Code or Microsoft Excel (optional for standalone mode)

### 2. Create Virtual Environment & Install Dependencies
Open PowerShell or Command Prompt:

```powershell
# Clone or unzip DeskPilot AI
cd desktop_app

# Create a virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### 3. Configure API Key
DeskPilot AI uses Google Gemini Flash for AI orchestration.
Set your API key in your environment or `.env` file:

```powershell
# In PowerShell:
$env:GEMINI_API_KEY="your-gemini-api-key-here"

# Or in Command Prompt:
set GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Run the Application

```powershell
# Launch the PySide6 Floating Desktop Interface
python run.py

# Or launch in CLI mode (no Qt window):
python run.py --cli
```

### 5. Running the Automated Tests

```powershell
python -m unittest discover -s tests
```

---

## Safety & Privacy Guardrails

- **Explicit Screen Capture Consent**: DeskPilot never grabs screenshots without user permission.
- **Privacy Filtering**: Password fields, credential dialogs, and authentication tokens are automatically excluded from UI Automation trees.
- **Global Emergency Stop**: Press `Ctrl+Alt+S` at any time to instantly cancel all pending automation.
- **Non-Destructive Editing**: All code and spreadsheet modifications create rollback snapshots before writing changes.
