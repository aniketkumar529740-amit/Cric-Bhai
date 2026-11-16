
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
