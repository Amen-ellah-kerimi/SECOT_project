import time
import unittest
import sys
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from test_helpers import take_screenshot

class SECOTInterfaceTest(unittest.TestCase):
    """Test suite for the SECOT web interface."""

    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests."""
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode (no GUI)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        # Initialize the WebDriver
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        cls.driver.maximize_window()

        # Base URL of the application
        cls.base_url = "http://localhost:5173"

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests have run."""
        cls.driver.quit()

    def setUp(self):
        """Set up before each test method."""
        self.driver.get(self.base_url)
        # Wait for the page to load
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "app-container"))
        )

    def tearDown(self):
        """Clean up after each test method."""
        # Take a screenshot if the test failed
        if hasattr(self, '_outcome') and self._outcome.errors:
            for method, error in self._outcome.errors:
                if error:
                    take_screenshot(self.driver, self._testMethodName)

    def test_page_title(self):
        """Test that the page title is correct."""
        self.assertEqual("SECOT Dashboard", self.driver.title)

    def test_header_exists(self):
        """Test that the header with the SECOT Dashboard title exists."""
        header = self.driver.find_element(By.XPATH, "//h1[contains(text(), 'SECOT Dashboard')]")
        self.assertTrue(header.is_displayed())

    def test_system_status_section(self):
        """Test that the System Status section exists and has the correct elements."""
        # Check section title
        status_title = self.driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]")
        self.assertTrue(status_title.is_displayed())

        # Check that the status table exists
        status_table = self.driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]/following-sibling::div//table")
        self.assertTrue(status_table.is_displayed())

        # Check that the table has headers
        headers = status_table.find_elements(By.TAG_NAME, "th")
        self.assertEqual(len(headers), 3)
        self.assertEqual(headers[0].text, "Test Type")
        self.assertEqual(headers[1].text, "Status")
        self.assertEqual(headers[2].text, "State")

        # Check that the table has rows for each test type
        rows = status_table.find_elements(By.TAG_NAME, "tr")
        # Header row + 4 test types
        self.assertEqual(len(rows), 5)

        # Check specific test types
        test_types = ["MQTT Connection", "DoS Test", "MITM Test", "Deauth Test"]
        for i, test_type in enumerate(test_types, start=1):
            cell = rows[i].find_element(By.XPATH, f".//td[1]")
            self.assertTrue(test_type in cell.text)

    def test_control_panel_section(self):
        """Test that the Control Panel section exists and has the correct elements."""
        # Check device selection dropdown
        device_select = self.driver.find_element(By.ID, "device-select")
        self.assertTrue(device_select.is_displayed())

        # Check Network Operations section
        network_ops = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]")
        self.assertTrue(network_ops.is_displayed())

        # Check Network Operations table
        network_table = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]/following-sibling::div//table")
        self.assertTrue(network_table.is_displayed())

        # Check Attack Simulation section
        attack_sim = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]")
        self.assertTrue(attack_sim.is_displayed())

        # Check Attack Simulation table
        attack_table = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]/following-sibling::div//table")
        self.assertTrue(attack_table.is_displayed())

        # Check that the warning message is displayed when no device is selected
        warning = self.driver.find_element(By.XPATH, "//p[contains(text(), 'No device selected')]")
        self.assertTrue(warning.is_displayed())

    def test_device_selection(self):
        """Test device selection functionality."""
        # Get the device dropdown
        device_select = self.driver.find_element(By.ID, "device-select")

        # Check if there are any devices in the dropdown
        options = device_select.find_elements(By.TAG_NAME, "option")
        self.assertTrue(len(options) > 1)  # At least the default "Select a device..." option

        # Select the first device (if any besides the default)
        if len(options) > 1:
            options[1].click()
            time.sleep(1)  # Wait for UI to update

            # Check if the warning message is gone
            try:
                warning = self.driver.find_element(By.XPATH, "//p[contains(text(), 'No device selected')]")
                self.assertFalse(warning.is_displayed())
            except NoSuchElementException:
                # This is expected if the warning is removed from the DOM
                pass

            # Check if the "Connected to" message is displayed
            connected_msg = self.driver.find_element(By.XPATH, "//p[contains(text(), 'Connected to:')]")
            self.assertTrue(connected_msg.is_displayed())

            # Check if Execute buttons are enabled
            execute_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Execute')]")
            for button in execute_buttons:
                self.assertFalse("cursor-not-allowed" in button.get_attribute("class"))

    def test_responsive_layout(self):
        """Test that the layout is responsive."""
        # Test with a mobile viewport
        self.driver.set_window_size(375, 812)  # iPhone X dimensions
        time.sleep(1)  # Wait for layout to adjust

        # Check that the main container is still visible
        container = self.driver.find_element(By.CLASS_NAME, "app-container")
        self.assertTrue(container.is_displayed())

        # Test with a tablet viewport
        self.driver.set_window_size(768, 1024)  # iPad dimensions
        time.sleep(1)  # Wait for layout to adjust

        # Check that the main container is still visible
        container = self.driver.find_element(By.CLASS_NAME, "app-container")
        self.assertTrue(container.is_displayed())

        # Reset to desktop size
        self.driver.maximize_window()

    def test_execute_button_appearance(self):
        """Test that Execute buttons have the correct appearance."""
        # Get all Execute buttons
        execute_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Execute')]")

        # Check that there are buttons for each command
        self.assertTrue(len(execute_buttons) > 0)

        # Check that the buttons have the correct styling when disabled
        for button in execute_buttons:
            # When no device is selected, buttons should be disabled
            self.assertTrue("disabled" in button.get_attribute("disabled") or
                           "cursor-not-allowed" in button.get_attribute("class"))

    def test_table_layout(self):
        """Test that tables have the correct layout."""
        # Check System Status table
        status_table = self.driver.find_element(By.XPATH, "//h2[contains(text(), 'System Status')]/following-sibling::div//table")

        # Check that the table has the correct width
        self.assertTrue(status_table.get_attribute("class").find("w-full") > -1)

        # Check Network Operations table
        network_table = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Network Operations')]/following-sibling::div//table")

        # Check that the table has the correct width
        self.assertTrue(network_table.get_attribute("class").find("w-full") > -1)

        # Check Attack Simulation table
        attack_table = self.driver.find_element(By.XPATH, "//h3[contains(text(), 'Attack Simulation')]/following-sibling::div//table")

        # Check that the table has the correct width
        self.assertTrue(attack_table.get_attribute("class").find("w-full") > -1)

if __name__ == "__main__":
    unittest.main()
