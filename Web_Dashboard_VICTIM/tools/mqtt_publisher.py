#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json
import time
import random
import argparse
from datetime import datetime

# Parse command line arguments
parser = argparse.ArgumentParser(description='MQTT Publisher for IoT Sensor Data')
parser.add_argument('--broker', type=str, default='172.26.0.1', help='MQTT broker address')
parser.add_argument('--port', type=int, default=1883, help='MQTT broker port')
parser.add_argument('--interval', type=float, default=3.0, help='Publish interval in seconds')
args = parser.parse_args()

# MQTT client setup
client = mqtt.Client()

# Connect to MQTT broker
try:
    client.connect(args.broker, args.port, 60)
    print(f"Connected to MQTT broker at {args.broker}:{args.port}")
except Exception as e:
    print(f"Failed to connect to MQTT broker: {e}")
    exit(1)

# Start the MQTT client loop
client.loop_start()

try:
    while True:
        # Generate random sensor data
        temperature = 20 + random.random() * 10  # Temperature between 20-30°C
        humidity = 30 + random.random() * 40     # Humidity between 30-70%

        # Current timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")

        # Create JSON payloads
        temp_payload = json.dumps({
            "value": round(temperature, 1),
            "timestamp": timestamp
        })

        humidity_payload = json.dumps({
            "value": round(humidity, 1),
            "timestamp": timestamp
        })

        # Publish to MQTT topics
        client.publish("sensors/temperature", temp_payload)
        print(f"Published to sensors/temperature: {temp_payload}")

        client.publish("sensors/humidity", humidity_payload)
        print(f"Published to sensors/humidity: {humidity_payload}")

        # Wait for the specified interval
        time.sleep(args.interval)

except KeyboardInterrupt:
    print("Stopping MQTT publisher...")
finally:
    # Disconnect from MQTT broker
    client.loop_stop()
    client.disconnect()
    print("Disconnected from MQTT broker")
