const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let pool;
let isMock = false;

// Mock database storage in memory
const mockDb = {
  users: [
    // Pre-seeded credentials for quick preview checks
    // Password is hashed 'password'
    { id: 1, name: 'Nisha Sharma', email: 'student@internhub.com', password: '$2b$10$oTef4eoeeRgXQ2C6SCvX0.GLVKdYF6irP7b9WRy/4gtppVY0EpHK.', role: 'student', created_at: new Date() },
    { id: 2, name: 'Rachel Green', email: 'recruiter@internhub.com', password: '$2b$10$oTef4eoeeRgXQ2C6SCvX0.GLVKdYF6irP7b9WRy/4gtppVY0EpHK.', role: 'recruiter', created_at: new Date() },
    { id: 3, name: 'System Admin', email: 'admin@internhub.com', password: '$2b$10$oTef4eoeeRgXQ2C6SCvX0.GLVKdYF6irP7b9WRy/4gtppVY0EpHK.', role: 'admin', created_at: new Date() }
  ],
  companies: [
    { id: 1, company_name: 'Linear', description: 'Building the future of software project tracking.', website: 'https://linear.app', location: 'Remote' },
    { id: 2, company_name: 'Stripe', description: 'Global financial infrastructure for internet payments.', website: 'https://stripe.com', location: 'San Francisco, CA' },
    { id: 3, company_name: 'Vercel', description: 'Edge networks and deployment hosting engines.', website: 'https://vercel.com', location: 'Remote' },
    { id: 4, company_name: 'Notion', description: 'Modular connected workspaces for documents.', website: 'https://notion.so', location: 'New York, NY' }
  ],
  internships: [
    { id: 1, title: 'Frontend Engineer (React)', description: 'Join the team building the future of software tracking. Work on glassmorphic UI features.', stipend: '$7,500/mo', duration: '6 Months', company_id: 1, created_at: new Date() },
    { id: 2, title: 'Payment Pipeline Engineer', description: 'Help us scale global currency endpoints. Work on robust APIs, transactional reliability.', stipend: '$8,200/mo', duration: '3 Months', company_id: 2, created_at: new Date() },
    { id: 3, title: 'Developer Experience Specialist', description: 'Help us build Next-generation tooling. Focus on Edge functions and dev server metrics.', stipend: '$6,800/mo', duration: '6 Months', company_id: 3, created_at: new Date() }
  ],
  applications: [
    { id: 1, student_id: 1, internship_id: 1, status: 'Interviewing', applied_at: new Date() },
    { id: 2, student_id: 1, internship_id: 3, status: 'Applied', applied_at: new Date() }
  ]
};

// Check if database URL is configured
if (process.env.DATABASE_URL || (process.env.DB_USER && process.env.DB_PASSWORD)) {
  try {
    const config = process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT || 5432,
        };
    pool = new Pool(config);
    console.log('⚡ PostgreSQL pool configured.');
  } catch (err) {
    console.error('❌ Failed to construct pg Pool. Using Mock fallback.', err);
    isMock = true;
  }
} else {
  console.warn('⚠️ No database connection variables found. Initializing mock DB engine.');
  isMock = true;
}

// Query Execution routing
const query = async (text, params = []) => {
  if (isMock) {
    return runMockQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ Database query error. Executing in-memory fallback:', err.message);
    return runMockQuery(text, params);
  }
};

// Simple Mock SQL parser to execute common operations
function runMockQuery(sql, params) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  
  // 1. SELECT User by Email
  if (cleanSql.includes('SELECT * FROM users WHERE email =')) {
    const email = params[0];
    const user = mockDb.users.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }

  // 2. SELECT User by ID
  if (cleanSql.includes('SELECT * FROM users WHERE id =')) {
    const id = parseInt(params[0]);
    const user = mockDb.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // 3. INSERT User
  if (cleanSql.includes('INSERT INTO users')) {
    const name = params[0];
    const email = params[1];
    const password = params[2];
    const role = params[3] || 'student';
    
    // Check duplication
    if (mockDb.users.some(u => u.email === email)) {
      throw new Error('Email is already registered.');
    }
    
    const newUser = { id: mockDb.users.length + 1, name, email, password, role, created_at: new Date() };
    mockDb.users.push(newUser);
    return { rows: [newUser] };
  }

  // 4. SELECT Internships with Company details
  if (cleanSql.includes('SELECT i.*, c.company_name') || cleanSql.includes('SELECT* FROM internships')) {
    const rows = mockDb.internships.map(intern => {
      const comp = mockDb.companies.find(c => c.id === intern.company_id) || {};
      return {
        ...intern,
        company_name: comp.company_name || 'InternHub Partner',
        location: comp.location || 'Remote'
      };
    });
    return { rows };
  }

  // 5. INSERT Internship
  if (cleanSql.includes('INSERT INTO internships')) {
    const title = params[0];
    const description = params[1];
    const stipend = params[2];
    const duration = params[3];
    const company_id = parseInt(params[4]) || 1;
    
    const newIntern = {
      id: mockDb.internships.length + 1,
      title,
      description,
      stipend,
      duration,
      company_id,
      created_at: new Date()
    };
    mockDb.internships.push(newIntern);
    return { rows: [newIntern] };
  }

  // 6. DELETE Internship
  if (cleanSql.includes('DELETE FROM internships WHERE id =')) {
    const id = parseInt(params[0]);
    mockDb.internships = mockDb.internships.filter(i => i.id !== id);
    return { rowCount: 1 };
  }

  // 7. SELECT Applications (with details)
  if (cleanSql.includes('SELECT a.*, i.title')) {
    const rows = mockDb.applications.map(app => {
      const job = mockDb.internships.find(i => i.id === app.internship_id) || {};
      const comp = mockDb.companies.find(c => c.id === job.company_id) || {};
      const student = mockDb.users.find(u => u.id === app.student_id) || {};
      return {
        ...app,
        title: job.title || 'Software Intern',
        stipend: job.stipend || '$5,000/mo',
        company_name: comp.company_name || 'Partner',
        student_name: student.name || 'Anonymous'
      };
    });
    return { rows };
  }

  // 8. INSERT Application
  if (cleanSql.includes('INSERT INTO applications')) {
    const student_id = parseInt(params[0]);
    const internship_id = parseInt(params[1]);
    const status = params[2] || 'Applied';
    
    // Prevent duplicate
    if (mockDb.applications.some(a => a.student_id === student_id && a.internship_id === internship_id)) {
      throw new Error('Already applied to this job.');
    }
    
    const newApp = {
      id: mockDb.applications.length + 1,
      student_id,
      internship_id,
      status,
      applied_at: new Date()
    };
    mockDb.applications.push(newApp);
    return { rows: [newApp] };
  }

  // 9. UPDATE Application Status
  if (cleanSql.includes('UPDATE applications SET status =')) {
    const status = params[0];
    const id = parseInt(params[1]);
    let updatedApp = null;
    mockDb.applications = mockDb.applications.map(a => {
      if (a.id === id) {
        updatedApp = { ...a, status };
        return updatedApp;
      }
      return a;
    });
    return { rows: updatedApp ? [updatedApp] : [] };
  }

  // 10. SELECT Users list (for Admin)
  if (cleanSql.includes('SELECT id, name, email, role')) {
    return { rows: mockDb.users };
  }

  // Default fallback
  return { rows: [] };
}

module.exports = {
  query
};
