document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const firstNameInput = form.querySelector('input[name="firstname"]');
  const lastNameInput = form.querySelector('input[name="lastname"]');
  const emailInput = form.querySelector('input[name="email"]');
  const passwordInput = form.querySelector('input[name="password"]');
  const roleInputs = form.querySelectorAll('input[name="role"]'); // all role radios

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // get selected role
    let role = "";
    roleInputs.forEach(radio => {
      if (radio.checked) role = radio.id; // or use radio.value if you set one
    });

    if (!firstNameInput.value || !lastNameInput.value || !email || !password || !role) {
      alert("Please fill in all fields and select a role.");
      return;
    }

    try {
      const response = await fetch("/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        alert("Account created successfully! Redirecting to sign in...");
        window.location.href = "/api/users/login";
      }, 2000);

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
});
