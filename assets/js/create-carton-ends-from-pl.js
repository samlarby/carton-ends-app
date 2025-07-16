document.getElementById("cartonForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const po = document.getElementById("po").value.trim();
  const style = document.getElementById("style").value.trim();
  const excelText = document.getElementById("excelData").value.trim();

  if (!excelText) {
    alert("Please paste your Excel data!");
    return;
  }

  // Save last PO
  localStorage.setItem("lastPO", po);

  const lines = excelText.split(/\r?\n/);
  if (lines.length < 2) {
    alert("Please include at least header and one row!");
    return;
  }

  // Headers (assume first row)
  const headerCells = lines[0].split(/\t/).map(h => h.trim().toUpperCase());

  const sizeColumns = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];
  const sizeIndexes = {};
  headerCells.forEach((h, i) => {
    if (sizeColumns.includes(h)) sizeIndexes[h] = i;
  });

  // ✅ UPDATED: Get existing labels count
  const container = document.getElementById("labels-container");
  const existingCount = container.querySelectorAll('.label').length;

  const newCartonsCount = lines.length - 1;
  const combinedTotal = existingCount + newCartonsCount;

  // ✅ REMOVED: Do not clear labels anymore
  // container.innerHTML = "";

  // Process each row
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;

    const cells = row.split(/\t/);
    let cartonNo = cells[0]?.trim() || `${i}`;

    // Gather contents
    let contents = [];
    for (const size of sizeColumns) {
      const idx = sizeIndexes[size];
      if (idx === undefined) continue;
      const val = cells[idx]?.trim();
      if (val && !isNaN(val) && +val > 0) {
        contents.push(`${size.toLowerCase()} - ${val}`);
      }
    }

    if (contents.length === 0) continue;

    // Create label from template
    const template = document.getElementById("label-template").content;
    const fragment = document.importNode(template, true);
    const label = fragment.querySelector('.label');

    label.querySelector(".out-po").innerText = po;
    label.querySelector(".out-style").innerText = style;

    // ✅ UPDATED: Correct carton sequence
    const sequenceNumber = existingCount + i;
    label.querySelector(".out-cartonNumber").innerText = `${sequenceNumber}/${combinedTotal}`;


    // Fill in contents section
    const contentsDiv = label.querySelector(".out-contents");
    contentsDiv.innerHTML = contents.map(item => `<div class="label-box">${item}</div>`).join("");

    container.appendChild(label);
  }

  document.getElementById("clearLabels")?.addEventListener("click", () => {
    document.getElementById("labels-container").innerHTML = "";
    document.getElementById("cartonStart").value = 1;
    localStorage.removeItem("lastCartonStart");
  });

  document.getElementById("exportPdf")?.addEventListener("click", async () => {
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
