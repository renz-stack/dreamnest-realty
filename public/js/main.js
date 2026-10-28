// ===== Mobile nav toggle (accessible) =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

function setMenuOpen(open) {
  navLinks.classList.toggle("open", open);
  // Tells screen readers whether the menu is currently shown
  navToggle.setAttribute("aria-expanded", String(open));
}

if (navToggle && navLinks) {
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.addEventListener("click", () => setMenuOpen(!navLinks.classList.contains("open")));

  // Esc closes the menu and puts keyboard focus back on the button
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  // Close the menu after choosing a link (useful for #section links)
  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenuOpen(false);
  });
}

// ===== Show logged-in user in nav =====
const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
const authLink = document.querySelector("#auth-link");
if (authLink && currentUser) {
  authLink.textContent = "Logout (" + currentUser.name.split(" ")[0] + ")";
  authLink.href = "#";
  authLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
}

// ===== Footer year =====
const yearEl = document.querySelector("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Shared property helpers =====
// Used by the Home page now, and by the Properties page later.
// Data comes from js/data/properties.js, which only some pages load.
const hasPropertyData = typeof PROPERTIES !== "undefined";

// 18500000 -> "₱18,500,000", rentals get "/mo"
function formatPrice(p) {
  const peso = "₱" + p.price.toLocaleString("en-PH");
  return p.status === "For Rent" ? peso + "/mo" : peso;
}

function propertyCardHTML(p) {
  return `
    <article class="property-card">
      <div class="property-img">
        <img src="${p.images[0]}" alt="${p.title} in ${p.city}" loading="lazy" onerror="this.style.display='none'">
        <span class="badge">${p.status}</span>
      </div>
      <div class="property-body">
        <div class="price">${formatPrice(p)}</div>
        <h3>${p.title}</h3>
        <p class="location">📍 ${p.address}</p>
        <div class="features">
          <span>🛏 ${p.beds} Beds</span>
          <span>🛁 ${p.baths} Baths</span>
          <span>📐 ${p.area} sqm</span>
        </div>
      </div>
    </article>`;
}

function renderProperties(list) {
  const grid = document.querySelector("#property-grid");
  if (!grid) return;
  grid.innerHTML = list.length
    ? list.map(propertyCardHTML).join("")
    : '<p style="grid-column:1/-1;text-align:center;color:#6b7280">No properties match your search.</p>';
}

// Home page: show only featured listings at first
if (hasPropertyData) renderProperties(PROPERTIES.filter((p) => p.featured));

// ===== Search / filter (Home) =====
const searchForm = document.querySelector("#search-form");
if (searchForm && hasPropertyData) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = searchForm.location.value.trim().toLowerCase();
    const type = searchForm.type.value;
    const status = searchForm.status.value;
    const maxPrice = Number(searchForm.maxPrice.value) || Infinity;

    // Search all listings, not just the featured ones
    const filtered = PROPERTIES.filter(
      (p) =>
        (!keyword || [p.title, p.city, p.address].some((text) => text.toLowerCase().includes(keyword))) &&
        (!type || p.type === type) &&
        (!status || p.status === status) &&
        p.price <= maxPrice
    );
    renderProperties(filtered);
    document.querySelector("#properties").scrollIntoView({ behavior: "smooth" });
  });
}

// ===== Shared validation helpers =====
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function setError(input, msg) {
  const el = input.closest(".form-group").querySelector(".error-msg");
  if (el) el.textContent = msg;
  return !msg;
}

function showAlert(el, type, msg) {
  el.className = "form-alert " + type;
  el.textContent = msg;
}

// ===== Contact form =====
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { name, email, phone, message } = contactForm;
    let ok = true;
    ok = setError(name, name.value.trim() ? "" : "Please enter your name") && ok;
    ok = setError(email, isEmail(email.value) ? "" : "Please enter a valid email") && ok;
    ok = setError(phone, !phone.value || /^[\d\s()+-]{7,20}$/.test(phone.value) ? "" : "Invalid phone number") && ok;
    ok = setError(message, message.value.trim().length >= 10 ? "" : "Message must be at least 10 characters") && ok;

    const alert = document.querySelector("#contact-alert");
    if (!ok) return showAlert(alert, "error", "Please fix the errors below.");

    const submitBtn = contactForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          phone: phone.value,
          subject: contactForm.subject.value,
          message: message.value,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show server-side validation errors next to their fields
        Object.entries(data.errors || {}).forEach(([field, msg]) => contactForm[field] && setError(contactForm[field], msg));
        return showAlert(alert, "error", data.error || "Please fix the errors below.");
      }
      showAlert(alert, "success", `Thanks, ${name.value.trim()}! An agent will contact you within 24 hours.`);
      contactForm.reset();
    } catch {
      showAlert(alert, "error", "Could not reach the server. Please try again later.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}

// ===== Login / Register =====
// NOTE: Demo-only auth using localStorage. Use a real backend for production.
const tabs = document.querySelectorAll(".auth-tabs button");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector("#" + tab.dataset.target).classList.add("active");
  })
);

document.querySelectorAll(".toggle-pw").forEach((btn) =>
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "Show" : "Hide";
  })
);

const getUsers = () => JSON.parse(localStorage.getItem("users") || '[{"name":"Demo User","email":"demo@estate.com","password":"demo123"}]');

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const { email, password } = loginForm;
    let ok = setError(email, isEmail(email.value) ? "" : "Please enter a valid email");
    ok = setError(password, password.value ? "" : "Please enter your password") && ok;
    const alert = document.querySelector("#login-alert");
    if (!ok) return;

    const user = getUsers().find((u) => u.email === email.value.toLowerCase() && u.password === password.value);
    if (!user) return showAlert(alert, "error", "Invalid email or password.");

    localStorage.setItem("currentUser", JSON.stringify({ name: user.name, email: user.email }));
    showAlert(alert, "success", `Welcome back, ${user.name}! Redirecting...`);
    setTimeout(() => (window.location.href = "index.html"), 1200);
  });
}

const registerForm = document.querySelector("#register-form");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const { name, email, password, confirm } = registerForm;
    let ok = true;
    ok = setError(name, name.value.trim() ? "" : "Please enter your name") && ok;
    ok = setError(email, isEmail(email.value) ? "" : "Please enter a valid email") && ok;
    ok = setError(password, password.value.length >= 6 ? "" : "Password must be at least 6 characters") && ok;
    ok = setError(confirm, confirm.value === password.value ? "" : "Passwords do not match") && ok;
    const alert = document.querySelector("#register-alert");
    if (!ok) return;

    const users = getUsers();
    if (users.some((u) => u.email === email.value.toLowerCase())) {
      return showAlert(alert, "error", "An account with this email already exists.");
    }
    users.push({ name: name.value.trim(), email: email.value.toLowerCase(), password: password.value });
    localStorage.setItem("users", JSON.stringify(users));
    showAlert(alert, "success", "Account created! You can now log in.");
    registerForm.reset();
  });
}
