import csv
import os
import random
from datetime import datetime

from dotenv import load_dotenv
from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    session, # ユーザ情報を一時的に保存
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
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# import requests
# import google.generativeai as genai
from google import genai
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)
app = Flask(__name__)
app.secret_key = os.getenv(
    "SECRET_KEY", "your_secret_key"
)  # セッション用のシークレットキー

# PostgreSQLの接続設定
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
print("DB URL:", app.config["SQLALCHEMY_DATABASE_URI"])
db = SQLAlchemy(app)
migrate = Migrate(app, db)
# ログイン管理（ログインしていない場合はログイン画面にリダイレクト）
login_manager = LoginManager(app)
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ---------------- SQLAlchemyのモデル ----------------
class User(UserMixin, db.Model):
    # columns
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    # relationship
    wrong_words = db.relationship("WrongWord", backref="user", lazy=True)
    decks = db.relationship("Deck", backref="owner", lazy=True)


class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    entry = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.String(200), nullable=False)
    deck_id = db.Column(db.Integer, db.ForeignKey("deck.id"), nullable=False)
    # relationship
    wrong_words = db.relationship("WrongWord", backref="word", lazy=True)


class WrongWord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    count = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey("word.id"), nullable=False)
    # word = db.relationship("Word", backref="wrong_words")


class Deck(db.Model):
    # columns
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    # relationship
    words = db.relationship("Word", backref="decks", lazy=True)


# ---------------- 関数 ----------------


def generate_sentence_from_words(words):
    prompt = f"以下の単語をすべて含む、文章として自然な英文を作成し、改行で英文と訳文の2行を無加工で返してください。: {', '.join(words)}."
    try:
        # response = gemini_pro.generate_content(prompt)
        response = client.models.generate_content(model="", contents=prompt)#gemini-1.5-flash

        # 改行で英文と訳文を分ける
        response_text = response.text.strip()
        if "\n" in response_text:
            sentence, translation = response_text.split("\n", 1)  # 英文と日本語を分ける
        else:
            sentence = response_text
            translation = ""

        return sentence, translation
    except Exception as e:
        print("❌ Geminiエラー:", e)
        return "❗ Gemini APIの呼び出しに失敗しました。", ""


def choose_question_and_choices(deck_id, k=4):
    all_words = Word.query.filter_by(deck_id=deck_id).all()
    if not all_words:
        flash("単語を登録してください。")
        return redirect(url_for("my_words"))
    correct = random.choice(all_words)
    # ダミー候補（意味が被らないように重複除外）
    other_words = [w for w in all_words if w.id != correct.id]
    distractors = random.sample(other_words,k-1) if len(other_words)>k-1 else other_words
    
    #合わせてシャッフル
    choices = [(w.meaning, w.id == correct.id) for w in distractors + [correct]]
    random.shuffle(choices)
    return correct.entry, choices 

def create_default_deck(user_id):
    """デフォルトのTOEICデッキを作成する"""
    deck = Deck(name="TOEIC単語集2500", description="TOEIC頻出単語集", user_id=user_id)
    db.session.add(deck)
    db.session.commit()

    # CSVファイルから単語を読み込む
    try:
        with open("TOEIC_full.csv", "r", encoding="utf-8") as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                entry = row.get("entry", "").strip()
                meaning = row.get("meaning", "").strip()
                if entry and meaning:
                    word = Word(entry=entry, meaning=meaning, deck_id=deck.id)
                    db.session.add(word)
        db.session.commit()
    except Exception as e:
        print(f"デフォルトデッキの作成中にエラーが発生しました: {e}")


# ---------------- ルーティング ----------------

@app.route("/", methods=["GET", "POST"])#トップ画面（ログイン）
def login():
    if request.method == "POST":
        # ログインフォームからユーザー名とパスワードを取得
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for("decks"))
        flash("ユーザー名またはパスワードが間違っています。")
    return render_template("login.html")

@app.route("/decks")
@login_required
def decks():
    user_decks = Deck.query.filter_by(user_id=current_user.id).all()
    return render_template("decks.html", decks=user_decks)


@app.route("/create_deck", methods=["POST"])
@login_required
def create_deck():
    name = request.form["name"]
    description = request.form["description"]
    deck = Deck(name=name, description=description, user_id=current_user.id)
    db.session.add(deck)
    db.session.commit()
    flash("デッキを作成しました。")
    return redirect(url_for("decks"))


@app.route("/deck/<int:deck_id>/test")
@login_required
def deck_test(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    if deck.user_id != current_user.id:
        flash("アクセス権限がありません。")
        return redirect(url_for("decks"))

    # デッキ内の単語を取得
    deck_words = Word.query.filter_by(deck_id=deck_id).all()
    if not deck_words:
        flash("このデッキには単語が登録されていません。")
        return redirect(url_for("decks"))

    # セッションに現在のデッキIDを保存
    session["current_deck_id"] = deck_id
    return redirect(url_for("index"))


@app.route("/deck/<int:deck_id>")
@login_required
def deck_detail(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    if deck.user_id != current_user.id:
        flash("アクセス権限がありません。")
        return redirect(url_for("decks"))

    # デッキに属する単語を取得
    words = Word.query.filter_by(deck_id=deck_id).all()
    return render_template("deck_detail.html", deck=deck, words=words)


@app.route("/deck/<int:deck_id>/add_word", methods=["POST"])
@login_required
def add_word_to_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    if deck.user_id != current_user.id:
        flash("アクセス権限がありません。")
        return redirect(url_for("decks"))

    entry = request.form["entry"]
    meaning = request.form["meaning"]

    word = Word(entry=entry, meaning=meaning, deck_id=deck_id)
    db.session.add(word)
    db.session.commit()
    flash("単語を追加しました。")
    return redirect(url_for("deck_detail", deck_id=deck_id))

@app.route("/deck/<int:deck_id>/delete", methods=["GET"])
@login_required
def delete_deck(deck_id):
    deck = Deck.query.get_or_404(deck_id)
    if deck.user_id != current_user.id:
        flash("削除権限がありません。")
        return redirect(url_for("decks"))

    try:
        # デッキに属する単語を取得
        words = Word.query.filter_by(deck_id=deck_id).all()

        # 各単語に関連するWrongWordレコードを削除
        for word in words:
            WrongWord.query.filter_by(word_id=word.id).delete()

        # 単語を削除
        Word.query.filter_by(deck_id=deck_id).delete()

        # デッキを削除
        db.session.delete(deck)
        db.session.commit()
        flash("デッキを削除しました。")
    except Exception as e:
        db.session.rollback()
        flash("デッキの削除中にエラーが発生しました。")
        print(f"デッキ削除エラー: {e}")

    return redirect(url_for("decks"))

# Test routes ------------------------------------------------------------

@app.route("/word")
@login_required
def index():
    deck_id = session.get("current_deck_id")
    word_entry, choices = choose_question_and_choices(deck_id)

    
    if deck_id:
        user_words = Word.query.filter_by(deck_id=deck_id).all()
    else:
        user_words = Word.query.filter_by(user_id=current_user.id).all()

    if not user_words:
        flash("単語を登録してください。")
        return redirect(url_for("my_words"))

    if "current_test_wrong_words" not in session:
        session["current_test_wrong_words"] = []
    return render_template(
        "index.html",
        word=word_entry,
        choices=choices,       # ← 追加
        wrong_words_count=len(session["current_test_wrong_words"])
    )


@app.route("/mark_word", methods=["POST"])
@login_required
def mark_word():
    data = request.json
# <<<<<<< HEAD
    word_entry = data["word"]
    selected_ok = data["isCorrect"]
    
    if not selected_ok:
#     word_entry = data.get("word")
#     is_correct = data.get("isCorrect")

#     if not is_correct:
        # 現在のテストセッションの間違えた単語をセッションに追加
        current_test_wrong_words = session.get("current_test_wrong_words", [])
        if word_entry not in current_test_wrong_words:
            current_test_wrong_words.append(word_entry)
            session["current_test_wrong_words"] = current_test_wrong_words

            # データベースにも記録
            word = Word.query.filter_by(entry=word_entry).first()
            if word:
                wrong_word = WrongWord.query.filter_by(
                    user_id=current_user.id, word_id=word.id
                ).first()
                if wrong_word:
                    wrong_word.count += 1
                else:
                    wrong_word = WrongWord(
                        word_id=word.id, user_id=current_user.id, count=1
                    )
                    db.session.add(wrong_word)
                db.session.commit()

    # ユーザーの単語から次の単語をランダムに選択
    next_entry, choices = choose_question_and_choices(current_user.id)
    wrong_cnt = len(session["current_test_wrong_words"])
    

    return jsonify(
        nextWord=next_entry,
        translationList=[c[0] for c in choices],   # 日本語4件
        correctnessList=[c[1] for c in choices],   # True/False4件
        wrongWordsCount=wrong_cnt,
        showWrongWords=wrong_cnt >= 10
    )


# Wrong words routes ------------------------------------------------------------
@app.route("/wrong_words")
@login_required
def wrong_words():
    wrong_words_list = session["current_test_wrong_words"]
    wrong_words_with_translation = {}

    # 間違えた単語の意味を取得
    for wrong_word in wrong_words_list:
        word = Word.query.filter_by(entry=wrong_word).first()
        if word:
            wrong_words_with_translation[word.entry] = word.meaning
    print(wrong_words_with_translation)
    return render_template("wrong_words.html", wrong_words=wrong_words_with_translation)


@app.route("/reset_wrong_words", methods=["POST"])
@login_required
def reset_wrong_words():
    # セッションのクリア
    session["current_test_wrong_words"] = []
    return jsonify({"status": "success"})

# Auth routes ------------------------------------------------------------
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
        create_default_deck(user.id)
        flash("登録が完了しました。ログインしてください。")
        return redirect(url_for("login"))
    return render_template("register.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


# My words routes ------------------------------------------------------------
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

# Generate sentence routes ------------------------------------------------------------
@app.route("/generate_sentence", methods=["GET"])
def generate_sentence():
    wrong_words = session.get("current_test_wrong_words", [])  # 正しいキーを使用
    word_list = wrong_words
    sentence, translation = generate_sentence_from_words(word_list)
    return render_template(
        "API.html", word_list=word_list, sentence=sentence, translation=translation
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
