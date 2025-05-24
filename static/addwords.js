      function deleteWord(deckId, wordId) {
        fetch(`/deck/${deckId}/word/${wordId}/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              // 成功した場合、該当の単語要素を削除
              const wordElement = document.getElementById(`word-${wordId}`);
              if (wordElement) {
                wordElement.remove();
              }
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

      // 検索機能の実装
      document.addEventListener("DOMContentLoaded", function () {
        const searchInput = document.getElementById("wordSearch");
        const wordItems = document.querySelectorAll(".word-item");

        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase();

          wordItems.forEach((item) => {
            const english = item.dataset.english;
            const japanese = item.dataset.japanese;

            if (english.includes(searchTerm) || japanese.includes(searchTerm)) {
              item.style.display = "flex";
            } else {
              item.style.display = "none";
            }
          });
        });
      });

document.getElementById("translate-btn").addEventListener("click", function(){
    const word = document.querySelector(".question-word1").value;

    fetch("/translate",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({word: word})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("meaning-box").value = data.meaning;
    })
    .catch(error => console.error("和訳失敗",error));
});