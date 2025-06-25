const API = "https://server-19j6.onrender.com/api"; // replace with your Flask backend domain when deployed

// Toggle forms
function showLogin() {
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
  clearMessage();
}

function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  clearMessage();
}

// Login
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("login-phone").value.trim();
  const password = document.getElementById("login-password").value;

  // Basic validation
  if (!phone || !password) {
    showMessage("Please fill in all fields", "error");
    return;
  }

  try {
    showMessage("Logging in...", "info");

    const res = await fetch(`${API}/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showMessage(data.error, "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage("Network error. Please try again.", "error");
  }
});

// Register
document
  .getElementById("register-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById(
      "reg-confirm-password"
    )?.value;

    // Basic validation
    if (!name || !phone || !password) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters long", "error");
      return;
    }

    // Phone format validation
    if (!phone.startsWith("+91") || phone.length !== 13) {
      showMessage("Phone number must be in format +91XXXXXXXXXX", "error");
      return;
    }

    try {
      showMessage("Creating account...", "info");

      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || null, password }),
      });

      const data = await res.json();

      if (data.success) {
        showMessage("Registration successful! Please login.", "success");
        document.getElementById("register-form").reset();
        setTimeout(() => {
          showLogin();
        }, 2000);
      } else {
        showMessage(data.error, "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showMessage("Network error. Please try again.", "error");
    }
  });

// Show message with different types
function showMessage(msg, type = "info") {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.innerText = msg;
    messageEl.className = `message ${type}`;

    // Auto-clear success/info messages after 5 seconds
    if (type === "success" || type === "info") {
      setTimeout(() => {
        clearMessage();
      }, 5000);
    }
  }
}

function clearMessage() {
  const messageEl = document.getElementById("message");
  if (messageEl) {
    messageEl.innerText = "";
    messageEl.className = "message";
  }
}

// Check authentication status on page load
async function checkAuth() {
  try {
    const res = await fetch(`${API}/check-session`, {
      credentials: "include",
    });
    const data = await res.json();

    if (data.authenticated) {
      // If on login page and already authenticated, redirect to dashboard
      if (
        window.location.pathname.includes("index.html") ||
        window.location.pathname === "/"
      ) {
        window.location.href = "dashboard.html";
      }
      return true;
    } else {
      // If on dashboard and not authenticated, redirect to login
      if (window.location.pathname.includes("dashboard.html")) {
        window.location.href = "index.html";
      }
      return false;
    }
  } catch (error) {
    console.error("Auth check error:", error);
    return false;
  }
}

// Dashboard loading
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/dashboard`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!data.success) {
      if (res.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "index.html";
      } else {
        showMessage("Failed to load dashboard data", "error");
      }
      return;
    }

    // Update user info
    const userInfoEl = document.getElementById("user-info");
    if (userInfoEl) {
      userInfoEl.innerHTML = `
        <div class="user-card">
          <h3>Welcome, ${data.delivery_boy.name}!</h3>
          <p><strong>Phone:</strong> ${data.delivery_boy.phone}</p>
          ${
            data.delivery_boy.email
              ? `<p><strong>Email:</strong> ${data.delivery_boy.email}</p>`
              : ""
          }
          <p><strong>Status:</strong> <span class="status-${
            data.delivery_boy.status
          }">${data.delivery_boy.status}</span></p>
          <p><strong>Deliveries Today:</strong> ${
            data.delivery_boy.deliveries_today
          }</p>
        </div>
      `;
    }

    // Update status select
    const statusSelect = document.getElementById("status-select");
    if (statusSelect) {
      statusSelect.value = data.delivery_boy.status;
    }

    // Update recent calls
    const callListEl = document.getElementById("call-list");
    if (callListEl) {
      if (data.recent_calls && data.recent_calls.length > 0) {
        callListEl.innerHTML = data.recent_calls
          .map(
            (call) => `
          <li class="call-item">
            <div class="call-info">
              <strong>Order:</strong> ${call.order_id}<br>
              <strong>Client:</strong> ${call.client_number}<br>
              <strong>Status:</strong> <span class="status-${
                call.call_status
              }">${call.call_status}</span><br>
              <strong>Time:</strong> ${new Date(
                call.call_time
              ).toLocaleString()}
            </div>
          </li>
        `
          )
          .join("");
      } else {
        callListEl.innerHTML = '<li class="no-calls">No recent calls</li>';
      }
    }
  } catch (error) {
    console.error("Dashboard loading error:", error);
    showMessage("Network error. Please refresh the page.", "error");
  }
}

// Update status
async function updateStatus() {
  const statusSelect = document.getElementById("status-select");
  if (!statusSelect) return;

  const status = statusSelect.value;

  try {
    const res = await fetch(`${API}/update-status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage(data.message, "success");
      // Reload dashboard to reflect changes
      setTimeout(() => {
        loadDashboard();
      }, 1000);
    } else {
      showMessage(data.error, "error");
      // Reset select to previous value
      loadDashboard();
    }
  } catch (error) {
    console.error("Status update error:", error);
    showMessage("Network error. Please try again.", "error");
    loadDashboard();
  }
}

// Load call logs with pagination
async function loadCallLogs(page = 1) {
  try {
    const res = await fetch(`${API}/call-logs?page=${page}&per_page=10`, {
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      const callLogsEl = document.getElementById("call-logs");
      if (callLogsEl) {
        if (data.call_logs && data.call_logs.length > 0) {
          callLogsEl.innerHTML = `
            <div class="call-logs-header">
              <h3>Call History (Page ${data.current_page} of ${data.pages})</h3>
            </div>
            <div class="call-logs-list">
              ${data.call_logs
                .map(
                  (call) => `
                <div class="call-log-item">
                  <div class="call-details">
                    <strong>Order:</strong> ${call.order_id}<br>
                    <strong>Client:</strong> ${call.client_number}<br>
                    <strong>Status:</strong> <span class="status-${
                      call.call_status
                    }">${call.call_status}</span><br>
                    <strong>Time:</strong> ${new Date(
                      call.call_time
                    ).toLocaleString()}<br>
                    ${
                      call.call_duration > 0
                        ? `<strong>Duration:</strong> ${call.call_duration}s<br>`
                        : ""
                    }
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
            ${
              data.pages > 1
                ? `
              <div class="pagination">
                ${
                  data.current_page > 1
                    ? `<button onclick="loadCallLogs(${
                        data.current_page - 1
                      })">Previous</button>`
                    : ""
                }
                <span>Page ${data.current_page} of ${data.pages}</span>
                ${
                  data.current_page < data.pages
                    ? `<button onclick="loadCallLogs(${
                        data.current_page + 1
                      })">Next</button>`
                    : ""
                }
              </div>
            `
                : ""
            }
          `;
        } else {
          callLogsEl.innerHTML =
            '<div class="no-data">No call logs found</div>';
        }
      }
    } else {
      showMessage("Failed to load call logs", "error");
    }
  } catch (error) {
    console.error("Call logs loading error:", error);
    showMessage("Network error loading call logs", "error");
  }
}

// Logout
async function logout() {
  try {
    const res = await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      showMessage("Logged out successfully", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      // Even if logout fails on server, clear client side
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Redirect anyway on network error
    window.location.href = "index.html";
  }
}

// Initialize page based on current location
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication status
  await checkAuth();

  // Load appropriate content based on page
  if (window.location.pathname.includes("dashboard.html")) {
    await loadDashboard();

    // Auto-refresh dashboard every 30 seconds
    setInterval(loadDashboard, 30000);
  }
});

// Profile management functions (if you add a profile page)
async function loadProfile() {
  try {
    const res = await fetch(`${API}/profile`, {
      credentials: "include",
    });

    const data = await res.json();

    if (data.success) {
      const profileForm = document.getElementById("profile-form");
      if (profileForm) {
        document.getElementById("profile-name").value = data.delivery_boy.name;
        document.getElementById("profile-phone").value =
          data.delivery_boy.phone;
        document.getElementById("profile-email").value =
          data.delivery_boy.email || "";
      }
    }
  } catch (error) {
    console.error("Profile loading error:", error);
  }
}

async function updateProfile() {
  const name = document.getElementById("profile-name").value.trim();
  const email = document.getElementById("profile-email").value.trim();

  try {
    const res = await fetch(`${API}/update-profile`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("Profile updated successfully", "success");
    } else {
      showMessage(data.error, "error");
    }
  } catch (error) {
    console.error("Profile update error:", error);
    showMessage("Network error. Please try again.", "error");
  }
}

async function changePassword() {
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-new-password").value;

  if (newPassword !== confirmPassword) {
    showMessage("New passwords do not match", "error");
    return;
  }

  if (newPassword.length < 6) {
    showMessage("New password must be at least 6 characters long", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/change-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("Password changed successfully", "success");
      document.getElementById("password-form").reset();
    } else {
      showMessage(data.error, "error");
    }
  } catch (error) {
    console.error("Password change error:", error);
    showMessage("Network error. Please try again.", "error");
  }
}
