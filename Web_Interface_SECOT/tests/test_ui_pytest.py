import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException

# Base URL of the application
BASE_URL = "http://localhost:5173"

@pytest.fixture(autouse=True)
def navigate_to_home(driver):
    """Navigate to the home page before each test."""
    driver.get(BASE_URL)
    # Wait for the page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "app-container"))
    )
    return driver

def test_page_title(driver):
    """Test that the page title is correct."""
    assert "SECOT Dashboard" == driver.title

def test_header_exists(driver):
    """Test that the header with the SECOT Dashboard title exists."""
    header = driver.find_element(By.XPATH, "//h1[contains(text(), 'SECOT Dashboard')]")
    assert header.is_displayed()

def test_system_status_section(driver):
    """Test that the System Status section exists and has the correct elements."""
    # Check section title
    status_title = driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]")
    assert status_title.is_displayed()
    
    # Check that the status table exists
    status_table = driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]/following-sibling::div//table")
    assert status_table.is_displayed()
    
    # Check that the table has headers
    headers = status_table.find_elements(By.TAG_NAME, "th")
    assert len(headers) == 3
    assert headers[0].text == "Test Type"
    assert headers[1].text == "Status"
    assert headers[2].text == "State"
    
    # Check that the table has rows for each test type
    rows = status_table.find_elements(By.TAG_NAME, "tr")
    # Header row + 4 test types
    assert len(rows) == 5
    
    # Check specific test types
    test_types = ["MQTT Connection", "DoS Test", "MITM Test", "Deauth Test"]
    for i, test_type in enumerate(test_types, start=1):
        cell = rows[i].find_element(By.XPATH, f".//td[1]")
        assert test_type in cell.text

def test_control_panel_section(driver):
    """Test that the Control Panel section exists and has the correct elements."""
    # Check device selection dropdown
    device_select = driver.find_element(By.ID, "device-select")
    assert device_select.is_displayed()
    
    # Check Network Operations section
    network_ops = driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]")
    assert network_ops.is_displayed()
    
    # Check Network Operations table
    network_table = driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]/following-sibling::div//table")
    assert network_table.is_displayed()
    
    # Check Attack Simulation section
    attack_sim = driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]")
    assert attack_sim.is_displayed()
    
    # Check Attack Simulation table
    attack_table = driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]/following-sibling::div//table")
    assert attack_table.is_displayed()
    
    # Check that the warning message is displayed when no device is selected
    warning = driver.find_element(By.XPATH, "//p[contains(text(), 'No device selected')]")
    assert warning.is_displayed()

def test_device_selection(driver):
    """Test device selection functionality."""
    # Get the device dropdown
    device_select = driver.find_element(By.ID, "device-select")
    
    # Check if there are any devices in the dropdown
    options = device_select.find_elements(By.TAG_NAME, "option")
    assert len(options) > 1  # At least the default "Select a device..." option
    
    # Select the first device (if any besides the default)
    if len(options) > 1:
        options[1].click()
        time.sleep(1)  # Wait for UI to update
        
        # Check if the warning message is gone
        try:
            warning = driver.find_element(By.XPATH, "//p[contains(text(), 'No device selected')]")
            assert not warning.is_displayed()
        except NoSuchElementException:
            # This is expected if the warning is removed from the DOM
            pass
        
        # Check if the "Connected to" message is displayed
        connected_msg = driver.find_element(By.XPATH, "//p[contains(text(), 'Connected to:')]")
        assert connected_msg.is_displayed()
        
        # Check if Execute buttons are enabled
        execute_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Execute')]")
        for button in execute_buttons:
            assert "cursor-not-allowed" not in button.get_attribute("class")

def test_responsive_layout(driver):
    """Test that the layout is responsive."""
    # Test with a mobile viewport
    driver.set_window_size(375, 812)  # iPhone X dimensions
    time.sleep(1)  # Wait for layout to adjust
    
    # Check that the main container is still visible
    container = driver.find_element(By.CLASS_NAME, "app-container")
    assert container.is_displayed()
    
    # Test with a tablet viewport
    driver.set_window_size(768, 1024)  # iPad dimensions
    time.sleep(1)  # Wait for layout to adjust
    
    # Check that the main container is still visible
    container = driver.find_element(By.CLASS_NAME, "app-container")
    assert container.is_displayed()
    
    # Reset to desktop size
    driver.maximize_window()

def test_execute_button_appearance(driver):
    """Test that Execute buttons have the correct appearance."""
    # Get all Execute buttons
    execute_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Execute')]")
    
    # Check that there are buttons for each command
    assert len(execute_buttons) > 0
    
    # Check that the buttons have the correct styling when disabled
    for button in execute_buttons:
        # When no device is selected, buttons should be disabled
        assert ("disabled" in button.get_attribute("disabled") or 
               "cursor-not-allowed" in button.get_attribute("class"))

def test_table_layout(driver):
    """Test that tables have the correct layout."""
    # Check System Status table
    status_table = driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]/following-sibling::div//table")
    
    # Check that the table has the correct width
    assert status_table.get_attribute("class").find("w-full") > -1
    
    # Check Network Operations table
    network_table = driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]/following-sibling::div//table")
    
    # Check that the table has the correct width
    assert network_table.get_attribute("class").find("w-full") > -1
    
    # Check Attack Simulation table
    attack_table = driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]/following-sibling::div//table")
    
    # Check that the table has the correct width
    assert attack_table.get_attribute("class").find("w-full") > -1
