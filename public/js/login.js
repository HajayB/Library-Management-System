document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const rememberMe = form.querySelector('input[name="rememberMe"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.querySelector(".error-message"); // Optional div for errors

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      return showError("Please fill in all fields.");
    }

    submitBtn.disabled = true;
    showError(""); // Clear old errors

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Sign in failed.");
      }

      // Save to localStorage or sessionStorage depending on "Remember Me"
      const storage = rememberMe.checked ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      // Redirect based on user role
      if (data.user.role === "admin") {
        setTimeout(()=>{
        // alert("Welcome back Admin! Redirecting to  dashboard...");
        window.location.href = "/api/users/admin/dashboard"; // admin route
        },2000)
        
      } else if (data.user.role === "member") {
        // alert("success! Redirecting to dashboard...");
        window.location.href = "/api/users/dashboard"; // member route
      } else {
        alert("Role not recognized. Redirecting to signup page...");
        window.location.href = "/api/users/signup";
      }

    } catch (error) {
      console.error("Login error:", error);
      showError(error.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = message ? "block" : "none";
    } else if (message) {
      alert(message);
    }
  }
});
