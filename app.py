# •	Flask：アプリ本体
# 	•	render_template：HTMLファイルを表示するため
# 	•	request：ユーザーから送られてきたデータを受け取る
# 	•	jsonify：PythonのデータをJSON形式で返す
#　 ・	session：ユーザーごとに情報を一時的に保存する仕組み（ここでは間違えた単語）

from flask import Flask, render_template, request, jsonify, session
import random
import csv

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # セッション用のシークレットキー


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


# 英単語と日本語訳の辞書
# アプリの単語リストとして使う
words = load_words_from_csv("TOEIC_words01.csv")

@app.route('/')
def index():
    #session['wrong_words'] = []  # ← 毎回リセット（開発用）

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

if __name__ == '__main__':
    app.run(debug=True)
    # このファイルがメインで実行された場合（python app.py）
	# •	サーバを起動する
	# •	debug=True にするとエラー表示がわかりやすくなる（開発モード）