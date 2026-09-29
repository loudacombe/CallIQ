-- Migration number: 0001 	 2026-09-29T00:47:37.436Z
-- CallIQ Initial Database Schema
-- Every call. Every outcome. Every opportunity.

PRAGMA foreign_keys = ON;

-- Organisations using CallIQ
CREATE TABLE organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CallIQ users / consultants / managers
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'consultant',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Customers / contacts
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    reference_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Every call recorded in CallIQ
CREATE TABLE calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    contact_id INTEGER,
    consultant_id INTEGER,

    direction TEXT NOT NULL,
    call_reason TEXT,
    outcome TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    notes TEXT,

    appointment_booked INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (consultant_id) REFERENCES users(id)
);

-- Follow-up work created from calls
CREATE TABLE follow_ups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    call_id INTEGER,
    contact_id INTEGER,
    assigned_to INTEGER,

    due_at TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,

    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (call_id) REFERENCES calls(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Appointments generated from calls
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    call_id INTEGER,
    contact_id INTEGER,
    assigned_to INTEGER,

    appointment_at TEXT,
    status TEXT NOT NULL DEFAULT 'booked',
    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (call_id) REFERENCES calls(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Helpful indexes for dashboard/reporting speed
CREATE INDEX idx_calls_organization
ON calls(organization_id);

CREATE INDEX idx_calls_created_at
ON calls(created_at);

CREATE INDEX idx_calls_consultant
ON calls(consultant_id);

CREATE INDEX idx_followups_due
ON follow_ups(due_at);

CREATE INDEX idx_followups_status
ON follow_ups(status);