import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import adminRoutes from "./routes/adminRoutes.js";
import adminApplicationRoutes from "./routes/adminApplicationRoutes.js";
import agentRoutes from './routes/agentRoutes.js';
import applicationRoutes from "./routes/applicationRoutes.js";
import universityRoutes from './routes/universityRoutes.js';
import programRoutes from "./routes/programRoutes.js";
import agentPaymentRoutes from "./routes/agentPaymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import agentDashboardRoutes from "./routes/agentDashboardRoutes.js";   // ⭐ NEW
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((error) => console.log("MongoDB Connection Error:", error.message));

app.get("/", (req, res) => {
    res.json({ message: "API is running successfully" });
});

// ============================================
// ⭐ ROUTES (ORDER IMPORTANT!)
// ============================================

// ⭐ ADMIN DASHBOARD (specific — PEHLE)
app.use('/api/admin/dashboard', dashboardRoutes);

// Admin routes
app.use("/api/admin", adminApplicationRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/admin/payments', paymentRoutes);

// ⭐ AGENT DASHBOARD (specific — agent routes se PEHLE)
app.use('/api/agent/dashboard', agentDashboardRoutes);

// Agent routes
app.use('/api/agent', applicationRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/payments', agentPaymentRoutes);

// Other routes
app.use('/api/universities', universityRoutes);
app.use('/api/programs', programRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});