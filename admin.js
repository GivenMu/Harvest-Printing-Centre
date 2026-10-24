
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";

const ADMIN_EMAILS = [
  "kelebogile.mashaba22@gmail.com",
  "muneinev2@gmail.com",
  "lebokea17@gmail.com",
  "mphonethomboni@gmail.com",
  "givenmutshotsho@gmail.com"
];

const overlay = document.getElementById("login-overlay");
const dashboard = document.getElementById("dashboard");
const errorEl = document.getElementById("login-error");

function showError(text) {
  errorEl.textContent = text;
  errorEl.style.display = "block";
}

document.getElementById("login-btn").addEventListener("click", async () => {
  errorEl.style.display = "none";
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    console.error(err);
    const messages = {
      "auth/unauthorized-domain": "This website's domain is not authorised in Firebase. Add it under Authentication > Settings > Authorized domains.",
      "auth/operation-not-allowed": "Google sign-in is not switched on in Firebase (Authentication > Sign-in method).",
      "auth/popup-blocked": "Your browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.",
      "auth/popup-closed-by-user": "The sign-in window was closed before it finished. Please try again.",
      "auth/cancelled-popup-request": "The sign-in window was closed before it finished. Please try again.",
      "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
    };
    showError(messages[err.code] || `Sign-in failed (${err.code || "unknown error"}).`);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

onAuthStateChanged(auth, async (user) => {
  if (user && ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
    overlay.style.display = "none";
    dashboard.style.display = "block";
    document.getElementById("admin-email").textContent = user.email;
    loadBookings();
    loadContacts();
    loadOrders();
  } else {
    dashboard.style.display = "none";
    overlay.style.display = "flex";
    if (user) {
      showError("This Google account is not authorised for the admin dashboard.");
      await signOut(auth);
    }
  }
});

function newestFirst(a, b) {
  return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);
}

function addRow(tbody, values, pillIndex) {
  const tr = document.createElement("tr");
  values.forEach((v, i) => {
    const td = document.createElement("td");
    if (i === pillIndex) {
      const pill = document.createElement("span");
      pill.className = "service-pill";
      pill.textContent = v;
      td.appendChild(pill);
    } else {
      td.textContent = v; // textContent, never innerHTML, so submitted text cannot run as code
    }
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
}

function showEmpty(loading, table, text) {
  loading.textContent = text;
  loading.style.display = "block";
  table.style.display = "none";
}

async function loadBookings() {
  const body = document.getElementById("bookings-body");
  const loading = document.getElementById("loading");
  const table = document.getElementById("bookings-table");
  body.replaceChildren();
  try {
    const snap = await getDocs(collection(db, "bookings"));
    const rows = snap.docs.map((d) => d.data()).sort(newestFirst);
    document.getElementById("booking-count").textContent = rows.length;
    if (!rows.length) return showEmpty(loading, table, "No bookings found yet.");
    loading.style.display = "none";
    table.style.display = "";
    rows.forEach((b, i) =>
      addRow(body, [i + 1, b.name || "—", b.phone || "—", b.email || "—", b.service || "—",
        b.quantity ?? "—", b.date || "—", b.message || "—"], 4));
  } catch (err) {
    console.error(err);
    showEmpty(loading, table, "Failed to load bookings. Check your connection and permissions.");
  }
}

async function loadContacts() {
  const body = document.getElementById("contacts-body");
  const loading = document.getElementById("contacts-loading");
  const table = document.getElementById("contacts-table");
  body.replaceChildren();
  try {
    const snap = await getDocs(collection(db, "contacts"));
    const rows = snap.docs.map((d) => d.data()).sort(newestFirst);
    document.getElementById("contact-count").textContent = rows.length;
    if (!rows.length) return showEmpty(loading, table, "No enquiries yet.");
    loading.style.display = "none";
    table.style.display = "";
    rows.forEach((c, i) =>
      addRow(body, [i + 1, c.name || "—", c.email || "—", c.phone || "—", c.service || "—", c.message || "—"], 4));
  } catch (err) {
    console.error(err);
    showEmpty(loading, table, "Failed to load enquiries. Check your connection and permissions.");
  }
}

const ORDER_STATUSES = ["Pending", "Confirmed", "Completed"];
const rand = (n) => `R${Number(n).toFixed(2)}`;

function orderDate(o) {
  if (!o.createdAt?.seconds) return "—";
  return new Date(o.createdAt.seconds * 1000)
    .toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

function orderCustomer(o) {
  const parts = [o.customerName, o.customerEmail].filter(Boolean);
  // Orders placed before names were saved only have the user's ID.
  return parts.length ? parts.join(" · ") : `App user ${String(o.userId || "").slice(0, 8)}`;
}

function orderItems(o) {
  return (o.items || []).map((it) =>
    `${it.quantity} x ${it.name || it.serviceId}${it.unitPrice == null ? " (quote)" : ` @ ${rand(it.unitPrice)}`}`
  ).join("\n") || "—";
}

function statusSelect(id, current) {
  const select = document.createElement("select");
  select.className = "status-select";
  ORDER_STATUSES.forEach((s) => select.add(new Option(s, s, false, s === current)));
  select.addEventListener("change", async () => {
    const previous = current;
    select.disabled = true;
    try {
      await updateDoc(doc(db, "orders", id), { status: select.value });
      current = select.value;
    } catch (err) {
      console.error(err);
      select.value = previous;
      alert("Could not update the order status. Check your connection and permissions.");
    } finally {
      select.disabled = false;
    }
  });
  return select;
}

async function loadOrders() {
  const body = document.getElementById("orders-body");
  const loading = document.getElementById("orders-loading");
  const table = document.getElementById("orders-table");
  body.replaceChildren();
  try {
    const snap = await getDocs(collection(db, "orders"));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(newestFirst);
    document.getElementById("order-count").textContent = rows.length;
    if (!rows.length) return showEmpty(loading, table, "No app orders yet.");
    loading.style.display = "none";
    table.style.display = "";
    rows.forEach((o, i) => {
      const total = o.requiresQuote ? `${rand(o.total || 0)} + quote` : rand(o.total || 0);
      addRow(body, [i + 1, orderDate(o), orderCustomer(o), orderItems(o), total, ""]);
      const cells = body.lastElementChild.children;
      cells[3].style.whiteSpace = "pre-line";
      cells[5].appendChild(statusSelect(o.id, o.status || "Pending"));
    });
  } catch (err) {
    console.error(err);
    showEmpty(loading, table, "Failed to load orders. Check your connection and permissions.");
  }
}

// ---------- PDF download (bookings) ----------
document.getElementById("download-pdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFillColor(15, 22, 35);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Harvest Printing Centre — Booking Records", 14, 14);

  const now = new Date().toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${now}`, 14, 20);

  const rows = [];
  document.querySelectorAll("#bookings-body tr").forEach((tr) => {
    const cells = [...tr.querySelectorAll("td")].map((td) => td.textContent.trim());
    if (cells.length) rows.push(cells);
  });

  doc.autoTable({
    startY: 26,
    head: [["#", "Name", "Phone", "Email", "Service", "Qty", "Date", "Message"]],
    body: rows,
    headStyles: { fillColor: [15, 22, 35], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [26, 33, 48] },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 7: { cellWidth: 45 } },
    margin: { left: 14, right: 14 },
    styles: { overflow: "linebreak", cellPadding: 3.5 },
    didDrawPage: (data) => {
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text(`Page ${data.pageNumber}  •  Harvest Printing Centre`,
        data.settings.margin.left, doc.internal.pageSize.height - 8);
    },
  });

  const total = document.getElementById("booking-count").textContent;
  doc.save(`HPC_Bookings_${total}_records_${new Date().toISOString().slice(0, 10)}.pdf`);
});
