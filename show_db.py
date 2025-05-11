import sqlite3

DATABASE = "word_quiz.db"


def show_users():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    print("--- Users ---")
    for row in cursor.execute("SELECT id, username FROM user"):
        print(row)
    conn.close()


def show_words():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    print("\n--- Words ---")
    for row in cursor.execute("SELECT id, entry, meaning, user_id FROM word"):
        print(row)
    conn.close()


if __name__ == "__main__":
    show_users()
    show_words()
