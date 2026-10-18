// Booking form (booking.html) and contact form (contact.html).
// Both validate the input, save a document in Firestore, then send an email via Web3Forms.
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const WEB3FORMS_KEY = "53c53bde-bff6-4db5-bb40-06105f7b483f";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{9,18}$/;

const clean = (v) => String(v ?? "").trim();

function setStatus(el, text, color) {
  if (!el) return;
  el.textContent = text;
  el.style.color = color;
}

async function sendEmail(subject, fields) {
  try {
    const fd = new FormData();
    fd.append("access_key", WEB3FORMS_KEY);
    fd.append("subject", subject);
    for (const [k, v] of Object.entries(fields)) fd.append(k, v ?? "");
    const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
    const json = await res.json();
    return json.success === true;
  } catch (err) {
    console.error("Email failed", err);
    return false;
  }
}

// Fill a <select> from the Firestore "services" collection.
// If the database cannot be reached, the options already in the HTML stay in place.
async function loadServiceOptions(select, extraOption) {
  if (!select) return;
  try {
    const snap = await getDocs(query(collection(db, "services"), orderBy("sortOrder")));
    if (snap.empty) return;
    const placeholder = select.options[0];
    select.replaceChildren(placeholder);
    snap.forEach((d) => {
      const o = document.createElement("option");
      o.value = d.data().name;
      o.textContent = d.data().name;
      o.dataset.serviceId = d.id;
      select.appendChild(o);
    });
    if (extraOption) {
      const o = document.createElement("option");
      o.value = extraOption;
      o.textContent = extraOption;
      select.appendChild(o);
    }
  } catch (err) {
    console.warn("Using the built-in service list", err);
  }
}

function validateCommon(d, errors) {
  if (d.name.length < 2 || d.name.length > 100) errors.push("Please enter your full name.");
  if (!EMAIL_RE.test(d.email) || d.email.length > 150) errors.push("Please enter a valid email address.");
  if (d.phone && !PHONE_RE.test(d.phone)) errors.push("Please enter a valid phone number (digits only).");
  if (d.message.length > 2000) errors.push("The message is too long (maximum 2000 characters).");
}

// ---------------- Booking form ----------------
const bookingForm = document.getElementById("booking-form");
if (bookingForm) {
  const f = bookingForm.elements;
  loadServiceOptions(f.namedItem("service"));

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    const select = f.namedItem("service");
    const data = {
      name: clean(f.namedItem("name").value),
      phone: clean(f.namedItem("phone").value),
      email: clean(f.namedItem("email").value),
      service: clean(select.value),
      serviceId: select.selectedOptions[0]?.dataset.serviceId || null,
      quantity: parseInt(f.namedItem("quantity").value, 10),
      date: clean(f.namedItem("date").value),
      message: clean(f.namedItem("message").value),
    };

    const errors = [];
    validateCommon(data, errors);
    if (!PHONE_RE.test(data.phone)) errors.push("Please enter a valid phone number (digits only).");
    if (!data.service) errors.push("Please choose a service.");
    if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 100000)
      errors.push("Quantity must be a whole number of 1 or more.");
    if (data.date) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(data.date) < today) errors.push("The preferred date cannot be in the past.");
    }
    if (errors.length) { setStatus(status, errors[0], "red"); return; }

    setStatus(status, "Sending...", "#555");
    try {
      await addDoc(collection(db, "bookings"), {
        ...data,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      const emailed = await sendEmail("New Booking - Harvest Printing Centre", {
        name: data.name, phone: data.phone, email: data.email, service: data.service,
        quantity: data.quantity, date: data.date, message: data.message,
      });
      setStatus(
        status,
        emailed ? "✅ Booking submitted successfully!" : "⚠️ Booking saved, but the email notification failed.",
        emailed ? "green" : "orange"
      );
      bookingForm.reset();
    } catch (err) {
      console.error(err);
      setStatus(status, "❌ Error submitting booking. Please try again.", "red");
    }
  });
}

// ---------------- Contact form ----------------
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const f = contactForm.elements;
  loadServiceOptions(f.namedItem("service"), "Other / Custom Work");

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    const data = {
      name: clean(f.namedItem("name").value),
      email: clean(f.namedItem("email").value),
      phone: clean(f.namedItem("phone").value),
      service: clean(f.namedItem("service").value),
      message: clean(f.namedItem("message").value),
    };

    const errors = [];
    validateCommon(data, errors);
    if (data.message.length < 5) errors.push("Please write a short message.");
    if (errors.length) { setStatus(status, errors[0], "red"); return; }

    setStatus(status, "Sending...", "#555");
    try {
      await addDoc(collection(db, "contacts"), {
        ...data,
        status: "New",
        createdAt: serverTimestamp(),
      });
      const emailed = await sendEmail("New Contact Message - Harvest Printing Centre", data);
      setStatus(
        status,
        emailed ? "✅ Message sent. We will get back to you soon." : "⚠️ Message saved, but the email notification failed.",
        emailed ? "green" : "orange"
      );
      contactForm.reset();
    } catch (err) {
      console.error(err);
      setStatus(status, "❌ Error sending message. Please try again.", "red");
    }
  });
}
