document.addEventListener("DOMContentLoaded", function () {
  const hamburgerBtn = document.querySelector(".hamburger-btn");
  const hamburgerContent = document.querySelector(".hamburger-content");
  const hamburgerLinks = document.querySelectorAll(".hamburger-content a");

  // ハンバーガーボタンのクリックイベント
  hamburgerBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    hamburgerContent.classList.toggle("active");
  });

  // メニューリンクのクリックイベント
  hamburgerLinks.forEach((link) => {
    link.addEventListener("click", function () {
      hamburgerBtn.classList.remove("active");
      hamburgerContent.classList.remove("active");
    });
  });

  // メニュー外のクリックでメニューを閉じる
  document.addEventListener("click", function (event) {
    if (
      !hamburgerBtn.contains(event.target) &&
      !hamburgerContent.contains(event.target)
    ) {
      hamburgerBtn.classList.remove("active");
      hamburgerContent.classList.remove("active");
    }
  });
});
