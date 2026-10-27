// ===== Mobile nav toggle =====
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
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

// ===== Sample property data =====
const properties = [
  { title: "Modern Family Villa", location: "Beverly Hills, CA", price: 1250000, beds: 5, baths: 4, area: 3800, type: "house", status: "For Sale", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800" },
  { title: "Downtown Luxury Apartment", location: "Manhattan, NY", price: 4500, beds: 2, baths: 2, area: 1200, type: "apartment", status: "For Rent", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800" },
  { title: "Cozy Suburban Home", location: "Austin, TX", price: 485000, beds: 3, baths: 2, area: 2100, type: "house", status: "For Sale", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800" },
  { title: "Beachfront Condo", location: "Miami, FL", price: 3200, beds: 2, baths: 1, area: 950, type: "condo", status: "For Rent", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800" },
  { title: "Penthouse with City View", location: "Chicago, IL", price: 2100000, beds: 4, baths: 3, area: 3200, type: "apartment", status: "For Sale", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800" },
  { title: "Countryside Farmhouse", location: "Nashville, TN", price: 720000, beds: 4, baths: 3, area: 2900, type: "house", status: "For Sale", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800" },
];

const formatPrice = (p) => "$" + p.price.toLocaleString() + (p.status === "For Rent" ? "/mo" : "");

function renderProperties(list) {
  const grid = document.querySelector("#property-grid");
  if (!grid) return;
  if (list.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6b7280">No properties match your search.</p>';
    return;
  }
  grid.innerHTML = list
    .map(
      (p) => `
    <div class="property-card">
      <div class="property-img">
        <img src="${p.img}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'">
        <span class="badge">${p.status}</span>
      </div>
      <div class="property-body">
        <div class="price">${formatPrice(p)}</div>
        <h3>${p.title}</h3>
        <p class="location">📍 ${p.location}</p>
        <div class="features">
          <span>🛏 ${p.beds} Beds</span>
          <span>🛁 ${p.baths} Baths</span>
          <span>📐 ${p.area.toLocaleString()} sqft</span>
        </div>
      </div>
    </div>`
    )
    .join("");
}
renderProperties(properties);

// ===== Search / filter =====
const searchForm = document.querySelector("#search-form");
if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const loc = searchForm.location.value.trim().toLowerCase();
    const type = searchForm.type.value;
    const status = searchForm.status.value;
    const maxPrice = Number(searchForm.maxPrice.value) || Infinity;

    const filtered = properties.filter(
      (p) =>
        (!loc || p.location.toLowerCase().includes(loc) || p.title.toLowerCase().includes(loc)) &&
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
