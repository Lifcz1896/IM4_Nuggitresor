// login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("api/login.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      showToast("Willkommen zurück!", "success");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 900);
    } else {
      showToast(result.message || "Login fehlgeschlagen.");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Etwas ist schiefgelaufen!");
  }
});
