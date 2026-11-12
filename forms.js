// Booking form (booking.html) and contact form (contact.html).
// Both validate the input, save a document in Firestore, then send an email via Web3Forms.
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./firebase-init.js";
import {
  emailError, phoneError, nameError, normaliseEmail, normalisePhone
} from "./validation.js";

const WEB3FORMS_KEY = "53c53bde-bff6-4db5-bb40-06105f7b483f";

const clean = (v) => String(v ?? "").trim();

function setStatus(el, text, color) {
  if (!el) return;
  el.textContent = text;
  el.style.color = color;
}

// ---------------- Per-field error messages ----------------
// Each field gets a small message under it, so the user sees exactly what to fix.
function fieldErrorEl(input) {
  let el = input.parentElement.querySelector(":scope > .field-error");
  if (!el) {
    el = document.createElement("small");
    el.className = "field-error";
    el.id = `${input.form.id}-${input.name}-error`;
    el.setAttribute("aria-live", "polite");
    input.insertAdjacentElement("afterend", el);
    input.setAttribute("aria-describedby", el.id);
  }
  return el;
}

function showFieldError(input, message) {
  if (!input) return;
  fieldErrorEl(input).textContent = message;
  input.classList.toggle("input-invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

// Checks one field with its rule and shows the result. Returns true when valid.
function checkField(input, rule) {
  if (!input) return true;
  const message = rule(input.value);
  showFieldError(input, message);
  return !message;
}

// Checks fields as the user leaves them, then again on every key press once an error is showing.
function attachLiveChecks(rules) {
  for (const [input, rule] of rules) {
    if (!input) continue;
    input.addEventListener("blur", () => checkField(input, rule));
    input.addEventListener("input", () => {
      if (input.classList.contains("input-invalid")) checkField(input, rule);
    });
  }
}

// Runs every rule, shows all errors, and moves focus to the first wrong field.
function checkAll(rules) {
  let first = null;
  for (const [input, rule] of rules) {
    if (!checkField(input, rule) && !first) first = input;
  }
  if (first) first.focus();
  return !first;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => { el.textContent = ""; });
  form.querySelectorAll(".input-invalid").forEach((el) => {
    el.classList.remove("input-invalid");
    el.setAttribute("aria-invalid", "false");
  });
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

const messageError = (min) => (v) => {
  const text = clean(v);
  if (text.length < min) return min > 0 ? "Please write a short message (at least 5 characters)." : "";
  if (text.length > 2000) return "The message is too long (maximum 2000 characters).";
  return "";
};

// Today's date as YYYY-MM-DD in the visitor's own time zone.
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------- Booking form ----------------
const bookingForm = document.getElementById("booking-form");
if (bookingForm) {
  bookingForm.noValidate = true; // our own messages replace the browser's pop-ups
  const f = bookingForm.elements;
  loadServiceOptions(f.namedItem("service"));
  const dateInput = f.namedItem("date");
  if (dateInput) dateInput.min = todayLocal();

  const rules = [
    [f.namedItem("name"), nameError],
    [f.namedItem("phone"), (v) => phoneError(v, { required: true })],
    [f.namedItem("email"), emailError],
    [f.namedItem("service"), (v) => (clean(v) ? "" : "Please choose a service.")],
    [f.namedItem("quantity"), (v) => {
      const raw = clean(v);
      if (!/^\d+$/.test(raw)) return "Quantity must be a whole number of 1 or more.";
      const q = Number(raw);
      if (q < 1) return "Quantity must be at least 1.";
      if (q > 100000) return "For more than 100 000 items, please contact us directly.";
      return "";
    }],
    [dateInput, (v) => {
      const d = clean(v);
      if (!d) return "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "Please choose a valid date.";
      return d < todayLocal() ? "The preferred date cannot be in the past." : "";
    }],
    [f.namedItem("message"), messageError(0)],
  ];
  attachLiveChecks(rules);

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    if (!checkAll(rules)) {
      setStatus(status, "Please fix the highlighted fields.", "red");
      return;
    }

    const select = f.namedItem("service");
    const data = {
      name: clean(f.namedItem("name").value),
      phone: normalisePhone(f.namedItem("phone").value), // stored as 0821234567
      email: normaliseEmail(f.namedItem("email").value),
      service: clean(select.value),
      serviceId: select.selectedOptions[0]?.dataset.serviceId || null,
      quantity: parseInt(f.namedItem("quantity").value, 10),
      date: clean(dateInput?.value),
      message: clean(f.namedItem("message").value),
    };

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
      clearFieldErrors(bookingForm);
    } catch (err) {
      console.error(err);
      setStatus(status, "❌ Error submitting booking. Please try again.", "red");
    }
  });
}

// ---------------- Contact form ----------------
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.noValidate = true;
  const f = contactForm.elements;
  loadServiceOptions(f.namedItem("service"), "Other / Custom Work");

  const rules = [
    [f.namedItem("name"), nameError],
    [f.namedItem("email"), emailError],
    [f.namedItem("phone"), (v) => phoneError(v, { required: false })], // optional on this form
    [f.namedItem("message"), messageError(5)],
  ];
  attachLiveChecks(rules);

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("form-status");
    if (!checkAll(rules)) {
      setStatus(status, "Please fix the highlighted fields.", "red");
      return;
    }

    const phoneRaw = clean(f.namedItem("phone").value);
    const data = {
      name: clean(f.namedItem("name").value),
      email: normaliseEmail(f.namedItem("email").value),
      phone: phoneRaw ? normalisePhone(phoneRaw) : "",
      service: clean(f.namedItem("service").value),
      message: clean(f.namedItem("message").value),
    };

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
      clearFieldErrors(contactForm);
    } catch (err) {
      console.error(err);
      setStatus(status, "❌ Error sending message. Please try again.", "red");
    }
  });
}
