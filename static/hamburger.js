document.addEventListener("DOMContentLoaded", function () {
  const hamburgerBtn = document.querySelector(".hamburger-btn");
  const hamburgerContent = document.querySelector(".hamburger-content");

  // メニューヘッダーを追加
  if (hamburgerContent && !hamburgerContent.querySelector(".menu-header")) {
    const menuHeader = document.createElement("div");
    menuHeader.className = "menu-header";

    const menuTitle = document.createElement("h3");
    menuTitle.textContent = "メニュー";

    const closeBtn = document.createElement("button");
    closeBtn.className = "menu-close-btn";
    closeBtn.setAttribute("aria-label", "メニューを閉じる");

    menuHeader.appendChild(menuTitle);
    menuHeader.appendChild(closeBtn);

    hamburgerContent.insertBefore(menuHeader, hamburgerContent.firstChild);
  }

  // 閉じるボタンの参照を取得
  const closeBtn = document.querySelector(".menu-close-btn");
  const hamburgerLinks = document.querySelectorAll(".hamburger-content a");

  // ハンバーガーボタンのクリックイベント
  hamburgerBtn.addEventListener("click", function () {
    // メニューを表示してからボタンの状態を変更する
    hamburgerContent.classList.toggle("active");

    // 少し遅延させてからボタンのアクティブ状態を切り替え
    setTimeout(() => {
      this.classList.toggle("active");
    }, 100);

    // メニューが開いたときのアニメーション
    if (hamburgerContent.classList.contains("active")) {
      // リンクを順番にフェードイン
      hamburgerLinks.forEach((link, index) => {
        link.style.opacity = "0";
        link.style.transform = "translateX(20px)";
        setTimeout(() => {
          link.style.transition = "all 0.3s ease";
          link.style.opacity = "1";
          link.style.transform = "translateX(0)";
        }, 200 + index * 50);
      });
    }
  });

  // 閉じるボタンのクリックイベント
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      hamburgerContent.classList.remove("active");
      setTimeout(() => {
        hamburgerBtn.classList.remove("active");
      }, 200);
    });
  }

  // メニューリンクのクリックイベント
  hamburgerLinks.forEach((link) => {
    link.addEventListener("click", function () {
      hamburgerContent.classList.remove("active");
      setTimeout(() => {
        hamburgerBtn.classList.remove("active");
      }, 200);
    });
  });

  // メニュー外のクリックでメニューを閉じる
  document.addEventListener("click", function (event) {
    if (
      hamburgerContent.classList.contains("active") &&
      !hamburgerBtn.contains(event.target) &&
      !hamburgerContent.contains(event.target)
    ) {
      hamburgerContent.classList.remove("active");
      setTimeout(() => {
        hamburgerBtn.classList.remove("active");
      }, 200);
    }
  });
});
