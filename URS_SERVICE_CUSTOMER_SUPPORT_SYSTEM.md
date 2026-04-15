# URS — Service / Customer Support System

**Module:** Service & Customer Support System (Advanced)
**Application:** QcMetric QMS Platform
**Version:** 1.0 — Draft
**Date:** April 8, 2026

---

## 1. Purpose & Scope

A built-in, context-aware support system that enables **agents** (support staff) to assist platform users via **voice and text channels**, with the ability to **reference live application data** using an **@-mention context picker** — directly within the QcMetric QMS platform.

---

## 2. Functional Requirements

### 2.1 Agent Management

| # | Requirement |
|---|-------------|
| 2.1.1 | The system shall allow creation and management of **support agent profiles** with name, department, skills, availability status (Online / Away / Offline), and shift schedule. |
| 2.1.2 | The system shall support **agent roles**: Level-1 (Frontline), Level-2 (Specialist), Level-3 (Escalation), and Supervisor. |
| 2.1.3 | Agents shall be assignable to **skill groups** mapped to QcMetric modules (Deviations, CAPA, Documents, Training, Dynamic Forms, Dynamic Workflows, Change Management). |
| 2.1.4 | The system shall provide an **Agent Dashboard** showing: active conversations, queue depth, average response time, CSAT score, and assigned tickets. |
| 2.1.5 | Agents shall be able to set **custom status messages** and configure auto-away timeout. |
| 2.1.6 | The system shall support **agent capacity limits** — maximum concurrent conversations per agent, configurable per role. |
| 2.1.7 | Supervisors shall have a **live monitoring view** to observe active agent conversations (read-only or whisper mode). |
| 2.1.8 | The system shall maintain an **agent performance scorecard** (tickets resolved, average handle time, first-response time, CSAT, escalation rate). |

### 2.2 Voice Handling

| # | Requirement |
|---|-------------|
| 2.2.1 | The system shall support **inbound and outbound voice calls** via WebRTC (browser-based — no plugin required). |
| 2.2.2 | Incoming voice calls shall be **routed to agents** based on skill group, availability, and least-recently-used algorithm. |
| 2.2.3 | The system shall support **IVR (Interactive Voice Response)** with configurable menu trees for module-based routing (e.g., Press 1 for Deviations, Press 2 for Documents). |
| 2.2.4 | Voice calls shall be **recorded** with start/stop timestamps and stored with a link to the support ticket. Recording shall comply with GxP audit-trail requirements. |
| 2.2.5 | The system shall provide **real-time speech-to-text transcription** during active calls, visible to the agent. |
| 2.2.6 | The system shall support **call hold, transfer (warm/cold), conference**, and mute functions. |
| 2.2.7 | Post-call, the system shall generate an **AI-powered call summary** with key action items extracted from the transcript. |
| 2.2.8 | The system shall support **voicemail** when no agents are available, with automatic ticket creation from voicemail transcription. |
| 2.2.9 | Voice channel shall integrate with **SignalR** for real-time call-status updates (ringing, connected, on-hold, ended) on the agent dashboard. |

### 2.3 Text Handling (Chat / Messaging)

| # | Requirement |
|---|-------------|
| 2.3.1 | The system shall provide a **live chat widget** embedded in the QcMetric UI, accessible from any page via a persistent floating button. |
| 2.3.2 | Text conversations shall support **rich text** (bold, italic, links), **file attachments** (drag-and-drop, max 25 MB), **screenshots** (paste from clipboard), and **code/JSON snippets**. |
| 2.3.3 | The system shall support **real-time typing indicators** and **read receipts** via SignalR. |
| 2.3.4 | Chat shall support **conversation threading** — a user can have multiple open threads (e.g., one for Deviation help, one for Training issue). |
| 2.3.5 | The system shall provide **AI-powered auto-suggest** — as the user types, suggest relevant KB articles or FAQ answers before agent involvement. |
| 2.3.6 | The system shall support an **AI chatbot (Level-0)** that handles common queries autonomously, with seamless handoff to a human agent when confidence is low or user requests it. |
| 2.3.7 | Chat history shall be **persisted** and searchable per user, per tenant, with full conversation timeline. |
| 2.3.8 | Agents shall be able to send **canned responses / macros** — pre-defined message templates with variable placeholders (e.g., `{userName}`, `{deviationId}`). |
| 2.3.9 | The system shall support **internal notes** within a conversation (visible only to agents, not the end user). |
| 2.3.10 | The system shall support **email-to-chat bridge** — support emails auto-create a text conversation thread. |
| 2.3.11 | The system shall support **SMS notifications** for offline users, linking back to the chat thread. |

### 2.4 Referring App Data (Contextual Data Access)

| # | Requirement |
|---|-------------|
| 2.4.1 | When a user initiates a support conversation, the system shall **auto-attach page context** — the current page URL, module name, and entity being viewed (e.g., Deviation DEV-2024-0042, Document DOC-REV-003). |
| 2.4.2 | The agent shall see a **contextual side-panel** showing the referenced entity's key details (status, assigned to, stage, creation date, last activity) without leaving the chat. |
| 2.4.3 | The system shall provide agents with **read-only deep links** into the QcMetric app for the referenced entity, respecting RBAC (agent must have appropriate permissions). |
| 2.4.4 | The system shall support **cross-referencing multiple entities** within a single conversation (e.g., a Deviation linked to a CAPA linked to a Training Assignment). |
| 2.4.5 | The system shall expose an **entity lookup API** that agents can invoke to search and pull entity details by ID, name, or keyword across all modules: |
| | — Deviations (ID, status, stage, product, department) |
| | — CAPA (ID, status, stage, linked deviations) |
| | — Documents (ID, title, version, status, effective date) |
| | — Training Programs (ID, name, assigned users, completion %) |
| | — Dynamic Form Submissions (form name, submission ID, status) |
| | — Workflow Instances (workflow name, instance ID, current node) |
| | — Change Management (change request ID, status, impact) |
| | — Tasks (task ID, type, assignee, due date, status) |
| 2.4.6 | Referenced entities shall be **rendered as interactive cards** in the chat — showing a summary with a clickable link to the full entity in-app. |
| 2.4.7 | The system shall maintain a **conversation-entity association log** (audit trail) linking every entity referenced in a support interaction. |

### 2.5 @-Mention Context Picker (Page Context)

| # | Requirement |
|---|-------------|
| 2.5.1 | Typing `@` in the chat input (by either user or agent) shall trigger a **context picker dropdown** with categorized search. |
| 2.5.2 | The context picker shall support the following **mention categories** with prefixes: |
| | — `@deviation:` → Search deviations (e.g., `@deviation:DEV-2024-0042`) |
| | — `@capa:` → Search CAPAs (e.g., `@capa:CAPA-2025-015`) |
| | — `@document:` → Search documents (e.g., `@document:SOP-QA-001`) |
| | — `@training:` → Search training programs (e.g., `@training:GMP Basics`) |
| | — `@form:` → Search dynamic form submissions |
| | — `@workflow:` → Search workflow instances |
| | — `@change:` → Search change requests |
| | — `@task:` → Search tasks |
| | — `@user:` → Search users (e.g., `@user:John Smith`) |
| | — `@page:` → Reference a specific app page/module by name |
| 2.5.3 | The context picker shall support **fuzzy search** — partial ID, title, or keyword matching with results ranked by relevance and recency. |
| 2.5.4 | Each mention result shall display a **compact preview**: entity icon, ID, title/name, current status badge, and module tag. |
| 2.5.5 | Upon selection, the mention shall render as an **inline chip/tag** in the message with: entity type icon, short label, and a hover tooltip showing full details. |
| 2.5.6 | Clicking a mention chip shall **navigate to the entity** in the QcMetric app (respecting RBAC — show "Access Denied" if the user lacks permission). |
| 2.5.7 | The context picker shall support **keyboard navigation** (arrow keys to navigate, Enter to select, Escape to dismiss). |
| 2.5.8 | Mentioned entities shall be **indexed** in the conversation metadata for search and reporting (e.g., "Show all support tickets that reference Deviation DEV-2024-0042"). |
| 2.5.9 | The system shall support **multi-mention** — multiple entities can be referenced in a single message. |
| 2.5.10 | The `@page:` mention shall list **all QcMetric modules/pages** (Dashboard, Deviations, CAPA, Documents, Training, Dynamic Forms, Dynamic Workflows, Reports, Settings, Tasks, Role Matrix, Master Data, Change Management) and insert a deep link. |
| 2.5.11 | Agents shall see an **enriched view** of mentions — when an entity is mentioned, a collapsible detail card auto-expands in the side panel showing full entity data. |

---

## 3. Ticket / Case Management

| # | Requirement |
|---|-------------|
| 3.1 | Every support interaction (voice or text) shall auto-create a **support ticket** with a unique ID (e.g., `TKT-2026-00001`). |
| 3.2 | Tickets shall have configurable **statuses**: New → Open → In Progress → Awaiting User → Resolved → Closed → Reopened. |
| 3.3 | Tickets shall have **priority levels**: Critical, High, Medium, Low — auto-assigned based on the referenced entity's module and status (e.g., a Critical Deviation auto-escalates to High priority). |
| 3.4 | Tickets shall support **categorization**: Module (Deviation, CAPA, Documents, etc.), Issue Type (Bug, How-To, Access Request, Data Issue, Configuration), and Sub-Category. |
| 3.5 | The system shall support **SLA timers** per priority level (e.g., Critical = 1 hr first response, 4 hr resolution) with escalation triggers on breach. |
| 3.6 | Tickets shall support **escalation rules** — auto-escalate to Level-2/Level-3 based on SLA breach, keyword detection, or agent request. |
| 3.7 | Tickets shall maintain a **full audit trail**: every status change, assignment, comment, and entity reference logged with timestamp and actor. |
| 3.8 | The system shall support **ticket merging** (duplicate detection) and **ticket splitting** (multi-issue separation). |
| 3.9 | The system shall integrate with the existing **Notify-To module** for ticket event notifications (created, assigned, escalated, resolved) via Email, SMS, In-App, and Push channels. |
| 3.10 | All tickets shall be scoped to the **current tenant** (multi-tenancy). |

---

## 4. Routing & Queue Management

| # | Requirement |
|---|-------------|
| 4.1 | The system shall support **intelligent routing** based on: agent skill group, current load, availability, and conversation language. |
| 4.2 | The system shall support **queue management** — FIFO with priority override, configurable max queue size, and estimated wait time display to users. |
| 4.3 | The system shall support **round-robin**, **least-busy**, and **skill-based** routing algorithms, configurable per tenant. |
| 4.4 | If no agents are available, the system shall offer the user: **leave a message** (creates ticket), **schedule a callback**, or **continue with AI chatbot**. |
| 4.5 | The system shall support **business hours** configuration per tenant with after-hours auto-response and ticket creation. |
| 4.6 | Supervisors shall be able to **manually reassign** conversations between agents. |

---

## 5. Knowledge Base Integration

| # | Requirement |
|---|-------------|
| 5.1 | The system shall include a **searchable Knowledge Base (KB)** for agents and users, organized by module. |
| 5.2 | KB articles shall be **linkable** within chat via `@kb:` mention (e.g., `@kb:How to create a deviation`). |
| 5.3 | The AI chatbot shall use the KB as its **primary data source** for autonomous responses. |
| 5.4 | The system shall support **article suggestions** — when a user describes an issue, auto-suggest top 3 relevant KB articles. |
| 5.5 | Agents shall be able to **create KB articles** directly from resolved tickets (ticket-to-article conversion). |

---

## 6. AI & Automation

| # | Requirement |
|---|-------------|
| 6.1 | The system shall provide an **AI chatbot (Level-0 agent)** that handles routine queries: navigation help, status inquiries, FAQ, and basic troubleshooting. |
| 6.2 | The AI chatbot shall have **full read access** to the user's permitted data (via RBAC) to answer questions like "What is the status of my Deviation DEV-2024-0042?" |
| 6.3 | The AI shall provide **sentiment analysis** on conversations — flag negative sentiment to supervisors for proactive intervention. |
| 6.4 | The system shall support **auto-categorization** of incoming queries using NLP (map to Module + Issue Type). |
| 6.5 | The AI shall support **suggested next actions** for agents — based on conversation context and entity state, suggest relevant actions (e.g., "This deviation is in HOD Review — you may need to contact the HOD assigned"). |
| 6.6 | The system shall support **conversation summarization** — generate a summary at ticket closure for audit trail and KB candidate review. |
| 6.7 | The AI chatbot shall support **multi-language** (based on tenant language configuration). |

---

## 7. Reporting & Analytics

| # | Requirement |
|---|-------------|
| 7.1 | The system shall provide a **Support Dashboard** with KPIs: total tickets, open vs. closed, average resolution time, CSAT score, first-contact resolution rate, SLA compliance %. |
| 7.2 | The system shall provide **agent-level reports**: tickets handled, average handle time, CSAT per agent, escalation rate. |
| 7.3 | The system shall provide **module-level reports**: support volume per QcMetric module (which modules generate the most support requests). |
| 7.4 | The system shall provide **trend analysis**: ticket volume over time, peak hours, recurring issues. |
| 7.5 | The system shall provide **entity reference analytics**: most-referenced entities in support conversations (e.g., "Deviation DEV-2024-0042 was referenced in 15 tickets this month"). |
| 7.6 | Reports shall be **exportable** as PDF and Excel. |
| 7.7 | The system shall support **scheduled report delivery** via the Notify-To module. |

---

## 8. Security & Compliance

| # | Requirement |
|---|-------------|
| 8.1 | All support data shall be **tenant-isolated** (multi-tenancy). |
| 8.2 | Agent access to entity data shall respect **RBAC** via the existing `usePermissions` system. |
| 8.3 | Voice recordings and chat transcripts shall be **encrypted at rest and in transit**. |
| 8.4 | The system shall maintain a **complete audit trail** for all support interactions (GxP compliance — 21 CFR Part 11 aligned). |
| 8.5 | The system shall support **data retention policies** — configurable per tenant (e.g., retain transcripts for 7 years). |
| 8.6 | PII/PHI data displayed in support context shall be **masked** based on agent role level. |
| 8.7 | The system shall support **session timeout** and re-authentication for agents handling sensitive data. |

---

## 9. Integration Points (with Existing QcMetric Modules)

| Integration | Description |
|-------------|-------------|
| **Auth API** (`ENV_CONFIG.API_BASE_URL`) | Agent authentication, user lookup, tenant context, RBAC validation |
| **Workflow API** (`ENV_CONFIG.WORKFLOW_API_URL`) | Entity lookup (Deviations, CAPA, Forms, Workflows, Tasks), @-mention data source |
| **CMS API** (`ENV_CONFIG.CMS_API_URL`) | Document entity lookup, KB article storage |
| **Training API** (`ENV_CONFIG.TRAINING_API_URL`) | Training program/assignment lookup |
| **Notify-To Module** | Ticket event notifications (email, SMS, in-app, push) |
| **SignalR Hub** | Real-time chat delivery, typing indicators, call status, agent presence |
| **Redux Store** | Agent state, active conversations, ticket state, UI state |

---

## 10. Non-Functional Requirements

| # | Requirement |
|---|-------------|
| 10.1 | Chat message delivery latency shall be **< 500ms** (P95) via SignalR. |
| 10.2 | The system shall support **500+ concurrent conversations** per tenant. |
| 10.3 | Voice call quality shall maintain **MOS ≥ 3.5** under normal network conditions. |
| 10.4 | The @-mention context picker shall return search results within **< 300ms**. |
| 10.5 | Chat widget shall add **< 50KB** (gzipped) to page bundle size. |
| 10.6 | The system shall support **offline message queuing** — messages sent while disconnected are queued and delivered on reconnect. |
| 10.7 | All UI components shall be **responsive** (desktop, tablet, mobile). |
| 10.8 | The system shall provide **99.9% uptime** for the chat service. |

---

## 11. UI Component Summary

| Component | Location (Proposed) |
|-----------|-------------------|
| Chat Widget (floating) | `lib/components/support/SupportChatWidget.tsx` |
| Agent Dashboard | `lib/components/support/AgentDashboard.tsx` |
| Context Picker (@-mention) | `lib/components/support/ContextPicker.tsx` |
| Entity Card (inline) | `lib/components/support/EntityCard.tsx` |
| Voice Call Panel | `lib/components/support/VoiceCallPanel.tsx` |
| Ticket List & Detail | `lib/components/support/TicketList.tsx`, `TicketDetail.tsx` |
| KB Article Viewer | `lib/components/support/KBArticleViewer.tsx` |
| Support Reports | `lib/components/support/SupportReports.tsx` |
| Redux Slice | `lib/components/support/support.slice.ts` |
| Service Layer | `lib/components/support/support.service.ts` |
| Models | `lib/components/support/support.model.ts` |
| Page Route | `app/support/page.tsx` → `SupportClient.tsx` |

---

## 12. @-Mention Workflow (Visual)

```
User types "@" in chat input
        │
        ▼
┌─────────────────────────┐
│   Context Picker Opens   │
│  ┌─────────────────────┐ │
│  │ 🔍 Search...        │ │
│  ├─────────────────────┤ │
│  │ 📋 Deviations       │ │
│  │ 🛡 CAPA             │ │
│  │ 📄 Documents        │ │
│  │ 🎓 Training         │ │
│  │ 📝 Forms            │ │
│  │ ⚙ Workflows         │ │
│  │ 🔄 Changes          │ │
│  │ ✅ Tasks            │ │
│  │ 👤 Users            │ │
│  │ 📍 Pages            │ │
│  │ 📖 Knowledge Base   │ │
│  └─────────────────────┘ │
└─────────────────────────┘
        │ User selects category + entity
        ▼
┌─────────────────────────────────────┐
│  Chat Message with Inline Chip      │
│                                     │
│  "Please check [DEV-2024-0042]      │
│   which is linked to [CAPA-025]"    │
│                                     │
│  Agent sees side-panel with:        │
│  ┌────────────────────────┐         │
│  │ DEV-2024-0042          │         │
│  │ Status: QA Review      │         │
│  │ Stage: 5/8             │         │
│  │ Product: Amoxicillin   │         │
│  │ Dept: Quality Control  │         │
│  │ [Open in QcMetric →]   │         │
│  └────────────────────────┘         │
└─────────────────────────────────────┘
```

---

*End of URS Document*
