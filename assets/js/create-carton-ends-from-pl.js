document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cartonForm");
  const container = document.getElementById("labels-container");
  const clearButton = document.getElementById("clearLabels");
  const exportButton = document.getElementById("exportPdf");

  // 🟡 Render saved labels on page load
  function renderSavedLabels() {
    const savedLabels = JSON.parse(localStorage.getItem("labels") || "[]");
    const template = document.getElementById("label-template").content;
    const total = savedLabels.length;

    savedLabels.forEach(labelData => {
      const fragment = document.importNode(template, true);
      const label = fragment.querySelector(".label");

      label.querySelector(".out-po").innerText = labelData.po;
      label.querySelector(".out-style").innerText = labelData.style;
      label.querySelector(".out-cartonNumber").innerText = `${labelData.cartonNumber}/${total}`;

      const contentsDiv = label.querySelector(".out-contents");
      contentsDiv.innerHTML = `<div class="label-box">${labelData.size} - ${labelData.quantity}</div>`;

      container.appendChild(label);
    });
  }
  renderSavedLabels();

  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const po = document.getElementById("po").value.trim();
    const style = document.getElementById("style").value.trim();
    const excelText = document.getElementById("excelData").value.trim();

    if (!excelText) {
      alert("Please paste your Excel data!");
      return;
    }

    localStorage.setItem("lastPO", po);

    const lines = excelText.split(/\r?\n/);
    if (lines.length < 2) {
      alert("Please include headers and at least one row of data!");
      return;
    }

    const rawHeaders = lines[0].split(/\t/).map(h => h.trim());
    const headers = rawHeaders.map(h => h.toUpperCase());

    const sizeIndex = headers.findIndex(h => h === "SIZE");
    const qtyIndex = headers.findIndex(h => h === "QUANTITY");

    if (sizeIndex === -1 || qtyIndex === -1) {
      alert(`Header must contain 'Size' and 'Quantity'. Found: ${rawHeaders.join(", ")}`);
      return;
    }

    const entries = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].trim();
      if (!row) continue;

      const cells = row.split(/\t/);
      if (cells.length <= Math.max(sizeIndex, qtyIndex)) {
        console.warn(`Skipping malformed row: ${row}`);
        continue;
      }

      const size = cells[sizeIndex]?.trim();
      const qty = cells[qtyIndex]?.trim();

      if (size && qty && !isNaN(qty) && +qty > 0) {
        entries.push({ size: size.toLowerCase(), quantity: +qty });
      }
    }

    if (entries.length === 0) {
      alert("No valid size/quantity data found.");
      return;
    }

    const template = document.getElementById("label-template").content;
    const existingLabels = container.querySelectorAll(".label");
    const savedLabels = JSON.parse(localStorage.getItem("labels") || "[]");
    const newTotal = existingLabels.length + entries.length;

    // 🔁 Update existing labels' /total
    existingLabels.forEach(label => {
      const numberText = label.querySelector(".out-cartonNumber").innerText;
      const currentNumber = numberText.split("/")[0];
      label.querySelector(".out-cartonNumber").innerText = `${currentNumber}/${newTotal}`;
    });

    const newLabelData = [];

    // 🆕 Create new labels
    entries.forEach((entry, index) => {
      const fragment = document.importNode(template, true);
      const label = fragment.querySelector(".label");

      const cartonNumber = existingLabels.length + index + 1;

      label.querySelector(".out-po").innerText = po;
      label.querySelector(".out-style").innerText = style;
      label.querySelector(".out-cartonNumber").innerText = `${cartonNumber}/${newTotal}`;

      const contentsDiv = label.querySelector(".out-contents");
      contentsDiv.innerHTML = `<div class="label-box">${entry.size} - ${entry.quantity}</div>`;

      container.appendChild(label);

      // Store this label for persistence
      newLabelData.push({
        po,
        style,
        size: entry.size,
        quantity: entry.quantity,
        cartonNumber
      });
    });

    // 💾 Save all labels to localStorage
    const allLabels = [...savedLabels, ...newLabelData];
    localStorage.setItem("labels", JSON.stringify(allLabels));
  });

  // 🧹 Clear labels and storage
  clearButton?.addEventListener("click", () => {
    container.innerHTML = "";
    const cartonStartInput = document.getElementById("cartonStart");
    if (cartonStartInput) cartonStartInput.value = 1;
    localStorage.removeItem("labels");
    localStorage.removeItem("lastCartonStart");
  });

  // 📄 Export as PDF
  exportButton?.addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const labels = document.querySelectorAll(".label");

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const canvas = await html2canvas(label, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("Carton_Labels.pdf");
  });
});
