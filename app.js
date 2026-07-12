      const MONTH_NAMES = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      const DAY_NAMES = [
        "أحد",
        "إثنين",
        "ثلاثاء",
        "أربعاء",
        "خميس",
        "جمعة",
        "سبت",
      ];

      const defaultHabits = DEFAULT_HABITS;

      const MARK_SYMBOL = { "": "", check: "✓", x: "✗" };
      const MARK_CLASS = { "": "", check: "mark-check", x: "mark-x" };
      const MARK_LABEL = { "": "غير محدد", check: "تم", x: "غير مكتمل" };

      function normalizeMark(mark) {
        if (mark === "check") return "check";
        if (mark === "x") return "x";
        return "";
      }

      function habitPointValue(habit) {
        return habit.points ?? 10;
      }

      function pointsForMark(habit, mark) {
        return normalizeMark(mark) === "check" ? habitPointValue(habit) : 0;
      }

      function maxDayPoints() {
        return state.habits.reduce((sum, h) => sum + habitPointValue(h), 0);
      }

      function getDayPoints(day) {
        let earnedPoints = 0;
        state.habits.forEach((h, hIdx) => {
          earnedPoints += pointsForMark(h, state.marks[`${hIdx}_${day}`] || "");
        });
        const possibleDayPoints = maxDayPoints();
        return {
          earnedPoints,
          possibleDayPoints,
          total: earnedPoints,
          max: possibleDayPoints,
          perfect: possibleDayPoints > 0 && earnedPoints >= possibleDayPoints,
        };
      }

      function formatEarnedPossible(earned, possible) {
        return toArabicDigits(`${earned} / ${possible}`);
      }

      function isMobileViewport() {
        return window.matchMedia("(max-width:700px)").matches;
      }

      /** Month heatmap/summary: earned only on mobile, earned/possible on larger screens. */
      function formatMonthPointsDisplay(earned, possible) {
        if (!possible || isMobileViewport()) return toArabicDigits(earned);
        return formatEarnedPossible(earned, possible);
      }

      /** Self-tests: earned/possible and category subtotals across الصباح, الظهر, تطويري, قبل النوم */
      function runPointsSelfTests(fixtureHabits, fixtureMarks) {
        const savedHabits = state.habits;
        const savedMarks = state.marks;
        state.habits = fixtureHabits;
        state.marks = fixtureMarks;

        const possibleDayPoints = maxDayPoints();
        console.assert(
          possibleDayPoints === 40,
          "possibleDayPoints should be 40 (4×10 + 0)",
        );

        let earnedPoints = 0;
        const byCat = {};
        fixtureHabits.forEach((h, hIdx) => {
          const pts = pointsForMark(h, fixtureMarks[`${hIdx}_1`] || "");
          earnedPoints += pts;
          byCat[h.cat] = (byCat[h.cat] || 0) + pts;
        });
        console.assert(
          earnedPoints === 30,
          "earnedPoints should be 30 (أ+ب+د)",
        );
        console.assert(byCat["الصباح"] === 10, "الصباح subtotal");
        console.assert(byCat["الظهر"] === 10, "الظهر subtotal");
        console.assert(byCat["تطويري"] === 0, "تطويري subtotal");
        console.assert(
          byCat["قبل النوم"] === 10,
          "قبل النوم subtotal (د=10, هـ=0)",
        );
        const catSum = Object.values(byCat).reduce((a, b) => a + b, 0);
        console.assert(
          catSum === earnedPoints,
          "category subtotals must equal day earned",
        );

        const day = getDayPoints(1);
        console.assert(
          day.earnedPoints === earnedPoints &&
            day.possibleDayPoints === possibleDayPoints,
          "getDayPoints earned/possible mismatch",
        );

        state.habits = savedHabits;
        state.marks = savedMarks;
      }

      const celebrationMessages = CELEBRATION_MESSAGES;

      function randomCelebrationMessage() {
        return celebrationMessages[
          Math.floor(Math.random() * celebrationMessages.length)
        ];
      }

      function playCenteredMessage(message, options = {}) {
        const emoji = options.emoji || "🎉";
        const withConfetti = options.confetti !== false;
        const encourage = !!options.encourage;
        const text = `${emoji} ${message}`;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          showToast(text);
          return;
        }
        const overlay = document.getElementById("celebrationOverlay");
        const banner = document.getElementById("celebrationBanner");
        if (!overlay || !banner) return;

        banner.textContent = text;
        banner.classList.toggle("is-encourage", encourage);
        overlay
          .querySelectorAll(".confetti-piece")
          .forEach((el) => el.remove());
        if (withConfetti) {
          const colors = [
            "#1b5e20",
            "#e8c46b",
            "#d9534f",
            "#3a6fb5",
            "#81c784",
            "#ff8a65",
            "#ab47bc",
          ];
          for (let i = 0; i < 48; i++) {
            const piece = document.createElement("span");
            piece.className = "confetti-piece";
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[i % colors.length];
            piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
            piece.style.animationDelay = `${Math.random() * 0.35}s`;
            piece.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
            piece.style.width = `${6 + Math.random() * 8}px`;
            piece.style.height = `${8 + Math.random() * 10}px`;
            overlay.appendChild(piece);
          }
        }

        banner.style.animation = "none";
        void banner.offsetWidth;
        banner.style.animation = "";
        overlay.classList.add("is-show");
        clearTimeout(playCenteredMessage._t);
        playCenteredMessage._t = setTimeout(() => {
          overlay.classList.remove("is-show");
          overlay
            .querySelectorAll(".confetti-piece")
            .forEach((el) => el.remove());
        }, 5000);
      }

      let lastCelebrationTime = 0;

      function playCelebration() {
        const now = Date.now();
        const withConfetti = now - lastCelebrationTime >= 1500;
        if (withConfetti) lastCelebrationTime = now;
        playCenteredMessage(randomCelebrationMessage(), {
          emoji: "🎉",
          confetti: withConfetti,
          encourage: false,
        });
      }

      function celebrateIfNewlyPerfect(day, wasPerfect) {
        if (wasPerfect) return;
        if (getDayPoints(day).perfect) playCelebration();
      }

      const halfXEncouragementMessages = HALF_X_ENCOURAGEMENT_MESSAGES;

      function randomHalfXMessage() {
        return halfXEncouragementMessages[
          Math.floor(Math.random() * halfXEncouragementMessages.length)
        ];
      }

      function dayXRatio(day) {
        let scored = 0;
        let xCount = 0;
        state.habits.forEach((h, hIdx) => {
          if (habitPointValue(h) <= 0) return;
          scored++;
          if (normalizeMark(state.marks[`${hIdx}_${day}`] || "") === "x")
            xCount++;
        });
        if (!scored) return 0;
        return xCount / scored;
      }

      function encourageIfHalfX(day, wasAtLeastHalf) {
        if (wasAtLeastHalf) return;
        if (dayXRatio(day) >= 0.5) {
          playCenteredMessage(randomHalfXMessage(), {
            emoji: "💛",
            confetti: false,
            encourage: true,
          });
        }
      }

      function syncHabitPointsFromDefaults(habits) {
        const byName = {};
        defaultHabits.forEach((h) => {
          if (Object.prototype.hasOwnProperty.call(h, "points"))
            byName[h.name] = h.points;
        });
        habits.forEach((h) => {
          if (Object.prototype.hasOwnProperty.call(byName, h.name))
            h.points = byName[h.name];
        });
        return habits;
      }

      let state = {
        habits: JSON.parse(JSON.stringify(defaultHabits)),
        marks: {},
        weekly: {},
        longestStreaks: {},
      };

      let currentDay = new Date().getDate();
      let viewMode = "day";
      let weeklyBuiltFor = null;

      const VIEW_MODE_KEY = "tracker_view_mode";
      const THEME_KEY = "tracker_theme";

      function applyTheme(theme) {
        const isDark = theme === "dark";
        document.documentElement.classList.toggle("theme-dark", isDark);
        safeSetItem(THEME_KEY, isDark ? "dark" : "light");
        const input = document.getElementById("themeToggle");
        if (input) {
          input.checked = isDark;
          input.setAttribute("aria-checked", isDark ? "true" : "false");
        }
        const label = document.getElementById("themeSwitchLabel");
        if (label) label.textContent = isDark ? "وضع فاتح" : "وضع داكن";
        // Refresh month heatmap so sticky/legend paints pick up theme tokens
        if (viewMode === "month") {
          renderTable();
          renderMonthSummary();
          updateWeeklyPoints();
        }
      }

      function initTheme() {
        let theme = null;
        try {
          theme = localStorage.getItem(THEME_KEY);
        } catch (e) {}
        if (theme !== "dark" && theme !== "light") {
          theme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
        }
        applyTheme(theme);
      }

      function storageKey(year, month) {
        return `tracker_${year}_${String(month + 1).padStart(2, "0")}`;
      }

      function daysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
      }

      function ensureLongestStreaks() {
        if (!state.longestStreaks || typeof state.longestStreaks !== "object") {
          state.longestStreaks = {};
        }
      }

      function habitStreakKey(habit) {
        return habit?.name || "";
      }

      function getMarksSnapshot(year, month) {
        const cur = getCurrentYearMonth();
        if (year === cur.year && month === cur.month) {
          return { marks: state.marks, habits: state.habits };
        }
        const raw = localStorage.getItem(storageKey(year, month));
        if (!raw) return { marks: {}, habits: [] };
        try {
          const parsed = JSON.parse(raw);
          return { marks: parsed.marks || {}, habits: parsed.habits || [] };
        } catch (e) {
          return { marks: {}, habits: [] };
        }
      }

      function isHabitCheckedOn(habitName, year, month, day) {
        const { marks, habits } = getMarksSnapshot(year, month);
        const hIdx = habits.findIndex((h) => h.name === habitName);
        if (hIdx < 0) return false;
        return normalizeMark(marks[`${hIdx}_${day}`] || "") === "check";
      }

      /** Consecutive completes walking backward from today; resets on any miss. */
      function getCurrentStreak(hIdx) {
        const habit = state.habits[hIdx];
        if (!habit) return 0;
        const name = habit.name;
        const now = new Date();
        let y = now.getFullYear();
        let m = now.getMonth();
        let d = now.getDate();
        let streak = 0;
        for (let i = 0; i < 400; i++) {
          if (!isHabitCheckedOn(name, y, m, d)) break;
          streak++;
          d -= 1;
          if (d < 1) {
            m -= 1;
            if (m < 0) {
              m = 11;
              y -= 1;
            }
            d = daysInMonth(y, m);
          }
        }
        return streak;
      }

      function getLongestStreakInMonth(hIdx) {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        let longest = 0;
        let run = 0;
        for (let d = 1; d <= nDays; d++) {
          if (normalizeMark(state.marks[`${hIdx}_${d}`] || "") === "check") {
            run++;
            if (run > longest) longest = run;
          } else {
            run = 0;
          }
        }
        return longest;
      }

      function updateLongestStreak(hIdx) {
        ensureLongestStreaks();
        const habit = state.habits[hIdx];
        if (!habit) return;
        const key = habitStreakKey(habit);
        const stored = state.longestStreaks[key] || 0;
        state.longestStreaks[key] = Math.max(
          stored,
          getCurrentStreak(hIdx),
          getLongestStreakInMonth(hIdx),
        );
      }

      function getPersistedLongestStreak(hIdx) {
        ensureLongestStreaks();
        const habit = state.habits[hIdx];
        if (!habit) return 0;
        const key = habitStreakKey(habit);
        return Math.max(
          state.longestStreaks[key] || 0,
          getLongestStreakInMonth(hIdx),
          getCurrentStreak(hIdx),
        );
      }

      function streakBadgeHtml(hIdx) {
        const n = getCurrentStreak(hIdx);
        return `<span class="habit-streak" title="السلسلة الحالية: ${toArabicDigits(n)}">🔥 ${toArabicDigits(n)}</span>`;
      }

      function runStreakSelfTests() {
        const savedHabits = state.habits;
        const savedMarks = state.marks;
        const savedLongest = state.longestStreaks;
        state.habits = [{ name: "اختبار سلسلة", cat: "الصباح", points: 10 }];
        state.marks = {
          "0_1": "check",
          "0_2": "check",
          "0_3": "",
          "0_4": "check",
          "0_5": "check",
          "0_6": "check",
        };
        state.longestStreaks = {};
        console.assert(
          getLongestStreakInMonth(0) === 3,
          "longest month streak should be 3",
        );
        state.habits = savedHabits;
        state.marks = savedMarks;
        state.longestStreaks = savedLongest;
      }

      function getCurrentYearMonth() {
        const year = parseInt(document.getElementById("yearInput").value, 10);
        const month = parseInt(
          document.getElementById("monthSelect").value,
          10,
        );
        return { year, month };
      }

      function setYearMonth(year, month, day) {
        while (month < 0) {
          month += 12;
          year -= 1;
        }
        while (month > 11) {
          month -= 12;
          year += 1;
        }
        document.getElementById("yearInput").value = year;
        document.getElementById("monthSelect").value = month;
        const nDays = daysInMonth(year, month);
        if (day != null) currentDay = day;
        if (currentDay > nDays) currentDay = nDays;
        if (currentDay < 1) currentDay = 1;
        loadState();
      }

      function shiftMonth(delta) {
        const { year, month } = getCurrentYearMonth();
        let y = year;
        let m = month + delta;
        while (m < 0) {
          m += 12;
          y -= 1;
        }
        while (m > 11) {
          m -= 12;
          y += 1;
        }
        const now = new Date();
        const day =
          viewMode === "day" && y === now.getFullYear() && m === now.getMonth()
            ? now.getDate()
            : 1;
        setYearMonth(y, m, day);
      }

      function showToast(msg) {
        const el = document.getElementById("toast");
        el.textContent = msg;
        el.classList.add("is-show");
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => el.classList.remove("is-show"), 2200);
      }

      function escapeAttr(str) {
        return String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      function toArabicDigits(value) {
        return String(value).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
      }

      function getWeekOfYear(date) {
        const d = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
      }

      function deleteHabitAt(idx) {
        if (!confirm("حذف هذه العادة؟")) return;
        state.habits.splice(idx, 1);
        const newMarks = {};
        Object.keys(state.marks).forEach((k) => {
          const [hi, day] = k.split("_");
          const hiNum = parseInt(hi, 10);
          if (hiNum === idx) return;
          const newHi = hiNum > idx ? hiNum - 1 : hiNum;
          newMarks[`${newHi}_${day}`] = state.marks[k];
        });
        state.marks = newMarks;
        saveState();
        renderAll();
      }

      function loadState() {
        const { year, month } = getCurrentYearMonth();
        const raw = localStorage.getItem(storageKey(year, month));
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            state.habits = syncHabitPointsFromDefaults(
              parsed.habits && parsed.habits.length
                ? parsed.habits
                : JSON.parse(JSON.stringify(defaultHabits)),
            );
            state.marks = parsed.marks || {};
            state.weekly = parsed.weekly || {};
            state.longestStreaks = parsed.longestStreaks || {};
          } catch (e) {
            state = {
              habits: JSON.parse(JSON.stringify(defaultHabits)),
              marks: {},
              weekly: {},
              longestStreaks: {},
            };
          }
        } else {
          state = {
            habits: JSON.parse(JSON.stringify(defaultHabits)),
            marks: {},
            weekly: {},
            longestStreaks: {},
          };
        }
        ensureLongestStreaks();
        weeklyBuiltFor = null;
        renderAll();
      }

      function safeSetItem(key, value) {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (err) {
          console.error(err);
          showToast("تعذر حفظ البيانات - المساحة التخزينية ممتلئة");
          return false;
        }
      }

      function saveState() {
        const { year, month } = getCurrentYearMonth();
        safeSetItem(storageKey(year, month), JSON.stringify(state));
      }

      function renderAll() {
        updateAppTitle();
        if (viewMode === "month") {
          renderTable();
          renderWeekly(false);
          renderMonthSummary();
        } else {
          renderDayView();
        }
        renderHabitManageList();
      }

      function updateAppTitle() {
        const { year, month } = getCurrentYearMonth();
        const label = `${MONTH_NAMES[month]} ${toArabicDigits(year)}`;
        const title = document.getElementById("appTitle");
        if (title) {
          title.textContent = `New متابع شهر ${label}`;
        }
        const monthNav = document.getElementById("monthNavTitle");
        if (monthNav) monthNav.textContent = label;
      }

      function setViewMode(mode) {
        viewMode = mode === "month" ? "month" : "day";
        safeSetItem(VIEW_MODE_KEY, viewMode);
        const isDay = viewMode === "day";
        document
          .getElementById("dayView")
          .classList.toggle("is-visible", isDay);
        document
          .getElementById("monthPanel")
          .classList.toggle("is-visible", !isDay);
        document
          .getElementById("monthSummary")
          .classList.toggle("is-visible", !isDay);
        document
          .getElementById("weeklySection")
          .classList.toggle("is-visible", !isDay);
        const viewToggle = document.getElementById("viewToggle");
        if (viewToggle) viewToggle.dataset.mode = viewMode;
        const dayBtn = document.getElementById("showDayBtn");
        const monthBtn = document.getElementById("showMonthBtn");
        if (dayBtn)
          dayBtn.setAttribute("aria-pressed", isDay ? "true" : "false");
        if (monthBtn)
          monthBtn.setAttribute("aria-pressed", isDay ? "false" : "true");
        if (isDay) {
          renderDayView();
        } else {
          renderTable();
          renderWeekly(true);
          renderMonthSummary();
        }
      }

      function getSavedViewMode() {
        try {
          const saved = localStorage.getItem(VIEW_MODE_KEY);
          if (saved === "month" || saved === "day") return saved;
        } catch (e) {}
        return "day";
      }

      function applyMarkToCell(td, key, mark) {
        mark = normalizeMark(mark);
        const heatClass =
          mark === "check"
            ? "heat-done"
            : mark === "x"
              ? "heat-missed"
              : "heat-empty";
        td.className = `day-cell ${heatClass}`;
        if (td.dataset.friday === "1") td.classList.add("friday-col");
        if (td.classList.contains("today-col") || td.dataset.today === "1") {
          td.classList.add("today-col");
        }
        td.textContent = MARK_SYMBOL[mark] || "";
        const hIdx = parseInt(key.split("_")[0], 10);
        const day = parseInt(key.split("_")[1], 10);
        // Theme colors come from CSS (var(--green) / dark overrides) — clear any stale inline fill
        td.style.backgroundColor = "";
        const habitName = state.habits[hIdx]?.name || "عادة";
        const { year, month } = getCurrentYearMonth();
        const status = MARK_LABEL[mark] || "غير محدد";
        const dateLabel = `${toArabicDigits(day)} ${MONTH_NAMES[month]}`;
        const tip = `${habitName} — ${dateLabel}: ${status}`;
        td.setAttribute("aria-label", tip);
        td.title = tip;
      }

      function cycleMark(key, td) {
        const day = parseInt(key.split("_")[1], 10);
        const hIdx = parseInt(key.split("_")[0], 10);
        const wasPerfect = getDayPoints(day).perfect;
        const wasAtLeastHalfX = dayXRatio(day) >= 0.5;
        const current = normalizeMark(state.marks[key] || "");
        const next = current === "" ? "check" : current === "check" ? "x" : "";
        state.marks[key] = next;
        applyMarkToCell(td, key, next);
        const habitRow = td.closest("tr");
        if (habitRow) {
          habitRow.querySelectorAll("td.day-cell[data-key]").forEach((cell) => {
            const cellKey = cell.dataset.key;
            applyMarkToCell(cell, cellKey, state.marks[cellKey] || "");
          });
        }
        updateLongestStreak(hIdx);
        saveState();
        updatePointsRow();
        updateWeeklyPoints();
        if (viewMode === "month") {
          renderMonthSummary();
          const habit = state.habits[hIdx];
          const habitCell = td.closest("tr")?.querySelector(".habit-cell");
          if (habit && habitCell) {
            habitCell.innerHTML =
              `${habit.icon || ""} ${habit.name} ${streakBadgeHtml(hIdx)}`.trim();
          }
        }
        celebrateIfNewlyPerfect(day, wasPerfect);
        encourageIfHalfX(day, wasAtLeastHalfX);
      }

      function updatePointsRow() {
        const row = document.getElementById("pointsRow");
        if (!row) return;
        const possibleDayPoints = maxDayPoints();
        const cells = row.querySelectorAll("td[data-day]");
        cells.forEach((td) => {
          const d = parseInt(td.dataset.day, 10);
          let earnedPoints = 0;
          state.habits.forEach((h, hIdx) => {
            earnedPoints += pointsForMark(h, state.marks[`${hIdx}_${d}`] || "");
          });
          td.textContent = formatMonthPointsDisplay(
            earnedPoints,
            possibleDayPoints,
          );
          td.title = `مكتسب/ممكن: ${earnedPoints} / ${possibleDayPoints}`;
        });
      }

      function layoutMonthLegend() {
        const bar = document.getElementById("tableLegendBar");
        if (!bar) return;
        // Keep legend truly centered in the heatmap shell (no habit-column offset).
        bar.style.paddingInlineStart = "";
        bar.style.paddingInlineEnd = "";
      }

      function scrollMonthTableToToday() {
        const wrap = document.querySelector(".table-wrap.heatmap-glass");
        const todayTh = wrap?.querySelector(
          "thead tr.day-header-row th.today-col",
        );
        const habitTh = wrap?.querySelector(
          "thead tr.day-header-row th.habit-col",
        );
        if (!wrap || !todayTh || !habitTh) return;

        // Align today's right edge flush with the habit column's left edge (no gap).
        const align = () => {
          const habitEdge = habitTh.getBoundingClientRect().left;
          const todayEdge = todayTh.getBoundingClientRect().right;
          const delta = todayEdge - habitEdge;
          if (Math.abs(delta) > 0.5)
            wrap.scrollBy({ left: delta, behavior: "auto" });
          // Second pass after sticky/layout settles
          requestAnimationFrame(() => {
            const habitEdge2 = habitTh.getBoundingClientRect().left;
            const todayEdge2 = todayTh.getBoundingClientRect().right;
            const delta2 = todayEdge2 - habitEdge2;
            if (Math.abs(delta2) > 0.5)
              wrap.scrollBy({ left: delta2, behavior: "auto" });
            layoutMonthLegend();
          });
        };
        requestAnimationFrame(() => requestAnimationFrame(align));
      }

      function renderTable() {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        const now = new Date();
        const todayDay =
          now.getFullYear() === year && now.getMonth() === month
            ? now.getDate()
            : -1;
        const headerRow = document.getElementById("headerRow");
        const tbody = document.getElementById("tableBody");
        headerRow.innerHTML = "";
        tbody.innerHTML = "";

        const thHabit = document.createElement("th");
        thHabit.textContent = "العادة";
        thHabit.className = "habit-col";
        headerRow.appendChild(thHabit);

        for (let d = 1; d <= nDays; d++) {
          const th = document.createElement("th");
          const weekday = new Date(year, month, d).getDay();
          th.innerHTML = `<span class="day-name">${DAY_NAMES[weekday]}</span><span class="day-num">${toArabicDigits(d)}</span>`;
          if (weekday === 5) th.classList.add("friday-col");
          if (d === todayDay) th.classList.add("today-col");
          headerRow.appendChild(th);
        }

        let lastCat = null;
        state.habits.forEach((habit, hIdx) => {
          const cat = habit.cat || "—";
          if (cat !== lastCat) {
            lastCat = cat;
            const groupTr = document.createElement("tr");
            groupTr.className = "cat-group-row";
            const tdLabel = document.createElement("td");
            tdLabel.className = "habit-cell cat-group-label";
            tdLabel.textContent = cat;
            groupTr.appendChild(tdLabel);
            const tdSpan = document.createElement("td");
            tdSpan.className = "cat-group-span";
            tdSpan.colSpan = nDays;
            tdSpan.setAttribute("aria-hidden", "true");
            groupTr.appendChild(tdSpan);
            tbody.appendChild(groupTr);
          }

          const tr = document.createElement("tr");
          const tdHabit = document.createElement("td");
          tdHabit.className = "habit-cell";
          tdHabit.innerHTML =
            `${habit.icon || ""} ${habit.name} ${streakBadgeHtml(hIdx)}`.trim();
          tr.appendChild(tdHabit);

          for (let d = 1; d <= nDays; d++) {
            const td = document.createElement("td");
            td.className = "day-cell";
            td.tabIndex = 0;
            td.setAttribute("role", "button");
            const key = `${hIdx}_${d}`;
            const mark = state.marks[key] || "";
            if (new Date(year, month, d).getDay() === 5) {
              td.classList.add("friday-col");
              td.dataset.friday = "1";
            }
            if (d === todayDay) {
              td.classList.add("today-col");
              td.dataset.today = "1";
            }
            applyMarkToCell(td, key, mark);
            td.dataset.key = key;
            td.addEventListener("click", () => cycleMark(key, td));
            td.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                cycleMark(key, td);
              }
            });
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        });

        const pointsRow = document.createElement("tr");
        pointsRow.className = "points-row";
        pointsRow.id = "pointsRow";
        const tdLabel = document.createElement("td");
        tdLabel.className = "habit-cell";
        tdLabel.textContent = "النقاط";
        pointsRow.appendChild(tdLabel);
        const possibleDayPoints = maxDayPoints();
        for (let d = 1; d <= nDays; d++) {
          const td = document.createElement("td");
          td.dataset.day = d;
          let earnedPoints = 0;
          state.habits.forEach((h, hIdx) => {
            earnedPoints += pointsForMark(h, state.marks[`${hIdx}_${d}`] || "");
          });
          td.textContent = formatMonthPointsDisplay(
            earnedPoints,
            possibleDayPoints,
          );
          td.title = `مكتسب/ممكن: ${earnedPoints} / ${possibleDayPoints}`;
          if (new Date(year, month, d).getDay() === 5)
            td.classList.add("friday-col");
          if (d === todayDay) td.classList.add("today-col");
          pointsRow.appendChild(td);
        }
        tbody.appendChild(pointsRow);

        if (todayDay > 0) {
          scrollMonthTableToToday();
        } else {
          requestAnimationFrame(() => requestAnimationFrame(layoutMonthLegend));
        }
      }

      function updateWeeklyPoints() {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        const nWeeks = Math.ceil(nDays / 7);
        for (let w = 0; w < nWeeks; w++) {
          const startDay = w * 7 + 1;
          const endDay = Math.min(nDays, startDay + 6);
          let weekPoints = 0;
          for (let d = startDay; d <= endDay; d++) {
            state.habits.forEach((h, hIdx) => {
              weekPoints += pointsForMark(h, state.marks[`${hIdx}_${d}`] || "");
            });
          }
          const badge = document.querySelector(`[data-week-points="${w}"]`);
          if (badge)
            badge.textContent = `إجمالي النقاط: ${toArabicDigits(weekPoints)}`;
        }
      }

      function renderWeekly(forceRebuild) {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        const nWeeks = Math.ceil(nDays / 7);
        const key = `${year}-${month}-${nWeeks}`;
        const section = document.getElementById("weeklySection");

        if (
          !forceRebuild &&
          weeklyBuiltFor === key &&
          section.children.length === nWeeks
        ) {
          updateWeeklyPoints();
          return;
        }

        const active = document.activeElement;
        const activeWeek = active && active.dataset && active.dataset.week;
        const activePos =
          active && active.tagName === "TEXTAREA"
            ? active.selectionStart
            : null;

        section.innerHTML = "";
        for (let w = 0; w < nWeeks; w++) {
          const startDay = w * 7 + 1;
          const endDay = Math.min(nDays, startDay + 6);
          let weekPoints = 0;
          for (let d = startDay; d <= endDay; d++) {
            state.habits.forEach((h, hIdx) => {
              weekPoints += pointsForMark(h, state.marks[`${hIdx}_${d}`] || "");
            });
          }
          const monthWeek = w + 1;
          const yearWeek = getWeekOfYear(new Date(year, month, startDay));
          const card = document.createElement("div");
          card.className = "weekly-card liquid-glass-lite";
          card.innerHTML = `
      <h3>
        أيام ${toArabicDigits(startDay)}–${toArabicDigits(endDay)}
        <span class="week-numbers">الأسبوع ${toArabicDigits(monthWeek)} من ${MONTH_NAMES[month]} - الأسبوع ${toArabicDigits(yearWeek)} من سنة ${toArabicDigits(year)}</span>
      </h3>
      <div class="week-points"><span data-week-points="${w}">إجمالي النقاط: ${toArabicDigits(weekPoints)}</span></div>
      <label style="display:block;margin-top:10px;font-weight:bold;">تخطيط الأسبوع:</label>
      <textarea data-week="${w}" placeholder="اكتب خطتك لهذا الأسبوع..."></textarea>
    `;
          const ta = card.querySelector("textarea");
          ta.value = state.weekly[w] || "";
          ta.addEventListener("input", () => {
            state.weekly[ta.dataset.week] = ta.value;
            saveState();
          });
          section.appendChild(card);
        }
        weeklyBuiltFor = key;

        if (activeWeek != null) {
          const ta = section.querySelector(
            `textarea[data-week="${activeWeek}"]`,
          );
          if (ta) {
            ta.focus();
            if (activePos != null) ta.setSelectionRange(activePos, activePos);
          }
        }
      }

      function populateDaySelect(year, month, nDays) {
        const sel = document.getElementById("daySelect");
        sel.innerHTML = "";
        for (let d = 1; d <= nDays; d++) {
          const opt = document.createElement("option");
          opt.value = d;
          opt.textContent = `${toArabicDigits(d)} ${MONTH_NAMES[month]}`;
          if (d === currentDay) opt.selected = true;
          sel.appendChild(opt);
        }
      }

      function populateMonthSelect() {
        const sel = document.getElementById("monthSelect");
        sel.innerHTML = "";
        MONTH_NAMES.forEach((name, idx) => {
          const opt = document.createElement("option");
          opt.value = idx;
          opt.textContent = name;
          sel.appendChild(opt);
        });
      }

      function goToToday() {
        const now = new Date();
        document.getElementById("monthSelect").value = now.getMonth();
        document.getElementById("yearInput").value = now.getFullYear();
        currentDay = now.getDate();
        loadState();
        setViewMode("day");
      }

      function initApp() {
        const now = new Date();
        document.getElementById("monthSelect").value = now.getMonth();
        document.getElementById("yearInput").value = now.getFullYear();
        currentDay = now.getDate();
        loadState();
        setViewMode(getSavedViewMode());
        const monthWrap = document.querySelector(".table-wrap.heatmap-glass");
        if (monthWrap && !monthWrap.dataset.legendBound) {
          monthWrap.dataset.legendBound = "1";
        }
        window.addEventListener("resize", layoutMonthLegend);
      }

      function openSettings() {
        document.getElementById("settingsModal").classList.add("is-open");
        renderHabitManageList();
      }

      function closeSettings() {
        document.getElementById("settingsModal").classList.remove("is-open");
      }

      function renderHabitManageList() {
        const list = document.getElementById("habitManageList");
        if (!list) return;
        list.innerHTML = "";
        state.habits.forEach((habit, hIdx) => {
          const item = document.createElement("div");
          item.className = "habit-manage-item";
          item.innerHTML = `
      <input type="text" class="icon-input" data-field="icon" data-idx="${hIdx}" value="${escapeAttr(habit.icon || "")}" title="إيموجي">
      <input type="text" data-field="name" data-idx="${hIdx}" value="${escapeAttr(habit.name || "")}" placeholder="اسم العادة">
      <input type="text" data-field="cat" data-idx="${hIdx}" value="${escapeAttr(habit.cat || "")}" placeholder="التصنيف" style="flex:0.8;">
      <button type="button" class="danger" data-del="${hIdx}">حذف</button>
    `;
          list.appendChild(item);
        });

        list.querySelectorAll("input[data-field]").forEach((input) => {
          input.addEventListener("change", () => {
            const idx = parseInt(input.dataset.idx, 10);
            const field = input.dataset.field;
            if (!state.habits[idx]) return;
            state.habits[idx][field === "cat" ? "cat" : field] =
              input.value.trim();
            saveState();
            renderAll();
          });
        });

        list.querySelectorAll("[data-del]").forEach((btn) => {
          btn.addEventListener("click", () => {
            deleteHabitAt(parseInt(btn.dataset.del, 10));
          });
        });
      }

      function renderDayView() {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        if (currentDay > nDays) currentDay = nDays;
        if (currentDay < 1) currentDay = 1;

        const weekday = new Date(year, month, currentDay).getDay();
        document.getElementById("dayViewTitle").textContent =
          `${DAY_NAMES[weekday]} - ${toArabicDigits(currentDay)} ${MONTH_NAMES[month]} ${toArabicDigits(year)}`;
        populateDaySelect(year, month, nDays);

        const list = document.getElementById("dayHabitList");
        list.innerHTML = "";
        let earnedPoints = 0;
        const possibleDayPoints = maxDayPoints();

        let lastCat = null;
        state.habits.forEach((habit, hIdx) => {
          const cat = habit.cat || "";
          if (cat && cat !== lastCat) {
            lastCat = cat;
            const catLabel = document.createElement("div");
            catLabel.className = "day-habit-cat";
            catLabel.style.alignSelf = "flex-start";
            catLabel.style.marginTop = hIdx === 0 ? "0" : "8px";
            catLabel.textContent = cat;
            list.appendChild(catLabel);
          }

          const key = `${hIdx}_${currentDay}`;
          const mark = normalizeMark(state.marks[key] || "");
          earnedPoints += pointsForMark(habit, mark);

          const item = document.createElement("div");
          item.className =
            "day-habit-item liquid-glass-lite" +
            (mark === "check" ? " is-complete" : "");
          item.innerHTML = `
      <span class="day-habit-name">${habit.icon || ""} ${habit.name}</span>
      ${streakBadgeHtml(hIdx)}
      <div class="day-toggle-group">
        <button type="button" class="day-toggle-btn ${mark === "check" ? "active-check" : ""}" data-key="${key}" data-mark="check" aria-pressed="${mark === "check"}">✓ تم</button>
        <button type="button" class="day-toggle-btn ${mark === "x" ? "active-x" : ""}" data-key="${key}" data-mark="x" aria-pressed="${mark === "x"}">✗ غير مكتمل</button>
      </div>
    `;
          list.appendChild(item);
        });

        list.querySelectorAll(".day-toggle-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            const newMark = btn.dataset.mark;
            const parts = key.split("_");
            const hIdx = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const wasPerfect = getDayPoints(day).perfect;
            const wasAtLeastHalfX = dayXRatio(day) >= 0.5;
            const current = normalizeMark(state.marks[key] || "");
            state.marks[key] = current === newMark ? "" : newMark;
            updateLongestStreak(hIdx);
            saveState();
            celebrateIfNewlyPerfect(day, wasPerfect);
            encourageIfHalfX(day, wasAtLeastHalfX);
            renderDayView();
          });
        });

        document.getElementById("dayTotal").textContent = possibleDayPoints
          ? `نقاط اليوم: ${formatEarnedPossible(earnedPoints, possibleDayPoints)}`
          : `نقاط اليوم: ${toArabicDigits(earnedPoints)}`;
      }

      function renderMonthSummary() {
        const { year, month } = getCurrentYearMonth();
        const nDays = daysInMonth(year, month);
        const list = document.getElementById("monthSummaryList");
        list.innerHTML = "";

        state.habits.forEach((habit, hIdx) => {
          let doneCount = 0;
          for (let d = 1; d <= nDays; d++) {
            if ((state.marks[`${hIdx}_${d}`] || "") === "check") doneCount++;
          }
          const pct = Math.round((doneCount / nDays) * 100);
          const row = document.createElement("div");
          row.className = "habit-progress-row";
          row.innerHTML = `
      <span class="habit-progress-name">${habit.icon || ""} ${habit.name}</span>
      <div class="habit-progress-bar-wrap" title="${toArabicDigits(doneCount)} من ${toArabicDigits(nDays)} يومًا (${toArabicDigits(pct)}٪)">
        <div class="habit-progress-bar" style="width:${pct}%;" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <span class="habit-progress-pct">${toArabicDigits(`${doneCount} / ${nDays}`)}</span>
      <span class="habit-progress-pct-box">${toArabicDigits(pct)}٪</span>
      ${streakBadgeHtml(hIdx)}
    `;
          list.appendChild(row);
        });

        let earnedMonthPoints = 0;
        for (let d = 1; d <= nDays; d++) {
          state.habits.forEach((h, hIdx) => {
            earnedMonthPoints += pointsForMark(
              h,
              state.marks[`${hIdx}_${d}`] || "",
            );
          });
        }
        const possibleMonthPoints = maxDayPoints() * nDays;
        const totalRow = document.createElement("div");
        totalRow.style.marginTop = "15px";
        totalRow.style.fontWeight = "bold";
        totalRow.style.fontSize = "1.1rem";
        totalRow.textContent =
          possibleMonthPoints && !isMobileViewport()
            ? `نقاط الشهر: ${formatEarnedPossible(earnedMonthPoints, possibleMonthPoints)}`
            : `نقاط الشهر: ${toArabicDigits(earnedMonthPoints)}`;
        list.appendChild(totalRow);
      }

      document.getElementById("loadBtn").addEventListener("click", loadState);
      document.getElementById("monthSelect").addEventListener("change", () => {
        loadState();
        if (viewMode === "day") renderDayView();
      });
      document.getElementById("yearInput").addEventListener("change", () => {
        loadState();
        if (viewMode === "day") renderDayView();
      });

      document.getElementById("resetBtn").addEventListener("click", () => {
        if (confirm("مسح بيانات هذا الشهر؟")) {
          const { year, month } = getCurrentYearMonth();
          localStorage.removeItem(storageKey(year, month));
          loadState();
          showToast("تم مسح الشهر");
        }
      });

      document.getElementById("addHabitBtn").addEventListener("click", () => {
        const name = document.getElementById("newHabitName").value.trim();
        const cat = document.getElementById("newHabitCat").value.trim();
        const icon = document.getElementById("newHabitIcon").value.trim();
        if (!name) return;
        state.habits.push({ name, cat, icon });
        document.getElementById("newHabitName").value = "";
        document.getElementById("newHabitCat").value = "";
        document.getElementById("newHabitIcon").value = "";
        saveState();
        renderAll();
        showToast("تمت إضافة العادة");
      });

      document.getElementById("exportBtn").addEventListener("click", () => {
        const { year, month } = getCurrentYearMonth();
        const blob = new Blob([JSON.stringify(state, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tracker_${year}_${String(month + 1).padStart(2, "0")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("تم التصدير");
      });

      document.getElementById("importBtn").addEventListener("click", () => {
        document.getElementById("importFile").click();
      });

      document.getElementById("importFile").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target.result);
            state = {
              habits: syncHabitPointsFromDefaults(
                parsed.habits || JSON.parse(JSON.stringify(defaultHabits)),
              ),
              marks: parsed.marks || {},
              weekly: parsed.weekly || {},
              longestStreaks: parsed.longestStreaks || {},
            };
            weeklyBuiltFor = null;
            saveState();
            renderAll();
            showToast("تم الاستيراد");
          } catch (err) {
            alert("ملف غير صالح");
          }
        };
        reader.readAsText(file);
        e.target.value = "";
      });

      document
        .getElementById("settingsBtn")
        .addEventListener("click", openSettings);
      document
        .getElementById("closeSettingsBtn")
        .addEventListener("click", closeSettings);
      document
        .getElementById("settingsModal")
        .addEventListener("click", (e) => {
          if (e.target.id === "settingsModal") closeSettings();
        });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeSettings();
      });

      document
        .getElementById("showDayBtn")
        .addEventListener("click", () => setViewMode("day"));
      document
        .getElementById("showMonthBtn")
        .addEventListener("click", () => setViewMode("month"));
      document
        .getElementById("prevMonthBtn")
        .addEventListener("click", () => shiftMonth(-1));
      document
        .getElementById("nextMonthBtn")
        .addEventListener("click", () => shiftMonth(1));
      document.getElementById("prevDayBtn").addEventListener("click", () => {
        currentDay -= 1;
        if (currentDay < 1) {
          const { year, month } = getCurrentYearMonth();
          let y = year,
            m = month - 1;
          if (m < 0) {
            m = 11;
            y -= 1;
          }
          setYearMonth(y, m, daysInMonth(y, m));
          return;
        }
        renderDayView();
      });
      document.getElementById("nextDayBtn").addEventListener("click", () => {
        const { year, month } = getCurrentYearMonth();
        currentDay += 1;
        if (currentDay > daysInMonth(year, month)) {
          let y = year,
            m = month + 1;
          if (m > 11) {
            m = 0;
            y += 1;
          }
          setYearMonth(y, m, 1);
          return;
        }
        renderDayView();
      });
      document.getElementById("daySelect").addEventListener("change", (e) => {
        currentDay = parseInt(e.target.value, 10);
        renderDayView();
      });
      document
        .getElementById("goTodayBtn")
        .addEventListener("click", goToToday);
      document.getElementById("themeToggle").addEventListener("change", (e) => {
        applyTheme(e.target.checked ? "dark" : "light");
      });

      populateMonthSelect();
      runPointsSelfTests(FIXTURE_HABITS, FIXTURE_MARKS);
      runStreakSelfTests();
      initTheme();
      initApp();
