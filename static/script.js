document.addEventListener("DOMContentLoaded", function () {
  const wordCard = document.getElementById("word-card");
  const correctBtn = document.getElementById("correct-btn");
  const wrongBtn = document.getElementById("wrong-btn");
  const wrongCount = document.getElementById("wrong-count");
  const wrongWordsNotification = document.getElementById(
    "wrong-words-notification"
  );
  // フリップの初期値：boolean型
  let isFlipped = false;

  // カードをタップ/クリックしたときのフリップ機能
  wordCard.addEventListener("click", function () {
    isFlipped = !isFlipped;

    if (isFlipped) {
      wordCard.classList.add("flipped");
    } else {
      wordCard.classList.remove("flipped");
    }
  });

  // 正解ボタンの処理
  correctBtn.addEventListener("click", function () {
    handleAnswer(true);
  });

  // 不正解ボタンの処理
  wrongBtn.addEventListener("click", function () {
    handleAnswer(false);
  });

  // 回答処理
  function handleAnswer(isCorrect) {
    const currentWord = wordCard.dataset.word;

    fetch("/mark_word", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        word: currentWord,
        isCorrect: isCorrect,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // 次の単語を表示
        wordCard.dataset.word = data.nextWord;
        wordCard.dataset.translation = data.translation;

        // カードのテキストを更新
        wordCard.querySelector(".word-front").textContent = data.nextWord;
        wordCard.querySelector(".word-back").textContent = data.translation;

        // カードを表面に戻す
        isFlipped = false;
        wordCard.classList.remove("flipped");

        // 間違えた単語の数を更新
        wrongCount.textContent = data.wrongWordsCount;

        // 10個たまったら通知を表示
        if (data.showWrongWords) {
          wrongWordsNotification.style.display = "block";
        }
      });
  }
});
