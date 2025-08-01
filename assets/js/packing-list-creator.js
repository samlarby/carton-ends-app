function parseLabels() {
  const text = document.getElementById("labelInput").value;
  const blocks = text.split(/Supplier Address/).filter(b => b.trim());
  const tbody = document.querySelector("#packingTable tbody");
  tbody.innerHTML = ""; // Clear existing table

  blocks.forEach(block => {
    const poMatch = block.match(/PO Number:\s*(\d+)/i);
    const styleMatch = block.match(/Style:\s*(.+)/i);
    const cartonMatch = block.match(/Carton Number:\s*(\d+)\/\d+/i);

    if (styleMatch && cartonMatch) {
      const sizes = { "2XS": 0, "XS": 0, "S": 0, "M": 0, "L": 0 };

      // Match all lines like "xs - 10", "m - 5", etc.
      const sizeLines = block.match(/([a-z0-9]+)\s*-\s*(\d+)/gi);

      if (sizeLines) {
        sizeLines.forEach(line => {
          const match = line.match(/([a-z0-9]+)\s*-\s*(\d+)/i);
          if (match) {
            let sizeKey = match[1].toUpperCase();
            let quantity = parseInt(match[2]);

            // Normalize common variations
            if (sizeKey === "XXS" || sizeKey === "2XS") sizeKey = "2XS";
            if (sizes.hasOwnProperty(sizeKey)) {
              sizes[sizeKey] += quantity;
            }
          }
        });
      }

      const total = Object.values(sizes).reduce((a, b) => a + b, 0);

      const row = `<tr>
        <td>${cartonMatch[1]}</td>
        <td>${styleMatch[1]}</td>
        <td>${sizes["2XS"]}</td>
        <td>${sizes["XS"]}</td>
        <td>${sizes["S"]}</td>
        <td>${sizes["M"]}</td>
        <td>${sizes["L"]}</td>
        <td>${total}</td>
      </tr>`;

      tbody.innerHTML += row;
    }
  });

  updateTotals();
}


  function updateTotals() {
    const totals = { "2XS": 0, "XS": 0, "S": 0, "M": 0, "L": 0 };
    document.querySelectorAll("#packingTable tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      totals["2XS"] += parseInt(cells[2].textContent);
      totals["XS"]  += parseInt(cells[3].textContent);
      totals["S"]   += parseInt(cells[4].textContent);
      totals["M"]   += parseInt(cells[5].textContent);
      totals["L"]   += parseInt(cells[6].textContent);
    });

    const totalsRow = document.getElementById("totalsRow");
    totalsRow.cells[2].textContent = totals["2XS"];
    totalsRow.cells[3].textContent = totals["XS"];
    totalsRow.cells[4].textContent = totals["S"];
    totalsRow.cells[5].textContent = totals["M"];
    totalsRow.cells[6].textContent = totals["L"];
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Header
    ws_data.push(["", "", "", "Size", "", "", "", ""]);
    ws_data.push(["Carton No.", "STYLE", "2XS", "XS", "S", "M", "L", "Total units in Carton"]);

    // Data rows
    document.querySelectorAll("#packingTable tbody tr").forEach(tr => {
      const row = Array.from(tr.children).map(td => td.textContent);
      ws_data.push(row);
    });

    // Blank rows up to 15 data rows
    for (let i = ws_data.length; i < 22; i++) {
      ws_data.push(["", "", "", "", "", "", "", 0]);
    }

    // Totals row
    const totalRow = document.querySelector("#totalsRow");
    const totalData = Array.from(totalRow.children).map(td => td.textContent);
    ws_data.push(totalData);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Packing List");
    XLSX.writeFile(wb, "Formatted_Packing_List.xlsx");
  }

function resetPackingList() {
document.querySelector("#packingTable tbody").innerHTML = "";
const tr = document.getElementById("totalsRow").children;
for (let i = 2; i <= 6; i++) {
  tr[i].textContent = "0";
}
}
