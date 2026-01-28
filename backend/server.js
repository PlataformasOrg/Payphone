import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ===============================
// Configuración paths (ESM)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// App
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// Servir FRONTEND estático
// ===============================
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Health check (Jenkins)
// ===============================
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Backend OK" });
});

// ===============================
// PAYPHONE - PREPARE
// ===============================
app.post("/api/payphone/prepare", async (req, res) => {
  try {
    const { amountUSD, reference } = req.body;

    const amountNum = Number(amountUSD);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ error: "amountUSD inválido" });
    }

    const token = process.env.PAYPHONE_TOKEN;
    const storeId = process.env.PAYPHONE_STORE_ID;
    const responseUrl =
      process.env.RESPONSE_URL || "http://localhost:3001/retorno.html";

    if (!token || !storeId) {
      return res.status(500).json({
        error: "Variables de entorno PAYPHONE no definidas",
      });
    }

    const amount = Math.round(amountNum * 100);

    const payload = {
      amount,
      amountWithoutTax: amount,
      currency: "USD",
      clientTransactionId: `TXN-${Date.now()}`,
      storeId,
      reference: reference || "Pago PayPhone",
      responseUrl,

      // Compatibilidad
      StoreId: storeId,
      ResponseUrl: responseUrl,
    };

    console.log("===== PAYLOAD PAYPHONE =====");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    console.log("STATUS:", response.status);
    console.log("RESPUESTA:", JSON.stringify(data, null, 2));

    return res.status(response.status).json({
      httpStatus: response.status,
      responseReceived: data,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Error interno",
      details: String(err.message || err),
    });
  }
});

// ===============================
// Export para tests
// ===============================
export default app;

// ===============================
// Iniciar servidor (no tests)
// ===============================
const PORT = Number(process.env.PORT || 3001);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}