import session from "express-session";
import connectPg from "connect-pg-simple";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 30 * 60 * 1000; // 30 minutes
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // Convert to seconds for pg-store
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    store: sessionStore,
    resave: true, // Force session save for deployment reliability
    saveUninitialized: true, // Ensure session initialization
    rolling: true, // Extend session on activity
    name: 'ayur.sid', // Custom session name for better tracking
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for Replit deployment compatibility
      sameSite: 'lax', // Important for cross-origin requests
      maxAge: sessionTtl,
      path: '/',
    },
  });
}

export function setupGoogleAuth(app: Express) {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (!user) {
          // Check if user exists with this email
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
          
          if (user) {
            // Link Google account to existing user
            await storage.linkGoogleAccount(user.id, profile.id);
          } else {
            // Create new user
            const newUser = {
              username: profile.emails?.[0]?.value || `google_${profile.id}`,
              email: profile.emails?.[0]?.value || null,
              full_name: profile.displayName || 'Google User',
              role: 'staff', // Default role for Google users
              is_active: true,
              google_id: profile.id,
              password: null // No password for OAuth users
            };
            user = await storage.createUserWithGoogle(newUser);
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Google auth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/');
    }
  );
}

export const requireAuth: RequestHandler = (req, res, next) => {
  // Debug session state for deployment troubleshooting
  console.log('Session check:', {
    sessionExists: !!req.session,
    userId: req.session?.userId,
    sessionID: req.sessionID,
    cookies: req.headers.cookie ? 'present' : 'missing'
  });
  
  // Check if session exists and has userId
  if (!req.session) {
    console.log('No session found - session middleware issue');
    return res.status(401).json({ message: "No session" });
  }
  
  if (!req.session.userId) {
    console.log('No userId in session - user not logged in');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Session is valid, proceed
  next();
};

export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!req.session?.userRole || !allowedRoles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
    userName: string;
  }
}