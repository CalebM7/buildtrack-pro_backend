import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitize from 'mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import authRouter from './routes/authRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import globalErrorHandler from './middleware/errorHandler.js';
import dailyReportRoutes from './routes/dailyReportRoutes.js';
import materialDeliveryRoutes from './routes/materialDeliveryRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import siteInstructionRoutes from './routes/siteInstructionRoutes.js';
import userRouter from './routes/userRoutes.js';


const app = express();

// 1. GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// Enable CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({
  limit: '10kb'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// Prevent parameter pollution
app.use(hpp());

// Compress responses
app.use(compression());

// 2. ROUTES
app.get('/', (req, res) => res.send('API is running...'));
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/daily-reports', dailyReportRoutes);
app.use('/api/material-deliveries', materialDeliveryRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/site-instructions', siteInstructionRoutes);
app.use('/api/users', userRouter);

// 3. ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);



export default app;
