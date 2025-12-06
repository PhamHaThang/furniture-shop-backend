require("dotenv").config();
const express = require("express");
const database = require("./configs/database");
const cors = require("cors");
const router = require("./routes/index.js");
const { errorHandler } = require("./middlewares/errorMiddleware");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configs/swagger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token",
      "Origin",
      "Accept",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100md", extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Homi Shop API Docs",
  })
);

app.use("/api", router);
app.use(errorHandler);
(async () => {
  await database.connect();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
  });
})();
module.exports = app;
