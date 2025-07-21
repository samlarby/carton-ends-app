const sizes = ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
let allStyleEntries = {}; // { styleName: { summary: {}, logEntries: [] } }

// Ensure style exists in data
function initializeStyleData(style) {
  if (!allStyleEntries[style]) {
    allStyleEntries[style] = {
      summary: Object.fromEntries(sizes.map(size => [size, { qty: 0, count: 0 }])),
      logEntries: []
    };
  }
}

// Save to local storage
function saveToStorage() {
  localStorage.setItem("allStyleEntries", JSON.stringify(allStyleEntries));
}

// Load from local storage
function loadFromStorage() {
  const stored = localStorage.getItem("allStyleEntries");
  if (stored) {
    allStyleEntries = JSON.parse(stored);
  }
}

// Render all style sections
function renderAllStyles() {
  const container = document.getElementById("all-styles-container");
  container.innerHTML = "";

  if (Object.keys(allStyleEntries).length === 0) {
    container.innerHTML = "<p>No data yet.</p>";
    return;
  }

  for (const [style, data] of Object.entries(allStyleEntries)) {
    const section = document.createElement("div");
    section.className = "style-section";

    const title = document.createElement("h3");
    title.innerText = `Style: ${style}`;
    section.appendChild(title);

    const summaryTable = document.createElement("table");
    summaryTable.className = "summary-table";
    summaryTable.innerHTML = `<tr><th>Size</th><th>Qty</th><th>Count</th></tr>`;

    let totalBoxes = 0;
    sizes.forEach(size => {
      const { qty, count } = data.summary[size] || { qty: 0, count: 0 };
      totalBoxes += count;
      const row = document.createElement("tr");
      row.innerHTML = `<td>${size}</td><td>${qty}</td><td>${count}</td>`;
      summaryTable.appendChild(row);
    });

    const boxTotal = document.createElement("p");
    boxTotal.innerText = `Total Boxes: ${totalBoxes}`;

    const logToggleBtn = document.createElement("button");
    logToggleBtn.innerText = "Show Log";
    logToggleBtn.className = "toggle-log-btn";

    // Pop-up log viewer
    logToggleBtn.addEventListener("click", () => {
      const modal = document.getElementById("logModal");
      const overlay = document.getElementById("modalOverlay");
      const modalLogTitle = document.getElementById("modalLogTitle");
      const modalLogTableBody = document.querySelector("#modalLogTable tbody");

      modalLogTitle.innerText = `Log for Style: ${style}`;
      modalLogTableBody.innerHTML = "";

      const logs = [...data.logEntries].sort((a, b) => sizes.indexOf(a.size) - sizes.indexOf(b.size));
      logs.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${entry.size}</td><td>${entry.qty}</td>`;
        modalLogTableBody.appendChild(row);
      });

      modal.style.display = "block";
      overlay.style.display = "block";
    });

    section.appendChild(summaryTable);
    section.appendChild(boxTotal);
    section.appendChild(logToggleBtn);
    container.appendChild(section);
  }
}

// Add a new entry
function addEntry() {
  const input = document.getElementById("entryInput").value.trim().toUpperCase();
  const style = document.getElementById("styleInput").value.trim().toUpperCase();

  if (!input || !style) {
    alert("Please enter a style and a size-quantity (e.g. M-10).");
    return;
  }

  const [size, qtyStr] = input.split("-");
  const qty = parseInt(qtyStr, 10);

  if (!sizes.includes(size) || isNaN(qty) || qty <= 0) {
    alert("Invalid entry. Use format SIZE-QUANTITY (e.g. M-10).");
    return;
  }

  initializeStyleData(style);

  allStyleEntries[style].summary[size].qty += qty;
  allStyleEntries[style].summary[size].count += 1;
  allStyleEntries[style].logEntries.push({ size, qty });

  saveToStorage();
  renderAllStyles();

  document.getElementById("entryInput").value = "";
  document.getElementById("entryInput").focus();
}

// Undo the last entry
function undoLast() {
  const style = document.getElementById("styleInput").value.trim().toUpperCase();
  if (!style || !allStyleEntries[style] || allStyleEntries[style].logEntries.length === 0) {
    alert("Nothing to undo.");
    return;
  }

  const last = allStyleEntries[style].logEntries.pop();
  const { size, qty } = last;

  if (allStyleEntries[style].summary[size]) {
    allStyleEntries[style].summary[size].qty -= qty;
    allStyleEntries[style].summary[size].count -= 1;
    if (allStyleEntries[style].summary[size].qty < 0) allStyleEntries[style].summary[size].qty = 0;
    if (allStyleEntries[style].summary[size].count < 0) allStyleEntries[style].summary[size].count = 0;
  }

  saveToStorage();
  renderAllStyles();
}

// Reset all data
function resetAll() {
  if (confirm("Are you sure you want to clear all data?")) {
    allStyleEntries = {};
    localStorage.removeItem("allStyleEntries");
    renderAllStyles();
    document.getElementById("entryInput").value = "";
    document.getElementById("styleInput").value = "";
  }
}

// Export to Excel
function exportToExcel() {
  const wb = XLSX.utils.book_new();

  for (const [style, data] of Object.entries(allStyleEntries)) {
    const summaryData = [["Size", "Qty", "Count"]];
    const logData = [["Size", "Quantity"]];

    sizes.forEach(size => {
      const s = data.summary[size];
      summaryData.push([size, s.qty, s.count]);
    });

    data.logEntries.forEach(entry => {
      logData.push([entry.size, entry.qty]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    const logSheet = XLSX.utils.aoa_to_sheet(logData);

    XLSX.utils.book_append_sheet(wb, summarySheet, `${style}_Summary`);
    XLSX.utils.book_append_sheet(wb, logSheet, `${style}_Log`);
  }

  XLSX.writeFile(wb, "carton_summary.xlsx");
}

// Close modal
function setupModalClose() {
  const modal = document.getElementById("logModal");
  const overlay = document.getElementById("modalOverlay");
  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
    overlay.style.display = "none";
  };
  overlay.onclick = () => {
    modal.style.display = "none";
    overlay.style.display = "none";
  };
}

// Init on load
window.onload = () => {
  loadFromStorage();
  renderAllStyles();
  setupModalClose();
};
