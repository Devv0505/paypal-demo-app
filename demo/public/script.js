let selectedName = "Latte";
let selectedPrice = 4.5;

const qtyInput = document.getElementById("qty");
const totalText = document.getElementById("total");
const msg = document.getElementById("message");
const items = document.querySelectorAll(".item");

// Update total price text
function updateTotal() {
  const qty = parseInt(qtyInput.value || "1", 10);
  const total = (selectedPrice * qty).toFixed(2);
  totalText.textContent = `Total: $${total} (${selectedName} × ${qty})`;
}

// Handle coffee button clicks
items.forEach((btn) => {
  btn.addEventListener("click", () => {
    items.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    selectedName = btn.dataset.name;
    selectedPrice = parseFloat(btn.dataset.price);

    updateTotal();
  });
});

// Handle quantity change
qtyInput.addEventListener("input", updateTotal);

// Message helper
function showMsg(text, type = "error") {
  msg.style.color = type === "success" ? "green" : "red";
  msg.textContent = text;
}

// Render PayPal buttons
paypal
  .Buttons({
    createOrder() {
      const qty = parseInt(qtyInput.value || "1", 10);
      const total = (selectedPrice * qty).toFixed(2);
      const itemName = `${selectedName} × ${qty}`;

      return fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, itemName }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.id) throw new Error(data.error || "Order creation failed");
          return data.id;
        });
    },

    onApprove(data) {
      return fetch(`/api/order/${data.orderID}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((details) => {
          const payer = details?.payer?.name?.given_name || "Customer";
          showMsg(
            `Thanks, ${payer}! Your ${selectedName} order is paid.`,
            "success"
          );
        });
    },

    onError(err) {
      console.error(err);
      showMsg("Something went wrong during payment.");
    },
  })
  .render("#paypal-button-container");

// Initialize total on load
updateTotal();
