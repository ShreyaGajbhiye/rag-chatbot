import session from 'express-session';
import { azureConfig } from '../config/azure.js';

export const sessionMiddleware = session({
  secret: azureConfig.session.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax' // Allow cross-site requests for localhost development
  }
});

// Session tracking middleware
export const sessionTracker = (req, res, next) => {
  const sessionId = req.sessionID;
  const isNewSession = req.session.isNew;
  
  if (isNewSession) {
    console.log(`🔐 New session created: ${sessionId}`);
  } else {
    console.log(`🔄 Existing session: ${sessionId}`);
  }
  
  next();
};
