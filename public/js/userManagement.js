import {start}  from './universalFunctions.js'
start();

import {returnHeader}  from './universalFunctions.js'

const headers = returnHeader();
const cards = document.querySelectorAll(".stat-card p");
  cards[0].textContent = "Loading...";
  cards[1].textContent = "Loading...";
  cards[2].textContent = "Loading...";
  cards[3].textContent = "Loading...";
async function userCards(){
    const res = await fetch("/api/summary", {headers});

    if(!res.ok)return;

    const data = await res.json();
    const stats = data.stats;

    cards[0].textContent = stats.totalUsers;
    cards[1].textContent = stats.activeMembers;
    cards[2].textContent = stats.usersWithOverdue;
    cards[3].textContent = stats.usersJoinedThisMonth;

}
userCards();

//TABLE 

const tableBody = document.querySelector(".user-table tbody");
const searchBar = document.getElementById("search");
const filterSelect = document.getElementById("filter");
const sortSelect = document.getElementById("sort");
let allrecords= [];

//===========FETCH ALL USERRECORDS==========
async function getAllRecords(){
  try {
  const res = await fetch("/api/users/userdetails", { headers });
  if (!res.ok) {
    showError(`Failed to load overdue list (${res.status})`);
    return;
  }

  const result = await res.json();
  allrecords = result.users;
  renderTable(allrecords);
}

catch (err) {
  console.error(err);
  showError("Something went wrong while loading overdue records.");
}
}getAllRecords();

async function renderTable(records) {
    if (!tableBody) return;

    if (!records || records.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No Activity</td></tr>';
  } else {
    tableBody.innerHTML = ""; // clear old rows

    records.forEach((record) => {
        const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${record.name}</td>
        <td>${record.borrowCount}</td>
        <td>${record.email}</td>
        <td class="active">${record.status}</td>
        <td  data-id="${record._id}"><button class ="details-btn">details</button></td>
      `;
      tableBody.appendChild(tr);
    });
  }
}
// ======================= SEARCH FOR RECORD BY NAME=======================
async function searchUsers(query) {
  query = query.trim();

  // If input is empty, show all records
  if (!query) {
    renderTable(allrecords);
    return;
  }

  try {
    const res = await fetch(`/api/users/userdetails?search=${encodeURIComponent(query)}`, { headers });
    
    if (!res.ok) {
      console.error(`Search request failed with status ${res.status}`);
      return;
    }

    const data = await res.json();
    const result = data.users;

    // If backend returned a message (no records)
    if (data.message) {
      tableBody.innerHTML = `<tr><td colspan="5">${data.message}</td></tr>`;
      return;
    }

    // Otherwise render records
    renderTable(result || []);
    
  } catch (err) {
    console.error(err);
    showError("Something went wrong while searching.");
  }
}

//===================TO USE SEARCH INPUT====================
searchBar.addEventListener("input", (e) => {
  const query = e.target.value;
  searchUsers(query);
});
// Function to fetch users with filter/sort
async function fetchFilteredUsers() {
  const filter = filterSelect.value;

  try {
    const res = await fetch(`/api/users/userdetails?filter=${filter}`, { headers });
    if (!res.ok) return;

    const data = await res.json();
    const result = data.users // update global array
    renderTable(result);
  } catch (err) {
    console.error(err);
  }
}

//function to fetch users with sort 
async function fetchSortedUsers(){
    const sort = sortSelect.value;

    try{
        const res = await fetch(`/api/users/userdetails?sort=${sort}`, { headers });
        if (!res.ok) return;

        const data = await res.json();
        const result = data.users // update global array
        renderTable(result);
    }catch(error){
        console.error(error)
    }
}

// Event listeners
filterSelect.addEventListener("change", fetchFilteredUsers);
sortSelect.addEventListener("change", fetchSortedUsers);

//PAGINATION
const pagination = document.querySelector(".pagination");
let currentPage = 1;
const limit = 5; // 5 users per page

async function loadPage(page) {
  // Prevent going out of bounds
  if (page < 1) return;
  
  const res = await fetch(`/api/users/userdetails?page=${page}&limit=${limit}`, { headers });
  if (!res.ok) return;
  const data = await res.json();

  const result = data.users;
  renderTable(result);

  currentPage = page;
  renderPagination(data.totalPages, currentPage);
}

function renderPagination(totalPages, currentPage) {
  if (!pagination) return;

  // Hide if 5 or fewer users
  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  } else {
    pagination.style.display = "flex";
  }

  pagination.innerHTML = "";

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev Page";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => loadPage(currentPage - 1));
  pagination.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.classList.toggle("active", i === currentPage);
    pageBtn.addEventListener("click", () => loadPage(i));
    pagination.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next Page";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => loadPage(currentPage + 1));
  pagination.appendChild(nextBtn);
}

// Initial load
loadPage(1);

//MODAL POP UP 

// MODAL ELEMENTS
const modal = document.getElementById("userModal");
const closeBtn = modal.querySelector(".close-btn");
const closeBtnBottom = modal.querySelector(".close-btn-bottom");

// Fields
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const address = document.getElementById("address");
const joinedOn = document.getElementById("joinedOn");
const status = document.getElementById("status");
const borrowCount = document.getElementById("borrowCount");
const overdueBooks = document.getElementById("overdueBooks");
const lastActive = document.getElementById("lastActive");
const totalFines = document.getElementById("totalFines");
const borrowHistory = document.getElementById("borrowHistory");

// Open modal when details button clicked
tableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("details-btn")) {
    const userId = e.target.parentElement.dataset.id;
    try {
      const res = await fetch(`/api/users/userdetails/${userId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch user details");

      const data = await res.json();
      const user = data.user;

      // Fill modal fields
      fullName.textContent = user.name;
      email.textContent = user.email;
      phone.textContent = user.phone || "N/A";
      address.textContent = user.address || "N/A";
      joinedOn.textContent = new Date(user.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });
      status.textContent = user.status;

      borrowCount.textContent = user.borrowCount || 0;
      overdueBooks.textContent = user.overdueBooks || 0;
      lastActive.textContent = user.lastActive ? new Date(user.lastActive).toLocaleDateString("en-GB") : "N/A";
      totalFines.textContent = user.totalFines ? `₦${user.totalFines.toLocaleString()}` : "₦0";

      // Borrow history
      borrowHistory.innerHTML = "";
      if (user.borrowHistory && user.borrowHistory.length) {
        user.borrowHistory.forEach(b => {
          const li = document.createElement("li");
          li.textContent = `${b.title} (${b.status})`;
          borrowHistory.appendChild(li);
        });
      } else {
        borrowHistory.innerHTML = "<li>No borrow history</li>";
      }

      // Show modal
      modal.style.display = "flex";
    } catch (err) {
      console.error(err);
      alert("Failed to load user details.");
    }
  }
});

// Close modal
closeBtn.addEventListener("click", () => modal.style.display = "none");
closeBtnBottom.addEventListener("click", () => modal.style.display = "none");

// Close modal when clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});
