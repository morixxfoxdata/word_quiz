import os
from dotenv import load_dotenv
# import google.generativeai as genai
from google import genai

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

gemini_pro = genai.GenerativeModel("gemini-1.5-flash")

prompt = "こんにちは　と言ってください"
response = gemini_pro.generate_content(prompt)
print(response.text)