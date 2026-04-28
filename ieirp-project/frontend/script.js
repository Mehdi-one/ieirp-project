// ============================================================
// IEIRP — script.js — FINAL VERSION
// Matched exactly to:
//   - index.html element IDs
//   - /api/auth, /api/incidents, /api/categories, /api/admin
// ============================================================
 
const API = "http://localhost:8080/api"; // ✅ confirmed from your controllers
 
// ============================================================
// STATE
// ============================================================
let token = localStorage.getItem("token");
let currentUser = (() => {
  try { return JSON.parse(localStorage.getItem("user")); }
  catch { return null; }
})();
 
// ============================================================
// BOOT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("[IEIRP] Booted. API =", API);
 
  // Auth form toggle
  document.getElementById("showRegister")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("loginForm").style.display    = "none";
    document.getElementById("registerForm").style.display = "block";
  });
  document.getElementById("showLogin")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display    = "block";
  });
 
  // ✅ Wire forms — this was the core bug before
  document.getElementById("loginFormElement")?.addEventListener("submit",    handleLogin);
  document.getElementById("registerFormElement")?.addEventListener("submit", handleRegister);
  document.getElementById("incidentForm")?.addEventListener("submit",        handleReportIncident);
 
  // Nav links
  document.querySelectorAll(".nav-link[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const page = link.getAttribute("href").replace("#", "");
      if (!page) return;
      e.preventDefault();
      showPage(page);
    });
  });
 
  // Logout
  document.querySelector(".logout-link")?.addEventListener("click", e => {
    e.preventDefault();
    logout();
  });
 
  // Dashboard filter button
  document.querySelector(".dashboard-filters .btn-secondary")
    ?.addEventListener("click", loadDashboardIncidents);
 
  // Startup
  updateNavForAuth();
  loadCategories();
 
  const hash = window.location.hash.replace("#", "");
  showPage(hash || (token ? "home" : "login"));
 
  window.addEventListener("hashchange", () => {
    const p = window.location.hash.replace("#", "");
    if (p) showPage(p);
  });
});
 
// ============================================================
// PAGE NAVIGATION
// ============================================================
function showPage(id) {
  const target = document.getElementById(id);
  if (!target) return;
 
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  window.location.hash = id;
 
  if (id === "incidents")  loadMyIncidents();
  if (id === "dashboard")  { loadDashboardStats(); loadDashboardIncidents(); }
  if (id === "admin")      { loadAdminUsers(); loadAdminCategories(); }
  if (id === "report")     loadCategories();
}
 
// ============================================================
// FETCH HELPER
// ============================================================
async function apiFetch(path, options = {}) {
  const url = `${API}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  console.log(`[FETCH] ${options.method || "GET"} ${url}`);
  const res = await fetch(url, { ...options, headers });
  console.log(`[FETCH] <- ${res.status} ${url}`);
  return res;
}
 
// ============================================================
// NOTIFICATIONS + LOADING
// ============================================================
function notify(msg, isError = false) {
  const el = document.getElementById("notification");
  if (!el) { alert(msg); return; }
  el.textContent = msg;
  el.className = "notification " + (isError ? "error" : "success") + " show";
  setTimeout(() => el.classList.remove("show"), 4000);
}
 
function showLoading(on) {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = on ? "flex" : "none";
}
 
// ============================================================
// LOGIN — POST /api/auth/login
// Response: { token, type, id, email, name, role }
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  if (btn) btn.disabled = true;
  showLoading(true);
 
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
 
  if (!email || !password) {
    notify("Please enter email and password.", true);
    if (btn) btn.disabled = false;
    showLoading(false);
    return;
  }
 
  try {
    const res  = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log("[LOGIN] Response:", data);
 
    if (!res.ok) {
      notify(data.error || "Invalid credentials.", true);
      return;
    }
 
    token       = data.token;  // ✅ backend returns "token"
    currentUser = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data));
 
    updateNavForAuth();
    notify("✅ Welcome back, " + (data.name || data.email) + "!");
    showPage("home");
 
  } catch (err) {
    console.error("[LOGIN]", err);
    notify("❌ Cannot reach backend at " + API + ". Is Spring Boot running?", true);
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}
 
// ============================================================
// REGISTER — POST /api/auth/register
// Response: { message, userId, email, role }
// ============================================================
async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  if (btn) btn.disabled = true;
  showLoading(true);
 
  const name     = document.getElementById("registerName").value.trim();
  const email    = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
 
  if (!name || !email || !password) {
    notify("Please fill in all fields.", true);
    if (btn) btn.disabled = false;
    showLoading(false);
    return;
  }
 
  try {
    const res  = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    console.log("[REGISTER] Response:", data);
 
    if (!res.ok) {
      notify(data.error || "Registration failed.", true);
      return;
    }
 
    notify("✅ Registered! Please log in.");
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display    = "block";
    document.getElementById("loginEmail").value = email;
 
  } catch (err) {
    console.error("[REGISTER]", err);
    notify("❌ Cannot reach backend at " + API, true);
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}
 
// ============================================================
// LOGOUT
// ============================================================
function logout() {
  token       = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateNavForAuth();
  showPage("login");
}
 
// ============================================================
// NAV VISIBILITY — roles: CITIZEN | AUTHORITY | ADMIN
// ============================================================
function updateNavForAuth() {
  const loggedIn    = !!token;
  const role        = currentUser?.role || "";
  const isAdmin     = role === "ADMIN";
  const isAuthority = role === "AUTHORITY" || isAdmin;
 
  const set = (sel, show) => {
    const el = document.querySelector(sel);
    if (el) el.style.display = show ? "" : "none";
  };
  set(".logout-link",    loggedIn);
  set(".login-link",     !loggedIn);
  set(".dashboard-link", isAuthority);
  set(".admin-link",     isAdmin);
}
 
// ============================================================
// CATEGORIES — GET /api/categories  (public endpoint)
// ============================================================
async function loadCategories() {
  const select = document.getElementById("category");
  if (!select) return;
 
  select.innerHTML = `<option value="">Loading…</option>`;
 
  try {
    const res  = await apiFetch("/categories");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    console.log("[CATEGORIES]", data);
 
    select.innerHTML = `<option value="">-- Select a category --</option>`;
    data.forEach(cat => {
      const opt       = document.createElement("option");
      opt.value       = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
 
    // Also populate dashboard filter
    const filterCat = document.getElementById("filterCategory");
    if (filterCat) {
      filterCat.innerHTML = `<option value="">All Categories</option>`;
      data.forEach(cat => {
        filterCat.innerHTML += `<option value="${cat.id}">${escHtml(cat.name)}</option>`;
      });
    }
 
  } catch (err) {
    console.error("[CATEGORIES]", err);
    select.innerHTML = `<option value="">⚠ Failed to load — is backend running?</option>`;
  }
}
 
// ============================================================
// REPORT INCIDENT — POST /api/incidents
// ============================================================
async function handleReportIncident(e) {
  e.preventDefault();
 
  if (!token) {
    notify("You must be logged in to report an incident.", true);
    showPage("login");
    return;
  }
 
  const btn = e.target.querySelector("button[type=submit]");
  if (btn) btn.disabled = true;
  showLoading(true);
 
  const categoryId  = document.getElementById("category").value;
  const location    = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();
  const latitude    = document.getElementById("latitude").value;
  const longitude   = document.getElementById("longitude").value;
 
  if (!categoryId || !location) {
    notify("Category and location are required.", true);
    if (btn) btn.disabled = false;
    showLoading(false);
    return;
  }
 
  const payload = {
    category:    { id: parseInt(categoryId) },
    location,
    description: description || "",
    latitude:    latitude  ? parseFloat(latitude)  : null,
    longitude:   longitude ? parseFloat(longitude) : null
  };
 
  console.log("[REPORT] Payload:", payload);
 
  try {
    const res  = await apiFetch("/incidents", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[REPORT] Response:", data);
 
    if (!res.ok) {
      notify(data.error || "Failed to submit incident.", true);
      return;
    }
 
    notify("✅ Incident reported successfully!");
    e.target.reset();
    loadCategories(); // repopulate dropdown after form reset
    setTimeout(() => showPage("incidents"), 1200);
 
  } catch (err) {
    console.error("[REPORT]", err);
    notify("❌ Backend not reachable.", true);
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}
 
// ============================================================
// MY INCIDENTS — GET /api/incidents/my
// ============================================================
async function loadMyIncidents() {
  if (!token) return;
  const container = document.getElementById("incidentsList");
  if (!container) return;
  container.innerHTML = "<p>Loading your incidents…</p>";
 
  try {
    const res = await apiFetch("/incidents/my");
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    renderIncidents(data, container, true);
  } catch (err) {
    console.error("[MY INCIDENTS]", err);
    container.innerHTML = "<p style='color:#c0392b'>Failed to load incidents.</p>";
  }
}
 
// ============================================================
// DASHBOARD STATS — GET /api/incidents/stats
// Response: { reported, underReview, inProgress, resolved, rejected }
// ============================================================
async function loadDashboardStats() {
  try {
    const res  = await apiFetch("/incidents/stats");
    if (!res.ok) return;
    const d = await res.json();
    console.log("[STATS]", d);
 
    // Backend doesn't return a "total" — compute it
    const total = (d.reported||0) + (d.underReview||0) + (d.inProgress||0)
                + (d.resolved||0) + (d.rejected||0);
 
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("totalIncidents",      total);
    set("reportedIncidents",   d.reported   || 0);
    set("inProgressIncidents", d.inProgress || 0);
    set("resolvedIncidents",   d.resolved   || 0);
 
  } catch (err) {
    console.error("[STATS]", err);
  }
}
 
// ============================================================
// DASHBOARD INCIDENTS — GET /api/incidents/filter
// ✅ Backend uses /filter?status=&categoryId=  NOT /?status=
// ============================================================
async function loadDashboardIncidents() {
  const container = document.getElementById("dashboardIncidents");
  if (!container) return;
  container.innerHTML = "<p>Loading…</p>";
 
  const status     = document.getElementById("filterStatus")?.value   || "";
  const categoryId = document.getElementById("filterCategory")?.value || "";
 
  const params = [];
  if (status)     params.push("status="     + status);
  if (categoryId) params.push("categoryId=" + categoryId);
  const path = "/incidents/filter" + (params.length ? "?" + params.join("&") : "");
 
  try {
    const res  = await apiFetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    renderIncidents(data, container, false);
  } catch (err) {
    console.error("[DASHBOARD]", err);
    container.innerHTML = "<p style='color:#c0392b'>Failed to load incidents.</p>";
  }
}
 
// ============================================================
// UPDATE STATUS — PUT /api/incidents/{id}/status
// ============================================================
async function updateIncidentStatus(id) {
  const select = document.getElementById("status_" + id);
  if (!select) return;
 
  try {
    const res = await apiFetch("/incidents/" + id + "/status", {
      method: "PUT",
      body: JSON.stringify({ status: select.value })
    });
    if (res.ok) { notify("✅ Status updated."); loadDashboardIncidents(); }
    else        { notify("Failed to update status.", true); }
  } catch (err) {
    console.error("[STATUS]", err);
    notify("❌ Error updating status.", true);
  }
}
 
// ============================================================
// ADMIN — USERS — GET /api/admin/users
// ============================================================
async function loadAdminUsers() {
  const container = document.getElementById("usersList");
  if (!container) return;
  container.innerHTML = "<p>Loading users…</p>";
 
  try {
    const res  = await apiFetch("/admin/users");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
 
    if (!data.length) { container.innerHTML = "<p>No users found.</p>"; return; }
 
    container.innerHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:10px">Name</th>
            <th style="padding:10px">Email</th>
            <th style="padding:10px">Role</th>
            <th style="padding:10px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(u => `
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px">${escHtml(u.name || "—")}</td>
              <td style="padding:10px">${escHtml(u.email)}</td>
              <td style="padding:10px">${escHtml(u.role || "CITIZEN")}</td>
              <td style="padding:10px">
                <button class="btn btn-secondary"
                  style="padding:4px 10px;font-size:12px;margin-right:4px"
                  onclick="changeUserRole(${u.id}, 'AUTHORITY')">Make Authority</button>
                <button class="btn btn-secondary"
                  style="padding:4px 10px;font-size:12px;color:#c0392b"
                  onclick="deleteAdminUser(${u.id})">Delete</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  } catch (err) {
    console.error("[ADMIN USERS]", err);
    container.innerHTML = "<p style='color:#c0392b'>Failed to load users.</p>";
  }
}
 
// ============================================================
// ADMIN — CHANGE ROLE — POST /api/admin/users/{id}/role
// ✅ Backend uses @PostMapping for this, not @PutMapping
// ============================================================
async function changeUserRole(userId, role) {
  try {
    const res = await apiFetch("/admin/users/" + userId + "/role", {
      method: "POST",
      body: JSON.stringify({ role })
    });
    if (res.ok) { notify("✅ Role updated to " + role + "."); loadAdminUsers(); }
    else        { notify("Failed to update role.", true); }
  } catch (err) { notify("❌ Error.", true); }
}
 
// ============================================================
// ADMIN — DELETE USER — DELETE /api/admin/users/{id}
// ============================================================
async function deleteAdminUser(userId) {
  if (!confirm("Delete this user? This cannot be undone.")) return;
  try {
    const res = await apiFetch("/admin/users/" + userId, { method: "DELETE" });
    if (res.ok) { notify("User deleted."); loadAdminUsers(); }
    else        { notify("Failed to delete user.", true); }
  } catch (err) { notify("❌ Error.", true); }
}
 
// ============================================================
// ADMIN — CATEGORIES
// ============================================================
async function loadAdminCategories() {
  const container = document.getElementById("categoriesList");
  if (!container) return;
  container.innerHTML = "<p>Loading categories…</p>";
 
  try {
    const res  = await apiFetch("/categories");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
 
    if (!data.length) { container.innerHTML = "<p>No categories found.</p>"; return; }
 
    container.innerHTML = `
      <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:10px">ID</th>
            <th style="padding:10px">Name</th>
            <th style="padding:10px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px">${c.id}</td>
              <td style="padding:10px">${escHtml(c.name)}</td>
              <td style="padding:10px">
                <button class="btn btn-secondary"
                  style="padding:4px 10px;font-size:12px;color:#c0392b"
                  onclick="deleteCategory(${c.id})">Delete</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  } catch (err) {
    console.error("[ADMIN CATEGORIES]", err);
    container.innerHTML = "<p style='color:#c0392b'>Failed to load categories.</p>";
  }
}
 
function showAddCategoryForm() {
  const name = prompt("New category name:");
  if (!name?.trim()) return;
  apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() })
  }).then(res => {
    if (res.ok) { notify("✅ Category added!"); loadAdminCategories(); loadCategories(); }
    else        { notify("Failed to add category.", true); }
  }).catch(() => notify("❌ Error.", true));
}
 
async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  try {
    const res = await apiFetch("/categories/" + id, { method: "DELETE" });
    if (res.ok) { notify("Category deleted."); loadAdminCategories(); loadCategories(); }
    else        { notify("Failed to delete.", true); }
  } catch (err) { notify("❌ Error.", true); }
}
 
// ============================================================
// ADMIN TABS
// ============================================================
function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b  => b.classList.remove("active"));
  document.getElementById(tab + "Tab")?.classList.add("active");
  const btns = document.querySelectorAll(".tab-btn");
  if (tab === "users")      btns[0]?.classList.add("active");
  if (tab === "categories") btns[1]?.classList.add("active");
}
 
// ============================================================
// RENDER INCIDENTS
// ============================================================
function renderIncidents(list, container, isOwner) {
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = "<p>No incidents found.</p>";
    return;
  }
 
  const colors = {
    REPORTED:     "#3b82f6",
    UNDER_REVIEW: "#f59e0b",
    IN_PROGRESS:  "#8b5cf6",
    RESOLVED:     "#10b981",
    REJECTED:     "#ef4444"
  };
 
  container.innerHTML = list.map(i => {
    const c = colors[i.status] || "#64748b";
    return `
      <div class="incident-card" style="
        border:1px solid #e2e8f0;border-radius:12px;padding:20px;
        margin-bottom:16px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.07)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px">
          <h4 style="margin:0;font-size:16px">${escHtml(i.category?.name || "Unknown")}</h4>
          <span style="background:${c}20;color:${c};padding:3px 10px;border-radius:20px;
                       font-size:12px;font-weight:600;white-space:nowrap">
            ${escHtml(i.status || "REPORTED")}
          </span>
        </div>
        <p style="margin:0 0 6px;color:#475569"><strong>📍</strong> ${escHtml(i.location || "—")}</p>
        ${i.description ? `<p style="margin:0 0 10px;color:#64748b;font-size:14px">${escHtml(i.description)}</p>` : ""}
        ${!isOwner ? `
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <select id="status_${i.id}"
              style="padding:5px;border-radius:6px;border:1px solid #cbd5e1;font-size:13px">
              <option value="REPORTED"     ${i.status==="REPORTED"     ?"selected":""}>Reported</option>
              <option value="UNDER_REVIEW" ${i.status==="UNDER_REVIEW" ?"selected":""}>Under Review</option>
              <option value="IN_PROGRESS"  ${i.status==="IN_PROGRESS"  ?"selected":""}>In Progress</option>
              <option value="RESOLVED"     ${i.status==="RESOLVED"     ?"selected":""}>Resolved</option>
              <option value="REJECTED"     ${i.status==="REJECTED"     ?"selected":""}>Rejected</option>
            </select>
            <button class="btn btn-secondary"
              style="padding:5px 12px;font-size:13px"
              onclick="updateIncidentStatus(${i.id})">Update</button>
          </div>` : ""}
      </div>`;
  }).join("");
}
 
// ============================================================
// XSS PROTECTION
// ============================================================
function escHtml(str) {
  if (str == null) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}