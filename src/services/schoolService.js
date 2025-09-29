import { pool } from '../config/database.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { AppError } from '../middleware/errorMiddleware.js';
import schoolQueries from '../database/queries/schoolQueries.js';

class SchoolService {
  // Create new school
  async createSchool(schoolData) {
    const { name, address, phone, email, website, principalName, schoolType, gradeLevels, capacity } = schoolData;

    // Check if school name already exists
    const existingSchool = await pool.query(schoolQueries.checkSchoolNameExists, [name, null]);
    if (existingSchool.rows.length > 0) {
      throw new AppError('School name already exists', HTTP_STATUS.CONFLICT);
    }

    const result = await pool.query(schoolQueries.createSchool, [
      name, address, phone, email, website, principalName, schoolType, gradeLevels, capacity
    ]);

    return result.rows[0];
  }

  // Get all schools with filters and pagination
  async getAllSchools(filters, pagination) {
    const { search, schoolType } = filters;
    const { page, limit } = pagination;

    const params = [
      search || null,
      schoolType || null,
      limit,
      (page - 1) * limit
    ];

    const [schoolsResult, countResult] = await Promise.all([
      pool.query(schoolQueries.getAllSchools, params),
      pool.query(schoolQueries.getSchoolsCount, [search || null, schoolType || null])
    ]);

    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      schools: schoolsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Get school by ID
  async getSchoolById(id) {
    const result = await pool.query(schoolQueries.getSchoolById, [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('School not found', HTTP_STATUS.NOT_FOUND);
    }

    return result.rows[0];
  }

  // Update school
  async updateSchool(id, schoolData) {
    const { name, address, phone, email, website, principalName, schoolType, gradeLevels, capacity } = schoolData;

    // Check if school exists
    const existingSchool = await pool.query(schoolQueries.getSchoolById, [id]);
    if (existingSchool.rows.length === 0) {
      throw new AppError('School not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if name is taken by another school
    if (name && name !== existingSchool.rows[0].name) {
      const nameCheck = await pool.query(schoolQueries.checkSchoolNameExists, [name, id]);
      if (nameCheck.rows.length > 0) {
        throw new AppError('School name already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const result = await pool.query(schoolQueries.updateSchool, [
      name || existingSchool.rows[0].name,
      address || existingSchool.rows[0].address,
      phone || existingSchool.rows[0].phone,
      email || existingSchool.rows[0].email,
      website || existingSchool.rows[0].website,
      principalName || existingSchool.rows[0].principal_name,
      schoolType || existingSchool.rows[0].school_type,
      gradeLevels || existingSchool.rows[0].grade_levels,
      capacity || existingSchool.rows[0].capacity,
      id
    ]);

    return result.rows[0];
  }

  // Delete school (soft delete)
  async deleteSchool(id) {
    const existingSchool = await pool.query(schoolQueries.getSchoolById, [id]);
    if (existingSchool.rows.length === 0) {
      throw new AppError('School not found', HTTP_STATUS.NOT_FOUND);
    }

    await pool.query(schoolQueries.deleteSchool, [id]);
  }

  // Get schools with student counts
  async getSchoolsWithStudentCounts() {
    const result = await pool.query(schoolQueries.getSchoolWithStudentCount);
    return result.rows;
  }

  // Get students by school
  async getStudentsBySchool(schoolId, pagination) {
    const { page, limit } = pagination;

    // Verify school exists
    await this.getSchoolById(schoolId);

    const result = await pool.query(schoolQueries.getStudentsBySchool, [
      schoolId,
      limit,
      (page - 1) * limit
    ]);

    return result.rows;
  }
}

export default new SchoolService();