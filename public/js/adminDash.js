document.addEventListener("DOMContentLoaded", async () => {
  // --- 🔐 Retrieve JWT token from localStorage or sessionStorage
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    window.location.href = "/api/users/login";
    return;
  }
  //includes token in header for authorization
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

// ===== Sidebar toggle (mobile)
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');

const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

function closeSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('active');
  overlay.classList.toggle('active', isOpen);
});

overlay.addEventListener('click', closeSidebar);

// ===== Dark mode toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
  themeToggle.textContent = '☀️';
}

// Toggle theme
themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// DOM elements
const welcomeText = document.getElementById("admin-name");
const cards = document.querySelectorAll(".card p");
const popularBooksTable = document.querySelector(".borrowed tbody");
// --- ✨ Show temporary loading states
  welcomeText.textContent = "Loading...";
  cards[0].textContent = "Loading...";
  cards[1].textContent = "Loading...";
  cards[2].textContent = "Loading...";
  cards[3].textContent = "Loading...";

  popularBooksTable.innerHTML =
    '<tr><td colspan="4">Loading records...</td></tr>';

try {
    // --- 1️⃣ Fetch profile + summary in parallel
    const [profileRes, summaryRes] = await Promise.all([
      fetch("/api/users/myprofile", { headers }),
      fetch("/api/summary", { headers }),
    ]);

    if (!profileRes.ok) throw new Error("Failed to fetch profile");
    if (!summaryRes.ok) throw new Error("Failed to fetch summary");

    const [profile, summary] = await Promise.all([
      profileRes.json(),
      summaryRes.json(),
    ]);

    welcomeText.textContent = `Welcome, ${profile.user.name}`;

    cards[0].textContent = `${summary.stats.totalUsers.toLocaleString()}`;
    cards[1].textContent = `${summary.stats.totalBooks.toLocaleString()}`;
    cards[2].textContent = `${summary.stats.borrowedBooks.toLocaleString()}`;
    cards[3].textContent = `${summary.stats.overdueBooks.toLocaleString()}`;



    //CHARTS 
    // 🎨 Render Bar Chart (monthly trends)
    const ctxBar = document.getElementById("activityChart");
    new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: summary.charts.monthlyChart.map(d => d.month),
        datasets: [{
          label: "Books Borrowed",
          data: summary.charts.monthlyChart.map(d => d.count),
          backgroundColor: "#4f46e5"
        }]
      }
    });
    // 🎨 Render Pie Chart 
    const ctxPie = document.getElementById("categoryChart");
    new Chart(ctxPie, {
      type: "doughnut",
      data: {
        labels: summary.charts.categoryChart.map(d => d.label),
        datasets: [{
          data: summary.charts.categoryChart.map(d => d.value),
          backgroundColor: ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444"]
        }]
      }
    });

  // --- 3️⃣ Most borrowed books (reuse the already-fetched summary)
    const mostBorrowedBooks = summary.highlights.mostBorrowedBooks;

    // --- 🧾 Clear placeholder rows
    popularBooksTable.innerHTML = "";

    if (mostBorrowedBooks.length === 0) {
      popularBooksTable.innerHTML =
        '<tr><td colspan="4">No Activity</td></tr>';
    } else {
      mostBorrowedBooks.forEach((record, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${record.title}</td>
          <td>${record.category}</td>
          <td>${record.borrowCount}</td>
        `;
        popularBooksTable.appendChild(tr);
      });
    }


}
catch(error){
  console.error(error);
  popularBooksTable.innerHTML = 
      '<tr><td colspan="4">Error loading records.</td></tr>';
}



  // --- 🚪 Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/api/users/login";
  });

});