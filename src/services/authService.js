import argon2 from 'argon2';
import crypto from 'crypto';
import { pool, redis } from '../config/database.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { AppError } from '../middleware/errorMiddleware.js';
import authqueries from '../database/queries/authQueries.js';

class AuthService {
  // Generate session token
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password
  async hashPassword(password) {
    return await argon2.hash(password);
  }

  // Verify password
  async verifyPassword(hash, password) {
    return await argon2.verify(hash, password);
  }

  // Create session
  async createSession(userId) {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store in database
    await pool.query(authqueries.sessionQueries.createSession, [userId, sessionToken, expiresAt]);

    // Store in Redis with TTL
    const sessionData = {
      userId,
      expiresAt: expiresAt.toISOString()
    };
    
    await redis.setEx(`session:${sessionToken}`, 24 * 60 * 60, JSON.stringify(sessionData));
    
    return sessionToken;
  }

  // Validate session
  async validateSession(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    // Check Redis first (faster)
    const cachedSession = await redis.get(`session:${sessionToken}`);
    
    if (cachedSession) {
      const sessionData = JSON.parse(cachedSession);
      
      // Check if session expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        await this.destroySession(sessionToken);
        return null;
      }

      // Get user data
      const userResult = await pool.query(authqueries.userTypeQueries.getUserWithType, [sessionData.userId]);
  
      if (userResult.rows.length === 0) {
        await this.destroySession(sessionToken);
        return null;
      }

      await pool.query(authqueries.sessionQueries.updateLastAccessed, [sessionToken]);
  
      return userResult.rows[0];
    }

    return null;
  }

  // Destroy session
  async destroySession(sessionToken) {
    // Remove from Redis
    await redis.del(`session:${sessionToken}`);

    await pool.query(authqueries.sessionQueries.deleteSession, [sessionToken]);
  }

  // Destroy all user sessions
  async destroyAllUserSessions(userId) {
    // Get all session tokens for user
    const sessions = await pool.query(authqueries.sessionQueries.getUserSessions, [userId]);

    // Remove from Redis
    for (const session of sessions.rows) {
      await redis.del(`session:${session.session_token}`);
    }

    // Remove from database
    for (const session of sessions.rows) {
      await pool.query(authqueries.sessionQueries.deleteSession, [session.session_token]);
    }
  }

  // Login user
  async login(username, password) {
    // Get user
    const userResult = await pool.query(authqueries.userTypeQueries.getUserWithTypeByUsername, [username]);

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await this.verifyPassword(user.password_hash, password);
    
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Create session
    const sessionToken = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type_name,
        permissions: user.permissions
      },
      sessionToken
    };
  }

  // Create user (admin only)
  async createUser(userData, createdBy) {
    const { username, password, firstName, lastName, phone, userType } = userData;

    // Check if username already exists
   const existingUser = await pool.query(authqueries.authSecurityQueries.checkUserExists, [username]);

    if (existingUser.rows.length > 0) {
      throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
    }

    // Get user type ID
    const userTypeResult = await pool.query(authqueries.userTypeQueries.getUserTypeById, [userType]);

    if (userTypeResult.rows.length === 0) {
      throw new AppError('Invalid user type', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await pool.query(authqueries.userQueries.createUser, [username, passwordHash, firstName, lastName, phone, userTypeResult.rows[0].id, createdBy]);

    return result.rows[0];
  }
  
  async getUserById(id) {
    const result = await pool.query(authqueries.userQueries.getUserById, [id]);
    return result.rows[0];
  }

  // Get all users
  async getAllUsers(pagination) {
    const result = await pool.query(authqueries.userQueries.getAllUsers, [pagination.limit, (pagination.page - 1) * pagination.limit]);
    return result.rows;
  }

  // Get all user types
  // GET /api/user-types
  async getUserTypes() {
    const result = await pool.query(authqueries.userTypeQueries.getUserTypes);
    return result.rows;
  }

  // Clean expired sessions (run periodically)
  async cleanExpiredSessions() {
    const expiredSessions = await pool.query(authqueries.sessionQueries.cleanExpiredSessions);

    for (const session of expiredSessions.rows) {
      await redis.del(`session:${session.session_token}`);
    }

    await pool.query(authqueries.sessionQueries.cleanExpiredSessions);
  }
}

export default new AuthService();