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

  const sizeColumns = ["XXS","XS","S","M","L","XL","XXL","3XL"];
  const sizeIndexes = {};
  headerCells.forEach((h, i) => {
    if (sizeColumns.includes(h)) sizeIndexes[h] = i;
  });

  const totalCartons = lines.length - 1;

  // Clear previous
  const container = document.getElementById("labels-container");
  container.innerHTML = "";

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
    label.querySelector(".out-cartonNumber").innerText = `${cartonNo}/${totalCartons}`;

    // Fill in contents section
    const contentsDiv = label.querySelector(".out-contents");
    contentsDiv.innerHTML = contents.map(item => `<div class="label-box">${item}</div>`).join("");

    container.appendChild(label);
  }
});
