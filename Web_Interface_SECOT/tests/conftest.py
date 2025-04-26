import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from test_helpers import add_screenshot_to_report

@pytest.fixture(scope="session")
def driver():
    """
    Create a WebDriver instance for testing.
    
    This fixture is used by pytest to provide a WebDriver instance to tests.
    """
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode (no GUI)
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Initialize the WebDriver
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    driver.maximize_window()
    
    yield driver
    
    # Teardown
    driver.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Pytest hook to capture screenshots on test failure.
    """
    outcome = yield
    report = outcome.get_result()
    
    # Check if a test failed and if it has a driver fixture
    if report.when == "call" and report.failed:
        driver_fixture = item.funcargs.get("driver")
        if driver_fixture:
            add_screenshot_to_report(driver_fixture, report)
