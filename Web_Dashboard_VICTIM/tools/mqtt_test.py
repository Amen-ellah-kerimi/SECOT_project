#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT client setup
client = mqtt.Client()

try:
    # Connect to MQTT broker
    client.connect("172.26.0.1", 1883, 60)
    print("Connected to MQTT broker")
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

        # Wait for 3 seconds
        time.sleep(3)

except KeyboardInterrupt:
    print("Stopping MQTT publisher...")
finally:
    # Disconnect from MQTT broker
    client.loop_stop()
    client.disconnect()
    print("Disconnected from MQTT broker")
