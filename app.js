const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbz9QPPMkluQupWCS9HQ-eOkgzP2reEupK0J-JuinFtYUYayFbBmBkhxPiHB8BPqaXEn/exec"; // Replace with your Apps Script Web App URL

// ✅ Run validation trigger
async function runValidation() {
  try {
    const res = await fetch(WEBAPP_URL + "?action=run", { method: "POST" });
    const msg = await res.json();

    alert("✅ " + msg.status);

    // Wait 5 sec for Sheet update, then refresh dashboard
    setTimeout(refreshData, 5000);
  } catch (err) {
    alert("❌ Error running validation: " + err.message);
  }
}

// ✅ Refresh dashboard with JSON data
async function refreshData() {
  try {
    const res = await fetch(WEBAPP_URL);
    const data = await res.json();

    const headers = data.headers;
    const rows = data.rows;

    const table = document.getElementById("data-table");
    table.innerHTML = "";

    // Build header row
    const headerRow = document.createElement("tr");
    headers.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Build data rows
    rows.forEach(row => {
      const tr = document.createElement("tr");
      headers.forEach(h => {
        const td = document.createElement("td");
        td.textContent = row[h] || "";
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

  } catch (err) {
    console.error("Error refreshing data:", err);
  }
}

// Auto load on page load
window.onload = refreshData;
