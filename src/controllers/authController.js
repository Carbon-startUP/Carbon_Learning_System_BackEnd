import { asyncHandler } from '../middleware/errorMiddleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import userService from '../services/userService.js';

class AuthController {
  // POST /api/auth/login
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const result = await userService.login(username, password);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        sessionToken: result.sessionToken
      }
    });
  });

  // POST /api/auth/logout
  logout = asyncHandler(async (req, res) => {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.headers['x-session-token'] ||
                        req.cookies?.sessionToken;

    if (sessionToken) {
      await userService.destroySession(sessionToken);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout successful'
    });
  });

  // GET /api/auth/me
  getProfile = asyncHandler(async (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          phone: req.user.phone,
          userType: req.user.user_type_name,
          permissions: req.user.permissions,
          lastLogin: req.user.last_login,
          createdAt: req.user.created_at
        }
      }
    });
  });

  // PATCH /api/auth/profile
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profileData = req.body;

    const updatedUser = await userService.updateUserProfile(userId, profileData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  });

  //TODO: implement change password service
  // POST /api/auth/change-password
  // changePassword = asyncHandler(async (req, res) => {
  //   const userId = req.user.id;
  //   const { currentPassword, newPassword } = req.body;
  //   await userService.changePassword(userId, currentPassword, newPassword);
  //   res.status(HTTP_STATUS.OK).json({
  //     success: true,
  //     message: 'Password changed successfully'
  //   });
  // });

  // POST /api/auth/users - Admin only
  createUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    const createdBy = req.user.id;

    const newUser = await userService.createUser(userData, createdBy);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser
      }
    });
  });

  // GET /api/users - Admin only
  getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', search, userType, isActive, createdFrom } = req.query;

    const filters = {
      search: search || null,
      userType: userType ? parseInt(userType) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      createdFrom: createdFrom || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await userService.getAllUsers(filters, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // GET /api/users/:id - Admin only
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user
      }
    });
  });

  // PATCH /api/users/:id - Admin only
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userData = req.body;
    const updatedBy = req.user.id;

    const updatedUser = await userService.updateUser(id, userData, updatedBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });
  });

  // DELETE /api/users/:id - Admin only
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedBy = req.user.id;

    await userService.deleteUser(id, deletedBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  // GET /api/auth/user-types - Admin only
  getUserTypes = asyncHandler(async (req, res) => {
    const userTypes = await userService.getUserTypes();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        userTypes
      }
    });
  });

  // POST /api/users/bulk - Admin only
  createBulkUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;
    const createdBy = req.user.id;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Users array is required and cannot be empty'
      });
    }

    const result = await userService.createBulkUsers(users, createdBy);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: `Successfully created ${result.success.length} users`,
      data: {
        success: result.success,
        errors: result.errors,
        summary: {
          total: users.length,
          successful: result.success.length,
          failed: result.errors.length
        }
      }
    });
  });

  // DELETE /api/users/bulk - Admin only
  deleteBulkUsers = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const deletedBy = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User IDs array is required and cannot be empty'
      });
    }

    const result = await userService.deleteBulkUsers(ids, deletedBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Successfully deleted ${result.success.length} users`,
      data: {
        success: result.success,
        errors: result.errors,
        summary: {
          total: ids.length,
          successful: result.success.length,
          failed: result.errors.length
        }
      }
    });
  });
}

export default new AuthController();
