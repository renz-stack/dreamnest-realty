// =====================================================================
// Property Details page: property.html?id=3
// Needs: js/data/properties.js (PROPERTIES, AGENTS)
//        js/main.js (formatPrice, refCode, propertyCardHTML)
// =====================================================================

const detail = document.querySelector("#property-detail");

// 1) Find the property whose id is in the URL
const propertyId = Number(new URLSearchParams(window.location.search).get("id"));
const property = PROPERTIES.find((p) => p.id === propertyId);

if (!property) {
  showNotFound();
} else {
  const agent = AGENTS.find((a) => a.id === property.agentId);
  document.title = `${property.title} | DreamNest Realty`;
  detail.innerHTML = detailHTML(property, agent);
  setUpGallery(property);
  if (property.status === "For Sale") setUpLoanCalculator(property.price);
}

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------
const peso = (n) => "₱" + Math.round(n).toLocaleString("en-PH");
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const listItems = (items) => items.map((item) => `<li>${item}</li>`).join("");

// "2026-09-14" -> "Sep 14, 2026" ("T00:00" keeps it in local time)
const formatDate = (iso) =>
  new Date(iso + "T00:00").toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

// Builds the "Key details" list, skipping facts that don't apply
function keyFacts(p) {
  const facts = [
    ["Property type", capitalize(p.type)],
    ["Bedrooms", p.beds],
    ["Bathrooms", p.baths],
    ["Floor area", `${p.area} sqm`],
    ["Lot area", p.lotArea && `${p.lotArea} sqm`],
    ["Floor level", p.floor && `${p.floor}th floor`],
    ["Parking", p.parking ? `${p.parking} slot${p.parking > 1 ? "s" : ""}` : "None"],
    ["Furnishing", p.furnishing],
    ["Year built", p.yearBuilt],
    ["Association dues", p.dues ? `${peso(p.dues)}/mo` : p.status === "For Rent" ? "Included" : "None"],
    ["Reference no.", refCode(p.id)],
  ];
  return facts
    .filter(([, value]) => value) // drop empty ones, e.g. no lot area for condos
    .map(([label, value]) => `<div class="fact"><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

// ---------------------------------------------------------------------
// Page HTML
// ---------------------------------------------------------------------
function detailHTML(p, agent) {
  const inquireUrl =
    "contact.html?" + new URLSearchParams({ property: refCode(p.id), title: p.title, status: p.status });
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(p.address)}&output=embed`;

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li><a href="properties.html">Properties</a></li>
        <li aria-current="page">${p.title}</li>
      </ol>
    </nav>

    <header class="detail-header">
      <div>
        <div class="detail-badges">
          <span class="tag tag-accent">${p.status}</span>
          <span class="tag">${capitalize(p.type)}</span>
          <span class="tag">${p.furnishing}</span>
        </div>
        <h1>${p.title}</h1>
        <p class="location">📍 ${p.address}</p>
      </div>
      <div class="detail-price">
        <strong>${formatPrice(p)}</strong>
        <span>Ref ${refCode(p.id)} · Listed ${formatDate(p.listedOn)}</span>
      </div>
    </header>

    <section class="gallery" aria-label="Photo gallery">
      <img id="gallery-main" src="${p.images[0]}" alt="${p.title}, photo 1 of ${p.images.length}">
      <div class="gallery-thumbs">
        ${p.images
          .map(
            (src, i) => `
          <button type="button" class="thumb" data-index="${i}" aria-label="Show photo ${i + 1} of ${p.images.length}"
                  aria-pressed="${i === 0}">
            <img src="${src.replace("w=1200", "w=200")}" alt="" loading="lazy">
          </button>`
          )
          .join("")}
      </div>
    </section>

    <div class="detail-layout">
      <div class="detail-main">
        <section class="detail-block">
          <h2>Key Details</h2>
          <dl class="facts">${keyFacts(p)}</dl>
        </section>

        <section class="detail-block">
          <h2>About this Property</h2>
          <p>${p.description}</p>
        </section>

        <section class="detail-block">
          <h2>Amenities &amp; Features</h2>
          <ul class="check-list">${listItems(p.amenities)}</ul>
        </section>

        <section class="detail-block">
          <h2>What's Nearby</h2>
          <ul class="nearby-list">
            ${p.nearby.map((n) => `<li><span>${n.name}</span><span>${n.distance}</span></li>`).join("")}
          </ul>
        </section>

        <section class="detail-block">
          <h2>${p.status === "For Sale" ? "Payment Options" : "Lease Terms"}</h2>
          <ul class="check-list">${listItems(p.terms)}</ul>
        </section>

        <section class="detail-block">
          <h2>Location</h2>
          <div class="map">
            <iframe src="${mapUrl}" loading="lazy" title="Map of ${p.address}"></iframe>
          </div>
        </section>
      </div>

      <aside class="detail-sidebar">
        <section class="detail-block agent-card" aria-labelledby="agent-heading">
          <h2 id="agent-heading">Listing Agent</h2>
          <div class="agent-info">
            <img src="${agent.photo}" alt="Photo of ${agent.name}" loading="lazy">
            <div>
              <strong>${agent.name}</strong>
              <span>${agent.title}</span>
            </div>
          </div>
          <p class="agent-bio">${agent.bio}</p>
          <a href="${inquireUrl}" class="btn btn-primary btn-block">Inquire About This Property</a>
          <a href="tel:${agent.phone.replace(/\s/g, "")}" class="btn btn-dark btn-block">📞 ${agent.phone}</a>
          <a href="mailto:${agent.email}?subject=${encodeURIComponent("Inquiry: " + refCode(p.id) + " " + p.title)}"
             class="agent-email">✉️ ${agent.email}</a>
        </section>

        ${p.status === "For Sale" ? loanCalculatorHTML() : ""}
      </aside>
    </div>

    ${similarHTML(p)}
  `;
}

function loanCalculatorHTML() {
  return `
    <section class="detail-block" aria-labelledby="loan-heading">
      <h2 id="loan-heading">Monthly Payment Estimate</h2>
      <form id="loan-form" class="loan-form">
        <div class="form-group">
          <label for="loan-down">Down payment</label>
          <select id="loan-down" name="down">
            <option value="10">10%</option>
            <option value="20" selected>20%</option>
            <option value="30">30%</option>
            <option value="50">50%</option>
          </select>
        </div>
        <div class="form-group">
          <label for="loan-years">Loan term</label>
          <select id="loan-years" name="years">
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="20" selected>20 years</option>
          </select>
        </div>
        <div class="form-group">
          <label for="loan-rate">Interest rate (% per year)</label>
          <input type="number" id="loan-rate" name="rate" value="6.5" min="0" max="30" step="0.1">
        </div>
      </form>
      <output id="loan-result" class="loan-result" for="loan-down loan-years loan-rate" aria-live="polite"></output>
      <p class="fine-print">Estimate only. Actual rates and terms depend on your bank or Pag-IBIG approval.</p>
    </section>`;
}

function similarHTML(p) {
  // Same city first, then same type and status, never the property itself
  const similar = PROPERTIES.filter((o) => o.id !== p.id && (o.city === p.city || (o.type === p.type && o.status === p.status)))
    .sort((a, b) => (b.city === p.city) - (a.city === p.city))
    .slice(0, 3);
  if (!similar.length) return "";
  return `
    <section class="detail-similar" aria-labelledby="similar-heading">
      <h2 id="similar-heading">Similar Properties</h2>
      <div class="property-grid">${similar.map(propertyCardHTML).join("")}</div>
    </section>`;
}

function showNotFound() {
  document.title = "Property Not Found | DreamNest Realty";
  detail.innerHTML = `
    <div class="not-found">
      <h1>Property not found</h1>
      <p>This listing may have been sold, rented out or removed.</p>
      <a href="properties.html" class="btn btn-primary">Browse All Properties</a>
    </div>`;
}

// ---------------------------------------------------------------------
// Interactivity
// ---------------------------------------------------------------------
function setUpGallery(p) {
  const mainImg = document.querySelector("#gallery-main");
  const thumbs = document.querySelectorAll(".thumb");
  thumbs.forEach((thumb) =>
    thumb.addEventListener("click", () => {
      const i = Number(thumb.dataset.index);
      mainImg.src = p.images[i];
      mainImg.alt = `${p.title}, photo ${i + 1} of ${p.images.length}`;
      thumbs.forEach((t) => t.setAttribute("aria-pressed", String(t === thumb)));
    })
  );
}

function setUpLoanCalculator(price) {
  const form = document.querySelector("#loan-form");
  const result = document.querySelector("#loan-result");

  function calculate() {
    const downPayment = price * (Number(form.down.value) / 100);
    const loan = price - downPayment;
    const months = Number(form.years.value) * 12;
    const monthlyRate = Number(form.rate.value) / 100 / 12;

    // Standard amortization formula: M = L × r(1+r)^n / ((1+r)^n − 1)
    const monthly =
      monthlyRate === 0
        ? loan / months
        : (loan * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    result.innerHTML = `
      <span>Down payment: <b>${peso(downPayment)}</b></span>
      <span>Loan amount: <b>${peso(loan)}</b></span>
      <span class="loan-monthly">≈ ${peso(monthly)} <small>/ month</small></span>`;
  }

  form.addEventListener("input", calculate);
  form.addEventListener("submit", (e) => e.preventDefault());
  calculate();
}
