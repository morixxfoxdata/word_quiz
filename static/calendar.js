document.addEventListener("DOMContentLoaded", function () {
  let currentDate = new Date();
  const calendarDays = document.getElementById("calendarDays");
  const currentMonthElement = document.getElementById("currentMonth");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const selectedDateTitle = document.getElementById("selectedDateTitle");
  const selectedDateLogs = document.getElementById("selectedDateLogs");
  const closeLogsBtn = document.getElementById("closeLogs");

  // 学習ログの日付を取得
  const logDates = new Set();
  document.querySelectorAll(".log-item").forEach((log) => {
    logDates.add(log.dataset.date);
    // デバッグ用
    console.log("Log date:", log.dataset.date);
  });

  function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 月の表示を更新
    currentMonthElement.textContent = `${year}年${month + 1}月`;

    // カレンダーの日付をクリア
    calendarDays.innerHTML = "";

    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 前月の日付を表示
    const firstDayOfWeek = firstDay.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate(); // 前月の最終日
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDate - firstDayOfWeek + i + 1;
      const prevDate = new Date(prevYear, prevMonth, day);
      const dayElement = createDayElement(prevDate, true);
      calendarDays.appendChild(dayElement);
    }

    // 当月の日付を表示
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayElement = createDayElement(date, false);
      calendarDays.appendChild(dayElement);
    }

    // 次月の日付を表示（必要に応じて）
    const totalCells = 42; // 6行7列
    const filledCells = firstDayOfWeek + lastDay.getDate();
    const remainingCells = totalCells - filledCells;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(nextYear, nextMonth, i);
      const dayElement = createDayElement(nextDate, true);
      calendarDays.appendChild(dayElement);
    }
  }

  function createDayElement(date, isOtherMonth) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    if (isOtherMonth) {
      dayElement.classList.add("other-month");
    }

    // 日付をYYYY-MM-DD形式に変換
    const dateString = formatDate(date);

    // デバッグ用
    if (logDates.has(dateString)) {
      console.log("Has log for date:", dateString);
      dayElement.classList.add("has-logs");
    }

    dayElement.textContent = date.getDate();
    dayElement.dataset.date = dateString;
    dayElement.addEventListener("click", () => selectDate(date, dayElement));
    return dayElement;
  }

  function selectDate(date, element) {
    // 選択された日付のスタイルを更新
    document.querySelectorAll(".calendar-day").forEach((day) => {
      day.classList.remove("selected");
    });
    element.classList.add("selected");

    // 選択された日付のログを表示
    const dateString = formatDate(date);
    console.log("Selected date:", dateString); // デバッグ用

    selectedDateTitle.textContent = `${date.getFullYear()}年${
      date.getMonth() + 1
    }月${date.getDate()}日の学習ログ`;

    // ログの表示/非表示を切り替え
    let hasLogs = false;
    document.querySelectorAll(".log-item").forEach((log) => {
      console.log("Comparing:", log.dataset.date, dateString); // デバッグ用
      if (log.dataset.date === dateString) {
        log.style.display = "block";
        hasLogs = true;
        console.log("Found log for date:", dateString); // デバッグ用
      } else {
        log.style.display = "none";
      }
    });

    // ログがない場合のメッセージ
    const logsContainer = document.getElementById("logsContainer");
    if (!hasLogs) {
      // すべての子要素を非表示にする
      Array.from(logsContainer.children).forEach((child) => {
        if (child.id !== "noLogsMessage") {
          child.style.display = "none";
        }
      });

      // ログがない場合のメッセージを追加
      let noLogsMessage = document.getElementById("noLogsMessage");
      if (!noLogsMessage) {
        noLogsMessage = document.createElement("div");
        noLogsMessage.id = "noLogsMessage";
        noLogsMessage.className = "no-logs-message";
        noLogsMessage.textContent = "この日の学習ログはありません";
        logsContainer.appendChild(noLogsMessage);
      } else {
        noLogsMessage.style.display = "block";
      }
    } else {
      // ログがある場合はメッセージを非表示
      const noLogsMessage = document.getElementById("noLogsMessage");
      if (noLogsMessage) {
        noLogsMessage.style.display = "none";
      }
    }

    // ログ表示エリアを表示
    selectedDateLogs.style.display = "block";
  }

  // 閉じるボタンのイベントリスナー
  closeLogsBtn.addEventListener("click", () => {
    selectedDateLogs.style.display = "none";
    document.querySelectorAll(".calendar-day").forEach((day) => {
      day.classList.remove("selected");
    });
  });

  // 月の移動ボタンのイベントリスナー
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // 初期表示
  renderCalendar();
});
