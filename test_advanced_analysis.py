#!/usr/bin/env python3
"""
Test script to check advanced fake news detection functionality that uses Ollama
"""

import sys
import os
import json
import requests

def test_advanced_analysis():
    print("Testing Advanced Fake News Detection (using Ollama)...")
    
    # Test with various inputs to see if the advanced analysis works
    test_inputs = [
        "This is a real news article with factual information.",
        "Fake news spreading rapidly on social media platforms.",
        "Breaking news: Scientists discover new breakthrough in medicine."
    ]
    
    print("\nTesting with advanced analysis (news_advanced type):")
    for i, text in enumerate(test_inputs):
        print(f"\nTest {i+1}: '{text[:50]}...'")

        try:
            # Send request to the backend
            response = requests.post(
                "http://localhost:5001/analyze",
                json={"text": text, "type": "news_advanced"},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Status: {data.get('status', 'N/A')}")
                print(f"  Confidence: {data.get('confidence', 'N/A')}")
                print(f"  Reason: {data.get('reason', 'N/A')[:100]}...")
                print(f"  Raw Output Available: {'raw_output' in data}")
                if 'raw_output' in data:
                    print(f"  Raw Output Preview: {str(data['raw_output'])[:100]}...")
            else:
                print(f"  Error: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            print(f"  Error: {e}")

    print("\nTesting with regular news analysis (for comparison):")
    for i, text in enumerate(test_inputs):
        print(f"\nTest {i+1}: '{text[:50]}...'")

        try:
            # Send request to the backend
            response = requests.post(
                "http://localhost:5001/analyze",
                json={"text": text, "type": "news"},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  Status: {data.get('status', 'N/A')}")
                print(f"  Confidence: {data.get('confidence', 'N/A')}")
                print(f"  Reason: {data.get('reason', 'N/A')[:100]}...")
            else:
                print(f"  Error: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    test_advanced_analysis()