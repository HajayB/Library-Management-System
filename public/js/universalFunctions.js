 export async function start(){
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
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

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

try {
    // --- 1️⃣ Fetch user profile
    const profileRes = await fetch("/api/users/myprofile", { headers });
    if (!profileRes.ok) throw new Error("Failed to fetch profile");
    const profile = await profileRes.json();

    welcomeText.textContent = `Welcome, ${profile.user.name}`;
}catch(error){
    console.error(error)
}

  // --- 🚪 Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/api/users/login";
  });

  console.log("working");

const errorBox = document.querySelector(".error-message");
const successBox = document.querySelector(".success-message");
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
      console.error(message);
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
}



export function returnHeader(){
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
  return headers;
  }