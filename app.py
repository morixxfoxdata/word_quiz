# <<<<<<< HEAD
# •	Flask：アプリ本体
# 	•	render_template：HTMLファイルを表示するため
# 	•	request：ユーザーから送られてきたデータを受け取る
# 	•	jsonify：PythonのデータをJSON形式で返す
# ・	session：ユーザーごとに情報を一時的に保存する仕組み（ここでは間違えた単語）

import random
import os
from dotenv import load_dotenv

from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
import requests
import google.generativeai as genai
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import check_password_hash, generate_password_hash

# 環境変数の読み込み
load_dotenv()
# =======
# from flask import Flask, render_template, request, jsonify, session
# import random
# import csv
# from dotenv import load_dotenv
# import os


# load_dotenv()
# api_key = os.getenv("GEMINI_API_KEY")

# >>>>>>> origin/Ito_test

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your_secret_key")  # セッション用のシークレットキー

# PostgreSQLの接続設定
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)
# ログイン管理（ログインしていない場合はログイン画面にリダイレクト）
login_manager = LoginManager(app)
login_manager.login_view = "login"


# <<<<<<< HEAD
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    words = db.relationship("Word", backref="user", lazy=True)



# # 英単語と日本語訳の辞書
# # アプリの単語リストとして使う
# words = load_words_from_csv("TOEIC_words01.csv")
# =======



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


# def load_words_from_csv(path):
#     words = {}
#     with open(path, newline='', encoding="utf-8") as csvfile:
#         reader = csv.DictReader(csvfile)
#         for row in reader:
#             entry = row.get("entry", "").strip()
#             meaning = row.get("meaning", "").strip()
#             if entry and meaning:
#                 words[entry] = meaning
#     return words


# words = load_words_from_csv("TOEIC_words.csv")
# >>>>>>> origin/Ito_test

@app.route('/')
def start():
    return render_template('start.html')

# @app.route('/test')
# =======
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    entry = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route("/word")
@login_required

def index():
# <<<<<<< HEAD
    # ユーザーの単語リストを取得
    user_words = Word.query.filter_by(user_id=current_user.id).all()

    # ユーザーの単語が登録されていない場合
    if not user_words:
        flash("単語を登録してください。")
        return redirect(url_for("my_words"))

# =======
#     session['wrong_words'] = []  # ← 毎回リセット（開発用）
# >>>>>>> origin/Ito_test
    # セッションの初期化
    if "wrong_words" not in session:
        session["wrong_words"] = []

    # ユーザーの単語からランダムに選択
    word = random.choice(user_words)

    return render_template("index.html", word=word.entry, translation=word.meaning)


@app.route("/mark_word", methods=["POST"])
@login_required
def mark_word():
    data = request.json
    word_entry = data.get("word")
    is_correct = data.get("isCorrect")

    if not is_correct:
        # 間違えた単語をセッションに追加
        wrong_words = session.get("wrong_words", [])

        # 既に追加されていなければ追加
        if word_entry not in wrong_words:
            wrong_words.append(word_entry)
            session["wrong_words"] = wrong_words

    # ユーザーの単語から次の単語をランダムに選択
    user_words = Word.query.filter_by(user_id=current_user.id).all()
    next_word = random.choice(user_words)

    # 間違えた単語が10個貯まったら通知
    show_wrong_words = len(session.get("wrong_words", [])) >= 10

    return jsonify(
        {
            "nextWord": next_word.entry,
            "translation": next_word.meaning,
            "wrongWordsCount": len(session.get("wrong_words", [])),
            "showWrongWords": show_wrong_words,
        }
    )


@app.route("/wrong_words")
@login_required
def wrong_words():
    wrong_words_list = session.get("wrong_words", [])
    wrong_words_with_translation = {}

    # 間違えた単語の意味を取得
    for word_entry in wrong_words_list:
        word = Word.query.filter_by(user_id=current_user.id, entry=word_entry).first()
        if word:
            wrong_words_with_translation[word_entry] = word.meaning

    return render_template("wrong_words.html", wrong_words=wrong_words_with_translation)


@app.route("/reset_wrong_words", methods=["POST"])
def reset_wrong_words():
    # JavaScript 側から POST されたら wrong_words を空にする
    # {"status": "success"} を返して、JS側で「トップに戻る」などの処理ができる
    session["wrong_words"] = []
    return jsonify({"status": "success"})


# <<<<<<< HEAD
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if User.query.filter_by(username=username).first():
            flash("ユーザー名は既に使われています。")
            return redirect(url_for("register"))
        hashed_pw = generate_password_hash(password)
        user = User(username=username, password=hashed_pw)
        db.session.add(user)
        db.session.commit()
        flash("登録が完了しました。ログインしてください。")
        return redirect(url_for("login"))
    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # ログインフォームからユーザー名とパスワードを取得
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for("index"))
        flash("ユーザー名またはパスワードが間違っています。")
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


@app.route("/my_words")
@login_required
def my_words():
    user_words = Word.query.filter_by(user_id=current_user.id).all()
    return render_template("my_words.html", words=user_words)


@app.route("/add_word", methods=["POST"])
@login_required
def add_word():
    entry = request.form["entry"]
    meaning = request.form["meaning"]
    word = Word(entry=entry, meaning=meaning, user_id=current_user.id)
    db.session.add(word)
    db.session.commit()
    flash("単語を追加しました。")
    return redirect(url_for("my_words"))


@app.route("/delete_word/<int:word_id>", methods=["POST"])
@login_required
def delete_word(word_id):
    word = Word.query.get_or_404(word_id)
    if word.user_id != current_user.id:
        flash("削除権限がありません。")
        return redirect(url_for("my_words"))
    db.session.delete(word)
    db.session.commit()
    flash("単語を削除しました。")
    return redirect(url_for("my_words"))



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
# >>>>>>> origin/Ito_test
    app.run(debug=True)
    # このファイルがメインで実行された場合（python app.py）
# •	サーバを起動する
# •	debug=True にするとエラー表示がわかりやすくなる（開発モード）
