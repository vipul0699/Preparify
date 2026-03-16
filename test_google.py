import urllib.request
import json
import urllib.error

url = 'http://127.0.0.1:8000/api/auth/google/'
data = json.dumps({'token': 'invalid_test_token'}).encode('utf-8')
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=data, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())
