import base64
import os

try:
    if not os.path.exists('firebase-service-account.json'):
        print("ERROR: firebase-service-account.json not found in current directory.")
    else:
        with open('firebase-service-account.json', 'rb') as f:
            data = f.read()
            encoded = base64.b64encode(data).decode()
            with open('creds_b64.txt', 'w') as out:
                out.write(encoded)
        print("SUCCESS: Credentials encoded to creds_b64.txt")
except Exception as e:
    print(f"ERROR: {e}")
