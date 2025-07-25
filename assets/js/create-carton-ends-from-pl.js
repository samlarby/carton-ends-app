document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cartonForm");
  const container = document.getElementById("labels-container");
  const clearButton = document.getElementById("clearLabels");
  const exportButton = document.getElementById("exportPdf");

  // 🔁 Centralized function to render labels from localStorage
  function refreshLabels() {
    container.innerHTML = ""; // Clear existing labels
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
      contentsDiv.innerHTML = (labelData.sizes || []).map(
        s => `<div class="label-box">${s.size} - ${s.quantity}</div>`
      ).join("");

      container.appendChild(label);
    });
  }

  // 🚀 Render labels on page load
  refreshLabels();

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

      const sizeCell = cells[sizeIndex]?.trim();
      const qtyCell = cells[qtyIndex]?.trim();

      if (!sizeCell || !qtyCell) continue;

      const sizeParts = sizeCell.split(",").map(s => s.trim().toLowerCase());
      const qtyParts = qtyCell.split(",").map(q => q.trim());

      if (sizeParts.length !== qtyParts.length) {
        console.warn(`Mismatched size/qty in row: ${row}`);
        continue;
      }

      const contents = [];
      for (let j = 0; j < sizeParts.length; j++) {
        const quantity = Number(qtyParts[j]);
        if (!isNaN(quantity) && quantity > 0) {
          contents.push({ size: sizeParts[j], quantity });
        }
      }

      if (contents.length > 0) {
        entries.push(contents); // Push the whole group as one label
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

    // 🆕 Create new label data (we will re-render from this)
    const newLabelData = [];

    entries.forEach((entryGroup, index) => {
      const cartonNumber = existingLabels.length + index + 1;
      newLabelData.push({
        po,
        style,
        cartonNumber,
        sizes: entryGroup
      });
    });

    // 💾 Save all labels to localStorage
    const allLabels = [...savedLabels, ...newLabelData];
    localStorage.setItem("labels", JSON.stringify(allLabels));

    // 🔄 Re-render labels
    refreshLabels();
  });

  // 🧹 Clear labels and storage
  clearButton?.addEventListener("click", () => {
    container.innerHTML = "";
    localStorage.removeItem("labels");
    localStorage.removeItem("lastCartonStart");
    refreshLabels(); // <- ensure the UI resets too
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
