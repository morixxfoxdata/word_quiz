from flask import Flask, render_template, request, jsonify, session
import random

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # セッション用のシークレットキー

# 英単語と日本語訳の辞書
words = {
    'apple': 'りんご',
    'banana': 'バナナ',
    'cat': '猫',
    'dog': '犬',
    'elephant': '象',
    'flower': '花',
    'guitar': 'ギター',
    'house': '家',
    'ice cream': 'アイスクリーム',
    'jacket': 'ジャケット',
    'keyboard': 'キーボード',
    'lion': 'ライオン',
    'mountain': '山',
    'notebook': 'ノート',
    'orange': 'オレンジ',
    'tree':'木'
}

@app.route('/')
def index():
    # セッションの初期化
    if 'wrong_words' not in session:
        session['wrong_words'] = []
    
    # ランダムに単語を取得
    word = random.choice(list(words.keys()))
    
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
    session['wrong_words'] = []
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)