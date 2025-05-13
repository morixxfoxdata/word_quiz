// 正誤処理関数（既存の handleAnswer を前提にする）
function handleAnswer(isCorrect) {
  const currentWord = wordCard.dataset.word;
  // フリップを解除
  // isFlipped: 日本語面を表示しているときは true
  isFlipped = false;
  // wordCard: カードの要素のDOM
  // wordCardに対して、flipped というクラスを外す
  wordCard.classList.remove("flipped");
  // ボタンを無効化
  // correctBtn.disabled = true;
  // wrongBtn.disabled = true;
  // wordCardのイベントリスナーを追加
  // transitionend: CSSのトランジションが終わったときに発火するイベント
  
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
  
  wordCard.addEventListener(
    "transitionend",
    function onTransitionEnd() {
      // currentWord: wordCardのデータ属性から取得した単語
      const currentWord = wordCard.dataset.word;
// =======
//   wordCard.addEventListener("transitionend", function onTransitionEnd() {
//     // currentWord: wordCardのデータ属性から取得した単語
//     const currentWord = wordCard.dataset.word;
// >>>>>>> origin/login:static/script.js
    // mark_word: サーバに「/mark_word という場所へアクセスしてね」と言っています。
    // 「ページを移動する」のではなく、裏でこっそり通信しています（これを「非同期通信」と言います）。
    fetch("/mark_word", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // body: サーバに送るデータを JSON 形式で指定
      // 例えば、サーバに { "word": "apple", "isCorrect": true } のようなデータを送る
      body: JSON.stringify({
        word: currentWord,
        isCorrect: isCorrect,
      }),
    })
      .then((response) => response.json())
      // JSON に変換したデータを、data という名前で受け取る
      // 例えば、サーバから { "nextWord": "banana", "translation": "バナナ" , "wrongWordsCount": 4, "showWrongWords": false} のようなデータを受け取る
      .then((data) => {
        // wrongsに、サーバから受け取ったデータの wrongWordsCount を代入
        // 例えば、サーバから受け取ったデータが { "wrongWordsCount": 4 } の場合、wrongs は 4 になる
        const wrongs = data.wrongWordsCount;
        // wrongCount: DOMの要素を取得
        wrongCount.textContent = wrongs;
        // 間違い回数が10回以上の場合
        if (wrongs >= 10) {
          correctBtn.disabled = true;
          wrongBtn.disabled = true;
          const notification = document.getElementById(
            "wrong-words-notification"
          );
          if (notification) notification.style.display = "block";
          const endOptions = document.getElementById("end-options");
          if (endOptions) endOptions.style.display = "block";
          return;
        }

        wordCard.dataset.word = data.nextWord;
        wordCard.dataset.translation = data.translation;
        wordCard.querySelector(".word-front").textContent = data.nextWord;
        wordCard.querySelector(".word-back").textContent = data.translation;
        // 10個たまったら通知を表示
        if (data.showWrongWords) {
          wrongWordsNotification.style.display = "block";
        }
      });
    wordCard.removeEventListener("transitionend", onTransitionEnd);
  });
}

// 🔁 リセット処理関数
function handleReset() {
  // fetch() は「サーバと通信する関数」です。
  // この例では、サーバに「/reset_wrong_words という場所へアクセスしてね」と言っています。
  // 「ページを移動する」のではなく、裏でこっそり通信しています（これを「非同期通信」と言います）。
  // 「POST」は「データを送るとき」に使う方法
  // サーバに「このリクエストのデータは JSON 形式だよ」と伝えるための設定です。
  // この場合、実際にはデータ本体を送っていないのであまり意味はないですが、書いておくと安心な基本セットです。
  fetch("/reset_wrong_words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    // response（サーバの返事）を .json() で JSON 形式に変換します。
    // 例えば、サーバから { "status": "success" } のような返事が返ってきます。
    .then((response) => response.json())
    // JSON に変換したデータを、data という名前で受け取る
    // window.location.href は「今表示しているページのURL」を指します。
    // それに / を代入すると、トップページに移動
    .then((data) => {
      if (data.status === "success") {
        window.location.href = "/";
      }
    });
}

// ✅ ページ読み込み後にイベントを一括登録
document.addEventListener("DOMContentLoaded", function () {
  // カードクリック処理
  const wordCard = document.getElementById("word-card");
  if (wordCard) {
    wordCard.addEventListener("click", function () {
      const flipSound = document.getElementById("flip-sound");

      if (!isFlipped && flipSound) {
        flipSound.currentTime = 0;
        flipSound.play();
      }

      wordCard.classList.toggle("flipped");
      isFlipped = !isFlipped;
    });

  }

  // ボタン取得
  const correctBtn = document.getElementById("correct-btn");
  const wrongBtn = document.getElementById("wrong-btn");
  const resetBtn = document.getElementById("reset-btn");
  window.wordCard = wordCard;
  window.correctBtn = correctBtn;
  window.wrongBtn = wrongBtn;
  window.wrongCount = document.getElementById("wrong-count");
  window.isFlipped = false;

  if (correctBtn)
    correctBtn.addEventListener("click", () => handleAnswer(true));
  if (wrongBtn) wrongBtn.addEventListener("click", () => handleAnswer(false));
  if (resetBtn) resetBtn.addEventListener("click", handleReset);
});

// 音声
document.addEventListener("DOMContentLoaded", function () {
  const sound = document.getElementById("trans-sound");
  const buttons = document.querySelectorAll(".play-sound00");

  buttons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      if (sound) {
        sound.currentTime = 0;
        sound.play();
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
