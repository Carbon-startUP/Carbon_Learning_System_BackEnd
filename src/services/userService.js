import argon2 from 'argon2';
import crypto from 'crypto';
import { pool, redis } from '../config/database.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { AppError } from '../middleware/errorMiddleware.js';
import userqueries from '../database/queries/userQueries.js';

class UserService {
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
    await pool.query(userqueries.sessionQueries.createSession, [userId, sessionToken, expiresAt]);

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
      const userResult = await pool.query(userqueries.userTypeQueries.getUserWithType, [sessionData.userId]);
  
      if (userResult.rows.length === 0) {
        await this.destroySession(sessionToken);
        return null;
      }

      await pool.query(userqueries.sessionQueries.updateLastAccessed, [sessionToken]);
  
      return userResult.rows[0];
    }

    return null;
  }

  // Destroy session
  async destroySession(sessionToken) {
    // Remove from Redis
    await redis.del(`session:${sessionToken}`);

    await pool.query(userqueries.sessionQueries.deleteSession, [sessionToken]);
  }

  // Destroy all user sessions
  async destroyAllUserSessions(userId) {
    // Get all session tokens for user
    const sessions = await pool.query(userqueries.sessionQueries.getUserSessions, [userId]);

    // Remove from Redis
    for (const session of sessions.rows) {
      await redis.del(`session:${session.session_token}`);
    }

    // Remove from database
    for (const session of sessions.rows) {
      await pool.query(userqueries.sessionQueries.deleteSession, [session.session_token]);
    }
  }

  // Login user
  async login(username, password) {
    // Get user
    const userResult = await pool.query(userqueries.userTypeQueries.getUserWithTypeByUsername, [username]);

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
   const existingUser = await pool.query(userqueries.authSecurityQueries.checkUserExists, [username]);

    if (existingUser.rows.length > 0) {
      throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
    }

    // Get user type ID
    const userTypeResult = await pool.query(userqueries.userTypeQueries.getUserTypeById, [userType]);

    if (userTypeResult.rows.length === 0) {
      throw new AppError('Invalid user type', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await pool.query(userqueries.userQueries.createUser, [username, passwordHash, firstName, lastName, phone, userTypeResult.rows[0].id, createdBy]);

    return result.rows[0];
  }
  
  async getUserById(id) {
    const result = await pool.query(userqueries.userQueries.getUserById, [id]);
    return result.rows[0];
  }

  // Get all users with filters
  async getAllUsers(filters, pagination) {
    const { search, userType, isActive, createdFrom } = filters;
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = pagination;

    let query, countQuery, params;

    if (search || userType !== undefined || isActive !== undefined || createdFrom) {
      // Use filtered query
      query = userqueries.userQueries.getAllUsersWithFilters;
      countQuery = userqueries.userQueries.getUsersCountWithFilters;
      params = [
        search || null,
        userType || null,
        isActive !== undefined ? isActive : null,
        createdFrom || null,
        sortBy,
        sortOrder,
        limit,
        (page - 1) * limit
      ];
    } else {
      // Use simple query
      query = userqueries.userQueries.getAllUsers;
      countQuery = userqueries.userQueries.getUsersCount;
      params = [limit, (page - 1) * limit];
    }

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search || userType !== undefined || isActive !== undefined || createdFrom ? 
        [search || null, userType || null, isActive !== undefined ? isActive : null, createdFrom || null] : 
        [])
    ]);

    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      users: usersResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Update user
  // eslint-disable-next-line no-unused-vars
  async updateUser(id, userData, updatedBy) {
    const { username, firstName, lastName, phone, userType } = userData;

    // Check if user exists
    const existingUser = await pool.query(userqueries.userQueries.getUserById, [id]);
    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.rows[0].username) {
      const usernameCheck = await pool.query(userqueries.authSecurityQueries.checkUserExists, [username]);
      if (usernameCheck.rows.length > 0 && usernameCheck.rows[0].id !== id) {
        throw new AppError('Username already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Get user type ID if provided
    let userTypeId = existingUser.rows[0].user_type_id;
    if (userType) {
      const userTypeResult = await pool.query(userqueries.userTypeQueries.getUserTypeById, [userType]);
      if (userTypeResult.rows.length === 0) {
        throw new AppError('Invalid user type', HTTP_STATUS.BAD_REQUEST);
      }
      userTypeId = userTypeResult.rows[0].id;
    }

    await pool.query(userqueries.userQueries.updateUser, [
      username || existingUser.rows[0].username,
      firstName || existingUser.rows[0].first_name,
      lastName || existingUser.rows[0].last_name,
      phone || existingUser.rows[0].phone,
      userTypeId,
      id
    ]);

    return await this.getUserById(id);
  }

  // Delete user (soft delete)
  // eslint-disable-next-line no-unused-vars
  async deleteUser(id, deletedBy) {
    const existingUser = await pool.query(userqueries.userQueries.getUserById, [id]);
    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    await pool.query(userqueries.userQueries.deleteUser, [id]);
    
    // Destroy all sessions for the deleted user
    await this.destroyAllUserSessions(id);
  }

  // Create bulk users from CSV data
  async createBulkUsers(usersData, createdBy) {
    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < usersData.length; i++) {
      try {
        const userData = usersData[i];
        
        // Validate required fields
        if (!userData.username || !userData.password || !userData.firstName || !userData.lastName || !userData.userType) {
          results.errors.push({
            row: i + 1,
            data: userData,
            error: 'Missing required fields (username, password, firstName, lastName, userType)'
          });
          continue;
        }

        const newUser = await this.createUser(userData, createdBy);
        results.success.push({
          row: i + 1,
          user: newUser
        });
      } catch (error) {
        results.errors.push({
          row: i + 1,
          data: usersData[i],
          error: error.message
        });
      }
    }

    return results;
  }

  // Delete bulk users
  async deleteBulkUsers(userIds, deletedBy) {
    const results = {
      success: [],
      errors: []
    };

    for (const userId of userIds) {
      try {
        await this.deleteUser(userId, deletedBy);
        results.success.push({
          id: userId,
          message: 'User deleted successfully'
        });
      } catch (error) {
        results.errors.push({
          id: userId,
          error: error.message
        });
      }
    }

    return results;
  }

  // Update user profile (for self-update)
  async updateUserProfile(userId, profileData) {
    const { firstName, lastName, phone } = profileData;
    
    const existingUser = await pool.query(userqueries.userQueries.getUserById, [userId]);
    if (existingUser.rows.length === 0) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    await pool.query(userqueries.userQueries.updateUser, [
      existingUser.rows[0].username, // Keep same username
      firstName || existingUser.rows[0].first_name,
      lastName || existingUser.rows[0].last_name,
      phone || existingUser.rows[0].phone,
      existingUser.rows[0].user_type_id, // Keep same user type
      userId
    ]);

    return await this.getUserById(userId);
  }

  // Get all user types
  // GET /api/user-types
  async getUserTypes() {
    const result = await pool.query(userqueries.userTypeQueries.getUserTypes);
    return result.rows;
  }

  // Clean expired sessions (run periodically)
  async cleanExpiredSessions() {
    const expiredSessions = await pool.query(userqueries.sessionQueries.cleanExpiredSessions);

    for (const session of expiredSessions.rows) {
      await redis.del(`session:${session.session_token}`);
    }

    await pool.query(userqueries.sessionQueries.cleanExpiredSessions);
  }
}

export default new UserService();