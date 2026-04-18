// Ticket state management — step guides and workflow definitions

export const RAISER_STEPS = {
  dashboard: [
    { step: 1, title: 'View Your Dashboard', desc: 'See an overview of all your raised support requests and their current status.' },
    { step: 2, title: 'Check Open Tickets', desc: 'Review any pending tickets that need your attention or have updates.' },
    { step: 3, title: 'Raise New Request', desc: 'Click "New Request" to create a support ticket for any eQMS module issue.' },
  ],
  newRequest: [
    { step: 1, title: 'Select Module', desc: 'Choose the eQMS module related to your issue (TMS, CMS, CCN, CAPA, Deviation, Note to File).' },
    { step: 2, title: 'Fill Details', desc: 'Provide a clear title, description, priority, and category for your request.' },
    { step: 3, title: 'Attach Files', desc: 'Optionally add screenshots or documents to help explain the issue.' },
    { step: 4, title: 'Submit Request', desc: 'Review and submit. You will receive a ticket ID and real-time updates.' },
  ],
  requestDetail: [
    { step: 1, title: 'View Ticket Info', desc: 'See your ticket\'s status, priority, assigned resolver, and timeline.' },
    { step: 2, title: 'Chat with Support', desc: 'Use the text chat to communicate with your assigned support agent.' },
    { step: 3, title: 'Join Meeting', desc: 'Click the meeting link shared by resolver to join Google Meet, Teams, etc.' },
    { step: 4, title: 'Rate & Close', desc: 'Once resolved, provide feedback and close the ticket.' },
  ],
};

export const RESOLVER_STEPS = {
  dashboard: [
    { step: 1, title: 'View Queue', desc: 'See all incoming and assigned support tickets in your queue.' },
    { step: 2, title: 'Check Stats', desc: 'Monitor your performance stats — tickets resolved, avg response time, CSAT score.' },
    { step: 3, title: 'Pick Tickets', desc: 'Assign unassigned tickets to yourself and start working on them.' },
  ],
  ticketWorkspace: [
    { step: 1, title: 'Review Request', desc: 'Read the ticket details, module info, description, and any attachments.' },
    { step: 2, title: 'Chat with User', desc: 'Use the text chat panel to ask questions and provide solutions.' },
    { step: 3, title: 'Share Meeting Link', desc: 'Share a Google Meet, Teams, or Zoom link for real-time discussion.' },
    { step: 4, title: 'Update Status', desc: 'Change ticket status as you progress (Open → In Progress → Resolved).' },
    { step: 5, title: 'Add Internal Notes', desc: 'Add notes visible only to support staff for knowledge sharing.' },
    { step: 6, title: 'Resolve Ticket', desc: 'Mark the ticket as resolved and provide a resolution summary.' },
  ],
};
