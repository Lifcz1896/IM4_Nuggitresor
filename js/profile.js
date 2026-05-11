// profile.js
async function loadProfile() {
  try {
    const response = await fetch("api/profile.php", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const result = await response.json();
    document.getElementById("firstname").value = result.firstname || "";
    document.getElementById("lastname").value = result.lastname || "";
  } catch (error) {
    console.error("Error loading profile:", error);
    window.location.href = "login.html";
  }
}

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstname = document.getElementById("firstname").value.trim();
  const lastname = document.getElementById("lastname").value.trim();

  try {
    const response = await fetch("api/profile.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstname, lastname }),
    });

    const result = await response.json();

    if (result.status === "success") {
      alert("Profil erfolgreich gespeichert!");
    } else {
      alert(result.message || "Fehler beim Speichern.");
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Etwas ist schiefgelaufen!");
  }
});

window.addEventListener("load", loadProfile);
