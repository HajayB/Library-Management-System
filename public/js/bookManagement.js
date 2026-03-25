import {start}  from './universalFunctions.js'
start();

import {returnHeader}  from './universalFunctions.js'

const headers = returnHeader();

  // === 🌍 UNIVERSAL FUNCTIONS =====================================
  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = message ? "block" : "none";

      if (message) {
      setTimeout(() => {
        errorBox.style.display = "none";
      }, 3000);
    }
    } else if (message) {
      alert(message);
    }
  }

  function showSuccess(message) {
    if (successBox) {
      successBox.textContent = message;
      successBox.style.display = message ? "block" : "none";

      if (message) {
      setTimeout(() => {
        successBox.style.display = "none";
      }, 3000);
    }
    } else if (message) {
      alert(message);
    }
  }

  //  // === ➕ DOM ELEMENT SELECTORS ========================
  const form = document.querySelector("form");
  const titleInput = form.querySelector('input[name="title"]');
  const authorInput = form.querySelector('input[name="author"]');
  const categoryInput = form.querySelector('select[name="category"]');
  const pubYear = form.querySelector('input[name="publishedYear"]');
  const isbnInput = form.querySelector('input[name="isbn"]');  
  const totalCopy = form.querySelector('input[name="totalCopies"]');
  const availableCopy = form.querySelector('input[name="availableCopies"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.querySelector(".error-message");
  const successBox = document.querySelector(".success-message");
  const booksTable = document.querySelector(".added tbody");
  
// ================Load books (for table)==============================

let allBooks = []; // empty array to keep books for later 
  try{
      const booksRes = await fetch("/api/books", { headers });
      if (!booksRes.ok) throw new Error("Failed to fetch books");
      const books = await booksRes.json();
      allBooks = books; //stores all books
      renderBooks(books);  
  }catch(error){
    console.error(error);
  }

function renderBooks(books) {
  booksTable.innerHTML = "";

  if (!books.length) {
    booksTable.innerHTML = '<tr><td colspan="6">No books found</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();

  books.forEach((book) => {
    const tr = document.createElement("tr");
    const date = new Date(book.createdAt).toLocaleDateString();
    const appendCategory = book.category.charAt(0).toUpperCase() + book.category.slice(1).toLowerCase();

    tr.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${appendCategory}</td>
      <td>${book.availableCopies}</td>
      <td>${date}</td>
      <td>
        <button class="edit" data-id="${book._id}">✏️</button>
        <button class="delete" data-id="${book._id}">🗑</button>
      </td>
    `;
    fragment.appendChild(tr);
  });

  booksTable.appendChild(fragment);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const category = categoryInput.value.trim();
  const publishedYear = Number(pubYear.value);
  const isbn = isbnInput.value.trim();
  const totalCopies = Number(totalCopy.value);
  const availableCopies = Number(availableCopy.value);

  submitBtn.disabled = true;
  showError("");

  try {
    // Send new book to the backend
    const res = await fetch("/api/books/add", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title,
        author,
        category,
        publishedYear,
        isbn,
        totalCopies,
        availableCopies
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error("Error adding book.");
    }
    showSuccess("Book added successfully!");

    const newBook = data.newBook;
    const bookId = newBook._id;

    // ✅ Create the row manually and prepend
    const newRow = document.createElement("tr");
    const date = new Date(newBook.createdAt).toLocaleDateString();


    newRow.innerHTML = `
      <td>${title}</td>
      <td>${author}</td>
      <td>${category}</td>
      <td>${availableCopies}</td>
      <td>${date}</td>
      <td>
        <button class="edit" data-id="${bookId}">✏️</button>
        <button class="delete" data-id="${bookId}">🗑</button>
      </td>
    `;


    booksTable.prepend(newRow);

    // Reset form fields
    form.reset();

    // ✅ Add to allBooks array
    allBooks.unshift(newBook);
  } catch (error) {
    console.error(error);
    showError(error.message || "Error adding book.");
  } finally {
    submitBtn.disabled = false;
  }
});
const pagination = document.querySelector(".pagination");
let currentPage = 1;
const limit = 5; // books per page
let totalPages = 1; // will be set dynamically

async function loadPage(page = 1, search = "") {
  currentPage = page;
  try {
    const res = await fetch(`/api/books?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch books");

    const data = await res.json();
    const books = data.books || [];

    totalPages = data.totalPages || 1;

    renderBooks(books);
    renderPagination();
  } catch (err) {
    console.error(err);
    showError(err.message || "Error loading books.");
  }
}

function renderPagination() {
  if (!pagination) return;

  pagination.innerHTML = "";

  // Hide if only 1 page
  if (totalPages <= 1) return;

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-btn")
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => loadPage(currentPage - 1));
  pagination.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.classList.add("page-btn")
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.classList.add("active");
    pageBtn.addEventListener("click", () => loadPage(i));
    pagination.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-btn")
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => loadPage(currentPage + 1));
  pagination.appendChild(nextBtn);
}

// Optional: update search to reset page
const searchInput = document.querySelector("#search"); // assuming you have one
if (searchInput) {
  searchInput.addEventListener("input", () => loadPage(1, searchInput.value.trim()));
}

// Initial load
loadPage(1);

  // === ❌ DELETE BOOK =====================================
  booksTable.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete")) return;

    const id = e.target.dataset.id;
    if (!id) return showError("No ID found for this transaction");

    const confirmDelete = confirm(
      "Are you sure you want to delete this book?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        // ✅ Update allBooks
        const bookIndex = allBooks.findIndex(b => b._id === id);
        if (bookIndex > -1) {
          allBooks[bookIndex].isDeleted = true;
      }

      // ✅ Re-render table to show top 5
      renderBooks(allBooks);
      showSuccess("Book deleted successfully!");
      } else {
        showError("Failed to delete book.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showError("Error deleting book.");
    }
  });


  // === ✏️ UPDATE TRANSACTION (MODAL) =============================
  const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeBtn = editModal.querySelector(".close");

// === OPEN MODAL ===
booksTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit")) {
    const id = e.target.dataset.id;
    const row = e.target.closest("tr");
    const cells = row.querySelectorAll("td");

    // Fill modal inputs with current data
    try{
     const res = await fetch(`/api/books/${id}`,{headers})
     if(!res.ok){
      showError("Unable to fetch book data.")
     }
     const bookRes = await res.json();

    editForm.id.value = bookRes._id;
    editForm.title.value =bookRes.title
    editForm.author.value = bookRes.author
    editForm.category.value = bookRes.category
    editForm.availableCopies.value = bookRes.availableCopies
    editForm.publishedYear.value = bookRes.publishedYear
    editForm.isbn.value = bookRes.isbn
    editForm.totalCopies.value = bookRes.totalCopies
    }
    catch(error){
      console.error(error);
    }


    editModal.style.display = "block";
  }
});

// === CLOSE MODAL ===
closeBtn.onclick = () => (editModal.style.display = "none");
window.onclick = (e) => {
  if (e.target == editModal) editModal.style.display = "none";
};

// === SUBMIT EDITS ===
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = editForm.id.value;
  const updatedBook = {
    title: editForm.title.value.trim(),
    author: editForm.author.value.trim(),
    category: editForm.category.value,
    publishedYear: Number(editForm.publishedYear.value),
    isbn: editForm.isbn.value.trim(),
    totalCopies: Number(editForm.totalCopies.value),
    availableCopies: Number(editForm.availableCopies.value),
  };

  try {
    const res = await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedBook),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed.");

    const returnedData = data.updatedBook;

    // ✅ Update the table row instantly
    const editedRow = booksTable.querySelector(`button[data-id="${id}"]`).closest("tr");
    editedRow.innerHTML = `
      <td>${returnedData.title}</td>
      <td>${returnedData.author}</td>
      <td>${returnedData.category}</td>
      <td>${returnedData.availableCopies}</td>
      <td>${new Date(returnedData.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="edit" data-id="${returnedData._id}">✏️</button>
        <button class="delete" data-id="${returnedData._id}">🗑</button>
      </td>
    `;

    editModal.style.display = "none";
    showSuccess("Book updated successfully! It will return upon refresh");
    booksTable.prepend(editedRow);
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
});
