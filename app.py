from flask import Flask, render_template, request, jsonify, session
import random
import csv
from dotenv import load_dotenv
import os
import requests  
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # セッション用のシークレットキー





def generate_sentence_from_words(words):
    load_dotenv()
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    genai.configure(api_key=GOOGLE_API_KEY)

    gemini_pro = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"Please write a sentence using all of: {', '.join(words)}."
    try:
        response = gemini_pro.generate_content(prompt)
        return response.text
    except Exception as e:
        print("❌ Geminiエラー:", e)
        return "❗ Gemini APIの呼び出しに失敗しました。"


def load_words_from_csv(path):
    words = {}
    with open(path, newline='', encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            entry = row.get("entry", "").strip()
            meaning = row.get("meaning", "").strip()
            if entry and meaning:
                words[entry] = meaning
    return words


words = load_words_from_csv("TOEIC_words.csv")

@app.route('/')
def index():
    session['wrong_words'] = []  # ← 毎回リセット（開発用）
    # セッションの初期化
    if 'wrong_words' not in session:
        session['wrong_words'] = []
    
    # ランダムに単語を取得
    word = random.choice(list(words.keys()))
    
    # render_template(...) → index.html に word と translation を渡して表示
    return render_template('index.html', word=word, translation=words[word])

@app.route('/mark_word', methods=['POST'])
def mark_word():
    data = request.json
    word = data.get('word')
    is_correct = data.get('isCorrect')
    
    if not is_correct and word in words:
        # 間違えた単語をセッションに追加
        wrong_words = session.get('wrong_words', [])
        
        # 既に追加されていなければ追加
        if word not in wrong_words:
            wrong_words.append(word)
            session['wrong_words'] = wrong_words
    
    # 次の単語をランダムに選択
    next_word = random.choice(list(words.keys()))
    
    # 間違えた単語が10個貯まったら通知
    show_wrong_words = len(session.get('wrong_words', [])) >= 10
    
    return jsonify({
        'nextWord': next_word,
        'translation': words[next_word],
        'wrongWordsCount': len(session.get('wrong_words', [])),
        'showWrongWords': show_wrong_words
    })

@app.route('/wrong_words')
def wrong_words():
    wrong_words_list = session.get('wrong_words', [])
    wrong_words_with_translation = {word: words[word] for word in wrong_words_list if word in words}
    return render_template('wrong_words.html', wrong_words=wrong_words_with_translation)

@app.route('/reset_wrong_words', methods=['POST'])
def reset_wrong_words():
    # JavaScript 側から POST されたら wrong_words を空にする
	# {"status": "success"} を返して、JS側で「トップに戻る」などの処理ができる
    session['wrong_words'] = []
    return jsonify({'status': 'success'})


@app.route("/generate_sentence", methods=["GET"])
def generate_sentence():
    wrong_words = session.get("wrong_words", [])
    word_list = wrong_words

    # 🟢 Gemini APIで例文生成
    example_sentence = generate_sentence_from_words(word_list)

    # 🟢 プロンプトも表示用に生成
    prompt = f"Please write short and natural English some sentences using all of the following words: {', '.join(word_list)}."

    return render_template("API.html",
                           word_list=word_list,
                           sentence=example_sentence,
                           prompt=prompt)

if __name__ == '__main__':
    app.run(debug=True)
    # このファイルがメインで実行された場合（python app.py）
	# •	サーバを起動する
	# •	debug=True にするとエラー表示がわかりやすくなる（開発モード）