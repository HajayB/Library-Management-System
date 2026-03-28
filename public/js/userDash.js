document.addEventListener("DOMContentLoaded", async () => {

  // ===== AUTH CHECK =====
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "/api/users/login";
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ===== SIDEBAR TOGGLE =====
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  // ===== DARK MODE =====
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // ===== LOGOUT =====
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/api/users/login";
  });

  // ===== DOM REFS =====
  const userNameEl = document.getElementById("user-name");
  const statTotal = document.getElementById("stat-total");
  const statReading = document.getElementById("stat-reading");
  const statOverdue = document.getElementById("stat-overdue");
  const statFines = document.getElementById("stat-fines");
  const fineBanner = document.getElementById("fine-banner");
  const bannerFineAmount = document.getElementById("banner-fine-amount");
  const activeCards = document.getElementById("active-cards");
  const activeCount = document.getElementById("active-count");
  const historyTbody = document.getElementById("history-tbody");
  const showMoreBtn = document.getElementById("show-more-btn");

  // ===== HELPERS =====
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCountdownInfo(dueDateStr, status) {
    if (status === "returned") return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return { text: `${diffDays} days left`, cls: "countdown-days-left" };
    } else if (diffDays === 1) {
      return { text: "1 day left", cls: "countdown-days-left" };
    } else if (diffDays === 0) {
      return { text: "Due today", cls: "countdown-due-today" };
    } else {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`,
        cls: "countdown-overdue",
      };
    }
  }

  function getStatusBadge(status) {
    const map = {
      returned: { label: "Returned", cls: "status-returned" },
      "within time": { label: "Reading", cls: "status-reading" },
      reading: { label: "Reading", cls: "status-reading" },
      overdue: { label: "Overdue", cls: "status-overdue" },
    };
    const s = map[status] || { label: status, cls: "status-reading" };
    return `<span class="status-badge ${s.cls}">${s.label}</span>`;
  }

  // ===== FETCH PROFILE =====
  try {
    const res = await fetch("/api/users/myprofile", { headers });
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();

    const { user, totalFine, borrowHistory } = data;

    // Topbar
    userNameEl.textContent = `Welcome, ${user.name}`;

    // Fine banner
    if (totalFine > 0) {
      bannerFineAmount.textContent = `₦${totalFine.toLocaleString()}`;
      fineBanner.style.display = "flex";
    }

    // ---- Stats ----
    const total = borrowHistory.length;
    const reading = borrowHistory.filter((b) => b.status === "within time").length;
    const overdue = borrowHistory.filter((b) => b.status === "overdue").length;

    statTotal.textContent = total;
    statReading.textContent = reading;
    statOverdue.textContent = overdue;
    statFines.textContent = `₦${totalFine.toLocaleString()}`;

    // ---- Active borrow cards ----
    const activeBooks = borrowHistory.filter((b) => b.status !== "returned");
    activeCount.textContent = activeBooks.length;

    if (activeBooks.length === 0) {
      activeCards.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>You have no books currently borrowed.</p>
          <a href="/api/users/library">Browse the Library</a>
        </div>`;
    } else {
      activeCards.innerHTML = "";
      activeBooks.forEach((book) => {
        const countdown = getCountdownInfo(book.dueDate, book.status);
        const isOverdue = book.status === "overdue";
        const card = document.createElement("div");
        card.className = `borrow-card ${isOverdue ? "overdue-card" : "reading-card"}`;

        // Footer: return button for on-time books, visit-library notice for overdue
        const cardFooter = isOverdue
          ? `<div class="overdue-notice">
               <span class="countdown-badge countdown-overdue">${countdown ? countdown.text : "Overdue"}</span>
               <span class="fine-tag">Fine: ₦${book.fine.toLocaleString()}</span>
             </div>
             <div class="library-notice">
               📍 Visit the library to pay your fine. The admin will clear it so you can return the book.
             </div>`
          : `<div class="borrow-card-footer">
               ${countdown ? `<span class="countdown-badge ${countdown.cls}">${countdown.text}</span>` : ""}
               <button class="btn-return" data-record-id="${book.recordId}">Return Book</button>
             </div>`;

        card.innerHTML = `
          <div class="borrow-card-top">
            <div>
              <div class="borrow-card-title">${book.title || "Unknown Title"}</div>
              <div class="borrow-card-author">by ${book.author || "Unknown Author"}</div>
            </div>
            <span class="category-badge">${book.category || "—"}</span>
          </div>
          <div class="borrow-card-dates">
            <div class="date-row">
              <span class="date-label">Borrowed</span>
              <span class="date-value">${formatDate(book.borrowDate)}</span>
            </div>
            <div class="date-row">
              <span class="date-label">Due Date</span>
              <span class="date-value">${formatDate(book.dueDate)}</span>
            </div>
          </div>
          ${cardFooter}`;
        activeCards.appendChild(card);
      });

      // ---- Return book handlers ----
      activeCards.querySelectorAll(".btn-return").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const recordId = btn.dataset.recordId;
          const confirmed = confirm("Confirm return? The book will be marked as returned.");
          if (!confirmed) return;

          btn.disabled = true;
          btn.textContent = "Processing...";

          try {
            const res = await fetch(`/api/return/${recordId}`, {
              method: "PUT",
              headers,
            });
            const data = await res.json();

            if (!res.ok) {
              alert(data.message || "Failed to process return.");
              btn.disabled = false;
              btn.textContent = "Return Book";
              return;
            }

            // Reload the page to reflect updated state
            window.location.reload();
          } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
            btn.disabled = false;
            btn.textContent = "Return Book";
          }
        });
      });
    }

    // ---- Borrow history table ----
    const SHOW_LIMIT = 5;
    let showing = SHOW_LIMIT;

    function renderHistory() {
      const visible = borrowHistory.slice(0, showing);
      if (visible.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No borrow history yet.</td></tr>`;
        return;
      }

      historyTbody.innerHTML = "";
      visible.forEach((b) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${b.title || "—"}</strong></td>
          <td>${b.author || "—"}</td>
          <td>${b.category || "—"}</td>
          <td>${formatDate(b.borrowDate)}</td>
          <td>${formatDate(b.dueDate)}</td>
          <td>${b.returnDate ? formatDate(b.returnDate) : "—"}</td>
          <td>${getStatusBadge(b.status)}</td>
          <td>${b.fine > 0 ? `<span style="color:var(--danger);font-weight:700;">₦${b.fine.toLocaleString()}</span>` : "₦0"}</td>`;
        historyTbody.appendChild(tr);
      });

      if (borrowHistory.length > showing) {
        showMoreBtn.style.display = "inline-block";
        showMoreBtn.textContent = `Show More (${borrowHistory.length - showing} remaining)`;
      } else {
        showMoreBtn.style.display = "none";
      }
    }

    renderHistory();

    showMoreBtn.addEventListener("click", () => {
      showing += SHOW_LIMIT;
      renderHistory();
    });

  } catch (err) {
    console.error(err);
    userNameEl.textContent = "Welcome";
    activeCards.innerHTML = `<div class="loading-text">Failed to load data. Please refresh.</div>`;
    historyTbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Error loading history.</td></tr>`;
  }
});
