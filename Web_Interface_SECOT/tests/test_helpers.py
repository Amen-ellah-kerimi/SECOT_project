import os
import time
from datetime import datetime

def take_screenshot(driver, test_name):
    """
    Take a screenshot when a test fails.
    
    Args:
        driver: Selenium WebDriver instance
        test_name: Name of the test that failed
    
    Returns:
        str: Path to the saved screenshot
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    screenshot_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    
    # Create screenshots directory if it doesn't exist
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
    
    # Generate a unique filename
    filename = f"{test_name}_{timestamp}.png"
    filepath = os.path.join(screenshot_dir, filename)
    
    # Take the screenshot
    driver.save_screenshot(filepath)
    
    return filepath

def add_screenshot_to_report(driver, report):
    """
    Add a screenshot to the pytest HTML report when a test fails.
    
    This function is intended to be used as a pytest hook.
    
    Args:
        driver: Selenium WebDriver instance
        report: pytest report object
    """
    if report.when == "call" and report.failed:
        screenshot_path = take_screenshot(driver, report.nodeid.split("::")[-1])
        if os.path.exists(screenshot_path):
            with open(screenshot_path, "rb") as img_file:
                screenshot_data = img_file.read()
                report.extra = [
                    {
                        "name": "screenshot",
                        "content": screenshot_data,
                        "mime_type": "image/png",
                        "extension": "png",
                    }
                ]
