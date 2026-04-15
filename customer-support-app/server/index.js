import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const KB_ARTICLES_FILE = path.join(DATA_DIR, 'kb_articles.json');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit_log.json');
const AUTOMATION_RULES_FILE = path.join(DATA_DIR, 'automation_rules.json');

/* ── File Persistence Helpers ──────────────────────────── */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/* ── Multer config for file uploads ────────────────────── */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip', '.rar'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed`));
    }
  },
});

function loadJson(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) { console.error(`Failed to load ${filePath}:`, e.message); }
  return fallback;
}

function saveTickets() {
  try { fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2)); } catch (e) { console.error('Save tickets error:', e.message); }
}

function saveMessages() {
  try { fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2)); } catch (e) { console.error('Save messages error:', e.message); }
}

function saveEmails() {
  try { fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2)); } catch (e) { console.error('Save emails error:', e.message); }
}
function saveNotifications() {
  try { fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2)); } catch (e) { console.error('Save notifications error:', e.message); }
}
function saveKBArticles() {
  try { fs.writeFileSync(KB_ARTICLES_FILE, JSON.stringify(kbArticles, null, 2)); } catch (e) { console.error('Save KB error:', e.message); }
}
function saveAuditLog() {
  try { fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(auditLog, null, 2)); } catch (e) { console.error('Save audit error:', e.message); }
}
function saveAutomationRules() {
  try { fs.writeFileSync(AUTOMATION_RULES_FILE, JSON.stringify(automationRules, null, 2)); } catch (e) { console.error('Save rules error:', e.message); }
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/* ── Data Store (persisted to disk) ────────────────────── */
const users = [
  { id: 'raiser-1', name: 'Anita Sharma', email: 'anita@pharma.com', role: 'raiser', department: 'Quality Control', avatar: 'AS' },
  { id: 'raiser-2', name: 'Raj Patel', email: 'raj@pharma.com', role: 'raiser', department: 'Production', avatar: 'RP' },
  { id: 'raiser-3', name: 'Meena Gupta', email: 'meena@pharma.com', role: 'raiser', department: 'QA', avatar: 'MG' },
  { id: 'resolver-1', name: 'David Chen', email: 'david@support.com', role: 'resolver', department: 'IT Support', avatar: 'DC', level: 'L2', specialties: ['TMS', 'CMS', 'CCN'], maxTickets: 10 },
  { id: 'resolver-2', name: 'Sarah Johnson', email: 'sarah@support.com', role: 'resolver', department: 'IT Support', avatar: 'SJ', level: 'L1', specialties: ['CAPA', 'DEVIATION', 'NTF'], maxTickets: 8 },
  { id: 'admin-1', name: 'Priya Nair', email: 'priya@pharma.com', role: 'admin', department: 'IT Admin', avatar: 'PN' },
  { id: 'qa-reviewer-1', name: 'Vikram Mehta', email: 'vikram@pharma.com', role: 'qa-reviewer', department: 'QA Head', avatar: 'VM' },
  { id: 'auditor-1', name: 'Linda Foster', email: 'linda@pharma.com', role: 'auditor', department: 'Compliance', avatar: 'LF' },
];

/* ── Escalation Matrix ─────────────────────────────────── */
const ESCALATION_MATRIX = {
  L1: { escalateTo: 'L2', maxHours: { Critical: 1, High: 2, Medium: 4, Low: 8 } },
  L2: { escalateTo: 'QA_HEAD', maxHours: { Critical: 2, High: 4, Medium: 8, Low: 24 } },
  QA_HEAD: { escalateTo: null, maxHours: { Critical: 4, High: 8, Medium: 24, Low: 48 } },
};

/* ── Smart Assignment: Module → Resolver mapping ───────── */
const MODULE_ASSIGNMENT = {
  TMS: ['resolver-1'],
  CMS: ['resolver-1'],
  CCN: ['resolver-1'],
  CAPA: ['resolver-2'],
  DEVIATION: ['resolver-2'],
  NTF: ['resolver-2'],
};

const tickets = loadJson(TICKETS_FILE, []);
const messages = loadJson(MESSAGES_FILE, {});
const emails = loadJson(EMAILS_FILE, []);
const notifications = loadJson(NOTIFICATIONS_FILE, []);
const kbArticles = loadJson(KB_ARTICLES_FILE, getDefaultKBArticles());
const auditLog = loadJson(AUDIT_LOG_FILE, []);
const automationRules = loadJson(AUTOMATION_RULES_FILE, getDefaultRules());
const onlineUsers = new Map(); // socketId -> userId
const userSockets = new Map(); // userId -> socketId

/* ── Default KB Articles ───────────────────────────────── */
function getDefaultKBArticles() {
  return [
    { id: 'KB-001', title: 'How to Create a Deviation Report', module: 'DEVIATION', content: 'Navigate to the Deviation module from the sidebar. Click "Create New Deviation". Fill in the required fields: Title, Department, Deviation Type, Product/Area, and Description. Attach any relevant documents. Submit for initial review.', views: 245, helpful: 89, notHelpful: 12, createdBy: 'resolver-1', createdAt: '2026-01-15T10:00:00Z', tags: ['deviation', 'create', 'report'] },
    { id: 'KB-002', title: 'CAPA Workflow: Step-by-Step Guide', module: 'CAPA', content: 'CAPA process consists of: 1) Initiation 2) Investigation 3) Root Cause Analysis 4) Action Planning 5) Implementation 6) Effectiveness Check 7) Closure. Each step requires appropriate approvals.', views: 189, helpful: 76, notHelpful: 8, createdBy: 'resolver-2', createdAt: '2026-01-20T10:00:00Z', tags: ['capa', 'workflow', 'process'] },
    { id: 'KB-003', title: 'Document Control: Creating & Routing', module: 'CMS', content: 'To create a new controlled document: Go to CMS > Documents > Create New. Select the document type, department, and template. Upload your draft. Define the review and approval routing. Submit for review cycle.', views: 167, helpful: 62, notHelpful: 5, createdBy: 'resolver-1', createdAt: '2026-02-01T10:00:00Z', tags: ['document', 'control', 'routing', 'cms'] },
    { id: 'KB-004', title: 'Training Assignment Setup', module: 'TMS', content: 'Training Programs can be created under TMS > Programs. Assign users or user groups. Set completion deadlines. Training can be linked to documents, SOPs, or external materials. Track completion via the Training Dashboard.', views: 134, helpful: 55, notHelpful: 3, createdBy: 'resolver-1', createdAt: '2026-02-10T10:00:00Z', tags: ['training', 'assignment', 'tms'] },
    { id: 'KB-005', title: 'Change Control Notice Process', module: 'CCN', content: 'CCN process: 1) Submit Change Request with impact assessment. 2) Review by Change Control Board. 3) If approved, create action items. 4) Implement changes. 5) Verify implementation. 6) Close CCN. All changes require documentation.', views: 98, helpful: 41, notHelpful: 7, createdBy: 'resolver-1', createdAt: '2026-02-15T10:00:00Z', tags: ['change', 'control', 'ccn'] },
    { id: 'KB-006', title: 'Note to File: When and How', module: 'NTF', content: 'A Note to File (NTF) documents clarifications, corrections, or deviations from standard procedures that do not require a formal deviation report. Create NTF from the NTF module, link to relevant records, and submit for review.', views: 87, helpful: 34, notHelpful: 4, createdBy: 'resolver-2', createdAt: '2026-03-01T10:00:00Z', tags: ['ntf', 'note', 'file'] },
    { id: 'KB-007', title: 'Common Login & Access Issues', module: 'General', content: 'If users report login issues: 1) Verify account status is Active. 2) Check role assignments. 3) Ensure tenant configuration is correct. 4) Clear browser cache. 5) Check for password expiry. 6) Verify SSO configuration if applicable.', views: 312, helpful: 128, notHelpful: 15, createdBy: 'resolver-1', createdAt: '2026-03-05T10:00:00Z', tags: ['login', 'access', 'sso', 'password'] },
    { id: 'KB-008', title: 'How to Escalate Tickets', module: 'General', content: 'To escalate a ticket: 1) Change priority to Critical or High. 2) Update status to reflect escalation. 3) Add notes about why escalation is needed. 4) Notify the supervisor. Escalation will auto-trigger based on SLA breach.', views: 76, helpful: 29, notHelpful: 6, createdBy: 'resolver-2', createdAt: '2026-03-10T10:00:00Z', tags: ['escalate', 'ticket', 'sla'] },
  ];
}

/* ── Default Automation Rules ──────────────────────────── */
function getDefaultRules() {
  return [
    { id: 'RULE-001', name: 'Auto-assign Critical tickets', enabled: true, condition: { field: 'priority', operator: 'equals', value: 'Critical' }, action: { type: 'auto-assign', assignTo: 'senior' }, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'RULE-002', name: 'Escalate Critical no response 1h', enabled: true, condition: { field: 'priority', operator: 'equals', value: 'Critical', timeCondition: { noResponseMinutes: 60 } }, action: { type: 'escalate' }, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'RULE-003', name: 'Auto-close after 7 days inactivity', enabled: true, condition: { field: 'status', operator: 'equals', value: 'Resolved', timeCondition: { inactiveDays: 7 } }, action: { type: 'auto-close' }, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'RULE-004', name: 'Set Awaiting User on no response', enabled: true, condition: { field: 'status', operator: 'equals', value: 'In Progress', timeCondition: { noUserResponseDays: 2 } }, action: { type: 'status-change', newStatus: 'Awaiting User' }, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'RULE-005', name: 'Reopen ticket if CSAT < 3', enabled: true, condition: { field: 'rating', operator: 'less_than', value: 3 }, action: { type: 'reopen' }, createdAt: '2026-01-01T00:00:00Z' },
  ];
}

/* ── Audit Trail Helper ────────────────────────────────── */
function logAudit(action, entity, entityId, userId, userName, details = {}) {
  const entry = {
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4)}`,
    action, // create, update, assign, escalate, resolve, close, login, etc.
    entity, // ticket, email, kb_article, user, etc.
    entityId,
    userId,
    userName,
    details,
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1', // simulated
  };
  auditLog.push(entry);
  if (auditLog.length > 5000) auditLog.splice(0, auditLog.length - 5000); // cap at 5k entries
  saveAuditLog();
  return entry;
}

/* ── Notification Helper ───────────────────────────────── */
function createNotification({ userId, title, message, type = 'info', ticketId = null, link = null }) {
  const notif = {
    id: `NOTIF-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4)}`,
    userId,
    title,
    message,
    type, // info, warning, error, success, escalation, sla-breach, assignment
    ticketId,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notif);
  if (notifications.length > 10000) notifications.splice(0, notifications.length - 10000);
  saveNotifications();
  // Push to user via socket if online
  const socketId = userSockets.get(userId);
  if (socketId) io.to(socketId).emit('notification:new', notif);
  return notif;
}

/* ── Smart Auto-Assignment Engine ──────────────────────── */
function autoAssignTicket(ticket) {
  const resolvers = users.filter(u => u.role === 'resolver');
  // 1. Filter by module specialty
  const moduleResolvers = MODULE_ASSIGNMENT[ticket.module] || resolvers.map(r => r.id);
  let candidates = resolvers.filter(r => moduleResolvers.includes(r.id));
  if (candidates.length === 0) candidates = resolvers;

  // 2. For Critical priority, prefer senior (L2) resolvers
  if (ticket.priority === 'Critical') {
    const seniors = candidates.filter(r => r.level === 'L2');
    if (seniors.length > 0) candidates = seniors;
  }

  // 3. Pick least-busy (fewest open tickets)
  let bestResolver = null;
  let minLoad = Infinity;
  for (const resolver of candidates) {
    const activeCount = tickets.filter(t => t.resolverId === resolver.id && !['Resolved', 'Closed'].includes(t.status)).length;
    const max = resolver.maxTickets || 10;
    if (activeCount < max && activeCount < minLoad) {
      minLoad = activeCount;
      bestResolver = resolver;
    }
  }
  return bestResolver;
}

/* ── SLA Engine ────────────────────────────────────────── */
function checkSLABreaches() {
  const now = new Date();
  tickets.forEach(ticket => {
    if (['Resolved', 'Closed'].includes(ticket.status)) return;
    if (!ticket.slaDeadline) return;

    const deadline = new Date(ticket.slaDeadline);
    const timeLeft = deadline - now;
    const totalSla = deadline - new Date(ticket.createdAt);
    const percentUsed = ((totalSla - timeLeft) / totalSla) * 100;

    // Already breached
    if (timeLeft <= 0 && !ticket.slaBreach) {
      ticket.slaBreach = true;
      ticket.slaBreachedAt = now.toISOString();
      saveTickets();

      // Notify raiser
      createNotification({ userId: ticket.raiserId, title: '⚠️ SLA Breached', message: `Ticket ${ticket.id} has exceeded its SLA deadline.`, type: 'sla-breach', ticketId: ticket.id });
      // Notify resolver
      if (ticket.resolverId) {
        createNotification({ userId: ticket.resolverId, title: '🔴 SLA Breached', message: `${ticket.id} SLA has been breached! Immediate action required.`, type: 'sla-breach', ticketId: ticket.id });
      }
      // Auto-escalate
      escalateTicket(ticket, 'SLA breach - auto-escalation');
      logAudit('sla_breach', 'ticket', ticket.id, 'system', 'System', { slaDeadline: ticket.slaDeadline, breachedAt: now.toISOString() });
      io.emit('ticket:updated', ticket);
    }

    // Warning at 75% SLA used
    if (percentUsed >= 75 && percentUsed < 100 && !ticket.slaWarning) {
      ticket.slaWarning = true;
      saveTickets();
      if (ticket.resolverId) {
        createNotification({ userId: ticket.resolverId, title: '⏰ SLA Warning', message: `${ticket.id} has used 75% of its SLA time. Please prioritize.`, type: 'warning', ticketId: ticket.id });
      }
      io.emit('ticket:updated', ticket);
    }
  });
}

function escalateTicket(ticket, reason) {
  const currentResolver = ticket.resolverId ? users.find(u => u.id === ticket.resolverId) : null;
  const currentLevel = currentResolver?.level || 'L1';
  const escalation = ESCALATION_MATRIX[currentLevel];

  if (!escalation || !escalation.escalateTo) {
    // Top level — notify QA Head
    const qaHead = users.find(u => u.role === 'qa-reviewer');
    if (qaHead) {
      createNotification({ userId: qaHead.id, title: '🚨 Maximum Escalation', message: `${ticket.id} has reached maximum escalation level. ${reason}`, type: 'escalation', ticketId: ticket.id });
    }
    ticket.escalationLevel = 'MAX';
  } else {
    const nextLevel = escalation.escalateTo;
    if (nextLevel === 'QA_HEAD') {
      const qaHead = users.find(u => u.role === 'qa-reviewer');
      if (qaHead) {
        createNotification({ userId: qaHead.id, title: '🔺 Escalated to QA Head', message: `${ticket.id} escalated: ${reason}`, type: 'escalation', ticketId: ticket.id });
        ticket.escalationLevel = 'QA_HEAD';
      }
    } else {
      // Find a resolver at the next level
      const nextResolver = users.find(u => u.role === 'resolver' && u.level === nextLevel && u.id !== ticket.resolverId);
      if (nextResolver) {
        ticket.resolverId = nextResolver.id;
        ticket.resolverName = nextResolver.name;
        ticket.escalationLevel = nextLevel;
        createNotification({ userId: nextResolver.id, title: '🔺 Ticket Escalated to You', message: `${ticket.id} has been escalated: ${reason}`, type: 'escalation', ticketId: ticket.id });
      }
    }
  }

  ticket.escalatedAt = new Date().toISOString();
  ticket.escalationReason = reason;
  ticket.history.push({
    action: 'escalated', by: 'System', at: new Date().toISOString(),
    detail: `Escalated: ${reason}. Level: ${ticket.escalationLevel || 'L1'}`,
  });
  saveTickets();
  logAudit('escalate', 'ticket', ticket.id, 'system', 'System', { reason, level: ticket.escalationLevel });
}

/* ── Automation Rules Engine ───────────────────────────── */
function runAutomationRules() {
  const now = new Date();
  const enabledRules = automationRules.filter(r => r.enabled);

  tickets.forEach(ticket => {
    if (['Closed'].includes(ticket.status)) return;

    enabledRules.forEach(rule => {
      // Auto-close resolved tickets after X days inactivity
      if (rule.action.type === 'auto-close' && ticket.status === 'Resolved') {
        const daysSinceUpdate = (now - new Date(ticket.updatedAt)) / 86400000;
        if (rule.condition.timeCondition?.inactiveDays && daysSinceUpdate >= rule.condition.timeCondition.inactiveDays) {
          ticket.status = 'Closed';
          ticket.updatedAt = now.toISOString();
          ticket.history.push({ action: 'auto_closed', by: 'System', at: now.toISOString(), detail: `Auto-closed after ${rule.condition.timeCondition.inactiveDays} days of inactivity` });
          createNotification({ userId: ticket.raiserId, title: 'Ticket Auto-Closed', message: `${ticket.id} was auto-closed due to inactivity.`, type: 'info', ticketId: ticket.id });
          logAudit('auto_close', 'ticket', ticket.id, 'system', 'System', { ruleId: rule.id });
          saveTickets();
          io.emit('ticket:updated', ticket);
        }
      }

      // Set to Awaiting User if no user response in X days
      if (rule.action.type === 'status-change' && ticket.status === 'In Progress') {
        const ticketMsgs = messages[ticket.id] || [];
        const lastUserMsg = ticketMsgs.filter(m => m.senderId === ticket.raiserId).pop();
        const daysSince = lastUserMsg ? (now - new Date(lastUserMsg.timestamp)) / 86400000 : (now - new Date(ticket.createdAt)) / 86400000;
        if (rule.condition.timeCondition?.noUserResponseDays && daysSince >= rule.condition.timeCondition.noUserResponseDays) {
          if (ticket.status !== rule.action.newStatus) {
            const oldStatus = ticket.status;
            ticket.status = rule.action.newStatus;
            ticket.updatedAt = now.toISOString();
            ticket.history.push({ action: 'auto_status', by: 'System', at: now.toISOString(), detail: `Auto-changed from ${oldStatus} to ${rule.action.newStatus}` });
            saveTickets();
            io.emit('ticket:updated', ticket);
          }
        }
      }

      // Reopen if rating < threshold
      if (rule.action.type === 'reopen' && ticket.status === 'Resolved' && ticket.rating) {
        if (ticket.rating < rule.condition.value && !ticket.reopenedByRule) {
          ticket.status = 'Reopened';
          ticket.reopenedByRule = true;
          ticket.updatedAt = now.toISOString();
          ticket.history.push({ action: 'auto_reopen', by: 'System', at: now.toISOString(), detail: `Reopened due to low rating (${ticket.rating}/5)` });
          createNotification({ userId: ticket.resolverId, title: '🔄 Ticket Reopened', message: `${ticket.id} reopened due to low customer rating (${ticket.rating}/5).`, type: 'warning', ticketId: ticket.id });
          logAudit('auto_reopen', 'ticket', ticket.id, 'system', 'System', { rating: ticket.rating, ruleId: rule.id });
          saveTickets();
          io.emit('ticket:updated', ticket);
        }
      }
    });
  });
}

// Run SLA check and automation rules every 30 seconds
setInterval(() => {
  checkSLABreaches();
  runAutomationRules();
}, 30000);
// Also run once on startup
setTimeout(() => { checkSLABreaches(); runAutomationRules(); }, 3000);

/* ── REST Endpoints ────────────────────────────────────── */

/* Email helper — simulates sending, saves to file */
function createEmail({ from, fromName, to, toName, subject, body, ticketId, type = 'notification', attachments = [] }) {
  const email = {
    id: `EMAIL-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4)}`,
    from,
    fromName,
    to,
    toName,
    subject,
    body,
    ticketId,
    type, // notification | user-compose | status-update
    attachments, // array of { id, originalName, fileName, size, mimetype, url }
    status: 'sent', // simulated
    sentAt: new Date().toISOString(),
    read: false,
  };
  emails.push(email);
  saveEmails();
  return email;
}

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/tickets', (req, res) => {
  const { userId, role } = req.query;
  let result = tickets;
  if (role === 'raiser' && userId) {
    result = tickets.filter((t) => t.raiserId === userId);
  }
  if (role === 'resolver' && userId) {
    result = tickets.filter((t) => t.resolverId === userId || !t.resolverId);
  }
  res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

app.post('/api/tickets', (req, res) => {
  const { title, description, module, priority, raiserId, category, subCategory, attachments, linkedRecords } = req.body;
  const raiser = users.find((u) => u.id === raiserId);
  const ticket = {
    id: `TKT-${Date.now().toString(36).toUpperCase()}`,
    title,
    description,
    module,
    category: category || 'General',
    subCategory: subCategory || '',
    priority: priority || 'Medium',
    status: 'New',
    raiserId,
    raiserName: raiser?.name || 'Unknown',
    raiserDept: raiser?.department || '',
    resolverId: null,
    resolverName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    slaDeadline: new Date(Date.now() + (priority === 'Critical' ? 4 : priority === 'High' ? 8 : 24) * 3600000).toISOString(),
    slaBreach: false,
    slaWarning: false,
    escalationLevel: null,
    escalatedAt: null,
    escalationReason: null,
    history: [{ action: 'created', by: raiser?.name, at: new Date().toISOString(), detail: 'Ticket created' }],
    attachments: Array.isArray(attachments) ? attachments : [],
    linkedRecords: Array.isArray(linkedRecords) ? linkedRecords : [], // eQMS module linking
    rating: null,
    feedback: '',
    feedbackCategories: [],
  };

  // Smart Auto-Assignment
  const assignedResolver = autoAssignTicket(ticket);
  if (assignedResolver) {
    ticket.resolverId = assignedResolver.id;
    ticket.resolverName = assignedResolver.name;
    ticket.status = 'Open';
    ticket.history.push({ action: 'auto_assigned', by: 'System', at: new Date().toISOString(), detail: `Auto-assigned to ${assignedResolver.name} (${assignedResolver.level || 'L1'}) based on module & workload` });
    createNotification({ userId: assignedResolver.id, title: '📋 New Ticket Assigned', message: `${ticket.id} — ${ticket.title} (${ticket.priority}) auto-assigned to you.`, type: 'assignment', ticketId: ticket.id, link: `/resolver/ticket/${ticket.id}` });
  }

  tickets.push(ticket);
  messages[ticket.id] = [];
  saveTickets();
  saveMessages();
  logAudit('create', 'ticket', ticket.id, raiserId, raiser?.name, { module, priority, title });

  // Auto-send email notifications
  createEmail({
    from: 'support@eqms-support.com', fromName: 'eQMS Support System',
    to: raiser?.email || 'unknown@pharma.com', toName: raiser?.name || 'User',
    subject: `[${ticket.id}] Support Request Received — ${ticket.title}`,
    body: `Dear ${raiser?.name || 'User'},\n\nYour support request has been successfully submitted.\n\nTicket ID: ${ticket.id}\nModule: ${ticket.module}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\n${assignedResolver ? `Assigned To: ${assignedResolver.name}\n` : ''}\nTitle: ${ticket.title}\nDescription: ${ticket.description}\n\nSLA Deadline: ${new Date(ticket.slaDeadline).toLocaleString()}\n\nYou can track your request in the eQMS Support portal.\n\nBest regards,\neQMS Support Team`,
    ticketId: ticket.id, type: 'ticket-confirmation',
  });

  const supportResolvers = users.filter(u => u.role === 'resolver');
  supportResolvers.forEach(resolver => {
    createEmail({
      from: 'support@eqms-support.com', fromName: 'eQMS Support System',
      to: resolver.email, toName: resolver.name,
      subject: `[New Ticket] ${ticket.id} — ${ticket.title} (${ticket.priority})`,
      body: `A new support request has been raised.\n\nTicket ID: ${ticket.id}\nRaised by: ${raiser?.name} (${raiser?.department})\nModule: ${ticket.module}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}\n\nSLA Deadline: ${new Date(ticket.slaDeadline).toLocaleString()}\n\n${assignedResolver?.id === resolver.id ? '⚡ This ticket has been auto-assigned to YOU.' : 'Please review and assign this ticket if needed.'}`,
      ticketId: ticket.id, type: 'resolver-notification',
    });
  });

  // Notify raiser
  createNotification({ userId: raiserId, title: '✅ Ticket Created', message: `${ticket.id} — ${title}. ${assignedResolver ? `Assigned to ${assignedResolver.name}.` : 'Pending assignment.'}`, type: 'success', ticketId: ticket.id, link: `/raiser/request/${ticket.id}` });

  io.emit('ticket:created', ticket);
  res.status(201).json(ticket);
});

app.patch('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updates = req.body;
  const oldStatus = ticket.status;
  const updatedBy = updates.updatedBy || 'System';

  Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });

  if (updates.status && updates.status !== oldStatus) {
    ticket.history.push({
      action: 'status_change', by: updatedBy, at: new Date().toISOString(),
      detail: `Status changed from ${oldStatus} to ${updates.status}`,
    });
    if (updates.status === 'Resolved') ticket.resolvedAt = new Date().toISOString();
    logAudit('status_change', 'ticket', ticket.id, updates.updatedById || 'unknown', updatedBy, { from: oldStatus, to: updates.status });

    // Notify raiser on status change
    createNotification({ userId: ticket.raiserId, title: `📍 Ticket ${updates.status}`, message: `${ticket.id} status: ${oldStatus} → ${updates.status}`, type: updates.status === 'Resolved' ? 'success' : 'info', ticketId: ticket.id });
  }

  if (updates.resolverId && !ticket.resolverName) {
    const resolver = users.find((u) => u.id === updates.resolverId);
    ticket.resolverName = resolver?.name;
    ticket.history.push({ action: 'assigned', by: resolver?.name, at: new Date().toISOString(), detail: `Assigned to ${resolver?.name}` });
    logAudit('assign', 'ticket', ticket.id, updates.resolverId, resolver?.name, { ticketId: ticket.id });
    createNotification({ userId: ticket.raiserId, title: '👤 Resolver Assigned', message: `${ticket.id} assigned to ${resolver?.name}.`, type: 'info', ticketId: ticket.id });
  }

  // CSAT with feedback categories and auto-reopen
  if (updates.rating) {
    ticket.feedbackCategories = updates.feedbackCategories || [];
    logAudit('rating', 'ticket', ticket.id, ticket.raiserId, ticket.raiserName, { rating: updates.rating, feedback: updates.feedback });
    if (ticket.resolverId) {
      createNotification({ userId: ticket.resolverId, title: '⭐ New Rating', message: `${ticket.id} rated ${updates.rating}/5${updates.feedback ? ': ' + updates.feedback.slice(0, 80) : ''}`, type: updates.rating >= 4 ? 'success' : 'warning', ticketId: ticket.id });
    }
  }

  // Handle linked eQMS records
  if (updates.linkedRecords) {
    ticket.linkedRecords = updates.linkedRecords;
    logAudit('link_record', 'ticket', ticket.id, updates.updatedById || 'unknown', updatedBy, { linkedRecords: updates.linkedRecords });
  }

  saveTickets();
  io.emit('ticket:updated', ticket);
  res.json(ticket);
});

app.get('/api/tickets/:id/messages', (req, res) => {
  res.json(messages[req.params.id] || []);
});

app.get('/api/stats/resolver/:id', (req, res) => {
  const rid = req.params.id;
  const myTickets = tickets.filter((t) => t.resolverId === rid);
  const resolved = myTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
  const avgTime = resolved.length
    ? resolved.reduce((acc, t) => acc + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0) / resolved.length / 3600000
    : 0;
  res.json({
    total: myTickets.length,
    open: myTickets.filter((t) => !['Resolved', 'Closed'].includes(t.status)).length,
    resolved: resolved.length,
    avgResolutionHours: Math.round(avgTime * 10) / 10,
    csat: resolved.filter((t) => t.rating).length
      ? (resolved.filter((t) => t.rating).reduce((a, t) => a + t.rating, 0) / resolved.filter((t) => t.rating).length).toFixed(1)
      : 'N/A',
  });
});

app.get('/api/stats/raiser/:id', (req, res) => {
  const rid = req.params.id;
  const myTickets = tickets.filter((t) => t.raiserId === rid);
  res.json({
    total: myTickets.length,
    open: myTickets.filter((t) => !['Resolved', 'Closed'].includes(t.status)).length,
    resolved: myTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
    critical: myTickets.filter((t) => t.priority === 'Critical').length,
  });
});

/* ── File Upload Endpoint ──────────────────────────────── */

/* ── Email Endpoints ───────────────────────────────────── */
// Get emails for a ticket
app.get('/api/tickets/:id/emails', (req, res) => {
  const ticketEmails = emails.filter(e => e.ticketId === req.params.id);
  res.json(ticketEmails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)));
});

// Get all emails for a user (by email address)
app.get('/api/emails', (req, res) => {
  const { userEmail } = req.query;
  if (!userEmail) return res.json([]);
  const userEmails = emails.filter(e => e.from === userEmail || e.to === userEmail);
  res.json(userEmails.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)));
});

// Send a new email (compose)
app.post('/api/emails', (req, res) => {
  const { from, fromName, to, toName, subject, body, ticketId, attachments } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required' });

  const email = createEmail({
    from,
    fromName,
    to: to || 'support@eqms-support.com',
    toName: toName || 'eQMS Support Team',
    subject,
    body,
    ticketId,
    type: 'user-compose',
    attachments: attachments || [],
  });

  // Notify via socket
  io.emit('email:sent', email);
  res.status(201).json(email);
});

/* ── Notification Endpoints ────────────────────────────── */
app.get('/api/notifications/:userId', (req, res) => {
  const userNotifs = notifications.filter(n => n.userId === req.params.userId);
  res.json(userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100));
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ error: 'Not found' });
  notif.read = true;
  saveNotifications();
  res.json(notif);
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const { userId } = req.body;
  notifications.filter(n => n.userId === userId && !n.read).forEach(n => { n.read = true; });
  saveNotifications();
  res.json({ success: true });
});

/* ── Knowledge Base Endpoints ──────────────────────────── */
app.get('/api/kb', (req, res) => {
  const { search, module } = req.query;
  let results = kbArticles;
  if (module && module !== 'All') results = results.filter(a => a.module === module);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags?.some(t => t.includes(q)));
  }
  res.json(results);
});

app.get('/api/kb/:id', (req, res) => {
  const article = kbArticles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  article.views = (article.views || 0) + 1;
  saveKBArticles();
  res.json(article);
});

app.post('/api/kb', (req, res) => {
  const { title, module, content, tags, createdBy } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const article = {
    id: `KB-${(kbArticles.length + 1).toString().padStart(3, '0')}`,
    title, module: module || 'General', content, tags: tags || [],
    views: 0, helpful: 0, notHelpful: 0,
    createdBy, createdAt: new Date().toISOString(),
  };
  kbArticles.push(article);
  saveKBArticles();
  logAudit('create', 'kb_article', article.id, createdBy, users.find(u => u.id === createdBy)?.name || 'Unknown', { title });
  res.status(201).json(article);
});

app.post('/api/kb/:id/feedback', (req, res) => {
  const article = kbArticles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Not found' });
  const { helpful } = req.body;
  if (helpful) article.helpful = (article.helpful || 0) + 1;
  else article.notHelpful = (article.notHelpful || 0) + 1;
  saveKBArticles();
  res.json(article);
});

// Auto-suggest KB articles based on ticket title/description
app.get('/api/kb/suggest', (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = kbArticles.map(a => {
    let score = 0;
    const text = (a.title + ' ' + a.content + ' ' + (a.tags || []).join(' ')).toLowerCase();
    words.forEach(w => { if (text.includes(w)) score += 1; });
    return { ...a, score };
  }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  res.json(scored);
});

// Create KB article from resolved ticket
app.post('/api/kb/from-ticket/:ticketId', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { createdBy } = req.body;
  const article = {
    id: `KB-${(kbArticles.length + 1).toString().padStart(3, '0')}`,
    title: `[From ${ticket.id}] ${ticket.title}`,
    module: ticket.module,
    content: `**Issue:** ${ticket.description}\n\n**Resolution:** ${ticket.resolution || 'See ticket history for resolution details.'}\n\n**Category:** ${ticket.category}\n**Priority:** ${ticket.priority}`,
    tags: [ticket.module.toLowerCase(), ticket.category.toLowerCase(), 'from-ticket'],
    views: 0, helpful: 0, notHelpful: 0,
    createdBy: createdBy || ticket.resolverId,
    createdAt: new Date().toISOString(),
    sourceTicketId: ticket.id,
  };
  kbArticles.push(article);
  saveKBArticles();
  logAudit('create_from_ticket', 'kb_article', article.id, createdBy, users.find(u => u.id === createdBy)?.name, { ticketId: ticket.id });
  res.status(201).json(article);
});

/* ── Audit Log Endpoints ───────────────────────────────── */
app.get('/api/audit', (req, res) => {
  const { entity, entityId, userId, limit = 200 } = req.query;
  let results = auditLog;
  if (entity) results = results.filter(a => a.entity === entity);
  if (entityId) results = results.filter(a => a.entityId === entityId);
  if (userId) results = results.filter(a => a.userId === userId);
  res.json(results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, Number(limit)));
});

/* ── Escalation Endpoint (manual) ──────────────────────── */
app.post('/api/tickets/:id/escalate', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { reason, escalatedBy } = req.body;
  escalateTicket(ticket, reason || 'Manual escalation');
  logAudit('manual_escalate', 'ticket', ticket.id, escalatedBy, users.find(u => u.id === escalatedBy)?.name, { reason });
  io.emit('ticket:updated', ticket);
  res.json(ticket);
});

/* ── Automation Rules Endpoints ────────────────────────── */
app.get('/api/rules', (req, res) => res.json(automationRules));

app.patch('/api/rules/:id', (req, res) => {
  const rule = automationRules.find(r => r.id === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  Object.assign(rule, req.body);
  saveAutomationRules();
  res.json(rule);
});

/* ── Global Search Endpoint ────────────────────────────── */
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ tickets: [], emails: [], kb: [], messages: [] });
  const query = q.toLowerCase();

  const matchedTickets = tickets.filter(t =>
    t.id.toLowerCase().includes(query) || t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query) || t.module?.toLowerCase().includes(query)
  ).slice(0, 20).map(t => ({ id: t.id, title: t.title, module: t.module, status: t.status, priority: t.priority }));

  const matchedEmails = emails.filter(e =>
    e.subject?.toLowerCase().includes(query) || e.body?.toLowerCase().includes(query)
  ).slice(0, 10).map(e => ({ id: e.id, subject: e.subject, from: e.fromName, ticketId: e.ticketId, sentAt: e.sentAt }));

  const matchedKB = kbArticles.filter(a =>
    a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query) || a.tags?.some(t => t.includes(query))
  ).slice(0, 10);

  const matchedMessages = [];
  Object.entries(messages).forEach(([ticketId, msgs]) => {
    msgs.forEach(m => {
      if (m.text?.toLowerCase().includes(query)) {
        matchedMessages.push({ ticketId, text: m.text.slice(0, 100), senderName: m.senderName, timestamp: m.timestamp });
      }
    });
  });

  res.json({ tickets: matchedTickets, emails: matchedEmails, kb: matchedKB, messages: matchedMessages.slice(0, 20) });
});

/* ── Advanced Reporting Endpoints ──────────────────────── */
app.get('/api/reports/sla-compliance', (req, res) => {
  const total = tickets.filter(t => t.slaDeadline).length;
  const breached = tickets.filter(t => t.slaBreach).length;
  const onTrack = total - breached;
  const byPriority = {};
  ['Critical', 'High', 'Medium', 'Low'].forEach(p => {
    const pTickets = tickets.filter(t => t.priority === p && t.slaDeadline);
    const pBreached = pTickets.filter(t => t.slaBreach).length;
    byPriority[p] = { total: pTickets.length, breached: pBreached, compliance: pTickets.length ? Math.round(((pTickets.length - pBreached) / pTickets.length) * 100) : 100 };
  });
  res.json({ total, breached, onTrack, compliance: total ? Math.round((onTrack / total) * 100) : 100, byPriority });
});

app.get('/api/reports/resolver-performance', (req, res) => {
  const resolvers = users.filter(u => u.role === 'resolver');
  const data = resolvers.map(r => {
    const rTickets = tickets.filter(t => t.resolverId === r.id);
    const resolved = rTickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
    const rated = resolved.filter(t => t.rating);
    const avgTime = resolved.length ? resolved.reduce((acc, t) => acc + (new Date(t.resolvedAt || t.updatedAt) - new Date(t.createdAt)), 0) / resolved.length / 3600000 : 0;
    const breached = rTickets.filter(t => t.slaBreach).length;
    return {
      id: r.id, name: r.name, level: r.level || 'L1', department: r.department,
      total: rTickets.length, open: rTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length,
      resolved: resolved.length, avgResolutionHours: Math.round(avgTime * 10) / 10,
      csat: rated.length ? (rated.reduce((a, t) => a + t.rating, 0) / rated.length).toFixed(1) : 'N/A',
      slaBreaches: breached,
      slaCompliance: rTickets.length ? Math.round(((rTickets.length - breached) / rTickets.length) * 100) : 100,
    };
  });
  res.json(data);
});

app.get('/api/reports/ticket-aging', (req, res) => {
  const now = new Date();
  const openTickets = tickets.filter(t => !['Resolved', 'Closed'].includes(t.status));
  const buckets = { '<1h': 0, '1-4h': 0, '4-8h': 0, '8-24h': 0, '1-3d': 0, '3-7d': 0, '>7d': 0 };
  openTickets.forEach(t => {
    const hours = (now - new Date(t.createdAt)) / 3600000;
    if (hours < 1) buckets['<1h']++;
    else if (hours < 4) buckets['1-4h']++;
    else if (hours < 8) buckets['4-8h']++;
    else if (hours < 24) buckets['8-24h']++;
    else if (hours < 72) buckets['1-3d']++;
    else if (hours < 168) buckets['3-7d']++;
    else buckets['>7d']++;
  });
  res.json({ total: openTickets.length, buckets });
});

app.get('/api/reports/csat', (req, res) => {
  const rated = tickets.filter(t => t.rating);
  const avg = rated.length ? (rated.reduce((a, t) => a + t.rating, 0) / rated.length).toFixed(1) : 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rated.forEach(t => { distribution[t.rating] = (distribution[t.rating] || 0) + 1; });
  // Feedback categories
  const categories = {};
  rated.forEach(t => {
    (t.feedbackCategories || []).forEach(c => { categories[c] = (categories[c] || 0) + 1; });
  });
  // Weekly trend (last 8 weeks)
  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 86400000);
    const weekEnd = new Date(Date.now() - i * 7 * 86400000);
    const weekRating = rated.filter(t => { const d = new Date(t.updatedAt); return d >= weekStart && d < weekEnd; });
    weeklyTrend.push({
      week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avg: weekRating.length ? (weekRating.reduce((a, t) => a + t.rating, 0) / weekRating.length).toFixed(1) : null,
      count: weekRating.length,
    });
  }
  res.json({ average: avg, total: rated.length, distribution, categories, weeklyTrend });
});

app.get('/api/reports/module-distribution', (req, res) => {
  const data = {};
  ['TMS', 'CMS', 'CCN', 'CAPA', 'DEVIATION', 'NTF'].forEach(m => {
    const mTickets = tickets.filter(t => t.module === m);
    data[m] = {
      total: mTickets.length,
      open: mTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length,
      resolved: mTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
      critical: mTickets.filter(t => t.priority === 'Critical').length,
    };
  });
  res.json(data);
});

app.post('/api/upload', upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  const fileInfos = req.files.map((f) => ({
    id: uuidv4(),
    originalName: f.originalname,
    fileName: f.filename,
    size: f.size,
    mimetype: f.mimetype,
    url: `/uploads/${f.filename}`,
    uploadedAt: new Date().toISOString(),
  }));
  res.json({ files: fileInfos });
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Max size is 25 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

/* ── Socket.IO Events ──────────────────────────────────── */
io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  socket.on('user:online', (userId) => {
    onlineUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.values()));
  });

  /* Chat Messages */
  socket.on('chat:message', (data) => {
    const { ticketId, senderId, senderName, text, type = 'text', fileName } = data;
    const msg = {
      id: uuidv4(),
      ticketId,
      senderId,
      senderName,
      text,
      type,
      fileName: fileName || null,
      timestamp: new Date().toISOString(),
    };
    if (!messages[ticketId]) messages[ticketId] = [];
    messages[ticketId].push(msg);
    saveMessages();
    io.emit(`chat:${ticketId}`, msg);

    // Auto-status: if user (raiser) replies while Awaiting User → set to In Progress
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.status === 'Awaiting User' && senderId === ticket.raiserId) {
      ticket.status = 'In Progress';
      ticket.updatedAt = new Date().toISOString();
      ticket.history.push({ action: 'auto_status', by: 'System', at: new Date().toISOString(), detail: 'Auto-changed to In Progress after user replied' });
      saveTickets();
      io.emit('ticket:updated', ticket);
    }
  });

  socket.on('chat:typing', ({ ticketId, userName }) => {
    socket.broadcast.emit(`chat:typing:${ticketId}`, { userName });
  });

  /* WebRTC Signaling */
  socket.on('call:initiate', ({ to, from, fromName, type, ticketId }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call:incoming', { from, fromName, type, ticketId, socketId: socket.id });
    }
  });

  socket.on('call:accept', ({ to, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('call:accepted', { socketId: socket.id });
  });

  socket.on('call:reject', ({ to, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('call:rejected');
  });

  socket.on('call:end', ({ to, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('call:ended');
  });

  socket.on('webrtc:offer', ({ to, offer, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('webrtc:offer', { offer, socketId: socket.id });
  });

  socket.on('webrtc:answer', ({ to, answer, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('webrtc:answer', { answer, socketId: socket.id });
  });

  socket.on('webrtc:ice-candidate', ({ to, candidate, socketId }) => {
    const targetSocket = socketId || userSockets.get(to);
    if (targetSocket) io.to(targetSocket).emit('webrtc:ice-candidate', { candidate, socketId: socket.id });
  });

  /* Remote Control */
  socket.on('remote:request', ({ to, fromName, ticketId, requestType }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('remote:request', {
        from: onlineUsers.get(socket.id),
        fromName,
        ticketId,
        requestType: requestType || 'control',
        socketId: socket.id,
      });
    }
  });

  // Raiser proactively offers control to resolver
  socket.on('remote:offer-control', ({ to, fromName, ticketId }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('remote:offer-control', {
        from: onlineUsers.get(socket.id),
        fromName,
        ticketId,
        socketId: socket.id,
      });
    }
  });

  socket.on('remote:accept-offer', ({ socketId }) => {
    io.to(socketId).emit('remote:offer-accepted', { socketId: socket.id });
  });

  socket.on('remote:accept', ({ socketId, controlGranted }) => {
    io.to(socketId).emit('remote:accepted', { socketId: socket.id, controlGranted: !!controlGranted });
  });

  socket.on('remote:reject', ({ socketId }) => {
    io.to(socketId).emit('remote:rejected');
  });

  socket.on('remote:end', ({ socketId, to }) => {
    if (socketId) io.to(socketId).emit('remote:ended');
    if (to) {
      const targetSocket = userSockets.get(to);
      if (targetSocket) io.to(targetSocket).emit('remote:ended');
    }
  });

  socket.on('remote:toggle-control', ({ socketId, controlGranted }) => {
    io.to(socketId).emit('remote:toggle-control', { controlGranted });
  });

  /* Remote Control WebRTC (namespaced to avoid conflicts with call WebRTC) */
  socket.on('remote:rtc:offer', ({ socketId, offer }) => {
    io.to(socketId).emit('remote:rtc:offer', { offer, socketId: socket.id });
  });

  socket.on('remote:rtc:answer', ({ socketId, answer }) => {
    io.to(socketId).emit('remote:rtc:answer', { answer, socketId: socket.id });
  });

  socket.on('remote:rtc:ice-candidate', ({ socketId, candidate }) => {
    io.to(socketId).emit('remote:rtc:ice-candidate', { candidate, socketId: socket.id });
  });

  socket.on('remote:mouse', ({ socketId, x, y, type, button }) => {
    io.to(socketId).emit('remote:mouse', { x, y, type, button });
  });

  socket.on('remote:keyboard', ({ socketId, key, code, type, ctrlKey, shiftKey, altKey }) => {
    io.to(socketId).emit('remote:keyboard', { key, code, type, ctrlKey, shiftKey, altKey });
  });

  socket.on('remote:scroll', ({ socketId, deltaX, deltaY }) => {
    io.to(socketId).emit('remote:scroll', { deltaX, deltaY });
  });

  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    // Only remove from userSockets if THIS socket is still the registered one
    // (prevents race condition when a new socket reconnects before old one disconnects)
    if (userId && userSockets.get(userId) === socket.id) {
      userSockets.delete(userId);
    }
    io.emit('users:online', Array.from(onlineUsers.values()));
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`🚀 Support server running on port ${PORT}`));
