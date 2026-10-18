// Services page: builds the "Quick Pricing Guide" from the Firestore "services" collection.
// The prices already in the HTML stay as a fallback if the database cannot be reached.
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const grid = document.querySelector(".pricing-grid");

if (grid) {
  try {
    const snap = await getDocs(query(collection(db, "services"), orderBy("sortOrder")));
    const priced = snap.docs.map((d) => d.data()).filter((s) => s.price !== null && s.priceLabel);
    if (priced.length) {
      grid.replaceChildren();
      priced.forEach((s) => {
        const box = document.createElement("div");
        box.className = "price-box fade-up show";
        const h = document.createElement("h3");
        h.textContent = s.name;
        const p = document.createElement("p");
        p.textContent = s.priceLabel;
        box.append(h, p);
        grid.appendChild(box);
      });
      const note = document.createElement("p");
      note.className = "price-note";
      note.textContent = "Prices are starting guides. Contact us for a final quote.";
      grid.after(note);
    }
  } catch (err) {
    console.warn("Showing the built-in price list", err);
  }
}
