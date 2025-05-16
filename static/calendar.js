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
  });

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
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      const dayElement = createDayElement(prevDate, true);
      calendarDays.appendChild(dayElement);
    }

    // 当月の日付を表示
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayElement = createDayElement(date, false);
      calendarDays.appendChild(dayElement);
    }

    // 次月の日付を表示
    const remainingDays = 42 - (firstDayOfWeek + lastDay.getDate());
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
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

    const dateString = date.toISOString().split("T")[0];
    if (logDates.has(dateString)) {
      dayElement.classList.add("has-logs");
    }

    dayElement.textContent = date.getDate();
    dayElement.addEventListener("click", () => selectDate(date));
    return dayElement;
  }

  function selectDate(date) {
    // 選択された日付のスタイルを更新
    document.querySelectorAll(".calendar-day").forEach((day) => {
      day.classList.remove("selected");
    });
    event.target.classList.add("selected");

    // 選択された日付のログを表示
    const dateString = date.toISOString().split("T")[0];
    selectedDateTitle.textContent = `${date.getFullYear()}年${
      date.getMonth() + 1
    }月${date.getDate()}日の学習ログ`;

    // ログの表示/非表示を切り替え
    document.querySelectorAll(".log-item").forEach((log) => {
      if (log.dataset.date === dateString) {
        log.style.display = "block";
      } else {
        log.style.display = "none";
      }
    });

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
