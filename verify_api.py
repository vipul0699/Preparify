import urllib.request
import json
import uuid

BASE_URL = "http://127.0.0.1:8000/api/quiz"

def post_json(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode('utf-8')}")
        return None

# 1. Ingest
print("--- 1. Ingest Material ---")
ingest_payload = {
    "topic": "Python Basics",
    "content": "Python is a high-level, interpreted programming language. It was created by Guido van Rossum and released in 1991. Python emphasizes readability."
}
resp = post_json(f"{BASE_URL}/ingest/", ingest_payload)
print(resp)

# 2. Generate
print("\n--- 2. Generate Quiz ---")
generate_payload = {
    "topic": "Python Basics",
    "difficulty": "Easy"
}
quiz_data = post_json(f"{BASE_URL}/generate/", generate_payload)
print(json.dumps(quiz_data, indent=2))

if quiz_data and quiz_data.get('questions'):
    first_q = quiz_data['questions'][0]
    q_id = first_q['id']
    
    # 3. Submit
    print(f"\n--- 3. Submit Answer for QID: {q_id} ---")
    submit_payload = {
        "question_id": q_id,
        "user_answer": "Guido van Rossum"
    }
    evaluation = post_json(f"{BASE_URL}/submit/", submit_payload)
    print(json.dumps(evaluation, indent=2))
else:
    print("No questions generated.")
