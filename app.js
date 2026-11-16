
/* =========================================
   CRICK BHAI - MAIN JAVASCRIPT
   File: app.js
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /* =========================================
     1. ELEMENTS
  ========================================= */

  const profileButton = document.getElementById("profileButton");
  const notification = document.getElementById("notification");

  let notificationTimer = null;


  /* =========================================
     2. NOTIFICATION FUNCTION
  ========================================= */

  function showNotification(message) {

    if (!notification) return;

    // Clear previous timer
    if (notificationTimer) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }

    // Update message
    notification.textContent = message;

    // Show notification
    notification.classList.add("show");

    // Automatically hide after 3 seconds
    notificationTimer = setTimeout(function () {

      notification.classList.remove("show");

      notificationTimer = null;

    }, 3000);

  }




/* =========================================
   ADMIN AUTHENTICATION
========================================= */

const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");
const adminLoginView = document.getElementById("adminLoginView");
const adminDashboard = document.getElementById("adminDashboard");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginError = document.getElementById("adminLoginError");
const adminLogout = document.getElementById("adminLogout");

function showAdminLogin() {
    adminLoginView.hidden = false;
    adminDashboard.hidden = true;
    adminLoginError.textContent = "";
    adminModal.hidden = false;
}

async function checkAdminSession() {
    const response = await fetch("/api/me", {
        credentials: "same-origin"
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.authenticated === true;
}

async function openAdminPanel() {
    adminModal.hidden = false;
    adminLoginView.hidden = false;
    adminDashboard.hidden = true;

    try {
        if (await checkAdminSession()) {
            adminLoginView.hidden = true;
            adminDashboard.hidden = false;
        }
    } catch {
        adminLoginError.textContent =
            "Unable to connect. Please try again.";
    }
}

if (profileButton) {
    profileButton.addEventListener("click", openAdminPanel);
}

closeAdminModal.addEventListener("click", () => {
    adminModal.hidden = true;
});

adminModal.addEventListener("click", (event) => {
    if (event.target === adminModal) {
        adminModal.hidden = true;
    }
});

adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;
    const submitButton = document.getElementById("adminLoginSubmit");

    adminLoginError.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Checking...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Login failed");
        }

        adminLoginForm.reset();

        adminLoginView.hidden = true;
        adminDashboard.hidden = false;

    } catch (error) {
        adminLoginError.textContent = error.message;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Login";
    }
});

adminLogout.addEventListener("click", async () => {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "same-origin"
        });

        if (!response.ok) throw new Error("Logout failed");

        adminDashboard.hidden = true;
        adminLoginView.hidden = false;
        adminModal.hidden = true;

    } catch {
        alert("Unable to logout. Please try again.");
    }
});

  /* =========================================
     3. PROFILE BUTTON
  ========================================= */

  if (profileButton) {

    profileButton.addEventListener("click", function () {

      showNotification(
        "Currently this is not available. We are working on this."
      );

    });

  }


  /* =========================================
     4. INITIALIZATION
  ========================================= */

  console.log("CRICK BHAI App Initialized");

});
