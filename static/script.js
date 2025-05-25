// グローバル変数の追加
let questionNumber = 0;
let correctCount = 0;
let wrongCount = 0;
let studyLogId = null;


// 間違えた単語数の表示を更新する関数
function updateWrongCount(count) {
  const wrongCountElement = document.getElementById("wrong-count");
  if (wrongCountElement) {
    wrongCountElement.textContent = count;
  }
}
// 正解数の表示
function updateCorrectCount(count) {
  const correctCountElement = document.getElementById("correct-count");
  if (correctCountElement) {
    correctCountElement.textContent = count;
  }
}

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
// function handleReset() {
//   fetch("/reset_wrong_words", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.status === "success") {
//         endStudySession().then(() => {
//           window.location.href = "/decks";
//         });
//       }
//     });
// }

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

// テスト開始時の処理
function startStudySession(deckId) {
  // まず間違えた単語のセッションをリセット
  fetch("/reset_wrong_words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        // 間違えた単語数を0にリセット
        updateWrongCount(0);
        updateCorrectCount(0);
        document.getElementById("question-number").textContent = 1;

        // 学習セッションを開始
        return fetch("/start_study_session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deck_id: deckId }),
        });
      }
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        studyLogId = data.study_log_id;
        correctCount = 0;
        wrongCount = 0;
      }
    });
}

// テスト終了時の処理
function endStudySession() {
  if (!studyLogId) return;

  return fetch("/end_study_session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      correct_count: correctCount,
      wrong_count: wrongCount,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        studyLogId = null;
      }
    })
    .catch((error) => {
      console.error("学習ログの保存に失敗しました:", error);
    });
}

// --- 選択肢クリック処理 ---
function attachChoiceHandlers() {
  const correctSound = document.getElementById("correct-sound");
  const wrongSound = document.getElementById("wrong-sound");

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".choice-btn")
        .forEach((b) => (b.disabled = true));

      const isCorrect = btn.dataset.correct === "1";

      if (isCorrect) {
        correctCount++;
        updateCorrectCount(correctCount)
      } else {
        wrongCount++;
      }

      btn.classList.add(isCorrect ? "correct" : "wrong");
      safePlay(isCorrect ? correctSound : wrongSound);

      document
        .querySelectorAll('.choice-btn[data-correct="1"]')
        .forEach((b) => b.classList.add("correct"));

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
          //表示を更新
          questionNumber = data.questionNumber;
          document.getElementById("question-number").textContent = questionNumber;
          updateWrongCount(data.wrongWordsCount);

          if (data.showWrongWords || data.isTestComplete|| questionNumber > 20) {
            // テスト終了時に学習ログを保存してから遷移
            endStudySession().then(() => {
              setTimeout(() => {
                window.location.href = "/wrong_words";
              }, 1000);
            });
            return;
          }
          setTimeout(() => {
            updateQuestion(data);
          }, 500);
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
// <<<<<<< csv_iwata

// document.addEventListener("DOMContentLoaded",()=>{
//   // ① ← ここで取得してグローバル変数にする
//   window.wrongCount = document.getElementById("wrong-count");
// =======
document.addEventListener("DOMContentLoaded", () => {
  // 初期の間違えた単語数を表示
  const initialWrongCount = parseInt(document.getElementById("wrong-count").textContent) || 0;
  const initialCorrectCount = parseInt(document.getElementById("correct-count").textContent) || 0;
  questionNumber = parseInt(document.getElementById("question-number").textContent) || 1;

  updateWrongCount(initialWrongCount);
  updateCorrectCount(initialCorrectCount);

  fetch("/get_current_deck_id")
    .then((response) => response.json())
    .then((data) => {
      if (data.deck_id) {
        startStudySession(data.deck_id);
      }
    });
// >>>>>>> dev

  attachChoiceHandlers();

  // // トップへボタンのカスタム処理
  // const resetBtn = document.getElementById("reset-btn");
  // if (resetBtn) {
  //   resetBtn.addEventListener("click", function (e) {
  //     e.preventDefault();
  //     const sound = document.getElementById("trans-sound");
  //     if (sound) {
  //       sound.currentTime = 0;
  //       sound.play();
  //     }

      // setTimeout(function () {
      //   window.location.href = "/decks";
      // }, 300);
  //   });
  // }

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

// ページを離れる前の処理を追加
window.addEventListener("beforeunload", (event) => {
  if (studyLogId) {
    endStudySession();
  }
});

// 進捗バーの幅を設定
document.addEventListener("DOMContentLoaded", function () {
  const progressBars = document.querySelectorAll(".progress");
  progressBars.forEach((bar) => {
    const progress = bar.getAttribute("data-progress");
    bar.style.width = `${progress}%`;
  });
});


document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.delete-btn');
  
  deleteButtons.forEach(button => {
      button.addEventListener('click', async function() {
          const sentenceId = this.dataset.sentenceId;
          
          if (confirm('削除してもよろしいですか？')) {
              try {
                  const response = await fetch(`/api/sentences/${sentenceId}`, {
                      method: 'DELETE',
                      headers: {
                          'Content-Type': 'application/json',
                      }
                  });
                  
                  if (response.ok) {
                      // 削除成功時は該当の要素をDOMから削除
                      this.closest('.sentence-item').remove();
                  }
              } catch (error) {
                  console.error('Error:', error);
                  // alert('エラーが発生しました。');
              }
          }
      });
  });
});