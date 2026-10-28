// =====================================================================
// Properties page: filtering, sorting and shareable URLs
// Needs: js/data/properties.js (PROPERTIES) and js/main.js (renderProperties)
// =====================================================================

const filterForm = document.querySelector("#filter-form");
const resultsCount = document.querySelector("#results-count");

// 1) Pre-fill the form from the URL, e.g. properties.html?location=Cebu&status=For+Rent
//    This is how the Home page search hands over its values.
const urlParams = new URLSearchParams(window.location.search);
for (const [name, value] of urlParams) {
  if (filterForm.elements[name]) filterForm.elements[name].value = value;
}

// 2) Sorting rules: each one compares two properties (a, b)
const SORTERS = {
  featured: (a, b) => b.featured - a.featured || a.id - b.id,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  newest: (a, b) => b.yearBuilt - a.yearBuilt,
  "size-desc": (a, b) => b.area - a.area,
};

// 3) Read the form, filter + sort the listings, then show them
function applyFilters() {
  const f = Object.fromEntries(new FormData(filterForm));
  const keyword = (f.location || "").trim().toLowerCase();
  const maxPrice = Number(f.maxPrice) || Infinity;
  const minBeds = Number(f.beds) || 0;

  const results = PROPERTIES.filter(
    (p) =>
      (!keyword ||
        [p.title, p.city, p.address, p.type, ...p.amenities].some((text) => text.toLowerCase().includes(keyword))) &&
      (!f.status || p.status === f.status) &&
      (!f.type || p.type === f.type) &&
      p.beds >= minBeds &&
      p.price <= maxPrice
  ).sort(SORTERS[f.sort] || SORTERS.featured);

  renderProperties(results);
  resultsCount.textContent = `${results.length} ${results.length === 1 ? "property" : "properties"} found`;

  // Keep the URL in sync so the current search can be bookmarked or shared
  const cleanParams = new URLSearchParams();
  for (const [name, value] of Object.entries(f)) {
    if (value && !(name === "sort" && value === "featured")) cleanParams.set(name, value);
  }
  const query = cleanParams.toString();
  history.replaceState(null, "", query ? "?" + query : window.location.pathname);
}

// 4) Re-filter instantly whenever any field changes
filterForm.addEventListener("input", applyFilters);
// The sort dropdown sits outside the <form> tag (linked with form="filter-form"),
// so its events don't bubble up to the form and need their own listener
document.querySelector("#sort").addEventListener("input", applyFilters);
filterForm.addEventListener("submit", (e) => e.preventDefault()); // Enter key shouldn't reload
filterForm.addEventListener("reset", () => setTimeout(applyFilters)); // wait until fields are cleared

applyFilters();
