import requests
import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)
if response.status_code == 200:
    models = response.json().get("models", [])
    print(":white_check_mark: 利用可能なモデル一覧:\n")
    for model in models:
        name = model.get("name")
        desc = model.get("description", "")
        print(f":small_blue_diamond: {name}\n    {desc}\n")
else:
    print(f":x: エラー: {response.status_code}")
    print(response.text)