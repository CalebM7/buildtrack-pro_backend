import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';

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
  origin: process.env.CLIENT_URI,
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
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Compress responses
app.use(compression());

// 2. ROUTES
// Define your routes here
// e.g., app.use('/api/v1/users', userRoutes);  
app.get('/', (req, res) => res.send('API is running...'));


// app.use('/api/v1/users', userRouter);

// 3. ERROR HANDLING MIDDLEWARE (will be added later)
// app.use(globalErrorHandler);

export default app;

