#!/usr/bin/env python3
"""
DeskPilot AI - Main Entry Point & Desktop Launcher
Starts the intelligent desktop assistant for Visual Studio Code, Visual Studio, and Microsoft Excel.
"""
import sys
import os
import argparse
import logging
from deskpilot.config import config
from deskpilot.app_detector import detector
from deskpilot.automation import automation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("deskpilot.main")


def run_cli_mode():
    """Interactive command-line mode for headless environments or terminal workflows"""
    print("=" * 60)
    print("  DeskPilot AI - Desktop Coding & Excel Assistant")
    print("=" * 60)
    print("Press Ctrl+C to exit. Emergency Stop: Ctrl+Alt+S\n")

    win = detector.get_active_window()
    print(f"Detected Active Window: {win.get('app', 'Unknown')}")
    print(f"Window Title: {win.get('title', '')}")
    
    ctx = detector.parse_workspace_context(win)
    print(f"Target Resource: {ctx.get('resource_name', 'Unknown')}")
    print("\nStarting Desktop Monitor loop...")

    try:
        import time
        while True:
            time.sleep(2)
            cur = detector.get_active_window()
            if cur.get("title") != win.get("title"):
                win = cur
                ctx = detector.parse_workspace_context(win)
                print(f"[Focus Shift] App: {win.get('app')} | Resource: {ctx.get('resource_name')}")
    except KeyboardInterrupt:
        print("\nDeskPilot AI stopped by user.")


def main():
    parser = argparse.ArgumentParser(description="DeskPilot AI - Desktop Coding and Excel Assistant")
    parser.add_argument("--cli", action="store_true", help="Run in terminal CLI mode without PySide6 GUI")
    parser.add_argument("--app", type=str, help="Simulate or focus specific app: vscode, visual_studio, excel")
    args = parser.parse_args()

    # Check for GEMINI_API_KEY
    if not os.environ.get("GEMINI_API_KEY"):
        logger.info("GEMINI_API_KEY not found in environment. Set it in .env or via export GEMINI_API_KEY=...")

    if args.cli:
        run_cli_mode()
    else:
        try:
            from deskpilot.gui.floating_window import create_floating_app
            app_tuple = create_floating_app()
            if app_tuple:
                app, window = app_tuple
                sys.exit(app.exec())
            else:
                logger.warning("Falling back to CLI mode as PySide6 GUI could not be initialized.")
                run_cli_mode()
        except Exception as e:
            logger.error(f"Failed to start GUI: {e}. Switching to CLI mode.")
            run_cli_mode()


if __name__ == "__main__":
    main()
