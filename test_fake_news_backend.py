#!/usr/bin/env python3
"""
Test script to check fake news detection functionality from backend
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Import modules from backend
from fake_news_detection import detect_fake_news
from analyzer import analyze_content

def test_fake_news_detection():
    print("Testing Fake News Detection...")
    
    # Test with various inputs to see if the model produces varying results
    test_inputs = [
        "This is a real news article with factual information.",
        "Fake news spreading rapidly on social media platforms.",
        "Breaking news: Scientists discover new breakthrough in medicine.",
        "This story is completely false and made up.",
        "Unverified claims about political candidates.",
        "Study shows benefits of regular exercise for heart health."
    ]
    
    print("\nTesting with pre-trained model:")
    for i, text in enumerate(test_inputs):
        print(f"\nTest {i+1}: '{text[:50]}...'")

        try:
            result = detect_fake_news(text)
            print(f"  Status: {result['status']}")
            print(f"  Confidence: {result['confidence']}")
            print(f"  Reason: {result['reason'][:100]}...")
            print(f"  Is Fake: {result['is_fake']}")
        except Exception as e:
            print(f"  Error: {e}")
    
    print("\nTesting with analyze_content function:")
    for i, text in enumerate(test_inputs):
        print(f"\nTest {i+1}: '{text[:50]}...'")

        try:
            result = analyze_content(text, analysis_type="news")
            print(f"  Status: {result['status']}")
            print(f"  Confidence: {result['confidence']}")
            print(f"  Reason: {result['reason'][:100]}...")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    test_fake_news_detection()