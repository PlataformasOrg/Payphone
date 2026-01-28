import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Endpoint de salud
 */
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Backend OK" });
});

/**
 * PREPARE: crea una transacción PayPhone (botón / link / QR)
 * - Usa TOKEN DE TIENDA
 * - Usa STORE_ID tipo UUID (string)
 * - NO envía phoneNumber (opcional y causa errores)
 */
app.post("/api/payphone/prepare", async (req, res) => {
  try {
    const { amountUSD, reference } = req.body;

    // 1️⃣ Validar monto
    const amountNum = Number(amountUSD);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ error: "amountUSD inválido" });
    }

    // 2️⃣ Leer STORE_ID (UUID, NO number)
    const storeId = process.env.PAYPHONE_STORE_ID;
    if (!storeId || storeId.trim().length < 10) {
      return res.status(500).json({
        error: "PAYPHONE_STORE_ID no válido en .env (debe ser UUID completo)",
        value: storeId,
      });
    }

    // 3️⃣ Leer TOKEN de tienda
    const token = process.env.PAYPHONE_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "PAYPHONE_TOKEN no existe en .env",
      });
    }

    // 4️⃣ URL de retorno
    const responseUrl =
      process.env.RESPONSE_URL || "http://localhost:3000/retorno.html";

    // 5️⃣ PayPhone trabaja en centavos
    const amount = Math.round(amountNum * 100);

    // 6️⃣ Payload (SIN teléfono)
    const payload = {
      amount,
      amountWithoutTax: amount,
      currency: "USD",
      clientTransactionId: `TXN-${Date.now()}`,
      storeId,
      reference: reference || "Pago de prueba",
      responseUrl,

      // Compatibilidad por si el API exige mayúsculas
      StoreId: storeId,
      ResponseUrl: responseUrl,
    };

    console.log("===== PAYLOAD ENVIADO A PAYPHONE =====");
    console.log(JSON.stringify(payload, null, 2));
    console.log("======================================");

    // 7️⃣ Llamada al API PayPhone
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

    console.log("HTTP STATUS PAYPHONE:", response.status);
    console.log("RESPUESTA PAYPHONE:", JSON.stringify(data, null, 2));

    // 8️⃣ Responder al frontend
    return res.status(response.status).json({
      httpStatus: response.status,
      requestSent: payload,
      responseReceived: data,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Error interno",
      details: String(err?.message || err),
    });
  }
});

/**
 * Arranque del servidor
 */
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
