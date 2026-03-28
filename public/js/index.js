const bookGrid = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");

async function fetchBooks(query = "") {
  try {
    let url = "/api/books/";
    if (query) {
      url += `?search=${encodeURIComponent(query)}`;
    }
    
    const res = await fetch(url);
    const data = await res.json();
    
    displayBooks(data.books);
  } catch (err) {
    console.error(err);
    bookGrid.innerHTML = `<p style="text-align:center;color:#bfc9d6;">Error fetching books</p>`;
  }
}
function displayBooks(books) {
  bookGrid.innerHTML = "";

  if (!books || !books.length) {
    bookGrid.innerHTML = `<p style="text-align:center;color:#9ca3af;grid-column:1/-1;padding:3rem 0;">No books found.</p>`;
    return;
  }

  books.forEach((book) => {
    const card = document.createElement("div");
    card.classList.add("book-card");
    card.style.cursor = "pointer";

    const available = book.availableCopies > 0;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
        <h3 style="color:#3b82f6;font-size:1rem;line-height:1.3;">${book.title}</h3>
        <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap;flex-shrink:0;background:${available ? "#064e3b" : "#3b0f0f"};color:${available ? "#6ee7b7" : "#f87171"};">${available ? `${book.availableCopies} available` : "Unavailable"}</span>
      </div>
      <p style="color:#d1d5db;font-size:0.88rem;margin-bottom:4px;">By ${book.author}</p>
      <p style="display:inline-block;font-size:0.78rem;color:#93c5fd;background:#1e3a5f;padding:2px 8px;border-radius:20px;">${book.category}</p>
    `;

    card.addEventListener("click", () => {
      window.location.href = "/api/users/login";
    });

    bookGrid.appendChild(card);
  });
}

// Show all books on page load
fetchBooks();

// Live search with debounce
let debounceTimeout;

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    fetchBooks(query);
  }, 400);
});

