const sizes = ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
let allStyleEntries = {}; // { styleName: { summary: {}, logEntries: [] } }

function initializeStyleData(style) {
  if (!allStyleEntries[style]) {
    allStyleEntries[style] = {
      summary: Object.fromEntries(sizes.map(size => [size, { qty: 0, count: 0 }])),
      logEntries: []
    };
  }
}

function saveToStorage() {
  localStorage.setItem("allStyleEntries", JSON.stringify(allStyleEntries));
}

function loadFromStorage() {
  const stored = localStorage.getItem("allStyleEntries");
  if (stored) {
    allStyleEntries = JSON.parse(stored);
  }
}

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

    // Summary Table
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

    // Log Button
    const logToggleBtn = document.createElement("button");
    logToggleBtn.innerText = "View Log";
    logToggleBtn.className = "toggle-log-btn";
    logToggleBtn.onclick = () => showLogModal(style);

    section.appendChild(summaryTable);
    section.appendChild(boxTotal);
    section.appendChild(logToggleBtn);

    container.appendChild(section);
  }
}

// Add entry handler supports mixed boxes input format: 
// Either "M-10" (single size) or "M5,L5" (mixed sizes)
function addEntry() {
  const input = document.getElementById("entryInput").value.trim().toUpperCase();
  const style = document.getElementById("styleInput").value.trim().toUpperCase();

  if (!input || !style) {
    alert("Please enter a style and size-quantity (e.g. M-10 or S-10,M-5).");
    return;
  }

  initializeStyleData(style);

  // Split by commas for multiple sizes in one box
  const parts = input.split(",");
  const items = [];

  for (const part of parts) {
    const [size, qtyStr] = part.split("-");
    const qty = parseInt(qtyStr, 10);

    if (!sizes.includes(size) || isNaN(qty) || qty <= 0) {
      alert("Invalid entry. Use format SIZE-QUANTITY (e.g. M-10) or multiple like S-10,M-5");
      return;
    }
    items.push({ size, qty });
  }

  // Add quantities per size
  items.forEach(({ size, qty }) => {
    allStyleEntries[style].summary[size].qty += qty;
  });

  // Increase box count by 1 for the whole mixed box
  items.forEach(({ size }) => {
    // Only increment count once per box, so do this only for the first size
    // We'll increment count only once total below instead
  });
  // Increment box count once per box (not per size)
  allStyleEntries[style].summary[items[0].size].count += 1;

  // Log the whole mixed box as one entry
  allStyleEntries[style].logEntries.push({ items });

  saveToStorage();
  renderAllStyles();

  document.getElementById("entryInput").value = "";
  document.getElementById("entryInput").focus();
}


// Undo last entry for a style
function undoLast() {
  const style = document.getElementById("styleInput").value.trim().toUpperCase();
  if (!style || !allStyleEntries[style]) {
    alert("No entries for this style to undo.");
    return;
  }

  const log = allStyleEntries[style].logEntries;
  if (log.length === 0) {
    alert("No entries to undo.");
    return;
  }

  // Remove last entry
  const lastEntry = log.pop();

  // lastEntry might be a mixed box with 'items' array or a single size-qty
  if (lastEntry.items) {
    // Mixed box undo
    lastEntry.items.forEach(({ size, qty }, index) => {
      allStyleEntries[style].summary[size].qty -= qty;
      // Remove 1 box count only once (on first size)
      if (index === 0) {
        allStyleEntries[style].summary[size].count -= 1;
      }
    });
  } else {
    // Single size-qty undo
    const { size, qty } = lastEntry;
    allStyleEntries[style].summary[size].qty -= qty;
    allStyleEntries[style].summary[size].count -= 1;
  }

  saveToStorage();
  renderAllStyles();
}


// Show modal popup for logs
function showLogModal(style) {
  const modal = document.getElementById("logModal");
  const overlay = document.getElementById("modalOverlay");
  const tbody = document.querySelector("#modalLogTable tbody");

  tbody.innerHTML = ""; // Clear previous rows

  const data = allStyleEntries[style];
  if (!data || data.logEntries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.innerText = "No log entries";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  // Sort the entries: for mixed boxes, sort based on the first size in the items array
  const sortedLogEntries = [...data.logEntries].sort((a, b) => {
    const getIndex = (entry) => {
      if (entry.items && entry.items.length > 0) {
        return sizes.indexOf(entry.items[0].size);
      }
      return sizes.indexOf(entry.size);
    };
    return getIndex(a) - getIndex(b);
  });

  sortedLogEntries.forEach(entry => {
    const row = document.createElement("tr");
    const sizeCell = document.createElement("td");
    const qtyCell = document.createElement("td");

    if (entry.items) {
      // Sort the items inside the mixed box
      const sortedItems = [...entry.items].sort((a, b) =>
        sizes.indexOf(a.size) - sizes.indexOf(b.size)
      );

      sizeCell.innerText = sortedItems.map(i => i.size).join(", ");
      qtyCell.innerText = sortedItems.map(i => i.qty).join(", ");
    } else {
      sizeCell.innerText = entry.size;
      qtyCell.innerText = entry.qty;
    }

    row.appendChild(sizeCell);
    row.appendChild(qtyCell);
    tbody.appendChild(row);
  });

  modal.style.display = "block";
  overlay.style.display = "block";
}



function closeLogModal() {
  document.getElementById("logModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
}

// Add event listener for your close button:
document.getElementById("closeModalBtn").onclick = closeLogModal;

// Also clicking on overlay closes modal
document.getElementById("modalOverlay").onclick = closeLogModal;


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

// Export Excel (same as before, adjusted for mixed boxes)
function exportToExcel() {
  const wb = XLSX.utils.book_new();

  // --- Helper to sanitize sheet names ---
  function sanitizeSheetName(name) {
    return name
      .replace(/[:\\/?*\[\]]/g, '')   // remove invalid characters
      .substring(0, 31)               // Excel allows max 31 chars
      .trim();                        // remove leading/trailing spaces
  }

  for (const [style, data] of Object.entries(allStyleEntries)) {
    // --- Summary Sheet ---
    const summaryData = [["Size", "Qty", "Count"]];
    sizes.forEach(size => {
      const { qty, count } = data.summary[size] || { qty: 0, count: 0 };
      summaryData.push([size, qty, count]);
    });
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(
      wb,
      summarySheet,
      sanitizeSheetName(`${style}_Summary`)
    );

    // --- Log Sheet ---
    const logData = [["Size", "Quantity"]];

    // Flatten and sort log entries by first size
    const sortedLogEntries = [...data.logEntries].sort((a, b) => {
      const getIndex = (entry) => {
        if (entry.items && entry.items.length > 0) {
          return sizes.indexOf(entry.items[0].size);
        }
        return sizes.indexOf(entry.size);
      };
      return getIndex(a) - getIndex(b);
    });

    sortedLogEntries.forEach(entry => {
      if (entry.items) {
        // Sort items inside the mixed box
        const sortedItems = [...entry.items].sort((a, b) =>
          sizes.indexOf(a.size) - sizes.indexOf(b.size)
        );
        logData.push([
          sortedItems.map(i => i.size).join(", "),
          sortedItems.map(i => i.qty).join(", ")
        ]);
      } else {
        logData.push([entry.size, entry.qty]);
      }
    });

    const logSheet = XLSX.utils.aoa_to_sheet(logData);
    XLSX.utils.book_append_sheet(
      wb,
      logSheet,
      sanitizeSheetName(`${style}_Log`)
    );
  }

  XLSX.writeFile(wb, "carton_summary.xlsx");
}


// On page load
window.onload = () => {
  loadFromStorage();
  renderAllStyles();
};


