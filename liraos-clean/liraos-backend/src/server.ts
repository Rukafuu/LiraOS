import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { imageRouter } from './routes/image';
import { conversationsRouter } from './routes/conversations';
import { memoriesRouter } from './routes/memories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3002'], // Frontend Vite ports including current port
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', chatRouter);
app.use('/api', imageRouter);
app.use('/api', conversationsRouter);
app.use('/api', memoriesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Chat Lira Backend' });
});

app.listen(PORT, () => {
  console.log(`🚀 Chat Lira Backend running on port ${PORT}`);
});
