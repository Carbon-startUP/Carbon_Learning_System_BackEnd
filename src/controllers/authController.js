import { asyncHandler } from '../middleware/errorMiddleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import authService from '../services/authService.js';

class AuthController {
  // POST /api/auth/login
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const result = await authService.login(username, password);

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
      await authService.destroySession(sessionToken);
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

    const updatedUser = await authService.updateUserProfile(userId, profileData);

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
  //   await authService.changePassword(userId, currentPassword, newPassword);
  //   res.status(HTTP_STATUS.OK).json({
  //     success: true,
  //     message: 'Password changed successfully'
  //   });
  // });

  // POST /api/auth/users - Admin only
  createUser = asyncHandler(async (req, res) => {
    const userData = req.body;
    const createdBy = req.user.id;

    const newUser = await authService.createUser(userData, createdBy);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser
      }
    });
  });

  // GET /api/auth/users - Admin only
  getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder, search, userType, isActive, createdFrom } = req.query;

    //TODO: implement filtering logic
    // eslint-disable-next-line no-unused-vars
    const filters = {
      search,
      userType,
      isActive,
      createdFrom
    };

    const pagination = {
      sortBy,
      sortOrder,
      limit,
      page 
    };

    const result = await authService.getAllUsers(pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // GET /api/auth/users/:id - Admin only
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await authService.getUserById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user
      }
    });
  });

  // PATCH /api/auth/users/:id - Admin only
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userData = req.body;
    const updatedBy = req.user.id;

    const updatedUser = await authService.updateUser(id, userData, updatedBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser
      }
    });
  });

  // DELETE /api/auth/users/:id - Admin only
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedBy = req.user.id;

    await authService.deleteUser(id, deletedBy);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  // GET /api/auth/user-types - Admin only
  getUserTypes = asyncHandler(async (req, res) => {
    const userTypes = await authService.getUserTypes();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        userTypes
      }
    });
  });

  // TODO: implement bulk user creation
  // POST /api/auth/users/bulk - Admin only
  // createBulkUsers = asyncHandler(async (req, res) => {
  //   const { users } = req.body;
  //   const createdBy = req.user.id;
  //   const result = await authService.createBulkUsers(users, createdBy);
  //   res.status(HTTP_STATUS.CREATED).json({
  //     success: true,
  //     message: `Successfully created ${result.success.length} users`,
  //     data: {
  //       success: result.success,
  //       errors: result.errors
  //     }
  //   });
  // });

  // TODO: implement bulk user deletion
  // DELETE /api/auth/users/bulk - Admin only
  // deleteBulkUsers = asyncHandler(async (req, res) => {
  //   const { ids } = req.body;
  //   const deletedBy = req.user.id;
  //   const result = await authService.deleteBulkUsers(ids, deletedBy);
  //   res.status(HTTP_STATUS.OK).json({
  //     success: true,
  //     message: `Successfully deleted ${result.success.length} users`,
  //     data: {
  //       success: result.success,
  //       errors: result.errors
  //     }
  //   });
  // });
}

export default new AuthController();
