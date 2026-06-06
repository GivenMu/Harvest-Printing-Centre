bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  formStatus.innerHTML = "Sending...";
  formStatus.style.color = "#555";

  try {

    // Save to Firebase
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

    formData.append("access_key", "53c53bde-bff6-4db5-bb40-06105f7b483f");
    formData.append("subject", "New Booking - Harvest Printing Centre");
    formData.append("name", bookingForm.name.value);
    formData.append("phone", bookingForm.phone.value);
    formData.append("email", bookingForm.email.value);
    formData.append("service", bookingForm.service.value);
    formData.append("quantity", bookingForm.quantity.value);
    formData.append("date", bookingForm.date.value);
    formData.append("message", bookingForm.message.value);

    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    formStatus.innerHTML = "✅ Booking submitted successfully!";
    formStatus.style.color = "green";
    bookingForm.reset();

  } catch (error) {
    console.error(error);

    formStatus.innerHTML = "❌ Error submitting booking.";
    formStatus.style.color = "red";
  }
});
