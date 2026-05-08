const API = "http://localhost:8080/api";
const IFRANE_CENTER = [33.533331, -5.166667];
const STATUS_META = {
  REPORTED: { label: "Reported", color: "#dc2626", priority: 1 },
  IN_PROGRESS: { label: "In Progress", color: "#f97316", priority: 2 },
  UNDER_REVIEW: { label: "Under Review", color: "#f59e0b", priority: 3 },
  REJECTED: { label: "Rejected", color: "#6b7280", priority: 4 },
  RESOLVED: { label: "Resolved", color: "#16a34a", priority: 5 }
};
const PUBLIC_PAGES = new Set(["home", "report", "login", "report-success"]);
const PRIVATE_PAGES = new Set(["incidents", "dashboard", "admin", "incident-detail"]);

let token = localStorage.getItem("token");
let currentUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
})();
let currentDetailIncidentId = null;
let previousDetailPage = "incidents";
let incidentMap = null;
let incidentMarker = null;
let dashboardMapInstance = null;
let dashboardMapMarkers = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("showRegister")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
  });

  document.getElementById("showLogin")?.addEventListener("click", e => {
    e.preventDefault();
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  });

  document.getElementById("loginFormElement")?.addEventListener("submit", handleLogin);
  document.getElementById("registerFormElement")?.addEventListener("submit", handleRegister);
  document.getElementById("incidentForm")?.addEventListener("submit", handleReportIncident);
  document.getElementById("useCurrentLocation")?.addEventListener("click", fillCurrentLocation);
  document.getElementById("imageUpload")?.addEventListener("change", previewIncidentImage);
  updateArchiveToggleLabel();
  document.getElementById("searchIncidents")?.addEventListener("input", filterDashboardIncidentCards);
  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    document.querySelector(".nav-menu")?.classList.toggle("active");
  });

  document.querySelectorAll(".nav-link[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const page = link.getAttribute("href").replace("#", "");
      if (!page) return;
      e.preventDefault();
      showPage(page);
      document.querySelector(".nav-menu")?.classList.remove("active");
    });
  });

  document.querySelector(".logout-link")?.addEventListener("click", e => {
    e.preventDefault();
    logout();
  });

  updateNavForAuth();
  loadCategories();

  const hash = window.location.hash.replace("#", "");
  showPage(hash || "home");

  window.addEventListener("hashchange", () => {
    const page = window.location.hash.replace("#", "");
    if (page) showPage(page);
  });
});

function showPage(id) {
  if (!canAccessPage(id)) {
    notify(token ? "Your role does not allow access to that page." : "Please log in to access that page.", true);
    id = "home";
  }

  const target = document.getElementById(id);
  if (!target) return;

  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  target.classList.add("active");
  window.location.hash = id;
  updateActiveNav(id);

  if (id === "incidents") loadMyIncidents();
  if (id === "dashboard") {
    loadDashboardStats();
    loadDashboardIncidents();
  }
  if (id === "admin") {
    loadAdminUsers();
    loadAdminCategories();
  }
  if (id === "report") loadCategories();
  if (id === "incident-detail" && currentDetailIncidentId) loadIncidentDetail(currentDetailIncidentId);
}

function canAccessPage(id) {
  if (PUBLIC_PAGES.has(id)) return true;
  if (id === "dashboard") return isAuthorityUser();
  if (id === "admin") return currentUser?.role === "ADMIN";
  if (PRIVATE_PAGES.has(id)) return !!token;
  return true;
}

function updateActiveNav(id) {
  document.querySelectorAll(".nav-link").forEach(link => {
    const page = link.getAttribute("href")?.replace("#", "");
    link.classList.toggle("active", page === id);
  });
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) logout();
  return res;
}

async function readJson(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

function notify(msg, isError = false) {
  const el = document.getElementById("notification");
  if (!el) {
    alert(msg);
    return;
  }
  el.textContent = msg;
  el.className = "notification " + (isError ? "error" : "success") + " show";
  setTimeout(() => el.classList.remove("show"), 4000);
}

function showLoading(on) {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = on ? "flex" : "none";
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  showLoading(true);

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!isValidEmail(email) || !password) {
    notify("Use a valid email and password.", true);
    btn.disabled = false;
    showLoading(false);
    return;
  }

  try {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const data = await readJson(res);

    if (!res.ok) {
      notify(data.error || "Invalid credentials.", true);
      return;
    }

    token = data.token;
    currentUser = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(data));

    updateNavForAuth();
    notify("Welcome back, " + (data.name || data.email) + ".");
    showPage("home");
  } catch (err) {
    console.error("[LOGIN]", err);
    notify("Cannot reach the backend. Is Spring Boot running?", true);
  } finally {
    showLoading(false);
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  showLoading(true);

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;

  if (!name || !isValidEmail(email) || password.length < 8) {
    notify("Use a name, a valid email, and a password with at least 8 characters.", true);
    btn.disabled = false;
    showLoading(false);
    return;
  }

  try {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    const data = await readJson(res);

    if (!res.ok) {
      notify(data.error || "Registration failed.", true);
      return;
    }

    notify("Registered. Please log in.");
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("loginEmail").value = email;
  } catch (err) {
    console.error("[REGISTER]", err);
    notify("Cannot reach the backend.", true);
  } finally {
    showLoading(false);
    btn.disabled = false;
  }
}

function logout() {
  token = null;
  currentUser = null;
  currentDetailIncidentId = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateNavForAuth();
  showPage("home");
}

function updateNavForAuth() {
  const loggedIn = !!token;
  const role = currentUser?.role || "";
  const isAdmin = role === "ADMIN";
  const isAuthority = role === "AUTHORITY" || isAdmin;

  setDisplay(".logout-link", loggedIn);
  setDisplay(".login-link", !loggedIn);
  setDisplay(".incidents-link", loggedIn);
  setDisplay(".dashboard-link", isAuthority);
  setDisplay(".admin-link", isAdmin);
  setDisplay(".public-report-field", !loggedIn);
  setDisplay(".authority-only", isAuthority);
  setDisplay(".citizen-only", loggedIn && !isAuthority);
  setDisplay(".visitor-only", !loggedIn);
  setDisplay(".public-access-card", true);
  updateAccessCardTarget(isAdmin, isAuthority, loggedIn);
}

function setDisplay(selector, show) {
  document.querySelectorAll(selector).forEach(el => {
    el.style.display = show ? "" : "none";
  });
}

function updateAccessCardTarget(isAdmin, isAuthority, loggedIn) {
  const card = document.querySelector(".public-access-card");
  if (!card) return;
  if (isAdmin) {
    card.setAttribute("href", "#admin");
  } else if (isAuthority) {
    card.setAttribute("href", "#dashboard");
  } else if (loggedIn) {
    card.setAttribute("href", "#incidents");
  } else {
    card.setAttribute("href", "#login");
  }
}

async function loadCategories() {
  const select = document.getElementById("category");
  try {
    const res = await apiFetch("/categories");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await readJson(res);

    if (select) {
      select.innerHTML = `<option value="">-- Select a category --</option>`;
      data.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    }

    const filterCat = document.getElementById("filterCategory");
    if (filterCat) {
      filterCat.innerHTML = `<option value="">All Categories</option>`;
      data.forEach(cat => {
        filterCat.insertAdjacentHTML("beforeend", `<option value="${cat.id}">${escHtml(cat.name)}</option>`);
      });
    }

    renderHomeCategories(data);
  } catch (err) {
    console.error("[CATEGORIES]", err);
    if (select) select.innerHTML = `<option value="">Failed to load categories</option>`;
  }
}

function renderHomeCategories(categories) {
  const container = document.getElementById("homeCategories");
  if (!container || !Array.isArray(categories) || !categories.length) return;

  const icons = {
    "Forest Fire": "fa-fire",
    "Snow-blocked Road": "fa-snowflake",
    "Water Issue": "fa-droplet",
    "Infrastructure Damage": "fa-road",
    "Wildlife Incident": "fa-dove",
    "Air Pollution": "fa-smog",
    "Waste Management": "fa-recycle",
    "Noise Pollution": "fa-volume-high"
  };

  container.innerHTML = categories.map(cat => `
    <span class="category-chip">
      <i class="fas ${icons[cat.name] || "fa-leaf"}"></i>
      ${escHtml(cat.name)}
    </span>
  `).join("");
}

function fillCurrentLocation() {
  if (!navigator.geolocation) {
    notify("Geolocation is not available in this browser.", true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      document.getElementById("latitude").value = position.coords.latitude.toFixed(6);
      document.getElementById("longitude").value = position.coords.longitude.toFixed(6);
      notify("Location added to the report.");
    },
    () => notify("Could not access your location.", true),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function readIncidentImage() {
  const input = document.getElementById("imageUpload");
  const file = input?.files?.[0];
  if (!file) return Promise.resolve("");

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return Promise.reject(new Error("Upload a PNG, JPG, WEBP, or GIF image."));
  }
  if (file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error("Image is too large. Please upload an image under 2 MB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function previewIncidentImage() {
  const input = document.getElementById("imageUpload");
  const preview = document.getElementById("imagePreview");
  const file = input?.files?.[0];
  if (!preview) return;

  preview.style.display = "none";
  preview.innerHTML = "";
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    preview.style.display = "block";
    preview.innerHTML = `<p class="error-text">Selected file is not an image.</p>`;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.style.display = "grid";
    preview.innerHTML = `
      <img src="${escAttr(reader.result)}" alt="Selected incident preview">
      <div>
        <strong>${escHtml(file.name)}</strong>
        <span>${Math.round(file.size / 1024)} KB</span>
      </div>
      <button type="button" class="btn btn-secondary btn-small" onclick="clearImagePreview()">Remove</button>
    `;
  };
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  const input = document.getElementById("imageUpload");
  const preview = document.getElementById("imagePreview");
  if (input) input.value = "";
  if (preview) {
    preview.style.display = "none";
    preview.innerHTML = "";
  }
}

async function handleReportIncident(e) {
  e.preventDefault();

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  showLoading(true);

  const reporterEmail = document.getElementById("reporterEmail")?.value.trim().toLowerCase() || "";
  const categoryId = document.getElementById("category").value;
  const location = document.getElementById("location").value.trim();
  const description = document.getElementById("description").value.trim();
  const latitudeRaw = document.getElementById("latitude").value;
  const longitudeRaw = document.getElementById("longitude").value;
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

  if (!categoryId || !location) {
    notify("Category and location are required.", true);
    btn.disabled = false;
    showLoading(false);
    return;
  }
  if (!token && !isValidEmail(reporterEmail)) {
    notify("Enter a valid email so the administration can identify the report.", true);
    btn.disabled = false;
    showLoading(false);
    return;
  }
  if (!coordsAreValid(latitude, longitude)) {
    notify("Latitude must be -90 to 90 and longitude must be -180 to 180.", true);
    btn.disabled = false;
    showLoading(false);
    return;
  }

  let imageUrl = "";
  try {
    imageUrl = await readIncidentImage();
  } catch (err) {
    notify(err.message, true);
    btn.disabled = false;
    showLoading(false);
    return;
  }

  const payload = {
    category: { id: parseInt(categoryId, 10) },
    location,
    description,
    latitude,
    longitude,
    imageUrl,
    reporterEmail: token ? currentUser?.email : reporterEmail
  };

  try {
    const res = await apiFetch(token ? "/incidents" : "/incidents/public", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await readJson(res);

    if (!res.ok) {
      notify(data.error || "Failed to submit incident.", true);
      return;
    }

    notify("Incident reported successfully.");
    e.target.reset();
    clearImagePreview();
    loadCategories();
    if (token && data.id) {
      currentDetailIncidentId = data.id;
      previousDetailPage = "incidents";
      setTimeout(() => showIncidentDetails(data.id, "incidents"), 500);
    } else {
      showPage("report-success");
    }
  } catch (err) {
    console.error("[REPORT]", err);
    notify("Backend not reachable.", true);
  } finally {
    showLoading(false);
    btn.disabled = false;
  }
}

async function loadMyIncidents() {
  if (!token) return;
  const container = document.getElementById("incidentsList");
  if (!container) return;
  container.innerHTML = renderIncidentSkeletons(4);

  try {
    const res = await apiFetch("/incidents/my");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await readJson(res);
    renderIncidents(data, container, true);
  } catch (err) {
    console.error("[MY INCIDENTS]", err);
    container.innerHTML = "<p class='error-text'>Failed to load incidents.</p>";
  }
}

async function loadDashboardStats() {
  try {
    const res = await apiFetch("/incidents/stats");
    if (!res.ok) return;
    const d = await readJson(res);
    const total = d.active ?? ((d.reported || 0) + (d.underReview || 0) + (d.inProgress || 0) + (d.resolved || 0) + (d.rejected || 0));

    setText("totalIncidents", total);
    setText("reportedIncidents", d.reported || 0);
    setText("inProgressIncidents", d.inProgress || 0);
    setText("resolvedIncidents", d.resolved || 0);
    setText("archivedIncidents", d.archived || 0);
    renderStatusChart(d);
  } catch (err) {
    console.error("[STATS]", err);
  }
}

function renderStatusChart(stats) {
  const container = document.getElementById("statusChart");
  if (!container) return;
  if (typeof Chart === "undefined") {
    container.innerHTML = "<p class='error-text'>Status chart could not load.</p>";
    return;
  }

  const rows = [
    ["reported", "Reported", stats.reported || 0, "#dc2626"],
    ["underReview", "Under Review", stats.underReview || 0, "#f59e0b"],
    ["inProgress", "In Progress", stats.inProgress || 0, "#f97316"],
    ["resolved", "Resolved", stats.resolved || 0, "#16a34a"],
    ["rejected", "Rejected", stats.rejected || 0, "#6b7280"]
  ];
  const total = rows.reduce((sum, row) => sum + row[2], 0);
  const labels = total ? rows.map(row => row[1]) : ["No incidents"];
  const values = total ? rows.map(row => row[2]) : [1];
  const colors = total ? rows.map(row => row[3]) : ["#e5e7eb"];

  if (window.statusChartInstance) {
    window.statusChartInstance.destroy();
  }

  container.innerHTML = `<canvas id="statusChartCanvas" height="220"></canvas>`;
  const canvas = document.getElementById("statusChartCanvas");
  window.statusChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            padding: 18,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: context => total
              ? `${context.label}: ${context.parsed}`
              : "No incidents yet"
          }
        }
      },
      cutout: "62%"
    }
  });
}

async function loadDashboardIncidents() {
  const container = document.getElementById("dashboardIncidents");
  if (!container) return;
  container.innerHTML = renderIncidentSkeletons(6);

  const params = new URLSearchParams();
  const status = document.getElementById("filterStatus")?.value;
  const categoryId = document.getElementById("filterCategory")?.value;
  const archived = document.getElementById("showArchivedIncidents")?.checked || false;
  if (status) params.set("status", status);
  if (categoryId) params.set("categoryId", categoryId);
  params.set("archived", String(archived));

  try {
    const path = "/incidents/filter" + (params.toString() ? `?${params.toString()}` : "");
    const res = await apiFetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await readJson(res);
    const visibleIncidents = archived ? data : data.filter(incident => !incident.archived);
    renderIncidents(sortIncidentsByPriority(visibleIncidents), container, false);
    initDashboardMap(visibleIncidents);
    filterDashboardIncidentCards();
  } catch (err) {
    console.error("[DASHBOARD]", err);
    container.innerHTML = "<p class='error-text'>Failed to load incidents.</p>";
  }
}

async function toggleArchivedIncidents() {
  updateArchiveToggleLabel();
  await loadDashboardIncidents();
  await loadDashboardStats();
}

function updateArchiveToggleLabel() {
  const toggle = document.getElementById("showArchivedIncidents");
  const label = document.getElementById("archiveToggleText");
  if (!toggle || !label) return;

  label.textContent = toggle.checked ? "Hide archived" : "Show archived";
}

function initDashboardMap(incidents) {
  const mapEl = document.getElementById("incidentMap");
  if (!mapEl || typeof L === "undefined") return;

  if (!dashboardMapInstance) {
    dashboardMapInstance = L.map("incidentMap").setView(IFRANE_CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(dashboardMapInstance);
    dashboardMapMarkers = L.layerGroup().addTo(dashboardMapInstance);
  }

  dashboardMapMarkers.clearLayers();
  (Array.isArray(incidents) ? incidents : [])
    .filter(hasIncidentCoords)
    .forEach(incident => {
      const color = mapStatusColor(incident.status);
      L.circleMarker([incident.latitude, incident.longitude], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.78,
        weight: 2
      })
        .bindPopup(`
          <strong>${escHtml(incident.location || "Unknown location")}</strong><br>
          ${escHtml(incident.category?.name || "Incident")}<br>
          ${escHtml((incident.status || "REPORTED").replaceAll("_", " "))}
        `)
        .addTo(dashboardMapMarkers);
    });

  setTimeout(() => dashboardMapInstance.invalidateSize(), 150);
}

async function showIncidentDetails(id, sourcePage = null) {
  currentDetailIncidentId = id;
  previousDetailPage = sourcePage || previousDetailPage || "incidents";
  showPage("incident-detail");
}

async function loadIncidentDetail(id) {
  const container = document.getElementById("incidentDetailContent");
  if (!container) return;
  container.innerHTML = "<p>Loading incident...</p>";

  try {
    const res = await apiFetch(`/incidents/${id}`);
    const incident = await readJson(res);
    if (!res.ok) {
      container.innerHTML = `<p class="error-text">${escHtml(incident.error || "Could not load this incident.")}</p>`;
      return;
    }

    renderIncidentDetail(incident);
  } catch (err) {
    console.error("[INCIDENT DETAIL]", err);
    container.innerHTML = "<p class='error-text'>Failed to load incident.</p>";
  }
}

function renderIncidentDetail(incident) {
  const container = document.getElementById("incidentDetailContent");
  const canManage = isAuthorityUser();
  const hasCoords = hasIncidentCoords(incident);
  const statusOptions = renderStatusOptions(incident.status);
  const imageSrc = safeImageSrc(incident.imageUrl);
  const archiveAction = incident.archived
    ? `<button type="button" class="btn btn-secondary" onclick="unarchiveIncident(${incident.id})">Restore from Archive</button>`
    : incident.status === "RESOLVED"
      ? `<button type="button" class="btn btn-danger" onclick="archiveIncident(${incident.id})">Archive Resolved</button>`
      : "";

  container.innerHTML = `
    <div class="incident-detail-grid">
      <article class="detail-panel">
        <div class="detail-header">
          <div>
            <p class="eyebrow">Incident #${incident.id}</p>
            <h2>${escHtml(incident.category?.name || "Incident")}</h2>
          </div>
          ${statusBadge(incident.status)}
        </div>

        <dl class="detail-list">
          <div><dt>Location</dt><dd>${escHtml(incident.location || "Unknown")}</dd></div>
          <div><dt>Reporter</dt><dd>${formatReporter(incident)}</dd></div>
          <div><dt>Created</dt><dd>${formatDate(incident.createdAt)}</dd></div>
          <div><dt>Updated</dt><dd>${formatDate(incident.updatedAt)}</dd></div>
          <div><dt>Resolved</dt><dd>${formatDate(incident.resolvedAt)}</dd></div>
          <div><dt>Coordinates</dt><dd>${hasCoords ? `${incident.latitude}, ${incident.longitude}` : "No coordinates stored"}</dd></div>
        </dl>

        <div class="detail-description">
          <h3>Description</h3>
          <p>${escHtml(incident.description || "No description provided.")}</p>
        </div>

        <div class="detail-media">
          <h3>Picture</h3>
          ${imageSrc
            ? `<img src="${escAttr(imageSrc)}" alt="Incident picture for ${escAttr(incident.category?.name || "incident")}">`
            : `<p class="empty-media">No picture was attached to this incident.</p>`}
        </div>

        ${canManage ? `
          <div class="detail-actions">
            <label for="detailStatus">Status</label>
            <select id="detailStatus">${statusOptions}</select>
            <div class="detail-action-row">
              <button type="button" class="btn btn-secondary" onclick="updateIncidentStatus(${incident.id}, 'detailStatus')">Update Status</button>
              <button type="button" class="btn btn-primary" onclick="resolveIncident(${incident.id})">Resolve Incident</button>
              ${archiveAction}
            </div>
          </div>
        ` : ""}
      </article>

      <aside class="map-panel">
        <div class="map-header">
          <h3>Incident Map</h3>
          <p>${hasCoords ? "Pinned at the stored incident coordinates." : "No coordinates were stored for this report."}</p>
        </div>
        <div id="incidentDetailMap" class="incident-map"></div>
      </aside>
    </div>
  `;

  setTimeout(() => renderIncidentMap(incident), 0);
}

function renderIncidentMap(incident) {
  const mapEl = document.getElementById("incidentDetailMap");
  if (!mapEl) return;
  const coords = hasIncidentCoords(incident) ? [incident.latitude, incident.longitude] : IFRANE_CENTER;

  if (typeof L === "undefined") {
    mapEl.innerHTML = "<div class='map-fallback'>Map library did not load. Check your internet connection.</div>";
    return;
  }

  if (incidentMap) {
    incidentMap.remove();
    incidentMap = null;
    incidentMarker = null;
  }

  incidentMap = L.map("incidentDetailMap").setView(coords, hasIncidentCoords(incident) ? 15 : 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(incidentMap);

  if (hasIncidentCoords(incident)) {
    incidentMarker = L.marker(coords).addTo(incidentMap);
    incidentMarker.bindPopup(`${escHtml(incident.category?.name || "Incident")}<br>${escHtml(incident.location || "")}`).openPopup();
  } else {
    L.circle(coords, { radius: 900, color: "#2E7D32", fillOpacity: 0.12 }).addTo(incidentMap);
  }

  setTimeout(() => incidentMap.invalidateSize(), 150);
}

function goBackFromIncidentDetail() {
  showPage(previousDetailPage || "incidents");
}

async function updateIncidentStatus(id, selectId = null) {
  const select = document.getElementById(selectId || "status_" + id);
  if (!select) return;

  try {
    const res = await apiFetch(`/incidents/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: select.value })
    });
    const data = await readJson(res);

    if (!res.ok) {
      notify(data.error || "Failed to update status.", true);
      return;
    }

    notify("Incident status updated.");
    refreshIncidentSurfaces(id);
  } catch (err) {
    console.error("[STATUS]", err);
    notify("Error updating status.", true);
  }
}

async function resolveIncident(id) {
  const select = document.getElementById("detailStatus");
  if (select) select.value = "RESOLVED";
  await updateIncidentStatus(id, "detailStatus");
}

async function archiveIncident(id) {
  try {
    const res = await apiFetch(`/incidents/${id}/archive`, { method: "PUT" });
    const data = await readJson(res);
    if (!res.ok) {
      notify(data.error || "Failed to archive incident.", true);
      return;
    }
    notify("Resolved incident archived.");
    previousDetailPage = "dashboard";
    showPage("dashboard");
  } catch (err) {
    console.error("[ARCHIVE]", err);
    notify("Error archiving incident.", true);
  }
}

async function unarchiveIncident(id) {
  try {
    const res = await apiFetch(`/incidents/${id}/unarchive`, { method: "PUT" });
    const data = await readJson(res);
    if (!res.ok) {
      notify(data.error || "Failed to restore incident.", true);
      return;
    }
    notify("Incident restored to active dashboard.");
    refreshIncidentSurfaces(id);
  } catch (err) {
    console.error("[UNARCHIVE]", err);
    notify("Error restoring incident.", true);
  }
}

function refreshIncidentSurfaces(id) {
  loadDashboardStats();
  if (document.getElementById("dashboard")?.classList.contains("active")) loadDashboardIncidents();
  if (document.getElementById("incidents")?.classList.contains("active")) loadMyIncidents();
  if (document.getElementById("incident-detail")?.classList.contains("active")) loadIncidentDetail(id);
}

async function loadAdminUsers() {
  const container = document.getElementById("usersList");
  if (!container) return;
  container.innerHTML = "<p>Loading users...</p>";

  try {
    const res = await apiFetch("/admin/users");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await readJson(res);

    if (!data.length) {
      container.innerHTML = "<p>No users found.</p>";
      return;
    }

    container.innerHTML = `
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(u => renderUserRow(u)).join("")}
        </tbody>
      </table>`;
  } catch (err) {
    console.error("[ADMIN USERS]", err);
    container.innerHTML = "<p class='error-text'>Failed to load users.</p>";
  }
}

function renderUserRow(u) {
  const role = u.role || "CITIZEN";
  const isSelf = currentUser?.id === u.id;
  return `
    <tr>
      <td>${escHtml(u.name || "-")}</td>
      <td>${escHtml(u.email)}</td>
      <td><span class="role-pill role-${role.toLowerCase()}">${escHtml(role)}</span></td>
      <td>
        <div class="admin-actions">
          <select id="role_${u.id}" ${isSelf ? "disabled" : ""}>
            <option value="CITIZEN" ${role === "CITIZEN" ? "selected" : ""}>Citizen</option>
            <option value="AUTHORITY" ${role === "AUTHORITY" ? "selected" : ""}>Authority</option>
            <option value="ADMIN" ${role === "ADMIN" ? "selected" : ""}>Admin</option>
          </select>
          <button class="btn btn-secondary" onclick="changeUserRole(${u.id})" ${isSelf ? "disabled" : ""}>Save Role</button>
          <button class="btn btn-danger" onclick="deleteAdminUser(${u.id})" ${isSelf ? "disabled" : ""}>Delete</button>
        </div>
      </td>
    </tr>`;
}

async function changeUserRole(userId, role = null) {
  const select = document.getElementById("role_" + userId);
  const nextRole = role || select?.value;
  if (!nextRole) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}/role`, {
      method: "POST",
      body: JSON.stringify({ role: nextRole })
    });
    const data = await readJson(res);

    if (!res.ok) {
      notify(data.error || "Failed to update role.", true);
      return;
    }

    notify("Role updated without changing the user's password.");
    loadAdminUsers();
  } catch (err) {
    console.error("[ROLE]", err);
    notify("Error updating role.", true);
  }
}

async function deleteAdminUser(userId) {
  if (!confirm("Delete this user? This cannot be undone.")) return;
  try {
    const res = await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
    const data = await readJson(res);
    if (!res.ok) {
      notify(data.error || "Failed to delete user.", true);
      return;
    }
    notify("User deleted.");
    loadAdminUsers();
  } catch (err) {
    console.error("[DELETE USER]", err);
    notify("Error deleting user.", true);
  }
}

async function loadAdminCategories() {
  const container = document.getElementById("categoriesList");
  if (!container) return;
  container.innerHTML = "<p>Loading categories...</p>";

  try {
    const res = await apiFetch("/categories");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await readJson(res);

    if (!data.length) {
      container.innerHTML = "<p>No categories found.</p>";
      return;
    }

    container.innerHTML = `
      <table class="admin-data-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${escHtml(c.name)}</td>
              <td>${escHtml(c.description || "")}</td>
              <td><button class="btn btn-danger" onclick="deleteCategory(${c.id})">Delete</button></td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  } catch (err) {
    console.error("[ADMIN CATEGORIES]", err);
    container.innerHTML = "<p class='error-text'>Failed to load categories.</p>";
  }
}

function showAddCategoryForm() {
  const name = prompt("New category name:");
  if (!name?.trim()) return;
  apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify({ name: name.trim() })
  }).then(async res => {
    const data = await readJson(res);
    if (res.ok) {
      notify("Category added.");
      loadAdminCategories();
      loadCategories();
    } else {
      notify(data.error || "Failed to add category.", true);
    }
  }).catch(() => notify("Error adding category.", true));
}

async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;
  try {
    const res = await apiFetch(`/categories/${id}`, { method: "DELETE" });
    const data = await readJson(res);
    if (!res.ok) {
      notify(data.error || "Failed to delete category.", true);
      return;
    }
    notify("Category deleted.");
    loadAdminCategories();
    loadCategories();
  } catch (err) {
    console.error("[DELETE CATEGORY]", err);
    notify("Error deleting category.", true);
  }
}

function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(tab + "Tab")?.classList.add("active");
  const btns = document.querySelectorAll(".tab-btn");
  if (tab === "users") btns[0]?.classList.add("active");
  if (tab === "categories") btns[1]?.classList.add("active");
}

function renderIncidents(list, container, isOwner) {
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = renderEmptyState(isOwner ? "No reported incidents yet" : "No active incidents match the filters", isOwner
      ? "Create your first environmental report and it will appear here."
      : "Try changing the status, category, archive, or search filters.");
    return;
  }

  const sourcePage = isOwner ? "incidents" : "dashboard";
  container.innerHTML = sortIncidentsByPriority(list).map(i => `
    <article class="incident-card incident-card-clickable incident-status-${String(i.status || "REPORTED").toLowerCase()}" onclick="showIncidentDetails(${i.id}, '${sourcePage}')">
      ${safeImageSrc(i.imageUrl) ? `<img class="incident-card-image" src="${escAttr(safeImageSrc(i.imageUrl))}" alt="Incident picture">` : ""}
      <div class="incident-card-top">
        <h4 class="incident-location-line">${escHtml(i.location || "-")}</h4>
        <div class="incident-card-badges">
          ${statusBadge(i.status)}
          ${i.archived ? `<span class="archive-badge">Archived</span>` : ""}
        </div>
      </div>
      <p class="incident-category-pill">${escHtml(i.category?.name || "Unknown")}</p>
      ${i.description ? `<p class="incident-card-description">${escHtml(i.description)}</p>` : ""}
      ${hasIncidentCoords(i) ? `<p class="incident-coordinates">${i.latitude}, ${i.longitude}</p>` : ""}
      <p class="incident-date-line">${formatDate(i.createdAt)}</p>
      <div class="incident-card-actions" onclick="event.stopPropagation()">
        <button type="button" class="btn btn-secondary btn-small" onclick="showIncidentDetails(${i.id}, '${sourcePage}')">Open</button>
        ${!isOwner && isAuthorityUser() ? `
          <select id="status_${i.id}" class="status-select">
            ${renderStatusOptions(i.status)}
          </select>
          <button type="button" class="btn btn-primary btn-small" onclick="updateIncidentStatus(${i.id})">Update</button>
          ${i.status === "RESOLVED" && !i.archived ? `<button type="button" class="btn btn-danger btn-small" onclick="archiveIncident(${i.id})">Archive</button>` : ""}
          ${i.archived ? `<button type="button" class="btn btn-secondary btn-small" onclick="unarchiveIncident(${i.id})">Restore</button>` : ""}
        ` : ""}
      </div>
    </article>
  `).join("");
}

function renderIncidentSkeletons(count = 4) {
  return Array.from({ length: count }, () => `
    <article class="incident-card skeleton-card">
      <span class="skeleton-line skeleton-title"></span>
      <span class="skeleton-line skeleton-short"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-wide"></span>
    </article>
  `).join("");
}

function renderEmptyState(title, message) {
  return `
    <div class="empty-state">
      <span><i class="fas fa-seedling"></i></span>
      <h3>${escHtml(title)}</h3>
      <p>${escHtml(message)}</p>
      <a class="btn btn-primary" href="#report">Report an Incident</a>
    </div>
  `;
}

function sortIncidentsByPriority(list) {
  return [...list].sort((a, b) => {
    const aPriority = STATUS_META[a.status]?.priority || 99;
    const bPriority = STATUS_META[b.status]?.priority || 99;
    if ((a.archived ? 1 : 0) !== (b.archived ? 1 : 0)) {
      return (a.archived ? 1 : 0) - (b.archived ? 1 : 0);
    }
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function filterDashboardIncidentCards() {
  const search = document.getElementById("searchIncidents");
  const container = document.getElementById("dashboardIncidents");
  if (!search || !container) return;

  const query = search.value.trim().toLowerCase();
  container.querySelectorAll(".incident-card").forEach(card => {
    const locationText = card.querySelector(".incident-location-line")?.textContent?.toLowerCase() || "";
    const descriptionText = card.querySelector(".incident-card-description")?.textContent?.toLowerCase() || "";
    const matches = !query || locationText.includes(query) || descriptionText.includes(query);
    card.style.display = matches ? "" : "none";
  });
}

function renderStatusOptions(status) {
  const statuses = [
    ["REPORTED", "Reported"],
    ["UNDER_REVIEW", "Under Review"],
    ["IN_PROGRESS", "In Progress"],
    ["RESOLVED", "Resolved"],
    ["REJECTED", "Rejected"]
  ];
  return statuses.map(([value, label]) => `<option value="${value}" ${status === value ? "selected" : ""}>${label}</option>`).join("");
}

function statusBadge(status = "REPORTED") {
  return `<span class="status-badge status-${status.toLowerCase()}">${escHtml(status.replaceAll("_", " "))}</span>`;
}

function hasIncidentCoords(incident) {
  return typeof incident.latitude === "number"
    && typeof incident.longitude === "number"
    && coordsAreValid(incident.latitude, incident.longitude);
}

function coordsAreValid(latitude, longitude) {
  if (latitude == null && longitude == null) return true;
  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function mapStatusColor(status) {
  const colors = {
    REPORTED: "#dc2626",
    IN_PROGRESS: "#f97316",
    UNDER_REVIEW: "#f59e0b",
    RESOLVED: "#16a34a",
    REJECTED: "#6b7280"
  };
  return colors[status] || "#6b7280";
}

function isAuthorityUser() {
  return currentUser?.role === "AUTHORITY" || currentUser?.role === "ADMIN";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatReporter(incident) {
  if (incident.user) {
    return `${escHtml(incident.user.name || "Unknown")} (${escHtml(incident.user.email || "no email")})`;
  }
  return escHtml(incident.reporterEmail || "Public report");
}

function safeImageSrc(value) {
  if (!value) return "";
  const src = String(value).trim();
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/i.test(src)) return src;
  if (/^https?:\/\/[^\s"'<>]{1,2048}$/i.test(src)) return src;
  return "";
}

function escAttr(str) {
  return escHtml(str).replaceAll("`", "&#96;");
}

function escHtml(str) {
  if (str == null) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}
