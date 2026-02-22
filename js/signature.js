let activeSigner = null;
let canvas;
let ctx;
let drawing = false;

document.addEventListener("DOMContentLoaded", function () {

  // =====================
  // AUTO SAVE FORM
  // =====================
  const fields = document.querySelectorAll("input, textarea");

  fields.forEach(field => {

    // Load saved data
    const saved = localStorage.getItem(field.name);
    if (saved) field.value = saved;

    // Save on input
    field.addEventListener("input", () => {
      localStorage.setItem(field.name, field.value);
    });
  });

  // =====================
  // LOAD SAVED SIGNATURE
  // =====================
  ["client", "engineer"].forEach(type => {
    const savedSign = localStorage.getItem(type + "-sign");

    if (savedSign) {
      const preview = document.getElementById(type + "-preview");
      preview.src = savedSign;
      preview.style.display = "block";
      preview.parentElement.querySelector(".placeholder").style.display = "none";
    }
  });

  // Setup canvas
  canvas = document.getElementById("signature-canvas");
  ctx = canvas.getContext("2d");

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mouseup", endDrawing);
  canvas.addEventListener("mousemove", draw);

  canvas.addEventListener("touchstart", startDrawing);
  canvas.addEventListener("touchend", endDrawing);
  canvas.addEventListener("touchmove", draw);
});

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function getPosition(event) {
  const rect = canvas.getBoundingClientRect();

  if (event.touches) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function startDrawing(e) {
  drawing = true;
  draw(e);
}

function endDrawing() {
  drawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const pos = getPosition(e);

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function openSignature(type) {
  activeSigner = type;
  document.getElementById("signature-modal").style.display = "flex";

  setTimeout(() => {
    resizeCanvas();
    clearSignature();
  }, 100);
}

function closeSignature() {
  document.getElementById("signature-modal").style.display = "none";
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
  const imageData = canvas.toDataURL("image/png");

  localStorage.setItem(activeSigner + "-sign", imageData);

  const preview = document.getElementById(activeSigner + "-preview");
  preview.src = imageData;
  preview.style.display = "block";
  preview.parentElement.querySelector(".placeholder").style.display = "none";

  closeSignature();
}

// Function clear all 
function clearAll() {

  if (!confirm("Are you sure you want to clear all data?")) return;

  // Hapus semua input & textarea
  const fields = document.querySelectorAll("input, textarea");

  fields.forEach(field => {
    field.value = "";
    localStorage.removeItem(field.name);
  });

  // Hapus signature client & engineer
  ["client", "engineer"].forEach(type => {
    localStorage.removeItem(type + "-sign");

    const preview = document.getElementById(type + "-preview");
    preview.src = "";
    preview.style.display = "none";

    const placeholder = preview.parentElement.querySelector(".placeholder");
    if (placeholder) placeholder.style.display = "block";
  });

  // alert("All data cleared successfully.");
}
// akhir function clear all 

// export jpg n pdf 
async function exportPDF() {

  const paper = document.querySelector(".paper");

  // Ubah semua canvas signature menjadi image sementara
  const canvases = document.querySelectorAll("canvas");
  const tempImages = [];

  canvases.forEach(canvas => {
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.style.width = canvas.style.width || canvas.width + "px";
    img.style.height = canvas.style.height || canvas.height + "px";

    // 🔥 pakai ukuran visual asli
    // img.style.width = canvas.offsetWidth + "px";
    // img.style.height = canvas.offsetHeight + "px";

    canvas.style.display = "none";
    canvas.parentNode.insertBefore(img, canvas);

    tempImages.push({ canvas, img });
  });

  const canvasExport = await html2canvas(paper, {
    scale: 3,
    useCORS: true
  });

  const imgData = canvasExport.toDataURL("image/jpeg", 0.8);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const imgHeight = (canvasExport.height * imgWidth) / canvasExport.width;

  pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
  pdf.save("SVR_Report.pdf");

  // Balikkan canvas seperti semula
  tempImages.forEach(item => {
    item.img.remove();
    item.canvas.style.display = "block";
  });
}

window.exportPNG = async function () {

  const paper = document.querySelector(".paper");

  const canvas = await html2canvas(paper, {
    scale: 3,                // bikin tajam
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  // Ukuran A4 dalam pixel (rasio A4)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  // Buat canvas baru ukuran A4
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = A4_WIDTH;
  finalCanvas.height = A4_HEIGHT;

  const ctx = finalCanvas.getContext("2d");

  // Isi background putih
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  // Hitung scaling proporsional
  const ratio = Math.min(
    A4_WIDTH / canvas.width,
    A4_HEIGHT / canvas.height
  );

  const newWidth = canvas.width * ratio;
  const newHeight = canvas.height * ratio;

  const x = (A4_WIDTH - newWidth) / 2;
  const y = (A4_HEIGHT - newHeight) / 2;

  ctx.drawImage(canvas, x, y, newWidth, newHeight);

  // Download PNG
  const link = document.createElement("a");
  link.download = "SVR_Report_A4.png";
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
};
// akhirexport jpg n pdf 