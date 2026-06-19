import { ErrorLog } from "../types";

const ERROR_LOGS_KEY = 'reicrew_error_logs_v1';

export const ErrorLogService = {
  logError(
    category: 'interview' | 'evaluation' | 'database' | 'system' | 'api' | 'proctoring',
    message: string,
    details?: any,
    sessionId?: string,
    candidateName?: string
  ): void {
    try {
      const logsStr = localStorage.getItem(ERROR_LOGS_KEY);
      const logs: ErrorLog[] = logsStr ? JSON.parse(logsStr) : [];
      
      const newLog: ErrorLog = {
        id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        category,
        message: message || "Unknown error",
        details: details ? (typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)) : undefined,
        sessionId: sessionId || localStorage.getItem('current_session_id') || undefined,
        candidateName: candidateName || undefined
      };
      
      logs.unshift(newLog); // Add to beginning (latest first)
      
      // Limit logs to keep localStorage slim
      if (logs.length > 200) {
        logs.pop();
      }
      
      localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(logs));
      console.warn(`[ErrorLogService] [${category.toUpperCase()}] ${message}`, details);
    } catch (e) {
      console.error("Failed to write to ErrorLogService:", e);
    }
  },

  getErrors(): ErrorLog[] {
    try {
      const logsStr = localStorage.getItem(ERROR_LOGS_KEY);
      return logsStr ? JSON.parse(logsStr) : [];
    } catch (e) {
      return [];
    }
  },

  clearErrors(): void {
    try {
      localStorage.removeItem(ERROR_LOGS_KEY);
    } catch (e) {
      console.error("Failed to clear ErrorLogService logs:", e);
    }
  }
};
