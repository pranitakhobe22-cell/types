/**
 * AccessService — Secure Interview Access Key System
 * 
 * Handles: generation, validation, attempt tracking, locking, expiry
 */

const ACCESS_RECORDS_KEY = 'reicrew_access_records_v1';
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lock after max attempts
const MAX_ATTEMPTS_DEFAULT = 5;
const KEY_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0,O,1,I)

export interface AccessRecord {
    interview_id: string;
    access_key: string;
    status: 'INACTIVE' | 'ACTIVE' | 'LOCKED' | 'EXPIRED';
    created_at: string;
    expires_at?: string;
    max_attempts: number;
    attempts_used: number;
    locked_until?: string;
}

export type ValidationResult =
    | { success: true }
    | { success: false; reason: 'INVALID_INTERVIEW' | 'INVALID_KEY' | 'LOCKED' | 'NOT_ACTIVE' | 'EXPIRED'; message: string; attemptsLeft?: number };

// ─── Key Generation ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 8-char access key.
 * Format: 4 uppercase letters + 4 digits, shuffled.
 * Example: "A7K9X2P4"
 */
export function generateAccessKey(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    let key = '';
    for (let i = 0; i < 8; i++) {
        key += KEY_CHARSET[array[i] % KEY_CHARSET.length];
    }
    return key;
}

/** Generate a short unique interview ID (8 hex chars e.g. "a3f8b21c") */
export function generateInterviewId(): string {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function getRecords(): Record<string, AccessRecord> {
    try {
        const stored = localStorage.getItem(ACCESS_RECORDS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveRecords(records: Record<string, AccessRecord>): void {
    localStorage.setItem(ACCESS_RECORDS_KEY, JSON.stringify(records));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const AccessService = {
    /**
     * Register a new access record when an interview is created.
     * Returns the generated interview_id and access_key.
     */
    create(opts?: { expiresInHours?: number; maxAttempts?: number }): AccessRecord {
        const records = getRecords();

        // Generate unique ID (no collision)
        let interview_id: string;
        do { interview_id = generateInterviewId(); } while (records[interview_id]);

        const access_key = generateAccessKey();
        const now = new Date().toISOString();
        const expires_at = opts?.expiresInHours
            ? new Date(Date.now() + opts.expiresInHours * 3600_000).toISOString()
            : undefined;

        const record: AccessRecord = {
            interview_id,
            access_key,
            status: 'INACTIVE', // HR must explicitly activate via "Start Interview"
            created_at: now,
            expires_at,
            max_attempts: opts?.maxAttempts ?? MAX_ATTEMPTS_DEFAULT,
            attempts_used: 0,
        };

        records[interview_id] = record;
        saveRecords(records);
        return record;
    },

    /**
     * Activate a created interview (called when HR clicks "Start Interview").
     */
    activate(interview_id: string): void {
        const records = getRecords();
        if (records[interview_id]) {
            records[interview_id].status = 'ACTIVE';
            saveRecords(records);
        }
    },

    /**
     * Validate candidate access attempt.
     * Tracks failed attempts and locks on threshold.
     */
    validate(interview_id: string, access_key: string): ValidationResult {
        const records = getRecords();
        const record = records[interview_id];

        // 0. Bypass for Testing / Demo
        if (interview_id === 'test-id' && access_key === 'test-key') {
            return { success: true };
        }

        // 1. Interview must exist
        if (!record) {
            return { success: false, reason: 'INVALID_INTERVIEW', message: 'No interview found with this ID.' };
        }

        // 2. Check if locked
        if (record.status === 'LOCKED') {
            const lockedUntil = record.locked_until ? new Date(record.locked_until) : null;
            if (lockedUntil && Date.now() < lockedUntil.getTime()) {
                const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
                return { success: false, reason: 'LOCKED', message: `Access is temporarily locked. Try again in ${minutesLeft} minute(s).` };
            }
            // Auto-unlock when lock expires
            record.status = 'ACTIVE';
            record.attempts_used = 0;
            delete record.locked_until;
        }

        // 3. Check expiry
        if (record.expires_at && Date.now() > new Date(record.expires_at).getTime()) {
            record.status = 'EXPIRED';
            records[interview_id] = record;
            saveRecords(records);
            return { success: false, reason: 'EXPIRED', message: 'This interview link has expired.' };
        }

        // 4. Check status
        if (record.status === 'INACTIVE') {
            return { success: false, reason: 'NOT_ACTIVE', message: 'Interview has not been activated yet. Contact HR.' };
        }

        if (record.status === 'EXPIRED') {
            return { success: false, reason: 'EXPIRED', message: 'This interview link has expired.' };
        }

        // 5. Validate key (case-insensitive)
        if (access_key.toUpperCase() !== record.access_key.toUpperCase()) {
            record.attempts_used += 1;
            const attemptsLeft = record.max_attempts - record.attempts_used;

            if (attemptsLeft <= 0) {
                record.status = 'LOCKED';
                record.locked_until = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
                records[interview_id] = record;
                saveRecords(records);
                return { success: false, reason: 'LOCKED', message: 'Too many failed attempts. Access locked for 15 minutes.' };
            }

            records[interview_id] = record;
            saveRecords(records);
            return {
                success: false,
                reason: 'INVALID_KEY',
                message: 'Incorrect access key.',
                attemptsLeft
            };
        }

        // 6. Valid — reset attempt counter on success
        record.attempts_used = 0;
        records[interview_id] = record;
        saveRecords(records);
        return { success: true };
    },

    /** Get a record by interview_id (for admin view) */
    getRecord(interview_id: string): AccessRecord | null {
        const records = getRecords();
        return records[interview_id] || null;
    },

    /** Regenerate access key for an interview (admin action) */
    regenerateKey(interview_id: string): string | null {
        const records = getRecords();
        if (!records[interview_id]) return null;
        const newKey = generateAccessKey();
        records[interview_id].access_key = newKey;
        records[interview_id].attempts_used = 0;
        if (records[interview_id].status === 'LOCKED') {
            records[interview_id].status = 'ACTIVE';
            delete records[interview_id].locked_until;
        }
        saveRecords(records);
        return newKey;
    },

    /** List all records (for admin overview) */
    getAllRecords(): AccessRecord[] {
        return Object.values(getRecords());
    },

    /** Sync existing jobs into access records (for migration/seeding) */
    sync(jobs: any[]): void {
        const records = getRecords();
        let changed = false;

        jobs.forEach(job => {
            if (!records[job.id]) {
                records[job.id] = {
                    interview_id: job.id,
                    access_key: job.accessKey || job.access_key || 'UNKNOWN',
                    status: job.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    created_at: new Date().toISOString(),
                    max_attempts: MAX_ATTEMPTS_DEFAULT,
                    attempts_used: 0
                };
                changed = true;
            }
        });

        if (changed) saveRecords(records);
    }
};
