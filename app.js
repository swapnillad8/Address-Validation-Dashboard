// Replace with your Google Sheet public CSV export link
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRB-G_0OHce1UPa5HJjbMe5jT4qUQC26XZGQKOcXdf_uaHJgM-jZu3h4SvCBHGMW_ITwSOd3WrUFwMx/pub?gid=0&single=true&output=csv";

// Replace with your deployed Apps Script Web App URL
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxUzY0rEobqzgw36jnh4cxHnbGUFmP0PZdWKcS06lcpsgegaNsBOOW3muEpy-YY3ig/exec";

let map = L.map('map').setView([20.5937, 78.9629], 5); // India default
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

async function fetchData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const rows = text.split("\n").map(r => r.split(","));
  return rows;
}

async function refreshData() {
  let data = await fetchData();

  // Remove header
  const headers = data.shift();
  const tableBody = document.getElementById("tableBody");
  tableBody.innerHTML = "";

  let total = data.length;
  let valid = data.filter(r => r[1] === "Valid").length;
  let invalid = total - valid;
  let avgAccuracy = (
    data.map(r => parseFloat(r[7]) || 0).reduce((a,b)=>a+b,0) / (total || 1)
  ).toFixed(2);

  document.getElementById("totalRows").textContent = total;
  document.getElementById("validCount").textContent = valid;
  document.getElementById("invalidCount").textContent = invalid;
  document.getElementById("avgAccuracy").textContent = avgAccuracy + "%";
  document.getElementById("lastUpdated").textContent = new Date().toLocaleString();

  // Clear map layers except base
  map.eachLayer((layer) => {
    if (!!layer.toGeoJSON) map.removeLayer(layer);
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Fill table + map
  data.forEach((row, i) => {
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td>${row[4]}</td>
      <td>${row[5]}</td>
      <td>${row[6]}</td>
      <td>${row[7]}%</td>
      <td>${row[8] && row[9] ? `<button onclick="focusMap(${row[8]},${row[9]})">📍</button>` : "-"}</td>
    `;
    tableBody.appendChild(tr);

    if(row[8] && row[9]) {
      L.marker([row[8], row[9]]).addTo(map)
        .bindPopup(`${row[2]}<br>${row[3]}, ${row[4]}`);
    }
  });
}

function focusMap(lat, lng) {
  map.setView([lat, lng], 12);
}

async function runValidation() {
  try {
    // Call Google Apps Script Web App to trigger validation
    const res = await fetch(WEBAPP_URL, { method: "POST" });
    const msg = await res.text();

    alert("✅ Validation triggered!\n\nResponse: " + msg);

    // After some delay, refresh dashboard
    setTimeout(refreshData, 3000);
  } catch (err) {
    alert("❌ Error running validation: " + err.message);
  }
}

function exportCSV() {
  window.open(SHEET_URL, "_blank");
}

// Initial load
refreshData();
