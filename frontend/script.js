// InternHub Client Application Script

// Global state variables
let currentUser = null;
let currentToken = null;
let activeTab = '';
let activeChatChannel = 'Linear Recruitment';
let globalJobsList = [];
let globalApplicationsList = [];

// Mock Alerts list
let notifications = [
  { id: 1, text: 'Linear scheduled your interview for tomorrow at 2:00 PM.', date: 'Just now', unread: true },
  { id: 2, text: 'Your application to Vercel has been received.', date: '2 days ago', unread: false },
  { id: 3, text: 'Notion extended an internship offer!', date: '5 days ago', unread: false }
];

// Initialise Dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Check if we are on dashboard page
  if (window.location.pathname.includes('dashboard.html')) {
    checkAuthentication();
    initDashboard();
  }
});

// Authentication Vetting
function checkAuthentication() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    console.warn('Access denied. Redirecting to login.');
    window.location.href = '/login.html';
    return;
  }

  currentToken = token;
  currentUser = JSON.parse(user);

  // Update profile details
  document.getElementById('user-name').innerText = currentUser.name;
  document.getElementById('user-role-label').innerText = currentUser.role.toUpperCase() + ' Space';
  document.getElementById('user-avatar').innerText = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Initialise workspaces depending on roles
function initDashboard() {
  renderSidebarNav();
  updateAlertsDot();

  // Set default workspace tabs
  if (currentUser.role === 'student') {
    switchTab('student_dashboard');
  } else if (currentUser.role === 'recruiter') {
    switchTab('recruiter_dashboard');
  } else if (currentUser.role === 'admin') {
    switchTab('admin_dashboard');
  }

  // Pre-fill role select bypass
  document.getElementById('role-bypass-select').value = currentUser.role;

  // Load backend database content
  loadDatabaseContent();
  updateResumePreview();
}

// Render dynamic sidebar items
function renderSidebarNav() {
  const navContainer = document.getElementById('sidebar-nav');
  navContainer.innerHTML = '';

  let links = [];
  if (currentUser.role === 'student') {
    links = [
      { id: 'student_dashboard', label: '📊 Dashboard' },
      { id: 'student_marketplace', label: '💼 Marketplace' },
      { id: 'student_kanban', label: '🗂 Pipeline Kanban' },
      { id: 'student_resume', label: '📝 Resume Builder' },
      { id: 'student_messaging', label: '✉ Messenger' },
      { id: 'student_settings', label: '⚙ Settings' }
    ];
  } else if (currentUser.role === 'recruiter') {
    links = [
      { id: 'recruiter_dashboard', label: '📊 Overview' },
      { id: 'recruiter_postjob', label: '➕ Post Internship' },
      { id: 'recruiter_candidates', label: '👥 Candidates Pipeline' },
      { id: 'recruiter_messaging', label: '✉ Messenger' },
      { id: 'recruiter_settings', label: '⚙ Settings' }
    ];
  } else if (currentUser.role === 'admin') {
    links = [
      { id: 'admin_dashboard', label: '📊 System Metrics' },
      { id: 'admin_moderation', label: '🗃 Moderation Queue' }
    ];
  }

  links.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `sidebar-btn ${activeTab === item.id ? 'active' : ''}`;
    btn.id = `nav-${item.id}`;
    btn.innerText = item.label;
    btn.onclick = () => switchTab(item.id);
    navContainer.appendChild(btn);
  });
}

// Switch view sections
function switchTab(tabId) {
  activeTab = tabId;
  renderSidebarNav();

  const contextTitles = {
    student_dashboard: 'Dashboard',
    student_marketplace: 'Marketplace',
    student_detail: 'Internship details',
    student_kanban: 'Application pipeline',
    student_resume: 'Resume builder',
    student_messaging: 'Messenger',
    student_settings: 'Settings',
    recruiter_dashboard: 'Recruiter overview',
    recruiter_postjob: 'Post internship',
    recruiter_candidates: 'Candidate pipeline',
    recruiter_messaging: 'Messenger',
    recruiter_settings: 'Settings',
    admin_dashboard: 'System metrics',
    admin_moderation: 'Moderation queue'
  };
  const contextTitle = document.getElementById('workspace-context-title');
  const contextLabel = document.getElementById('workspace-context-label');
  if (contextTitle) contextTitle.innerText = contextTitles[tabId] || 'Workspace';
  if (contextLabel && currentUser) {
    contextLabel.innerText = `${currentUser.role.charAt(0).toUpperCase()}${currentUser.role.slice(1)} workspace`;
  }

  // Hide all sections
  document.querySelectorAll('.workspace-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // Show selected section
  const targetId = tabId.replace('_', '-').replace('recruiter-messaging', 'student-messaging');
  const targetSec = document.getElementById(`${targetId}-section`);
  if (targetSec) {
    targetSec.style.display = 'block';
  }

  // Hook details triggers
  if (tabId === 'student_kanban') {
    renderKanban();
  }

  // Auto-close mobile navigation drawer on select
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('sidebar-open')) {
    toggleMobileSidebar();
  }
}

// Fetch database records from Node backend
async function loadDatabaseContent() {
  try {
    // 1. Fetch internships
    const jobsRes = await fetch('/api/internships');
    const jobsData = await jobsRes.json();
    if (jobsData.success) {
      globalJobsList = jobsData.data;
      renderMarketplace();
      renderRecruiterOverview();
      renderAdminOverview();
    }

    // 2. Fetch applications
    const appsRes = await fetch('/api/applications', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const appsData = await appsRes.json();
    if (appsData.success) {
      globalApplicationsList = appsData.data;
      renderStudentOverview();
      renderRecruiterOverview();
      renderKanban();
    }
  } catch (err) {
    console.error('Fetch database sync failed:', err);
  }
}

// Render student overview widgets
function renderStudentOverview() {
  const tableBody = document.getElementById('student-dashboard-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const studentApps = globalApplicationsList;
  document.getElementById('student-apps-count').innerText = `${studentApps.length} Jobs`;

  if (studentApps.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No active applications. Browse the Marketplace!</td></tr>`;
    return;
  }

  studentApps.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold">${app.title}</td>
      <td>${app.company_name}</td>
      <td>${app.stipend}</td>
      <td><span class="badge badge-primary">${app.status}</span></td>
      <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="switchTab('student_kanban')">View board</button></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Render marketplace internship cards
function renderMarketplace() {
  const grid = document.getElementById('marketplace-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const query = document.getElementById('marketplace-search').value.toLowerCase();
  const filter = document.getElementById('marketplace-filter').value;

  const filtered = globalJobsList.filter(job => {
    const queryMatch = job.title.toLowerCase().includes(query) ||
                       job.company_name.toLowerCase().includes(query) ||
                       job.description.toLowerCase().includes(query);
    const filterMatch = filter === 'All' ? true :
                        filter === 'Remote' ? job.location === 'Remote' :
                        job.location !== 'Remote';
    return queryMatch && filterMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 3; text-align:center; padding: 40px; color:var(--text-muted)">No matching internships found.</div>`;
    return;
  }

  filtered.forEach(job => {
    const hasApplied = globalApplicationsList.some(app => app.internship_id === job.id);
    const card = document.createElement('div');
    card.className = 'glass-card animate-fade';
    card.innerHTML = `
      <div class="glass-header">
        <div>
          <h3 style="font-size:1.05rem;">${job.title}</h3>
          <p style="font-size:0.75rem; color:var(--text-secondary);">${job.company_name} | ${job.location}</p>
        </div>
      </div>
      <p style="font-size:0.8rem; color:var(--text-secondary); min-height: 50px; margin-bottom: 12px;">
        ${job.description.slice(0, 100)}...
      </p>
      <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:10px;">
        <span style="font-size:0.8rem; font-weight:700; color:var(--accent);">${job.stipend}</span>
        <div class="flex gap-2" style="display:flex; gap:8px;">
          <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem;" onclick="viewJobDetail(${job.id})">Details</button>
          <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" ${hasApplied ? 'disabled' : ''} onclick="quickApply(${job.id})">
            ${hasApplied ? 'Applied ✓' : 'Quick Apply'}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Display internship detail parameters
async function viewJobDetail(id) {
  try {
    const res = await fetch(`/api/internships/${id}`);
    const resData = await res.json();
    if (!resData.success) return;

    const job = resData.data;
    const detailCard = document.getElementById('detail-job-card');
    detailCard.innerHTML = `
      <div class="glass-header">
        <div>
          <h2>${job.title}</h2>
          <p style="color:var(--primary); font-weight:600; font-size:0.9rem;">${job.company_name} • ${job.location}</p>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:16px; margin-top: 16px;">
        <div>
          <h4 class="label">Internship Description</h4>
          <p style="font-size:0.875rem; line-height:1.6; margin-top:4px;">${job.description}</p>
        </div>
        <div style="display:flex; gap:20px; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid var(--border-glass)">
          <div>
            <span class="label" style="font-size:0.65rem;">Stipend Package</span>
            <div style="font-size:1.1rem; font-weight:bold; color:var(--accent);">${job.stipend}</div>
          </div>
          <div>
            <span class="label" style="font-size:0.65rem;">Listing Duration</span>
            <div style="font-size:1.1rem; font-weight:bold;">${job.duration}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('apply-job-id').value = job.id;
    document.getElementById('apply-user-name').innerText = currentUser.name + ` (${currentUser.email})`;
    switchTab('student_detail');
  } catch (err) {
    console.error(err);
  }
}

// Submit Application
async function handleApplySubmit(e) {
  e.preventDefault();
  const jobId = parseInt(document.getElementById('apply-job-id').value);
  const cover = document.getElementById('apply-cover').value;

  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ internship_id: jobId, cover_pitch: cover })
    });
    const data = await res.json();
    if (data.success) {
      alert('Application submitted successfully!');
      document.getElementById('apply-cover').value = '';
      
      // Update local state and trigger notifications
      pushNotification(`Submitted application to ${jobId}`);
      await loadDatabaseContent();
      switchTab('student_dashboard');
    } else {
      alert(data.message || 'Application submission failed.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function quickApply(jobId) {
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ internship_id: jobId })
    });
    const data = await res.json();
    if (data.success) {
      alert('Quick application sent!');
      pushNotification(`Quick application sent for job ID ${jobId}`);
      await loadDatabaseContent();
    } else {
      alert(data.message || 'Quick apply failed.');
    }
  } catch (err) {
    console.error(err);
  }
}

// Vetted Kanban pipelines renderer
function renderKanban() {
  const columns = ['Applied', 'Reviewing', 'Interviewing', 'Offered', 'Archived'];
  columns.forEach(status => {
    const colDiv = document.getElementById(`kanban-${status}`);
    if (!colDiv) return;

    const cardsStack = colDiv.querySelector('.kanban-cards-stack');
    cardsStack.innerHTML = '';

    const matchingApps = globalApplicationsList.filter(a => a.status === status);
    colDiv.querySelector('span')?.remove();

    // Render count indicator
    const header = colDiv.querySelector('h4');
    const span = document.createElement('span');
    span.className = 'badge badge-secondary';
    span.style.float = 'right';
    span.innerText = matchingApps.length;
    header.appendChild(span);

    matchingApps.forEach(app => {
      const card = document.createElement('div');
      card.className = 'kanban-card animate-fade';
      card.innerHTML = `
        <div style="font-weight:bold; font-size:0.85rem; display:flex; justify-content:space-between;">
          <span>${app.company_name || 'Linear'}</span>
          <span>▲</span>
        </div>
        <div>${app.title}</div>
        <div style="font-size:0.65rem; color:var(--text-muted);">Stipend: ${app.stipend}</div>
        <div style="display:flex; justify-content:flex-end; gap:4px; margin-top:4px;">
          <button onclick="moveKanbanCard(${app.id}, -1)" style="background:transparent; border:1px solid var(--border-glass); padding:2px 6px; border-radius:4px; font-size:0.65rem; cursor:pointer;">◀</button>
          <button onclick="moveKanbanCard(${app.id}, 1)" style="background:transparent; border:1px solid var(--border-glass); padding:2px 6px; border-radius:4px; font-size:0.65rem; cursor:pointer;">▶</button>
        </div>
      `;
      cardsStack.appendChild(card);
    });
  });
}

// Kanban drag simulation clicker
async function moveKanbanCard(appId, dir) {
  const app = globalApplicationsList.find(a => a.id === appId);
  if (!app) return;

  const cols = ['Applied', 'Reviewing', 'Interviewing', 'Offered', 'Archived'];
  const curIdx = cols.indexOf(app.status);
  const nextIdx = curIdx + dir;

  if (nextIdx >= 0 && nextIdx < cols.length) {
    const nextStatus = cols[nextIdx];
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        pushNotification(`Pipeline status updated: ${nextStatus}`);
        await loadDatabaseContent();
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Live Resume Preview
function updateResumePreview() {
  const preview = document.getElementById('resume-preview-container');
  if (!preview) return;

  const name = document.getElementById('resume-name').value;
  const title = document.getElementById('resume-title').value;
  const edu = document.getElementById('resume-education').value;
  const exp = document.getElementById('resume-experience').value;
  const skills = document.getElementById('resume-skills').value;

  preview.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <h2 style="color:#0f172a; margin:0; font-size:1.5rem;">${name}</h2>
        <p style="color:var(--primary); font-size:0.85rem; font-weight:600; margin-top:2px;">${title}</p>
      </div>
      <div style="text-align:right; font-size:0.7rem; color:#64748b;">
        <div>Vetted Intern Profile</div>
        <div>Stanford verification active</div>
      </div>
    </div>
    <hr style="border:0; border-top:1px solid #e2e8f0; margin:12px 0;" />
    <div>
      <h4 style="color:#0f172a; font-size:0.75rem; text-transform:uppercase; margin-bottom:4px;">Education</h4>
      <p style="font-size:0.8rem; color:#334155;">${edu}</p>
    </div>
    <div style="margin-top:12px;">
      <h4 style="color:#0f172a; font-size:0.75rem; text-transform:uppercase; margin-bottom:4px;">Experience</h4>
      <p style="font-size:0.8rem; color:#334155; line-height:1.5;">${exp}</p>
    </div>
    <div style="margin-top:12px;">
      <h4 style="color:#0f172a; font-size:0.75rem; text-transform:uppercase; margin-bottom:4px;">Skills Tags</h4>
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
        ${skills.split(',').map(s => `<span style="background:#f1f5f9; color:#334155; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:500;">${s.trim()}</span>`).join('')}
      </div>
    </div>
    <div style="margin-top:auto; border-top:1px dashed #cbd5e1; padding-top:10px; text-align:center; font-size:0.6rem; color:#94a3b8; font-family:var(--font-mono)">
      ✓ DYNAMIC RECORD PROFILE SYNC VERIFIED ATS-SECURE
    </div>
  `;
}

// Render recruiter overview lists
function renderRecruiterOverview() {
  const jobsTable = document.getElementById('recruiter-jobs-table-body');
  if (!jobsTable) return;
  jobsTable.innerHTML = '';

  const recruiterJobs = globalJobsList;
  document.getElementById('recruiter-active-count').innerText = `${recruiterJobs.length} Active`;

  recruiterJobs.forEach(job => {
    const matchScore = '94%';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold">${job.title}</td>
      <td><span class="badge badge-accent">Vetted Matching</span></td>
      <td>${job.stipend}</td>
      <td><button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="switchTab('recruiter_candidates')">Review applicants</button></td>
    `;
    jobsTable.appendChild(tr);
  });

  // Render candidate lists
  const candidatesTable = document.getElementById('recruiter-candidates-table-body');
  if (!candidatesTable) return;
  candidatesTable.innerHTML = '';

  if (globalApplicationsList.length === 0) {
    candidatesTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No applications submitted yet.</td></tr>`;
    return;
  }

  globalApplicationsList.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold">${app.student_name || 'Nisha Sharma'}</td>
      <td>${app.title}</td>
      <td><span class="badge badge-primary">${app.status}</span></td>
      <td>
        <select class="select" style="padding:2px 4px; font-size:0.75rem;" onchange="updateApplicationStage(${app.id}, this.value)">
          <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
          <option value="Reviewing" ${app.status === 'Reviewing' ? 'selected' : ''}>Reviewing</option>
          <option value="Interviewing" ${app.status === 'Interviewing' ? 'selected' : ''}>Interviewing</option>
          <option value="Offered" ${app.status === 'Offered' ? 'selected' : ''}>Offered</option>
          <option value="Archived" ${app.status === 'Archived' ? 'selected' : ''}>Archived</option>
        </select>
      </td>
      <td>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" onclick="openRecruiterChat('${app.student_name || 'Nisha Sharma'}')">Chat</button>
      </td>
    `;
    candidatesTable.appendChild(tr);
  });
}

async function updateApplicationStage(appId, newStage) {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ status: newStage })
    });
    const data = await res.json();
    if (data.success) {
      alert('Candidate pipeline stage updated!');
      await loadDatabaseContent();
    }
  } catch (err) {
    console.error(err);
  }
}

function openRecruiterChat(name) {
  activeChatChannel = name;
  switchTab('recruiter_messaging');
  initChatStream();
}

// Post Internship submit
async function handlePostJobSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('post-title').value;
  const stipend = document.getElementById('post-stipend').value;
  const duration = document.getElementById('post-duration').value;
  const description = document.getElementById('post-description').value;

  try {
    const res = await fetch('/api/internships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ title, stipend, duration, description })
    });
    const data = await res.json();
    if (data.success) {
      alert('Internship vacancy posted and published successfully!');
      document.getElementById('post-job-form').reset();
      pushNotification(`New job posted: ${title}`);
      await loadDatabaseContent();
      switchTab('recruiter_dashboard');
    } else {
      alert(data.message || 'Job posting failed.');
    }
  } catch (err) {
    console.error(err);
  }
}

// Render Admin overview elements
async function renderAdminOverview() {
  const userTable = document.getElementById('admin-users-table-body');
  if (!userTable) return;
  userTable.innerHTML = '';

  try {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();
    if (data.success) {
      data.data.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.id}</td>
          <td style="font-weight:bold">${user.name}</td>
          <td>${user.email}</td>
          <td><span class="badge badge-primary">${user.role}</span></td>
          <td><span class="badge badge-accent">Active</span></td>
        `;
        userTable.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }

  // Populate moderation queue
  const modTable = document.getElementById('admin-moderation-table-body');
  if (!modTable) return;
  modTable.innerHTML = '';

  // Simulate pending moderation listing
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="font-weight:bold">AI Prompt engineer</td>
    <td>$6,000/mo</td>
    <td><span class="badge badge-danger">Guideline Check</span></td>
    <td>
      <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="approveJob()">Approve</button>
    </td>
  `;
  modTable.appendChild(tr);
}

function approveJob() {
  alert('Vacancy approved and matching algorithms initiated!');
  document.getElementById('admin-moderation-table-body').innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Queue cleared. No pending checks.</td></tr>`;
}

// Messaging and chats helper
let mockChatLogs = [
  { sender: 'recruiter', text: 'Hi, loved your profile! Are you free for an interview tomorrow?', time: '10:30 AM', channel: 'Linear Recruitment' },
  { sender: 'student', text: 'Hi! Yes, I am absolutely free. 2:00 PM EST works best.', time: '10:45 AM', channel: 'Linear Recruitment' },
  { sender: 'recruiter', text: 'Perfect, I will send a zoom calendar invite.', time: '11:00 AM', channel: 'Linear Recruitment' }
];

function selectChannel(ch) {
  activeChatChannel = ch;
  document.getElementById('chat-header').innerText = ch;
  initChatStream();
}

function initChatStream() {
  const stream = document.getElementById('chat-stream');
  if (!stream) return;
  stream.innerHTML = '';

  const filtered = mockChatLogs.filter(m => m.channel === activeChatChannel || activeChatChannel.includes(m.sender));

  filtered.forEach(m => {
    const bubble = document.createElement('div');
    const isMe = m.sender === 'student';
    bubble.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
    bubble.style.background = isMe ? 'var(--primary)' : 'var(--bg-surface)';
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = isMe ? '12px 12px 0 12px' : '12px 12px 12px 0';
    bubble.style.maxWidth = '70%';
    bubble.style.fontSize = '0.85rem';
    bubble.innerHTML = `
      <p style="margin:0; color:${isMe ? '#fff' : 'var(--text-primary)'}">${m.text}</p>
      <span style="font-size:0.6rem; opacity:0.6; display:block; text-align:right; margin-top:4px;">${m.time}</span>
    `;
    stream.appendChild(bubble);
  });
  stream.scrollTop = stream.scrollHeight;
}

function sendChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-msg');
  const text = input.value;
  if (!text) return;

  mockChatLogs.push({
    sender: 'student',
    text,
    time: 'Just now',
    channel: activeChatChannel
  });

  input.value = '';
  initChatStream();

  // Simulated responder
  setTimeout(() => {
    mockChatLogs.push({
      sender: 'recruiter',
      text: 'Thanks for writing. Our engineering lead will review this note.',
      time: 'Just now',
      channel: activeChatChannel
    });
    pushNotification(`New response message from ${activeChatChannel}`);
    initChatStream();
  }, 2000);
}

// Notification Centre Panel
function toggleAlertsDrawer() {
  const drawer = document.getElementById('alerts-drawer');
  const isClosed = drawer.style.display === 'none';
  drawer.style.display = isClosed ? 'block' : 'none';
  if (isClosed) renderAlerts();
}

function renderAlerts() {
  const list = document.getElementById('alerts-list');
  list.innerHTML = '';
  notifications.forEach(n => {
    const alertDiv = document.createElement('div');
    alertDiv.style.padding = '8px';
    alertDiv.style.background = n.unread ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)';
    alertDiv.style.borderRadius = '6px';
    alertDiv.style.fontSize = '0.75rem';
    alertDiv.style.borderLeft = n.unread ? '3px solid var(--primary)' : 'none';
    alertDiv.innerHTML = `
      <p style="margin:0;">${n.text}</p>
      <span style="font-size:0.65rem; color:var(--text-muted);">${n.date}</span>
    `;
    list.appendChild(alertDiv);
  });
}

function clearAlerts() {
  notifications = notifications.map(n => ({ ...n, unread: false }));
  renderAlerts();
  updateAlertsDot();
}

function pushNotification(text) {
  notifications.unshift({ id: Date.now(), text, date: 'Just now', unread: true });
  updateAlertsDot();
}

function updateAlertsDot() {
  const dot = document.getElementById('unread-alert-dot');
  if (!dot) return;
  const count = notifications.filter(n => n.unread).length;
  dot.style.display = count > 0 ? 'block' : 'none';
}

// Prototype Controller Drawer Switching
function toggleProtoDrawer() {
  const drawer = document.getElementById('proto-drawer');
  drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
}

function toggleTheme() {
  const root = document.documentElement;
  const curTheme = root.getAttribute('data-theme');
  root.setAttribute('data-theme', curTheme === 'dark' ? 'light' : 'dark');
}

function toggleViewport() {
  const wrapper = document.getElementById('viewport-wrapper');
  const frame = document.getElementById('viewport-frame');
  const notch = document.getElementById('phone-notch');

  if (wrapper.className === 'mobile-frame-container') {
    wrapper.className = '';
    frame.className = '';
    notch.style.display = 'none';
  } else {
    wrapper.className = 'mobile-frame-container';
    frame.className = 'mobile-frame';
    notch.className = 'mobile-notch';
    notch.style.display = 'block';
  }
}

function bypassRole(newRole) {
  currentUser.role = newRole;
  localStorage.setItem('user', JSON.stringify(currentUser));
  checkAuthentication();
  initDashboard();
}

// Toggle mobile navigation sidebar overlay drawer
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('sidebar-open');
  if (isOpen) {
    sidebar.classList.remove('sidebar-open');
    if (backdrop) backdrop.style.display = 'none';
  } else {
    sidebar.classList.add('sidebar-open');
    if (backdrop) backdrop.style.display = 'block';
  }
}
