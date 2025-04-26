# SECOT Interface Tests

This directory contains automated tests for the SECOT web interface and API.

## Prerequisites

- Python 3.8 or higher
- Chrome browser installed (for UI tests)
- SECOT frontend running on http://localhost:5173
- SECOT backend running on http://localhost:8000

## Setup

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Or use the setup flag with the test runner:

```bash
python run_tests.py --setup
```

## Running Tests

### Run all tests

```bash
python run_tests.py
```

### Run only UI tests

```bash
python run_tests.py --ui
```

### Run only API tests

```bash
python run_tests.py --api
```

### Run UI tests with visible browser (not headless)

```bash
python run_tests.py --ui --no-headless
```

### Run tests with pytest and generate HTML report

```bash
python run_tests.py --pytest
```

This will run the tests using pytest and create a `report.html` file in the tests directory with detailed test results, including screenshots of failed tests.

## Test Structure

- `ui_test.py`: Contains Selenium tests for the web interface using unittest
- `test_ui_pytest.py`: Contains Selenium tests for the web interface using pytest
- `api_test.py`: Contains API tests for the backend endpoints
- `run_tests.py`: Test runner script with various options
- `conftest.py`: Pytest configuration and fixtures
- `test_helpers.py`: Helper functions for tests (e.g., taking screenshots)

## Test Cases

### UI Tests

1. **Page Title Test**: Verifies the page title is "SECOT Dashboard"
2. **Header Test**: Checks that the header with the SECOT Dashboard title exists
3. **System Status Section Test**: Verifies the System Status section and its elements
4. **Control Panel Section Test**: Checks the Control Panel section and its elements
5. **Device Selection Test**: Tests the device selection functionality
6. **Responsive Layout Test**: Verifies the layout is responsive on different screen sizes
7. **Execute Button Appearance Test**: Checks that Execute buttons have the correct appearance
8. **Table Layout Test**: Verifies tables have the correct layout

### API Tests

1. **Health Endpoint Test**: Verifies the health endpoint returns status "ok"
2. **Get Devices Test**: Checks the devices endpoint returns a list of devices
3. **Get Status Test**: Verifies the status endpoint returns the expected fields
4. **Scan Network Test**: Tests the scan network endpoint
5. **DoS Attack Tests**: Tests starting and stopping DoS attacks
6. **MITM Attack Tests**: Tests starting and stopping MITM attacks
7. **Deauthentication Test**: Tests triggering deauthentication
8. **Error Handling Test**: Verifies proper error handling for invalid requests
