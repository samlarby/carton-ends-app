const sizes = ["2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL"];
    const summary = {};
    const logEntries = [];

    sizes.forEach(size => summary[size] = { qty: 0, count: 0 });

    const summaryTable = document.getElementById("summaryTable");
    sizes.forEach(size => {
      const row = summaryTable.insertRow();
      row.insertCell(0).innerText = size;
      row.insertCell(1).innerText = 0;
      row.insertCell(2).innerText = 0;
    });

    function updateSummaryTable() {
      let totalBoxes = 0;
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        summaryTable.rows[i + 1].cells[1].innerText = summary[size].qty;
        summaryTable.rows[i + 1].cells[2].innerText = summary[size].count;
        totalBoxes += summary[size].count;
      }
      document.getElementById("totalBoxes").innerText = `Total Boxes: ${totalBoxes}`;
    }

    function updateLogTable() {
      const logTable = document.getElementById("logTable");
      while (logTable.rows.length > 1) {
        logTable.deleteRow(1);
      }
      logEntries.sort((a, b) => sizes.indexOf(a.size) - sizes.indexOf(b.size));
      logEntries.forEach(entry => {
        const row = logTable.insertRow();
        row.insertCell(0).innerText = entry.size;
        row.insertCell(1).innerText = entry.qty;
      });
    }

    function addEntry() {
      const inputField = document.getElementById("entryInput");
      const input = inputField.value.trim().toUpperCase();
      if (!input) return;

      const parts = input.split("-");
      if (parts.length !== 2) {
        alert("Please enter in format SIZE-QUANTITY, e.g. M-10");
        return;
      }

      const size = parts[0];
      const qty = parseInt(parts[1], 10);

      if (!sizes.includes(size) || isNaN(qty) || qty <= 0) {
        alert("Invalid input. Check size and quantity.");
        return;
      }

      summary[size].qty += qty;
      summary[size].count += 1;
      updateSummaryTable();

      logEntries.push({ size, qty });
      updateLogTable();

      inputField.value = "";
      inputField.focus();
    }

    function resetAll() {
      sizes.forEach(size => summary[size] = { qty: 0, count: 0 });
      updateSummaryTable();

      logEntries.length = 0;
      updateLogTable();

      const inputField = document.getElementById("entryInput");
      inputField.value = "";
      inputField.focus();
    }