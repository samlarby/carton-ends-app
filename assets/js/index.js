window.addEventListener("DOMContentLoaded", () => {
    const storedPO = localStorage.getItem("lastPO");
    if (storedPO) {
        document.getElementById("po").value = storedPO;
    }
    if (storedStart) {
        document.getElementById("cartonStart").value = storedStart;
    }
});

document.getElementById("cartonForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const po = document.getElementById("po").value;
    const qty = document.getElementById("qty").value;
    const startNum = parseInt(document.getElementById("cartonStart").value);
    const totalNum = parseInt(document.getElementById("cartonTotal").value);
    const style = document.getElementById("style").value;
    const labelCount = parseInt(document.getElementById("labelCount").value);

    // Store PO number for future autofill
    localStorage.setItem("lastPO", po);

    const container = document.getElementById("labels-container");
    const template = document.getElementById("label-template").content;

    // ❌ REMOVE this line if you want to preserve previous labels
    // container.innerHTML = "";

    // ✅ Generate exactly labelCount labels
    for (let i = 0; i < labelCount; i++) {
        const fragment = document.importNode(template, true);
        const label = fragment.querySelector('.label');
        label.querySelector(".out-po").innerText = po;
        label.querySelector(".out-qty").innerText = qty;
        label.querySelector(".out-cartonNumber").innerText = `${startNum + i}/${totalNum}`;
        label.querySelector(".out-style").innerText = style;
        container.appendChild(label);
    }

    const newStart = startNum + labelCount;
    document.getElementById("cartonStart").value = newStart;
    localStorage.setItem("lastCartonStart", newStart);
});


document.getElementById("clearLabels").addEventListener("click", () => {
    // Clear labels
    document.getElementById("labels-container").innerHTML = "";

    // Reset carton start to 1
    document.getElementById("cartonStart").value = 1;

    // Remove saved carton start from localStorage
    localStorage.removeItem("lastCartonStart");
});

document.getElementById("exportPdf").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const labels = document.querySelectorAll(".label");

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];

        // Convert to canvas
        const canvas = await html2canvas(label, {
            scale: 2,
            useCORS: true
        });

        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = 210;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i !== 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save("Carton_Labels.pdf");
});
