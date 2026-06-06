import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAObkg1J4OJGS9WQPo1u_d3wE0Yn0wz5KM",
  authDomain: "harvest-printing-centre.firebaseapp.com",
  projectId: "harvest-printing-centre",
  storageBucket: "harvest-printing-centre.firebasestorage.app",
  messagingSenderId: "895161653548",
  appId: "1:895161653548:web:571e54b048783d5603f489",
  measurementId: "G-4VZPDLK528"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bookingForm = document.querySelector(".booking-form");
const formStatus = document.getElementById("form-status");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    formStatus.innerHTML = "Sending...";
    formStatus.style.color = "#555";

    try {
      // Save booking to Firebase
      await addDoc(collection(db, "bookings"), {
        name: bookingForm.name.value,
        phone: bookingForm.phone.value,
        email: bookingForm.email.value,
        service: bookingForm.service.value,
        quantity: bookingForm.quantity.value,
        date: bookingForm.date.value,
        message: bookingForm.message.value,
        createdAt: serverTimestamp()
      });

      // Send email via Web3Forms
      const formData = new FormData();

      formData.append(
        "access_key",
        "53c53bde-bff6-4db5-bb40-06105f7b483f"
      );

      formData.append(
        "subject",
        "New Booking - Harvest Printing Centre"
      );

      formData.append("name", bookingForm.name.value);
      formData.append("phone", bookingForm.phone.value);
      formData.append("email", bookingForm.email.value);
      formData.append("service", bookingForm.service.value);
      formData.append("quantity", bookingForm.quantity.value);
      formData.append("date", bookingForm.date.value);
      formData.append("message", bookingForm.message.value);

      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (result.success) {
        formStatus.innerHTML =
          "✅ Booking submitted successfully!";
        formStatus.style.color = "green";
        bookingForm.reset();
      } else {
        formStatus.innerHTML =
          "⚠️ Saved to Firebase, but email failed.";
        formStatus.style.color = "orange";
      }

    } catch (error) {
      console.error(error);

      formStatus.innerHTML =
        "❌ Error submitting booking.";
      formStatus.style.color = "red";
    }
  });
}
