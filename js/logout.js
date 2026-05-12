// logout.js
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const response = await fetch("api/logout.php", {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (result.status === "success") {
      window.location.href = "login.html";
    } else {
      showToast("Logout fehlgeschlagen. Bitte erneut versuchen.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Etwas ist schiefgelaufen!");
  }
});
