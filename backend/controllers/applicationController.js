const db = require('../models/db');

// 1. POST /applications (Student Apply)
const createApplication = async (req, res) => {
  const { internship_id } = req.body;
  const student_id = req.user.id;

  if (!internship_id) {
    return res.status(400).json({
      success: false,
      message: 'Internship ID is required to apply.'
    });
  }

  // Ensure user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can apply for internships.'
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO applications (student_id, internship_id, status) VALUES ($1, $2, $3) RETURNING *',
      [student_id, internship_id, 'Applied']
    );
    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Submit application error:', err);
    if (err.message.includes('Already applied')) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this internship.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application.'
    });
  }
};

// 2. GET /applications (List Applications)
const getApplications = async (req, res) => {
  const { role, id } = req.user;
  try {
    let result;
    if (role === 'student') {
      // Students only see their own applications
      result = await db.query(
        'SELECT a.*, i.title, i.stipend, i.duration, c.company_name, c.location FROM applications a JOIN internships i ON a.internship_id = i.id JOIN companies c ON i.company_id = c.id WHERE a.student_id = $1 ORDER BY a.applied_at DESC',
        [id]
      );
    } else {
      // Recruiters and admins see all applications
      result = await db.query(
        'SELECT a.*, i.title, i.stipend, c.company_name, u.name AS student_name, u.email AS student_email FROM applications a JOIN internships i ON a.internship_id = i.id JOIN companies c ON i.company_id = c.id JOIN users u ON a.student_id = u.id ORDER BY a.applied_at DESC'
      );
    }
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Fetch applications error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications.'
    });
  }
};

// 3. PUT /applications/:id (Update status)
const updateApplicationStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Pipeline status is required to update.'
    });
  }

  // Vetting validation check: recruiters or admins only
  if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized. Only recruiters or administrators can change pipeline stages.'
    });
  }

  try {
    const result = await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found to update.'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Application pipeline stage updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status.'
    });
  }
};

// 4. DELETE /applications/:id (Cancel application)
const deleteApplication = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Check if application exists
    const appQuery = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (appQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    const application = appQuery.rows[0];

    // Ensure student deletes their own, or admin deletes
    if (req.user.role === 'student' && application.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only withdraw your own applications.'
      });
    }

    await db.query('DELETE FROM applications WHERE id = $1', [id]);
    return res.status(200).json({
      success: true,
      message: 'Application successfully withdrawn.'
    });
  } catch (err) {
    console.error('Cancel application error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to withdraw application.'
    });
  }
};

module.exports = {
  createApplication,
  getApplications,
  updateApplicationStatus,
  deleteApplication
};
