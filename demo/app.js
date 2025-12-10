// app.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL =
  process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

// ===== Get PayPal access token =====
async function getToken() {
  const auth = Buffer.from(
    PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
  ).toString("base64");

  const res = await axios({
    url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    method: "post",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: "grant_type=client_credentials",
  });

  return res.data.access_token;
}

// ===== Create order =====
app.post("/api/order", async (req, res) => {
  try {
    const { amount, itemName } = req.body;

    if (!amount || !itemName) {
      return res.status(400).json({ error: "amount and itemName required" });
    }

    const token = await getToken();

    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: itemName,
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
    };

    const paypalRes = await axios({
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: body,
    });

    res.json({ id: paypalRes.data.id });
  } catch (err) {
    console.error("Error creating order:", err.response?.data || err.message);
    res.status(500).json({ error: "Cannot create order" });
  }
});

// ===== Capture order =====
app.post("/api/order/:id/capture", async (req, res) => {
  try {
    const token = await getToken();
    const orderId = req.params.id;

    const paypalRes = await axios({
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.json(paypalRes.data);
  } catch (err) {
    console.error("Error capturing order:", err.response?.data || err.message);
    res.status(500).json({ error: "Cannot capture order" });
  }
});

// Fallback route – for Express v5, must use app.use, not app.get("*")
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Coffee app running on http://localhost:${PORT}`);
});
