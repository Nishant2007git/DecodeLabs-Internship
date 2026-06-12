const db = require('../models/db');

// 1. GET /internships
const getAllInternships = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT i.*, c.company_name, c.location, c.website FROM internships i LEFT JOIN companies c ON i.company_id = c.id ORDER BY i.created_at DESC'
    );
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Fetch internships error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve internship listings.'
    });
  }
};

// 2. GET /internships/:id
const getInternshipById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await db.query(
      'SELECT i.*, c.company_name, c.location, c.website, c.description AS company_desc FROM internships i LEFT JOIN companies c ON i.company_id = c.id WHERE i.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.'
      });
    }
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Fetch internship details error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve internship details.'
    });
  }
};

// 3. POST /internships
const createInternship = async (req, res) => {
  const { title, description, stipend, duration, company_id } = req.body;

  // Validation
  if (!title || !description || !stipend || !duration) {
    return res.status(400).json({
      success: false,
      message: 'All fields (title, description, stipend, duration) are required.'
    });
  }

  // Check role: recruiter or admin only
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized. Only recruiters or admins can create internships.'
    });
  }

  try {
    // Default company_id to 1 if none provided for convenience
    const compId = company_id || 1;
    const result = await db.query(
      'INSERT INTO internships (title, description, stipend, duration, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, stipend, duration, compId]
    );
    return res.status(201).json({
      success: true,
      message: 'Internship created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Create internship error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create internship listing.'
    });
  }
};

// 4. PUT /internships/:id
const updateInternship = async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, stipend, duration } = req.body;

  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized. Only recruiters or admins can edit internships.'
    });
  }

  try {
    const result = await db.query(
      'UPDATE internships SET title = COALESCE($1, title), description = COALESCE($2, description), stipend = COALESCE($3, stipend), duration = COALESCE($4, duration) WHERE id = $5 RETURNING *',
      [title, description, stipend, duration, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found to update.'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Internship updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update internship error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update internship details.'
    });
  }
};

// 5. DELETE /internships/:id
const deleteInternship = async (req, res) => {
  const id = parseInt(req.params.id);

  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized. Only recruiters or admins can remove internships.'
    });
  }

  try {
    const result = await db.query('DELETE FROM internships WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: 'Internship listing removed successfully.'
    });
  } catch (err) {
    console.error('Delete internship error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove internship listing.'
    });
  }
};

module.exports = {
  getAllInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  deleteInternship
};
