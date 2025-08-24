// ===== CONFIG =====
const API_URL = "https://script.google.com/macros/s/AKfycbyc4H5UxP4fP1sfC6u8PDEHe9QjW9H3nDLIxVUCT84EG1_I-r7dlPLpbIfskPZqHk9K/exec"; 
// Example: https://script.google.com/macros/s/AKfycbx12345/exec

let sheetData = [];
let filteredData = [];

// ===== Fetch Data =====
async function fetchData() {
  try {
    const res = await fetch(`${API_URL}?action=getData`);
    const json = await res.json();
    sheetData = json.data || [];
    applyFilters();
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    alert("Failed to fetch data from Google Sheets.");
  }
}

// ===== Apply Filters =====
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const limit = parseInt(document.getElementById("limitInput").value) || 0;

  filteredData = sheetData.filter(row => {
    const matchesSearch =
      row.FormattedAddress?.toLowerCase().includes(search) ||
      row.City?.toLowerCase().includes(search) ||
      row.State?.toLowerCase().includes(search) ||
      row.Country?.toLowerCase().includes(search);

    const matchesStatus =
      status === "All" || row.Status === status;

    return matchesSearch && matchesStatus;
  });

  if (limit > 0) {
    filteredData = filteredData.slice(0, limit);
  }

  renderTable();
  renderStats();
  renderMap();
}

// ===== Render Table =====
function renderTable() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  filteredData.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${row.Status || "-"}</td>
      <td>${row.FormattedAddress || "-"}</td>
      <td>${row.City || "-"}</td>
      <td>${row.State || "-"}</td>
      <td>${row.Pincode || "-"}</td>
      <td>${row.Country || "-"}</td>
      <td>${row.Accuracy || "-"}</td>
      <td><button onclick="zoomTo(${row.Lat || 0}, ${row.Lng || 0})">📍</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Render Stats =====
function renderStats() {
  document.getElementById("totalRows").textContent = sheetData.length;
  document.getElementById("validCount").textContent =
    sheetData.filter(r => r.Status === "Valid").length;
  document.getElementById("invalidCount").textContent =
    sheetData.filter(r => r.Status === "Invalid").length;

  const avgAccuracy =
    sheetData.reduce((sum, r) => sum + (parseFloat(r.Accuracy) || 0), 0) /
    (sheetData.length || 1);
  document.getElementById("avgAccuracy").textContent =
    avgAccuracy.toFixed(2) + "%";

  document.getElementById("lastUpdated").textContent =
    new Date().toLocaleString();
}

// ===== Map =====
let map = L.map("map").setView([20, 77], 4); // Default India view
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

function renderMap() {
  markersLayer.clearLayers();
  filteredData.forEach(row => {
    if (row.Lat && row.Lng) {
      L.marker([row.Lat, row.Lng])
        .addTo(markersLayer)
        .bindPopup(`<b>${row.FormattedAddress || "Unknown"}</b>`);
    }
  });
}

function zoomTo(lat, lng) {
  if (lat && lng) {
    map.setView([lat, lng], 14);
  }
}

// ===== Run Validation =====
async function runValidation() {
  try {
    const res = await fetch(`${API_URL}?action=runValidation`, {
      method: "POST"
    });
    const json = await res.json();
    alert(json.message || "Validation triggered!");
    await fetchData();
  } catch (err) {
    console.error("❌ Error running validation:", err);
    alert("Error running validation. Check Apps Script logs.");
  }
}

// ===== Refresh =====
function refreshData() {
  fetchData();
}

// ===== Export CSV =====
function exportCSV() {
  let csv = "Sr No,Status,Formatted Address,City,State,Pincode,Country,Accuracy\n";
  filteredData.forEach((row, i) => {
    csv += `${i + 1},${row.Status || ""},${row.FormattedAddress || ""},${row.City || ""},${row.State || ""},${row.Pincode || ""},${row.Country || ""},${row.Accuracy || ""}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "validated_addresses.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

// ===== Init =====
window.onload = fetchData;
