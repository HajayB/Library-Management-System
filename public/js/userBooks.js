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
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const booksGrid = document.getElementById("books-grid");
  const paginationEl = document.getElementById("pagination");
  const resultsCount = document.getElementById("results-count");

  // Modal elements
  const borrowModal = document.getElementById("borrow-modal");
  const modalClose = document.getElementById("modal-close");
  const modalCancel = document.getElementById("modal-cancel");
  const modalConfirm = document.getElementById("modal-confirm");
  const modalBookTitle = document.getElementById("modal-book-title");
  const modalBookAuthor = document.getElementById("modal-book-author");
  const modalBorrowDate = document.getElementById("modal-borrow-date");
  const modalDueDate = document.getElementById("modal-due-date");

  // Toast
  const toast = document.getElementById("toast");

  // ===== STATE =====
  let currentPage = 1;
  const PAGE_LIMIT = 12;
  let selectedBookId = null;
  let debounceTimer = null;

  // ===== HELPERS =====
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3500);
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCategoryClass(category) {
    const map = {
      "Fiction":      "cat-fiction",
      "Non-Fiction":  "cat-non-fiction",
      "Science":      "cat-science",
      "Technology":   "cat-technology",
      "History":      "cat-history",
      "Biography":    "cat-biography",
      "Self-Help":    "cat-self-help",
      "Children":     "cat-children",
      "Fantasy":      "cat-fantasy",
      "Mystery":      "cat-mystery",
      "Romance":      "cat-romance",
      "Thriller":     "cat-thriller",
    };
    return map[category] || "cat-mystery";
  }

  function getCategoryEmoji(category) {
    const map = {
      "Fiction":      "📖",
      "Non-Fiction":  "📰",
      "Science":      "🔬",
      "Technology":   "💻",
      "History":      "🏛️",
      "Biography":    "👤",
      "Self-Help":    "🌟",
      "Children":     "🧒",
      "Fantasy":      "🧙",
      "Mystery":      "🔍",
      "Romance":      "💕",
      "Thriller":     "😱",
    };
    return map[category] || "📚";
  }

  // ===== FETCH & RENDER BOOKS =====
  async function loadBooks(page = 1) {
    currentPage = page;
    booksGrid.innerHTML = `<div class="grid-message"><p>Loading books...</p></div>`;
    paginationEl.innerHTML = "";
    resultsCount.textContent = "Loading...";

    let searchTerm = searchInput.value.trim();
    const category = categoryFilter.value;

    // If no text search, use the selected category as search term
    if (!searchTerm && category) {
      searchTerm = category;
    }

    const params = new URLSearchParams({
      page,
      limit: PAGE_LIMIT,
      ...(searchTerm && { search: searchTerm }),
    });

    try {
      const res = await fetch(`/api/books?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load books");
      const data = await res.json();

      const { books, total, totalPages } = data;

      resultsCount.textContent = `Showing ${books.length} of ${total} book${total !== 1 ? "s" : ""}`;

      if (books.length === 0) {
        booksGrid.innerHTML = `
          <div class="grid-message">
            <div class="empty-icon">🔍</div>
            <p>No books found. Try a different search term.</p>
          </div>`;
        return;
      }

      booksGrid.innerHTML = "";
      books.forEach((book) => {
        const isAvailable = book.availableCopies > 0;
        const catClass = getCategoryClass(book.category);
        const catEmoji = getCategoryEmoji(book.category);

        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
          <div class="book-card-cover" style="background:var(--border)">
            ${catEmoji}
          </div>
          <div class="book-card-body">
            <div class="book-card-title">${book.title}</div>
            <div class="book-card-author">by ${book.author}</div>
            <div class="book-card-meta">
              <span class="book-category ${catClass}">${book.category}</span>
              <span class="availability ${isAvailable ? "available" : "unavailable"}">
                ${isAvailable ? `${book.availableCopies} available` : "Not available"}
              </span>
            </div>
          </div>
          <div class="book-card-footer">
            <button
              class="btn-borrow"
              data-id="${book._id}"
              data-title="${book.title}"
              data-author="${book.author}"
              ${!isAvailable ? "disabled" : ""}
            >
              ${isAvailable ? "Borrow" : "Unavailable"}
            </button>
          </div>`;
        booksGrid.appendChild(card);
      });

      // Attach borrow button listeners
      booksGrid.querySelectorAll(".btn-borrow:not(:disabled)").forEach((btn) => {
        btn.addEventListener("click", () => openBorrowModal(btn));
      });

      // Render pagination
      renderPagination(totalPages, page);

    } catch (err) {
      console.error(err);
      booksGrid.innerHTML = `<div class="grid-message"><p>Failed to load books. Please try again.</p></div>`;
      resultsCount.textContent = "";
    }
  }

  // ===== PAGINATION =====
  function renderPagination(totalPages, current) {
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "← Prev";
    prevBtn.disabled = current === 1;
    prevBtn.addEventListener("click", () => loadBooks(current - 1));
    paginationEl.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === current) btn.classList.add("active");
      btn.addEventListener("click", () => loadBooks(i));
      paginationEl.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next →";
    nextBtn.disabled = current === totalPages;
    nextBtn.addEventListener("click", () => loadBooks(current + 1));
    paginationEl.appendChild(nextBtn);
  }

  // ===== BORROW MODAL =====
  function openBorrowModal(btn) {
    selectedBookId = btn.dataset.id;
    const title = btn.dataset.title;
    const author = btn.dataset.author;

    const now = new Date();
    const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    modalBookTitle.textContent = title;
    modalBookAuthor.textContent = `by ${author}`;
    modalBorrowDate.textContent = formatDate(now);
    modalDueDate.textContent = formatDate(due);

    modalConfirm.disabled = false;
    modalConfirm.textContent = "Borrow Book";
    borrowModal.style.display = "flex";
  }

  function closeBorrowModal() {
    borrowModal.style.display = "none";
    selectedBookId = null;
  }

  modalClose.addEventListener("click", closeBorrowModal);
  modalCancel.addEventListener("click", closeBorrowModal);

  // Close on overlay click
  borrowModal.addEventListener("click", (e) => {
    if (e.target === borrowModal) closeBorrowModal();
  });

  // ===== CONFIRM BORROW =====
  modalConfirm.addEventListener("click", async () => {
    if (!selectedBookId) return;

    modalConfirm.disabled = true;
    modalConfirm.textContent = "Processing...";

    try {
      const res = await fetch("/api/borrow", {
        method: "POST",
        headers,
        body: JSON.stringify({ bookId: selectedBookId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Failed to borrow book.", "error");
        modalConfirm.disabled = false;
        modalConfirm.textContent = "Borrow Book";
        return;
      }

      closeBorrowModal();
      showToast("Book borrowed successfully! Due in 14 days.", "success");
      // Reload current page to update availability counts
      loadBooks(currentPage);

    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
      modalConfirm.disabled = false;
      modalConfirm.textContent = "Borrow Book";
    }
  });

  // ===== SEARCH — debounced =====
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadBooks(1), 400);
  });

  // ===== CATEGORY FILTER =====
  categoryFilter.addEventListener("change", () => {
    // Clear the text search when a category is selected to avoid conflicts
    if (categoryFilter.value) searchInput.value = "";
    loadBooks(1);
  });

  // ===== INITIAL LOAD =====
  await Promise.all([
    fetch("/api/users/myprofile", { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { userNameEl.textContent = data ? `Welcome, ${data.user.name}` : "Welcome"; })
      .catch(() => { userNameEl.textContent = "Welcome"; }),
    loadBooks(1),
  ]);
});
