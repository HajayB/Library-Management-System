const bookGrid = document.getElementById("booksContainer");
const searchInput = document.getElementById("searchInput");

async function fetchBooks(query = "") {
  try {
    let url = "/api/books/";
    if (query) {
      url += `?search=${encodeURIComponent(query)}`;
    }
    console.log(url);
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.books); 
    displayBooks(data.books);
  } catch (err) {
    console.error(err);
    bookGrid.innerHTML = `<p style="text-align:center;color:#bfc9d6;">Error fetching books</p>`;
  }
}
function displayBooks(books) {
  bookGrid.innerHTML = "";

  if (!books.length) {
    bookGrid.innerHTML = `<p style="text-align:center;color:#bfc9d6;">No books found</p>`;
    return;
  }

  books.forEach((book) => {
    // const card = document.createElement("div");
    // card.classList.add("book-card");
    // const handleOnClick = ()=>{alert("Please login to view full details of this book.")}

    // card.innerHTML = `
    //   <div class="book-title" onclick=handleOnClick >${book.title}</div>
    //   <div class="book-author">By: ${book.author}</div>
    //   <div class="book-category">Category: ${book.category}</div>
    // `;

    // bookGrid.appendChild(card); 

    const card = document.createElement("div");
    card.classList.add("book-card");

    const title = document.createElement("div");
    title.classList.add("book-title");
    title.textContent = book.title;

    card.addEventListener("click", () => {
      alert("Please login to view full details of this book.");
    });

    const author = document.createElement("div");
    author.classList.add("book-author");
    author.textContent = `By: ${book.author}`;

    const category = document.createElement("div");
    category.classList.add("book-category");
    category.textContent = `Category: ${book.category}`;

    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(category);

    bookGrid.appendChild(card);
  });
}

// live search
let debounceTimeout;

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    if (query === "") {
      bookGrid.innerHTML = "";
      return;
    }

    fetchBooks(query);
  }, 2000); // 2 seconds
});

