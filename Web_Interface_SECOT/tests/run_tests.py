import argparse
import subprocess
import sys
import os

def setup_environment():
    """Install required dependencies."""
    print("Installing test dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def run_ui_tests(headless=True):
    """Run UI tests with Selenium."""
    print("\n=== Running UI Tests ===")
    cmd = [sys.executable, "-m", "unittest", "ui_test.py"]
    subprocess.run(cmd)

def run_api_tests():
    """Run API tests."""
    print("\n=== Running API Tests ===")
    cmd = [sys.executable, "-m", "unittest", "api_test.py"]
    subprocess.run(cmd)

def run_all_tests(headless=True):
    """Run all tests."""
    run_ui_tests(headless)
    run_api_tests()

def run_pytest_tests():
    """Run tests using pytest with HTML report."""
    print("\n=== Running Tests with Pytest and Generating Report ===")
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "test_ui_pytest.py",
        "api_test.py",
        "--html=report.html",
        "--self-contained-html",
        "-v"
    ]
    subprocess.run(cmd)
    print(f"Report generated: {os.path.abspath('report.html')}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run SECOT interface tests")
    parser.add_argument("--ui", action="store_true", help="Run UI tests only")
    parser.add_argument("--api", action="store_true", help="Run API tests only")
    parser.add_argument("--no-headless", action="store_true", help="Run UI tests with browser visible")
    parser.add_argument("--pytest", action="store_true", help="Run tests with pytest and generate HTML report")
    parser.add_argument("--setup", action="store_true", help="Install dependencies before running tests")

    args = parser.parse_args()

    if args.setup:
        setup_environment()

    if args.pytest:
        run_pytest_tests()
    elif args.ui:
        run_ui_tests(not args.no_headless)
    elif args.api:
        run_api_tests()
    else:
        run_all_tests(not args.no_headless)
