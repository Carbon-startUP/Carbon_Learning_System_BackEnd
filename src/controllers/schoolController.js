import { asyncHandler } from '../middleware/errorMiddleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import schoolService from '../services/schoolService.js';

class SchoolController {
  // POST /api/schools
  createSchool = asyncHandler(async (req, res) => {
    const schoolData = req.body;

    const newSchool = await schoolService.createSchool(schoolData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'School created successfully',
      data: {
        school: newSchool
      }
    });
  });

  // GET /api/schools
  getAllSchools = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, schoolType } = req.query;

    const filters = {
      search: search || null,
      schoolType: schoolType || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await schoolService.getAllSchools(filters, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // GET /api/schools/:id
  getSchoolById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const school = await schoolService.getSchoolById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        school
      }
    });
  });

  // PATCH /api/schools/:id
  updateSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const schoolData = req.body;

    const updatedSchool = await schoolService.updateSchool(id, schoolData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'School updated successfully',
      data: {
        school: updatedSchool
      }
    });
  });

  // DELETE /api/schools/:id
  deleteSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await schoolService.deleteSchool(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'School deleted successfully'
    });
  });

  // GET /api/schools/stats/with-counts
  getSchoolsWithStudentCounts = asyncHandler(async (req, res) => {
    const schools = await schoolService.getSchoolsWithStudentCounts();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        schools
      }
    });
  });

  // GET /api/schools/:id/students
  getStudentsBySchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const students = await schoolService.getStudentsBySchool(id, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        students,
        pagination
      }
    });
  });
}

export default new SchoolController();