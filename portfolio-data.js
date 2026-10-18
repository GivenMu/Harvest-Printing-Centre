// Portfolio page: builds the gallery from the Firestore "portfolio" collection.
// The gallery already in the HTML stays as a fallback if the database cannot be reached.
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

const gallery = document.querySelector(".gallery.premium-gallery");

if (gallery) {
  try {
    const snap = await getDocs(query(collection(db, "portfolio"), orderBy("sortOrder")));
    if (!snap.empty) {
      gallery.replaceChildren();
      snap.forEach((d) => {
        const item = d.data();
        const wrap = document.createElement("div");
        wrap.className = "gallery-item fade-up show";
        const img = document.createElement("img");
        img.src = "images/" + item.imageFile;
        img.alt = item.alt || item.title;
        img.loading = "lazy";
        const overlay = document.createElement("div");
        overlay.className = "gallery-overlay";
        const span = document.createElement("span");
        span.textContent = item.title;
        overlay.appendChild(span);
        wrap.append(img, overlay);
        gallery.appendChild(wrap);
      });
    }
  } catch (err) {
    console.warn("Showing the built-in gallery", err);
  }
}
