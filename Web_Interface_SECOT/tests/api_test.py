import unittest
import requests
import json
import time

class SECOTAPITest(unittest.TestCase):
    """Test suite for the SECOT API endpoints."""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests."""
        cls.base_url = "http://localhost:8000"  # Adjust if your backend runs on a different port
        
    def test_health_endpoint(self):
        """Test the health endpoint."""
        response = requests.get(f"{self.base_url}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        
    def test_get_devices(self):
        """Test the get devices endpoint."""
        response = requests.get(f"{self.base_url}/devices")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        
        # If there are devices, check their structure
        if len(data) > 0:
            device = data[0]
            self.assertIn("id", device)
            self.assertIn("name", device)
            self.assertIn("ip", device)
            self.assertIn("mac", device)
            
    def test_get_status(self):
        """Test the get status endpoint."""
        response = requests.get(f"{self.base_url}/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check that the status contains the expected fields
        self.assertIn("mqtt", data)
        self.assertIn("dos", data)
        self.assertIn("mitm", data)
        self.assertIn("deauth", data)
        self.assertIn("last_updated", data)
        
    def test_scan_network(self):
        """Test the scan network endpoint."""
        # This is a POST request that triggers an action
        response = requests.post(
            f"{self.base_url}/scan",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_start_dos(self):
        """Test the start DoS attack endpoint."""
        response = requests.post(
            f"{self.base_url}/dos/start",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_stop_dos(self):
        """Test the stop DoS attack endpoint."""
        response = requests.post(
            f"{self.base_url}/dos/stop",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_start_mitm(self):
        """Test the start MITM attack endpoint."""
        response = requests.post(
            f"{self.base_url}/mitm/start",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_stop_mitm(self):
        """Test the stop MITM attack endpoint."""
        response = requests.post(
            f"{self.base_url}/mitm/stop",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_trigger_deauth(self):
        """Test the trigger deauthentication endpoint."""
        response = requests.post(
            f"{self.base_url}/deauth",
            json={"device_id": "test_device"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("success", data)
        
    def test_error_handling(self):
        """Test error handling for invalid requests."""
        # Test with missing required field
        response = requests.post(
            f"{self.base_url}/dos/start",
            json={}  # Missing device_id
        )
        self.assertEqual(response.status_code, 400)
        
        # Test with invalid endpoint
        response = requests.get(f"{self.base_url}/invalid_endpoint")
        self.assertEqual(response.status_code, 404)

if __name__ == "__main__":
    unittest.main()
