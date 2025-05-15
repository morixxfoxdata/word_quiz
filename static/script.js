// 正誤処理関数（既存の handleAnswer を前提にする）
function handleAnswer(isCorrect) {
  const currentWord = wordCard.dataset.word;
  isFlipped = false;
  wordCard.classList.remove("flipped");

  //効果音の再生
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");
  if (isCorrect) {
    correctSound.currentTime = 0; // ←連打対応（最初から）
    correctSound.play();
  } else {
    wrongSound.currentTime = 0;
    wrongSound.play();
  }
}

// 🔁 リセット処理関数
function handleReset() {
  fetch("/reset_wrong_words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        window.location.href = "/decks";
      }
    });
}

// 音声を安定させる
function safePlay(audioElement) {
  if (!audioElement) return;

  try {
    audioElement.pause(); // 途中再生中なら一旦止める
    audioElement.currentTime = 0; // 必ず先頭から
    audioElement.play().catch((e) => {
      console.warn("効果音再生エラー:", e);
    });
  } catch (e) {
    console.warn("効果音処理エラー:", e);
  }
}

// --- 選択肢クリック処理 ---
function attachChoiceHandlers() {
  const correctSound = document.getElementById("correct-sound"); //★追加
  const wrongSound = document.getElementById("wrong-sound"); //★追加

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // 再度おせないよう
      document
        .querySelectorAll(".choice-btn")
        .forEach((b) => (b.disabled = true));

      const isCorrect = btn.dataset.correct === "1";

      // ボタンにクラスを追加
      btn.classList.add(isCorrect ? "correct" : "wrong");

      // 効果音
      safePlay(isCorrect ? correctSound : wrongSound);

      // 正解の選択肢を強調表示
      document
        .querySelectorAll('.choice-btn[data-correct="1"]')
        .forEach((b) => b.classList.add("correct"));

      // サーバへ送信
      fetch("/mark_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: document.querySelector(".question-word").textContent,
          isCorrect: isCorrect,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          // 10問終わり判定
          wrongCount.textContent = data.wrongWordsCount;
          if (data.showWrongWords || data.isTestComplete) {
            setTimeout(() => {
              window.location.href = "/wrong_words";
            }, 1000);
            return;
          }
          // １秒待って次問セット
          setTimeout(() => {
            updateQuestion(data);
          }, 1000);
        });
    });
  });
}

// --- 次問へ差し替える ---
function updateQuestion(data) {
  document.querySelector(".question-word").textContent = data.nextWord;

  const container = document.getElementById("choice-container");
  container.innerHTML = ""; // 既存ボタン消す
  data.translationList.forEach((txt, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.dataset.correct = data.correctnessList[idx] ? "1" : "0";
    btn.textContent = txt;
    container.appendChild(btn);
  });
  attachChoiceHandlers();
}

document.addEventListener("DOMContentLoaded", () => {
  // ① ← ここで取得してグローバル変数にする
  window.wrongCount = document.getElementById("wrong-count");

  attachChoiceHandlers();

  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", handleReset);

  // ページ遷移SE（省略）
});

// 音声
document.addEventListener("DOMContentLoaded", function () {
  const sound = document.getElementById("trans-sound");
  const buttons = document.querySelectorAll(".play-sound00");

  buttons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      if (sound) {
        sound.currentTime = 0;
        safePlay(sound);
      }

      // 遷移処理：button の親要素（<a href="/test">）を取得して遷移
      const parentLink = btn.closest("a");
      if (parentLink && parentLink.href) {
        e.preventDefault();
        setTimeout(() => {
          window.location.href = parentLink.href;
        }, 300);
      }
    });
  });
});
