import express from "express";
import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// ⭐ DNS FIX
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

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
import agentDashboardRoutes from "./routes/agentDashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// MONGODB CONNECTION
// ============================================
const connectDB = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        // ⭐ SAHI TAREEQA: .env se URI lo
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            console.error('❌ MONGO_URI not found in .env file!');
            process.exit(1);
        }
        
        console.log('URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

connectDB();

// ROUTES
app.get("/", (req, res) => {
    res.json({ message: "API is running successfully" });
});

app.use('/api/admin/dashboard', dashboardRoutes);
app.use("/api/admin", adminApplicationRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/admin/payments', paymentRoutes);

app.use('/api/agent/dashboard', agentDashboardRoutes);
app.use('/api/agent', applicationRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/agent/payments', agentPaymentRoutes);

app.use('/api/universities', universityRoutes);
app.use('/api/programs', programRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});