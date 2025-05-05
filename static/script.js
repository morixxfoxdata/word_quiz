// document は「今表示しているページ」全体を指します。
// 	•	DOMContentLoaded は「HTML の読み込みが終わったら」という意味。
// 	•	ページの内容が読み込まれた後にこの中の関数（function () { ... }）が実行されます。
document.addEventListener("DOMContentLoaded", function () {
  // getElementById() で HTML 内のパーツを取得しています。
	// •	const は「この変数は後から変更しない」という宣言。
  const wordCard = document.getElementById("word-card");
  const correctBtn = document.getElementById("correct-btn");
  const wrongBtn = document.getElementById("wrong-btn");
  const wrongCount = document.getElementById("wrong-count");
  const wrongWordsNotification = document.getElementById(
    "wrong-words-notification"
  );

  // この変数で「カードが裏返っているかどうか」を記録します。
	// •	最初は false（＝表側を表示中）。
  // フリップの初期値：boolean型
  let isFlipped = false;

  // カードをタップ/クリックしたときのフリップ機能
  // !isFlipped は「true⇄false を反転する」記号。
	// •	.classList.add() / .remove() は CSS のクラスを追加・削除する。
	// •	つまり、CSSで「裏面表示」になるようにスタイルが切り替わります
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
  // カードに付いている data-word="apple" のような情報を取得。
	// •	dataset.word は HTML 側の data-word 属性を読む方法。
  function handleAnswer(isCorrect) {
    
    if (parseInt(wrongCount.textContent) >= 10) {
      // すでに10個以上なら無視
      return;
    }

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
        if (data.wrongWordsCount >= 10) {
          correctBtn.disabled = true;
          wrongBtn.disabled = true;
          wrongWordsNotification.style.display = "block";
          // ここでリセット/確認ボタンを表示させるなど
          showEndOptions();
        }

      });
  }
  function showEndOptions() {
    const endOptions = document.getElementById("end-options");
    endOptions.style.display = "block";
  }
  

});
