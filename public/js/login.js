document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const rememberMe = form.querySelector('input[name="rememberMe"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorBox = document.querySelector(".error-message");
  const successBox = document.querySelector(".success-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      return showError("Please fill in all fields.");
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    showError("");

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      const storage = rememberMe.checked ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      showSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/api/users/admin/dashboard";
        } else if (data.user.role === "member") {
          window.location.href = "/api/users/dashboard";
        } else {
          window.location.href = "/api/users/signup";
        }
      }, 800);

    } catch (error) {
      console.error("Login error:", error);
      showError(error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  });

  function showError(message) {
    if (successBox) successBox.style.display = "none";
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = message ? "block" : "none";
    } else if (message) {
      alert(message);
    }
  }

  function showSuccess(message) {
    if (errorBox) errorBox.style.display = "none";
    if (successBox) {
      successBox.textContent = message;
      successBox.style.display = "block";
    }
  }
});
