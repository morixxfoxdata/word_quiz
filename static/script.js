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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: currentWord, isCorrect: isCorrect }),
    })
      .then((response) => response.json())
      .then((data) => {
        const wrongs = data.wrongWordsCount;
        wrongCount.textContent = wrongs;
  
        // ❗️10個以上間違えたらクイズ終了処理
        if (wrongs >= 10) {
          correctBtn.disabled = true;
          wrongBtn.disabled = true;
          wrongWordsNotification.style.display = "block";
          showEndOptions();
          return;
        }
  
        // 🔁 次のカード表示（10個未満のとき）
        wordCard.dataset.word = data.nextWord;
        wordCard.dataset.translation = data.translation;
        wordCard.querySelector(".word-front").textContent = data.nextWord;
        wordCard.querySelector(".word-back").textContent = data.translation;
  
        isFlipped = false;
        wordCard.classList.remove("flipped");
      });
  }

  function showEndOptions() {
    const endOptions = document.getElementById("end-options");
    if (endOptions) {
      endOptions.style.display = "block";
    } else {
      console.warn("⚠️ end-options が見つかりません！");
    }
  }
  
  document.getElementById("reset-btn").addEventListener("click", function () {
    fetch("/reset_wrong_words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          window.location.href = "/";
        }
      });
  });
  
});
