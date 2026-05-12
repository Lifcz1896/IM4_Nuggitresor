// register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    if (result.status === "success") {
      showToast("Registrierung erfolgreich!", "success");
      setTimeout(() => { window.location.href = "login.html"; }, 1200);
    } else {
      showToast(result.message || "Registrierung fehlgeschlagen.");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Etwas ist schiefgelaufen!");
  }
});
