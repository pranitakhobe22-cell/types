import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { InterviewSession, Question, ErrorLog, JobPost } from '../types';
import {
    Users, LogOut, Search, Shield, Edit, Plus, Save, X, Trash2, Play,
    Activity, ToggleLeft, ToggleRight, ChevronRight, Link, Copy, CheckCircle,
    Server, Database, AlertTriangle, Terminal, CheckCircle2, BookOpen, RefreshCw, FileText,
    Download, Sliders, Upload
} from 'lucide-react';

import { SystemHealth } from '../services/healthService';
import { SupabaseService } from '../services/supabaseService';
import { SessionReportView } from './SessionReportView';
import { ErrorLogService } from '../services/errorLogService';
import { getQuestionsForRole } from '../services/aiService';
import { submitAnswer } from '../services/apiService';

interface AdminDashboardProps {
    onLogout: () => void;
    health?: SystemHealth | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, health }) => {
    // Tab state
    const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'system' | 'errors'>('candidates');

    // Candidate Sessions state
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Questions Editor state
    const [selectedRole, setSelectedRole] = useState<'CSE' | 'ECE' | 'APTITUDE'>('CSE');
    const [isUploading, setIsUploading] = useState(false);
    const [questionsList, setQuestionsList] = useState<Question[]>([]);
    const [questionsFilter, setQuestionsFilter] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [questionsSubTab, setQuestionsSubTab] = useState<'editor' | 'settings' | 'analytics'>('editor');

    // New Questions Search, Filter, Selection & Pagination state
    const [questionSearchQuery, setQuestionSearchQuery] = useState('');
    const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('all');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    
    // Dialog / Modal triggers
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [balanceModalOpen, setBalanceModalOpen] = useState(false);
    const [balanceSuggestions, setBalanceSuggestions] = useState<{ id: string | number; text: string; current: string; suggested: string }[]>([]);
    
    // Import Wizard state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFileContent, setImportFileContent] = useState<string | null>(null);
    const [importFileName, setImportFileName] = useState('');
    const [importPreviewData, setImportPreviewData] = useState<{
        questions: any[];
        validCount: number;
        errors: { row: number; msg: string; severity: 'error' | 'warning' }[];
        warningsCount: number;
        errorsCount: number;
    } | null>(null);
    const [importMergeStrategy, setImportMergeStrategy] = useState<'replace' | 'append'>('append');

    // Job Settings (Global strategy & Technical Stage Overrides)
    const [difficultyStrategy, setDifficultyStrategy] = useState<'Adaptive' | 'Easy Only' | 'Medium Only' | 'Hard Only'>('Adaptive');
    const [stageOverrides, setStageOverrides] = useState<{
        Fundamentals?: 'Adaptive' | 'Easy Only' | 'Medium Only' | 'Hard Only';
        Core?: 'Adaptive' | 'Easy Only' | 'Medium Only' | 'Hard Only';
        Scenario?: 'Adaptive' | 'Easy Only' | 'Medium Only' | 'Hard Only';
    }>({
        Fundamentals: 'Adaptive',
        Core: 'Adaptive',
        Scenario: 'Adaptive'
    });

    // Error Logs state
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [errorsFilter, setErrorsFilter] = useState<string>('all');
    const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

    // Test AI Grading Simulator state
    const [testAnswer, setTestAnswer] = useState('');
    const [testResult, setTestResult] = useState<any | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        setTestAnswer('');
        setTestResult(null);
        setIsTesting(false);
    }, [editingQuestion]);

    const handleTestGrading = async () => {
        if (!editingQuestion || !testAnswer.trim()) return;
        setIsTesting(true);
        setTestResult(null);
        try {
            const mockCandidate = { name: "Test Admin", isDemo: true };
            const result = await submitAnswer(
                mockCandidate as any,
                editingQuestion,
                testAnswer,
                undefined,
                undefined,
                "test-session-id"
            );
            setTestResult(result.evaluation);
        } catch (err: any) {
            console.error("Test grading failed:", err);
            setTestResult({
                error: err.message || "Failed to contact AI evaluator. Please check your network and try again."
            });
        } finally {
            setIsTesting(false);
        }
    };

    // Loading indicator
    const [isLoading, setIsLoading] = useState(true);

    // Load initial candidate sessions and error logs
    const loadSessionsAndErrors = async () => {
        setIsLoading(true);
        try {
            // Load Sessions
            const rawSessions = await SupabaseService.getAllSessions();
            if (rawSessions) {
                const mappedSessions: InterviewSession[] = rawSessions.map(rs => ({
                    id: rs.session_id,
                    candidate: {
                        name: rs.candidate_name || 'Unknown',
                        email: rs.candidate_email || '',
                        role: rs.job_title || 'Unknown',
                        profilePhoto: rs.profile_photo_url,
                        idCardImage: rs.id_card_image_url
                    },
                    status: rs.session_status,
                    date: rs.session_date,
                    overallScore: rs.total_score || 0,
                    proctoringReport: {
                        violations: rs.all_proctoring_events ? rs.all_proctoring_events.map((v: any) => ({
                            type: v.type || v.event_type,
                            severity: v.severity === 'High' ? 10 : (v.severity === 'Medium' ? 5 : 1),
                            message: v.message,
                            timestamp: new Date(v.time || v.occurred_at).getTime(),
                            snapshot_url: v.snapshot_url,
                            clip_url: v.clip_url
                        })) : []
                    },
                    evaluationReport: {
                        total_score: rs.total_score,
                        final_verdict: rs.final_verdict,
                        scoring_basis: rs.scoring_basis,
                        evaluation_logic: rs.evaluation_logic
                    },
                    results: rs.all_questions_and_answers ? rs.all_questions_and_answers.map((qb: any) => ({
                        questionText: qb.question_text,
                        userAnswer: qb.candidate_answer,
                        contentScore: qb.content_score,
                        grammarScore: qb.grammar_score,
                        fluencyScore: qb.fluency_score,
                        confidenceScore: qb.confidence_score,
                        verdict: qb.verdict,
                        feedback: qb.feedback
                    })) : []
                } as unknown as InterviewSession));

                const sortedSessions = [...mappedSessions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                });
                setSessions(sortedSessions);
            }
        } catch (err) {
            console.error("Failed to load sessions:", err);
            ErrorLogService.logError('system', "Failed to load interview sessions on admin dashboard", err);
        }

        // Load error logs from service
        setErrorLogs(ErrorLogService.getErrors());
        setIsLoading(false);
    };

    // Load candidate sessions on mount and whenever tab changes to refresh
    useEffect(() => {
        loadSessionsAndErrors();
    }, [activeTab]);

    // Load Questions when selectedRole changes
    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);
            try {
                // Try fetching corresponding job post from database
                const jobs = await SupabaseService.getAllJobs();
                const matchedJob = jobs.find(j => 
                    j.title.toLowerCase().includes(selectedRole.toLowerCase()) || 
                    (selectedRole === 'CSE' && j.title.toLowerCase().includes('computer')) ||
                    (selectedRole === 'ECE' && j.title.toLowerCase().includes('electron'))
                );
                
                if (matchedJob) {
                    if (matchedJob.settings) {
                        setDifficultyStrategy(matchedJob.settings.difficultyStrategy || 'Adaptive');
                        setStageOverrides(matchedJob.settings.stageOverrides || {
                            Fundamentals: 'Adaptive',
                            Core: 'Adaptive',
                            Scenario: 'Adaptive'
                        });
                    } else {
                        setDifficultyStrategy('Adaptive');
                        setStageOverrides({
                            Fundamentals: 'Adaptive',
                            Core: 'Adaptive',
                            Scenario: 'Adaptive'
                        });
                    }

                    if (matchedJob.questions && matchedJob.questions.length > 0) {
                        const parsed = typeof matchedJob.questions === 'string' ? JSON.parse(matchedJob.questions) : matchedJob.questions;
                        setQuestionsList(parsed);
                        console.log(`Loaded ${parsed.length} questions from database for ${selectedRole}`);
                    } else {
                        const fallback = getQuestionsForRole(selectedRole);
                        setQuestionsList(fallback);
                    }
                } else {
                    // Fallback to local storage or default bank
                    const fallback = getQuestionsForRole(selectedRole);
                    setQuestionsList(fallback);
                    setDifficultyStrategy('Adaptive');
                    setStageOverrides({
                        Fundamentals: 'Adaptive',
                        Core: 'Adaptive',
                        Scenario: 'Adaptive'
                    });
                    console.log(`Loaded ${fallback.length} fallback questions for ${selectedRole}`);
                }
            } catch (err) {
                console.error("Failed to fetch questions:", err);
                const fallback = getQuestionsForRole(selectedRole);
                setQuestionsList(fallback);
                setDifficultyStrategy('Adaptive');
                setStageOverrides({
                    Fundamentals: 'Adaptive',
                    Core: 'Adaptive',
                    Scenario: 'Adaptive'
                });
            }
            setIsLoading(false);
        };
        loadQuestions();
    }, [selectedRole]);

    // Question bank action: Save custom edits
    const handleSaveQuestions = async () => {
        setIsSaving(true);
        setSuccessMessage(null);
        try {
            // 1. Sync to local storage backup
            localStorage.setItem(`reicrew_questions_${selectedRole.toLowerCase()}`, JSON.stringify(questionsList));
            
            // 2. Sync to Supabase job posts
            const jobs = await SupabaseService.getAllJobs();
            const matchedJob = jobs.find(j => 
                j.title.toLowerCase().includes(selectedRole.toLowerCase()) || 
                (selectedRole === 'CSE' && j.title.toLowerCase().includes('computer')) ||
                (selectedRole === 'ECE' && j.title.toLowerCase().includes('electron'))
            );

            if (matchedJob) {
                const updatedJob: JobPost = {
                    ...matchedJob,
                    questions: questionsList,
                    settings: {
                        ...matchedJob.settings,
                        difficultyStrategy,
                        stageOverrides
                    }
                };
                // Sync using existing StorageService or SupabaseService
                await StorageService.saveJobs(jobs.map(j => j.id === matchedJob.id ? updatedJob : j));
                console.log(`Successfully synced edited questions and settings for ${selectedRole} to database`);
            } else {
                console.warn(`No job post found matching ${selectedRole} to sync database questions.`);
            }

            setSuccessMessage("Questions and difficulty settings saved successfully! All future interviews will use this configuration.");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            console.error("Failed to save questions:", err);
            ErrorLogService.logError('database', `Failed to save questions for ${selectedRole}: ${err.message || err}`, err);
            alert("Failed to save questions to database. Changes saved locally only.");
        } finally {
            setIsSaving(false);
        }
    };

    // Question bank action: Restore default question sets
    const handleResetQuestions = () => {
        if (window.confirm("Are you sure you want to restore the default questions? This will erase all custom edits for this role.")) {
            localStorage.removeItem(`reicrew_questions_${selectedRole.toLowerCase()}`);
            // Re-load questions from defaults
            const defaults = getQuestionsForRole(selectedRole);
            setQuestionsList(defaults);
            setSuccessMessage("Questions reset to default. Click 'Save Changes' to apply this to the database.");
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    // Question bank action: Edit fields inside the list
    const handleUpdateQuestion = (qId: number | string, field: keyof Question, value: any) => {
        const updated = questionsList.map(q => {
            if (q.id === qId) {
                const updatedQ = { ...q, [field]: value };
                return updatedQ;
            }
            return q;
        });
        setQuestionsList(updated);
    };

    // Question bank action: Add new blank question template
    const handleAddQuestion = () => {
        const newQ: Question = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            question: "Enter question text here...",
            difficulty: 'medium',
            type: questionsFilter !== 'all' ? (questionsFilter as any) : 'Core',
            category: "Technical",
            evaluationGuide: ["Explain the core concept or answer the question directly."],
            maxScore: 10
        };
        setQuestionsList([...questionsList, newQ]);
    };

    // Question bank action: Delete question from array
    const handleDeleteQuestion = (qId: number | string) => {
        if (window.confirm("Are you sure you want to delete this question? Remember to click 'Save Changes' to apply the deletion to the database.")) {
            setQuestionsList(questionsList.filter(q => q.id !== qId));
            if (editingQuestion && editingQuestion.id === qId) {
                setEditingQuestion(null);
                setIsAddModalOpen(false);
            }
        }
    };

    // Error log actions
    const handleClearErrorLogs = () => {
        if (window.confirm("Are you sure you want to clear all system error logs?")) {
            ErrorLogService.clearErrors();
            setErrorLogs([]);
            setExpandedErrorId(null);
        }
    };

    // CSV Candidate export helper
    const handleDownloadCSV = () => {
        if (sessions.length === 0) return;
        
        const headers = ['Candidate Name', 'Email', 'Role', 'Date', 'Status', 'Overall Score'];
        const rows = sessions.map(s => [
            s.candidate.name,
            s.candidate.email,
            s.candidate.role,
            new Date(s.date).toLocaleDateString(),
            s.status,
            `${s.overallScore}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reicrew_candidates_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filters candidate session search
    const filteredSessions = sessions.filter(s =>
        s.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.candidate.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Full multi-layered filtering
    const filteredQuestions = questionsList.filter(q => {
        // Stage filter
        if (questionsFilter !== 'all' && q.type !== questionsFilter) return false;
        // Search query
        if (questionSearchQuery) {
            const query = questionSearchQuery.toLowerCase();
            const textMatch = q.question.toLowerCase().includes(query);
            const categoryMatch = q.category?.toLowerCase().includes(query) || false;
            if (!textMatch && !categoryMatch) return false;
        }
        // Difficulty filter
        if (selectedDifficultyFilter !== 'all' && q.difficulty !== selectedDifficultyFilter) return false;
        // Category filter
        if (selectedCategoryFilter !== 'all' && q.category !== selectedCategoryFilter) return false;

        return true;
    });

    // Pagination calculations
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

    // Reset page to 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [questionSearchQuery, selectedDifficultyFilter, selectedCategoryFilter, questionsFilter, selectedRole]);

    // Checkbox selection helpers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedQuestions(currentQuestions.map(q => String(q.id)));
        } else {
            setSelectedQuestions([]);
        }
    };

    const handleSelectQuestion = (qId: string, checked: boolean) => {
        if (checked) {
            setSelectedQuestions([...selectedQuestions, qId]);
        } else {
            setSelectedQuestions(selectedQuestions.filter(id => id !== qId));
        }
    };

    // Bulk actions handler
    const handleBulkAction = (action: string) => {
        if (selectedQuestions.length === 0) {
            alert("No questions selected.");
            return;
        }

        let updated = [...questionsList];
        if (action === 'easy' || action === 'medium' || action === 'hard') {
            updated = questionsList.map(q => {
                if (selectedQuestions.includes(String(q.id))) {
                    return { 
                        ...q, 
                        difficulty: action as any,
                        version: (q.version || 1) + 1,
                        updatedAt: new Date().toISOString()
                    };
                }
                return q;
            });
            setSuccessMessage(`Updated difficulty to ${action} for ${selectedQuestions.length} questions.`);
        } else if (action === 'delete') {
            if (window.confirm(`Are you sure you want to delete the ${selectedQuestions.length} selected questions?`)) {
                updated = questionsList.filter(q => !selectedQuestions.includes(String(q.id)));
                setSuccessMessage(`Deleted ${selectedQuestions.length} questions.`);
            } else {
                return;
            }
        } else if (action === 'category') {
            const newCat = window.prompt("Enter new category name:");
            if (newCat !== null && newCat.trim() !== '') {
                updated = questionsList.map(q => {
                    if (selectedQuestions.includes(String(q.id))) {
                        return { 
                            ...q, 
                            category: newCat.trim(),
                            version: (q.version || 1) + 1,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return q;
                });
                setSuccessMessage(`Updated category to "${newCat.trim()}" for ${selectedQuestions.length} questions.`);
            } else {
                return;
            }
        }
        setQuestionsList(updated);
        setSelectedQuestions([]);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // JSON/CSV Question Exporter
    const handleExportQuestions = (format: 'json' | 'csv') => {
        if (questionsList.length === 0) {
            alert("No questions to export.");
            return;
        }

        if (format === 'json') {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questionsList, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `reicrew_questions_${selectedRole.toLowerCase()}_v${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } else {
            // CSV Format (excluding ideal_answer and topic)
            const headers = ['id', 'question', 'difficulty', 'type', 'category', 'evaluationGuide', 'version', 'updatedAt'];
            const rows = questionsList.map(q => {
                const evaluationGuideStr = q.evaluationGuide 
                    ? q.evaluationGuide.join(';') 
                    : '';
                return [
                    q.id,
                    `"${(q.question || '').replace(/"/g, '""')}"`,
                    q.difficulty || 'medium',
                    q.type || 'Core',
                    q.category || 'Technical',
                    `"${evaluationGuideStr.replace(/"/g, '""')}"`,
                    q.version || 1,
                    q.updatedAt || new Date().toISOString()
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `reicrew_questions_${selectedRole.toLowerCase()}_v${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    // JSON/CSV Question Uploader/Previewer
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportFileContent(content);
            processImportPreview(content, file.name.endsWith('.csv') ? 'csv' : 'json');
        };
        reader.readAsText(file);
    };

    const processImportPreview = (content: string, format: 'json' | 'csv') => {
        let parsedList: any[] = [];
        const errorsList: { row: number; msg: string; severity: 'error' | 'warning' }[] = [];
        let validCount = 0;
        let warningsCount = 0;
        let errorsCount = 0;

        try {
            if (format === 'json') {
                const data = JSON.parse(content);
                parsedList = Array.isArray(data) ? data : [data];
            } else {
                // Parse CSV
                const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length < 2) throw new Error("CSV file is empty or missing header row.");
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                
                const parseCsvRow = (text: string) => {
                    const result = [];
                    let insideQuote = false;
                    let entry = "";
                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === '"') {
                            insideQuote = !insideQuote;
                        } else if (char === ',' && !insideQuote) {
                            result.push(entry.trim());
                            entry = "";
                        } else {
                            entry += char;
                        }
                    }
                    result.push(entry.trim());
                    return result;
                };

                for (let i = 1; i < lines.length; i++) {
                    const values = parseCsvRow(lines[i]);
                    const item: any = {};
                    headers.forEach((h, idx) => {
                        let val = values[idx] || '';
                        val = val.replace(/^["']|["']$/g, '').replace(/""/g, '"');
                        item[h] = val;
                    });
                    parsedList.push(item);
                }
            }
        } catch (e: any) {
            alert("Error parsing file: " + e.message);
            return;
        }

        // Validate each parsed item
        const validatedQuestions = parsedList.map((item, index) => {
            const rowNumber = index + 2;
            const rowErrors: string[] = [];
            const rowWarnings: string[] = [];
            
            const questionText = item.question || item.text || '';
            if (!questionText.trim()) {
                rowErrors.push("Missing question text.");
            }

            let difficulty = String(item.difficulty || '').toLowerCase().trim();
            if (!difficulty) {
                rowErrors.push("Missing difficulty.");
            } else if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
                rowWarnings.push(`Invalid difficulty "${item.difficulty}", defaulting to "medium".`);
                difficulty = 'medium';
            }

            let type = item.type || item.stage || '';
            const validTypes = ['Fundamentals', 'Core', 'Scenario', 'Behavioral Experience', 'Behavioral Situation'];
            if (!type) {
                rowErrors.push("Missing flow stage (type).");
            } else {
                const matchedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase().trim());
                if (!matchedType) {
                    rowErrors.push(`Invalid flow stage "${type}". Must be one of: ${validTypes.join(', ')}`);
                } else {
                    type = matchedType;
                }
            }

            const category = item.category || (type.startsWith('Behavioral') ? 'Behavioral' : 'Technical');

            let evaluationGuide: string[] = [];
            if (item.evaluationGuide) {
                evaluationGuide = String(item.evaluationGuide).split(';').map(part => part.trim()).filter(Boolean);
            } else if (item.keyConcepts) {
                // Backward compatibility: Convert imported keyConcepts
                if (typeof item.keyConcepts === 'string') {
                    evaluationGuide = item.keyConcepts.split(';').map(part => {
                        const [concept] = part.split(':');
                        return (concept || '').trim();
                    }).filter(Boolean);
                } else if (Array.isArray(item.keyConcepts)) {
                    evaluationGuide = item.keyConcepts.map(c => typeof c === 'string' ? c : c.concept || '').filter(Boolean);
                }
            } else if (item.keyPoints) {
                if (typeof item.keyPoints === 'string') {
                    evaluationGuide = item.keyPoints.split(';').map(part => part.trim()).filter(Boolean);
                } else if (Array.isArray(item.keyPoints)) {
                    evaluationGuide = item.keyPoints.filter(Boolean);
                }
            }

            if (evaluationGuide.length === 0) {
                rowWarnings.push("No expected evaluation areas specified.");
                evaluationGuide.push("Explain the core concept or answer the question directly.");
            }

            const isDuplicate = questionsList.some(q => 
                q.question.toLowerCase().trim().replace(/[^a-z0-9]/g, '') === 
                questionText.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
            );
            if (isDuplicate) {
                rowWarnings.push("Potential duplicate: Question text matches an existing question in the bank.");
            }

            const version = item.version ? parseInt(item.version, 10) : 1;
            const updatedAt = item.updatedAt || new Date().toISOString();

            rowErrors.forEach(msg => {
                errorsList.push({ row: rowNumber, msg, severity: 'error' });
                errorsCount++;
            });
            rowWarnings.forEach(msg => {
                errorsList.push({ row: rowNumber, msg, severity: 'warning' });
                warningsCount++;
            });

            const isValid = rowErrors.length === 0;
            if (isValid) validCount++;

            return {
                id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                question: questionText,
                difficulty,
                type,
                category,
                evaluationGuide,
                maxScore: item.maxScore ? parseFloat(item.maxScore) : 10,
                version: isNaN(version) ? 1 : version,
                updatedAt,
                isValid
            };
        });

        setImportPreviewData({
            questions: validatedQuestions,
            validCount,
            errors: errorsList,
            warningsCount,
            errorsCount
        });
    };

    const handleCompleteImport = () => {
        if (!importPreviewData) return;

        const validQuestionsToImport = importPreviewData.questions
            .filter(q => q.isValid)
            .map(({ isValid, ...rest }) => rest as Question);

        if (validQuestionsToImport.length === 0) {
            alert("No valid questions found to import.");
            return;
        }

        if (importMergeStrategy === 'replace') {
            setQuestionsList(validQuestionsToImport);
            setSuccessMessage(`Successfully replaced question bank with ${validQuestionsToImport.length} imported questions.`);
        } else {
            const currentTexts = new Set(questionsList.map(q => q.question.toLowerCase().trim().replace(/[^a-z0-9]/g, '')));
            const filteredNew = validQuestionsToImport.filter(q => 
                !currentTexts.has(q.question.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
            );
            
            setQuestionsList([...questionsList, ...filteredNew]);
            setSuccessMessage(`Successfully appended ${filteredNew.length} new unique questions (skipped ${validQuestionsToImport.length - filteredNew.length} duplicates).`);
        }

        setImportModalOpen(false);
        setImportPreviewData(null);
        setImportFileContent(null);
        setImportFileName('');
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Modal Question Editor save handler
    const handleSaveModal = () => {
        if (!editingQuestion) return;
        if (!editingQuestion.question.trim()) {
            alert("Question text cannot be empty.");
            return;
        }

        let validAreas = (editingQuestion.evaluationGuide || []).map(a => a.trim()).filter(Boolean);
        if (selectedRole === 'APTITUDE') {
            if (validAreas.length === 0) {
                validAreas = ["Explain the core concept or select the correct option directly."];
            }
            if (!editingQuestion.options || editingQuestion.options.length < 4 || editingQuestion.options.some(o => !o.trim())) {
                alert("All 4 option fields must be filled out for Aptitude questions.");
                return;
            }
            if (!editingQuestion.answer || !['A', 'B', 'C', 'D'].includes(editingQuestion.answer.toUpperCase())) {
                alert("Please select a valid correct answer (A, B, C, or D).");
                return;
            }
        } else {
            if (validAreas.length === 0) {
                alert("At least one non-empty evaluation checklist area is required.");
                return;
            }
        }

        const updatedQ: Question = {
            ...editingQuestion,
            evaluationGuide: validAreas,
            version: isAddModalOpen ? 1 : (editingQuestion.version || 1) + 1,
            updatedAt: new Date().toISOString()
        };

        if (isAddModalOpen) {
            setQuestionsList([...questionsList, updatedQ]);
            setSuccessMessage("Added new question! Click 'Save Changes' to save to database.");
        } else {
            setQuestionsList(questionsList.map(q => q.id === editingQuestion.id ? updatedQ : q));
            setSuccessMessage("Updated question! Click 'Save Changes' to save to database.");
        }
        setEditingQuestion(null);
        setIsAddModalOpen(false);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingQuestion) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${editingQuestion.id || Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`;
            
            // Check if supabase exists
            const { supabase } = await import('../services/supabaseClient');
            if (!supabase) throw new Error("Supabase client is not available.");

            const { data, error: uploadError } = await supabase.storage
                .from('question-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('question-images')
                .getPublicUrl(fileName);

            setEditingQuestion({
                ...editingQuestion,
                imageUrl: publicUrl
            });
            alert("Image uploaded successfully!");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            alert(`Failed to upload image: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Filters error logs
    const filteredErrors = errorLogs.filter(err => {
        if (errorsFilter === 'all') return true;
        return err.category === errorsFilter;
    });

    // Count statistics for the flow diagram stages
    const getStageCount = (type: string) => {
        return questionsList.filter(q => q.type === type).length;
    };

    return (
        <div className="h-screen w-screen flex bg-[#F8FAFC] overflow-hidden font-sans text-slate-900 selection:bg-indigo-500/10">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-900 shadow-xl">
                <div className="p-6 flex items-center gap-3 text-white border-b border-slate-900">
                    <Shield className="text-indigo-500 shrink-0" size={28} />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Reicrew AI</h1>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5">
                    {[
                        { id: 'candidates', icon: FileText, label: 'Evaluation Reports' },
                        { id: 'questions', icon: BookOpen, label: 'Interview Flow Editor' },
                        { id: 'system', icon: Activity, label: 'System Health' },
                        { id: 'errors', icon: AlertTriangle, label: 'System Error Logs' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { 
                                setActiveTab(item.id as any); 
                                setSelectedSession(null); 
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                                activeTab === item.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                                    : 'hover:bg-slate-900/60 hover:text-white text-slate-400'
                            }`}
                        >
                            <item.icon size={18} className="shrink-0" /> 
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-900 bg-slate-950/50">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-300 text-sm font-medium">
                        <LogOut size={18} className="shrink-0" /> Exit Portal
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'candidates' && (selectedSession ? `Session Report: ${selectedSession.candidate.name}` : 'Evaluation Reports & History')}
                            {activeTab === 'questions' && `Questions & Flow Editor: ${selectedRole}`}
                            {activeTab === 'system' && 'Infrastructure & System Health'}
                            {activeTab === 'errors' && 'Structured Error Logs'}
                        </h2>
                    </div>

                    {selectedSession && activeTab === 'candidates' && (
                        <button 
                            onClick={() => setSelectedSession(null)} 
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                            ← Back to List
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    
                    {/* TAB 1: EVALUATION REPORTS / SESSION HISTORY */}
                    {activeTab === 'candidates' && !selectedSession && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{sessions.length}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Interviews</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">
                                            {sessions.length > 0 
                                                ? `${Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length)}%` 
                                                : '0%'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Average Score</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">
                                            {sessions.reduce((acc, s) => acc + (s.proctoringReport?.violations?.length || 0), 0)}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Integrity Flags</p>
                                    </div>
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl w-full sm:max-w-md focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/5 transition-all">
                                        <Search size={18} className="text-slate-400 shrink-0" />
                                        <input
                                            placeholder="Search by candidate name or email..."
                                            className="bg-transparent outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleDownloadCSV}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 active:scale-[0.98]"
                                    >
                                        <Download size={14} className="shrink-0" /> EXPORT ALL DATA
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Candidate</th>
                                                <th className="px-6 py-4">Assessment Path</th>
                                                <th className="px-6 py-4">Date Conducted</th>
                                                <th className="px-6 py-4">Overall Score</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredSessions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium bg-slate-50/20">
                                                        No candidate interview sessions found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSessions.map((s) => (
                                                    <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{s.candidate.name}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{s.candidate.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {s.candidate.role}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">
                                                            {new Date(s.date).toLocaleDateString()} at {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-bold text-base ${
                                                                s.overallScore >= 75 ? 'text-emerald-600' : s.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                            }`}>
                                                                {Math.round(s.overallScore)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                                                s.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                s.status === 'TERMINATED' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                                            }`}>
                                                                {s.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => setSelectedSession(s)} 
                                                                className="px-4 py-2 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 bg-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                            >
                                                                View Report
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'candidates' && selectedSession && (
                        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                            {selectedSession.evaluationReport?.evaluation_logic ? (
                                <SessionReportView
                                    candidate={{
                                        name: selectedSession.candidate.name,
                                        email: selectedSession.candidate.email,
                                        role: selectedSession.candidate.role
                                    }}
                                    evalReport={selectedSession.evaluationReport.evaluation_logic}
                                    sessionId={selectedSession.id}
                                    mode="admin"
                                />
                            ) : (
                                <div className="bg-white p-12 border border-slate-200 rounded-3xl text-center shadow-sm max-w-lg mx-auto mt-10">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="font-bold text-slate-800 text-lg">No AI Report Found</h3>
                                    <p className="text-slate-400 text-sm mt-2">The evaluation report is either missing or failed generation for this session.</p>
                                    <button 
                                        onClick={() => setSelectedSession(null)} 
                                        className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                                    >
                                        Return to Sessions
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: INTERVIEW FLOW & QUESTION EDITOR */}
                    {activeTab === 'questions' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
                            {/* Toggle between CSE and ECE */}
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">Question Bank Selection</h3>
                                    <p className="text-xs text-slate-400">Choose the technical domain questions to edit.</p>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                    <button
                                        onClick={() => { setSelectedRole('CSE'); setQuestionsFilter('all'); }}
                                        className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                                            selectedRole === 'CSE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'
                                        }`}
                                    >
                                        Computer Science (CSE)
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRole('ECE'); setQuestionsFilter('all'); }}
                                        className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                                            selectedRole === 'ECE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'
                                        }`}
                                    >
                                        Electronics (ECE)
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRole('APTITUDE'); setQuestionsFilter('all'); }}
                                        className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                                            selectedRole === 'APTITUDE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-550 hover:text-slate-800'
                                        }`}
                                    >
                                        Aptitude
                                    </button>
                                </div>
                            </div>

                            {/* SUB-TAB SYSTEM FOR RECRUITER FOCUS */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-md shadow-sm">
                                <button
                                    onClick={() => setQuestionsSubTab('editor')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        questionsSubTab === 'editor' 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Questions
                                </button>
                                <button
                                    onClick={() => setQuestionsSubTab('settings')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        questionsSubTab === 'settings' 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Interview Settings
                                </button>
                                <button
                                    onClick={() => setQuestionsSubTab('analytics')}
                                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                        questionsSubTab === 'analytics' 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Analytics
                                </button>
                            </div>

                            {/* SUB-TAB CONTENT 1: QUESTIONS EDITOR */}
                            {questionsSubTab === 'editor' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* DYNAMIC INTERVIEW FLOW CHART */}
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                <Sliders size={20} className="text-indigo-500" /> Active Adaptive Interview Flow
                                            </h3>
                                            <p className="text-xs text-slate-400">Click on any stage in the path below to filter and edit its questions.</p>
                                        </div>

                                        <div className="flex flex-col xl:flex-row items-stretch gap-3 pt-4">
                                            {/* Stage 1 */}
                                            <div 
                                                onClick={() => setQuestionsFilter('Fundamentals')}
                                                className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                                    questionsFilter === 'Fundamentals' 
                                                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 1</span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-1">Fundamentals</h4>
                                                    <p className="text-[11px] text-slate-400 mt-1">Basic concepts & entry-level questions.</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Q1 of 5</span>
                                                    <span className="text-xs font-black text-slate-500">{questionsList.filter(q => q.type === 'Fundamentals').length} Qs</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="hidden xl:flex items-center text-slate-300">→</div>

                                            {/* Stage 2 */}
                                            <div 
                                                onClick={() => setQuestionsFilter('Core')}
                                                className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                                    questionsFilter === 'Core' 
                                                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 2</span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-1">Core Tech (Adaptive)</h4>
                                                    <p className="text-[11px] text-slate-400 mt-1">Core details; splits dynamically by difficulty.</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Q2 of 5</span>
                                                    <span className="text-xs font-black text-slate-500">{questionsList.filter(q => q.type === 'Core').length} Qs</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="hidden xl:flex items-center text-slate-300">→</div>

                                            {/* Stage 3 */}
                                            <div 
                                                onClick={() => setQuestionsFilter('Scenario')}
                                                className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                                    questionsFilter === 'Scenario' 
                                                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 3</span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-1">Scenario/Case Study</h4>
                                                    <p className="text-[11px] text-slate-400 mt-1">Practical problem solving scenario.</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Q3 of 5</span>
                                                    <span className="text-xs font-black text-slate-500">{questionsList.filter(q => q.type === 'Scenario').length} Qs</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="hidden xl:flex items-center text-slate-300">→</div>

                                            {/* Stage 4 */}
                                            <div 
                                                onClick={() => setQuestionsFilter('Behavioral Experience')}
                                                className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                                    questionsFilter === 'Behavioral Experience' 
                                                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 4</span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-1">Behavioral Exp</h4>
                                                    <p className="text-[11px] text-slate-400 mt-1">Evaluates past candidate experience.</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Q4 of 5</span>
                                                    <span className="text-xs font-black text-slate-500">{questionsList.filter(q => q.type === 'Behavioral Experience').length} Qs</span>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="hidden xl:flex items-center text-slate-300">→</div>

                                            {/* Stage 5 */}
                                            <div 
                                                onClick={() => setQuestionsFilter('Behavioral Situation')}
                                                className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                                    questionsFilter === 'Behavioral Situation' 
                                                        ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 5</span>
                                                    <h4 className="font-bold text-sm text-slate-800 mt-1">Behavioral Situation</h4>
                                                    <p className="text-[11px] text-slate-400 mt-1">Evaluates scenario-based behavior.</p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Q5 of 5</span>
                                                    <span className="text-xs font-black text-slate-500">{questionsList.filter(q => q.type === 'Behavioral Situation').length} Qs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {questionsFilter !== 'all' && (
                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    onClick={() => setQuestionsFilter('all')}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                                                >
                                                    View All Questions in Bank ({questionsList.length}) →
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* SEARCH, FILTERS & BULK ACTIONS ROW */}
                                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-3 flex-1">
                                                {/* Search */}
                                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-xl w-full sm:max-w-xs focus-within:bg-white focus-within:border-indigo-500 transition-all">
                                                    <Search size={16} className="text-slate-400 shrink-0" />
                                                    <input
                                                        placeholder="Search question text..."
                                                        className="bg-transparent outline-none text-xs w-full text-slate-800 placeholder:text-slate-400"
                                                        value={questionSearchQuery}
                                                        onChange={e => setQuestionSearchQuery(e.target.value)}
                                                    />
                                                </div>

                                                {/* Difficulty Filter */}
                                                <select
                                                    value={selectedDifficultyFilter}
                                                    onChange={e => setSelectedDifficultyFilter(e.target.value)}
                                                    className="border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-white text-slate-700 font-semibold shadow-sm"
                                                >
                                                    <option value="all">All Difficulties</option>
                                                    <option value="easy">Easy Only</option>
                                                    <option value="medium">Medium Only</option>
                                                    <option value="hard">Hard Only</option>
                                                </select>

                                                {/* Category Filter */}
                                                <select
                                                    value={selectedCategoryFilter}
                                                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                                                    className="border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-white text-slate-700 font-semibold shadow-sm"
                                                >
                                                    <option value="all">All Categories</option>
                                                    {Array.from(new Set(questionsList.map(q => q.category).filter(Boolean))).map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>

                                                {/* Stage Type filter info indicator */}
                                                {questionsFilter !== 'all' && (
                                                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-semibold">
                                                        Stage: {questionsFilter}
                                                        <button onClick={() => setQuestionsFilter('all')} className="text-indigo-400 hover:text-indigo-700 font-black">✕</button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons: Import, Export, Add, Save */}
                                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                <button 
                                                    onClick={() => handleExportQuestions('csv')}
                                                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <Download size={14} /> Export CSV
                                                </button>
                                                <button 
                                                    onClick={() => { setImportPreviewData(null); setImportModalOpen(true); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <Plus size={14} className="rotate-45" /> Import CSV/JSON
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const newQ: Question = selectedRole === 'APTITUDE' ? {
                                                            id: `apt-custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                                                            question: "",
                                                            difficulty: 'medium',
                                                            type: 'Fundamentals',
                                                            category: "Quantitative",
                                                            options: ["", "", "", ""],
                                                            answer: "A",
                                                            explanation: "",
                                                            evaluationGuide: ["Explain the core concept or select the correct option directly."],
                                                            maxScore: 10,
                                                            version: 1,
                                                            updatedAt: new Date().toISOString()
                                                        } : {
                                                            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                                                            question: "",
                                                            difficulty: 'medium',
                                                            type: questionsFilter !== 'all' ? (questionsFilter as any) : 'Core',
                                                            category: "Technical",
                                                            evaluationGuide: ["Core Concept"],
                                                            maxScore: 10,
                                                            version: 1,
                                                            updatedAt: new Date().toISOString()
                                                        };
                                                        setEditingQuestion(newQ);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                                                >
                                                    <Plus size={14} /> Add Question
                                                </button>
                                                <button
                                                    onClick={handleSaveQuestions}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                                                >
                                                    <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* BULK ACTIONS SELECTOR */}
                                        {selectedQuestions.length > 0 && (
                                            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                                <span className="text-xs font-bold text-indigo-800">{selectedQuestions.length} questions selected:</span>
                                                <select
                                                    onChange={(e) => {
                                                        const act = e.target.value;
                                                        if (!act) return;
                                                        handleBulkAction(act);
                                                        e.target.value = '';
                                                    }}
                                                    className="border border-indigo-200 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs outline-none bg-white text-indigo-700 font-bold shadow-sm"
                                                >
                                                    <option value="">Choose Bulk Action...</option>
                                                    <option value="easy">Set Difficulty to Easy</option>
                                                    <option value="medium">Set Difficulty to Medium</option>
                                                    <option value="hard">Set Difficulty to Hard</option>
                                                    <option value="category">Change Category...</option>
                                                    <option value="delete">Delete Selected Questions</option>
                                                </select>
                                                <button 
                                                    onClick={() => setSelectedQuestions([])} 
                                                    className="text-xs text-slate-400 hover:text-indigo-800 hover:underline font-bold"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* QUESTIONS TABLE */}
                                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                                                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 w-12 text-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={filteredQuestions.length > 0 && currentQuestions.every(q => selectedQuestions.includes(String(q.id)))}
                                                                onChange={handleSelectAll}
                                                                className="accent-indigo-600 rounded border-slate-300 w-4 h-4 cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="px-6 py-4 w-[60%]">Question</th>
                                                        <th className="px-6 py-4 w-36">Stage</th>
                                                        <th className="px-6 py-4 w-28">Difficulty</th>
                                                        <th className="px-6 py-4 w-28 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredQuestions.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                                                                No questions matched the active filters.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        currentQuestions.map((q) => {
                                                            const isChecked = selectedQuestions.includes(String(q.id));
                                                            return (
                                                                <tr key={q.id} className={`hover:bg-slate-50/30 transition-colors ${isChecked ? 'bg-indigo-50/10' : ''}`}>
                                                                    <td className="px-6 py-4 text-center">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            checked={isChecked}
                                                                            onChange={(e) => handleSelectQuestion(String(q.id), e.target.checked)}
                                                                            className="accent-indigo-600 rounded border-slate-300 w-4 h-4 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-slate-800 truncate" title={q.question}>
                                                                                {q.question}
                                                                            </span>
                                                                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md shrink-0">
                                                                                {q.evaluationGuide?.length || 0} Areas
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="text-xs text-slate-600 font-medium">{q.type}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                                                                            q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                            q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                                                        }`}>
                                                                            {q.difficulty}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <button 
                                                                                onClick={() => { setEditingQuestion({ ...q }); setIsAddModalOpen(false); }} 
                                                                                className="p-1.5 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 bg-white rounded-lg text-slate-500 transition-all shadow-sm"
                                                                                title="Edit Details"
                                                                            >
                                                                                <Edit size={13} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleDeleteQuestion(q.id)} 
                                                                                className="p-1.5 border border-slate-200 hover:border-red-500 hover:text-red-600 bg-white rounded-lg text-slate-500 transition-all shadow-sm"
                                                                                title="Delete Question"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* PAGINATION FOOTER */}
                                        {totalPages > 1 && (
                                            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                                                <div className="text-xs text-slate-400 font-semibold">
                                                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredQuestions.length)} of {filteredQuestions.length} questions
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                    >
                                                        &lt; Previous
                                                    </button>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                                                                currentPage === page 
                                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                    <button 
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
                                                    >
                                                        Next &gt;
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SUB-TAB CONTENT 2: INTERVIEW SETTINGS */}
                            {questionsSubTab === 'settings' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    <Sliders size={20} className="text-indigo-500" /> Recruiter Strategy & Difficulty Overrides
                                                </h3>
                                                <p className="text-xs text-slate-400">Configure how the AI-driven assessment adjusts difficulty levels for each candidate.</p>
                                            </div>
                                            <button
                                                onClick={handleSaveQuestions}
                                                disabled={isSaving}
                                                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                                            >
                                                <Save size={14} /> {isSaving ? "Saving Settings..." : "Save Settings"}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            <div className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Global Difficulty Strategy</label>
                                                <p className="text-[11px] text-slate-400 mb-2">Base strategy for selecting questions in technical stages.</p>
                                                <select
                                                    value={difficultyStrategy}
                                                    onChange={(e) => setDifficultyStrategy(e.target.value as any)}
                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm transition-all"
                                                >
                                                    <option value="Adaptive">Adaptive (Dynamic Difficulty based on candidate answers)</option>
                                                    <option value="Easy Only">Easy Only (Beginner hiring)</option>
                                                    <option value="Medium Only">Medium Only (Mid-level hiring)</option>
                                                    <option value="Hard Only">Hard Only (Senior / Advanced)</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Stage 1: Fundamentals Override</label>
                                                <p className="text-[11px] text-slate-400 mb-2">Override difficulty choice specifically for basic concepts.</p>
                                                <select
                                                    value={stageOverrides.Fundamentals || 'Adaptive'}
                                                    onChange={(e) => setStageOverrides({ ...stageOverrides, Fundamentals: e.target.value as any })}
                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm transition-all"
                                                >
                                                    <option value="Adaptive">Fallback to Global Strategy</option>
                                                    <option value="Easy Only">Easy Only</option>
                                                    <option value="Medium Only">Medium Only</option>
                                                    <option value="Hard Only">Hard Only</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Stage 2: Core Tech Override</label>
                                                <p className="text-[11px] text-slate-400 mb-2">Override difficulty choice specifically for main technical concepts.</p>
                                                <select
                                                    value={stageOverrides.Core || 'Adaptive'}
                                                    onChange={(e) => setStageOverrides({ ...stageOverrides, Core: e.target.value as any })}
                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm transition-all"
                                                >
                                                    <option value="Adaptive">Fallback to Global Strategy</option>
                                                    <option value="Easy Only">Easy Only</option>
                                                    <option value="Medium Only">Medium Only</option>
                                                    <option value="Hard Only">Hard Only</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">Stage 3: Scenario Override</label>
                                                <p className="text-[11px] text-slate-400 mb-2">Override difficulty choice specifically for situational case studies.</p>
                                                <select
                                                    value={stageOverrides.Scenario || 'Adaptive'}
                                                    onChange={(e) => setStageOverrides({ ...stageOverrides, Scenario: e.target.value as any })}
                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm transition-all"
                                                >
                                                    <option value="Adaptive">Fallback to Global Strategy</option>
                                                    <option value="Easy Only">Easy Only</option>
                                                    <option value="Medium Only">Medium Only</option>
                                                    <option value="Hard Only">Hard Only</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-2 mt-4">
                                            <p className="font-bold flex items-center gap-1"><AlertTriangle size={14} className="text-indigo-500" /> Precedence Rule & Behavior</p>
                                            <ol className="list-decimal pl-4 space-y-1 text-slate-400 font-medium">
                                                <li>Individual Stage Override &gt; Global Strategy &gt; Default Adaptive.</li>
                                                <li>Stage 4 (Behavioral Experience) and Stage 5 (Behavioral Situation) do not support overrides as they evaluate dynamic behavioral factors without explicit easy/medium/hard question classification.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUB-TAB CONTENT 3: ANALYTICS & BALANCING */}
                            {questionsSubTab === 'analytics' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                <Activity size={20} className="text-indigo-500" /> Question Bank Coverage Analytics & Balancing
                                            </h3>
                                            <p className="text-xs text-slate-400">View overall question distribution across interview stages and difficulty skewness.</p>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total Questions</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.filter(q => q.type === 'Fundamentals').length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Fundamentals</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.filter(q => q.type === 'Core').length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Core Tech</div>
                                                <div className="text-[9px] text-slate-500 font-semibold mt-1">
                                                    E: {questionsList.filter(q => q.type === 'Core' && q.difficulty === 'easy').length} | 
                                                    M: {questionsList.filter(q => q.type === 'Core' && q.difficulty === 'medium').length} | 
                                                    H: {questionsList.filter(q => q.type === 'Core' && q.difficulty === 'hard').length}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.filter(q => q.type === 'Scenario').length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Scenario / Cases</div>
                                                <div className="text-[9px] text-slate-500 font-semibold mt-1">
                                                    E: {questionsList.filter(q => q.type === 'Scenario' && q.difficulty === 'easy').length} | 
                                                    M: {questionsList.filter(q => q.type === 'Scenario' && q.difficulty === 'medium').length} | 
                                                    H: {questionsList.filter(q => q.type === 'Scenario' && q.difficulty === 'hard').length}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.filter(q => q.type === 'Behavioral Experience').length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Behavioral Exp</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-2xl font-black text-slate-800">{questionsList.filter(q => q.type === 'Behavioral Situation').length}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Behavioral Sit</div>
                                            </div>
                                        </div>

                                        {/* Auto balance trigger alerts for both Core and Scenario stage difficulty metrics */}
                                        {['Core', 'Scenario'].map(stage => {
                                            const easy = questionsList.filter(q => q.type === stage && q.difficulty === 'easy').length;
                                            const medium = questionsList.filter(q => q.type === stage && q.difficulty === 'medium').length;
                                            const hard = questionsList.filter(q => q.type === stage && q.difficulty === 'hard').length;
                                            
                                            const min = Math.min(easy, medium, hard);
                                            const max = Math.max(easy, medium, hard);
                                            const isImbalanced = min < 5 || (max - min) > 3;

                                            return (
                                                <div key={stage} className={`p-5 rounded-2xl border ${isImbalanced ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/50 border-slate-200/60'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-slate-800">{stage} Stage Distribution</h4>
                                                        <p className="text-xs text-slate-500">Current: Easy: <span className="font-semibold text-slate-700">{easy}</span> | Medium: <span className="font-semibold text-slate-700">{medium}</span> | Hard: <span className="font-semibold text-slate-700">{hard}</span></p>
                                                        {isImbalanced ? (
                                                            <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><AlertTriangle size={13} /> Imbalanced (recommended 10/10/10 split for robust adaptive testing).</p>
                                                        ) : (
                                                            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={13} /> Well balanced difficulty distribution.</p>
                                                        )}
                                                    </div>
                                                    {isImbalanced && (
                                                        <button 
                                                            onClick={() => {
                                                                const stageQs = questionsList.filter(q => q.type === stage);
                                                                const target = Math.round(stageQs.length / 3);
                                                                const counts = {
                                                                    easy: { count: easy, list: stageQs.filter(q => q.difficulty === 'easy') },
                                                                    medium: { count: medium, list: stageQs.filter(q => q.difficulty === 'medium') },
                                                                    hard: { count: hard, list: stageQs.filter(q => q.difficulty === 'hard') }
                                                                };
                                                                
                                                                const targetDiffs = { easy: target, medium: target, hard: target };
                                                                const diffSum = target * 3;
                                                                if (diffSum < stageQs.length) {
                                                                    targetDiffs.medium += (stageQs.length - diffSum);
                                                                } else if (diffSum > stageQs.length) {
                                                                    targetDiffs.easy -= (diffSum - stageQs.length);
                                                                }

                                                                const keys = ['easy', 'medium', 'hard'] as const;
                                                                const suggestionsList: typeof balanceSuggestions = [];
                                                                
                                                                let iters = 0;
                                                                while (iters < 50) {
                                                                    const underKey = keys.find(k => counts[k].count < targetDiffs[k]);
                                                                    const overKey = keys.find(k => counts[k].count > targetDiffs[k]);
                                                                    if (!underKey || !overKey) break;

                                                                    const qToShift = counts[overKey].list.pop();
                                                                    if (qToShift) {
                                                                        suggestionsList.push({
                                                                            id: qToShift.id,
                                                                            text: qToShift.question,
                                                                            current: overKey,
                                                                            suggested: underKey
                                                                        });
                                                                        counts[overKey].count--;
                                                                        counts[underKey].count++;
                                                                    }
                                                                    iters++;
                                                                }

                                                                if (suggestionsList.length > 0) {
                                                                    setBalanceSuggestions(suggestionsList);
                                                                    setQuestionsFilter(stage); // Set filter to match suggestion stage context
                                                                    setBalanceModalOpen(true);
                                                                } else {
                                                                    alert("Could not generate balancing suggestions automatically. Please edit difficulties manually.");
                                                                }
                                                            }}
                                                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-sm shrink-0 active:scale-[0.98]"
                                                        >
                                                            Suggest Auto-Balance
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* AUTO-BALANCE SUGGESTIONS MODAL */}
                            {balanceModalOpen && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 space-y-6">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                                <Sliders size={20} className="text-indigo-600" /> Auto-Balance Suggestions
                                            </h3>
                                            <button onClick={() => setBalanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        
                                        <p className="text-xs text-slate-500">
                                            The following shifts are suggested to reach target balance of approximately equal distribution in Stage {questionsFilter} (Recommended: 10 Easy, 10 Medium, 10 Hard). Select the ones you approve.
                                        </p>

                                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[40vh] pr-2">
                                            {balanceSuggestions.map(sugg => (
                                                <label key={sugg.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100/85 border border-slate-200/40 cursor-pointer transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        defaultChecked 
                                                        id={`sugg-${sugg.id}`}
                                                        className="mt-1 accent-indigo-600 rounded border-slate-300 w-4 h-4 shrink-0" 
                                                    />
                                                    <div>
                                                        <p className="text-xs text-slate-700 font-medium line-clamp-2">"{sugg.text}"</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded capitalize">{sugg.current}</span>
                                                            <span className="text-[10px] text-slate-400">➔</span>
                                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded capitalize">{sugg.suggested}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                            <button 
                                                onClick={() => setBalanceModalOpen(false)} 
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const approvedIds = balanceSuggestions.filter(s => {
                                                        const el = document.getElementById(`sugg-${s.id}`) as HTMLInputElement | null;
                                                        return el ? el.checked : true;
                                                    }).map(s => s.id);
                                                    
                                                    const updated = questionsList.map(q => {
                                                        const sugg = balanceSuggestions.find(s => s.id === q.id);
                                                        if (sugg && approvedIds.includes(q.id)) {
                                                            return { 
                                                                ...q, 
                                                                difficulty: sugg.suggested as any,
                                                                version: (q.version || 1) + 1,
                                                                updatedAt: new Date().toISOString()
                                                            };
                                                        }
                                                        return q;
                                                    });
                                                    setQuestionsList(updated);
                                                    setBalanceModalOpen(false);
                                                    setBalanceSuggestions([]);
                                                    setSuccessMessage(`Applied Auto-Balance shifts to ${approvedIds.length} questions! Click 'Save Changes' to apply to database.`);
                                                    setTimeout(() => setSuccessMessage(null), 5000);
                                                }}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                                            >
                                                Apply Selected Shifts
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IMPORT CSV/JSON WIZARD DIALOG MODAL */}
                            {importModalOpen && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col p-6 space-y-6">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                                <Upload size={20} className="text-indigo-600" /> Import Questions Wizard
                                            </h3>
                                            <button onClick={() => { setImportModalOpen(false); setImportPreviewData(null); }} className="text-slate-400 hover:text-slate-600">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {!importPreviewData ? (
                                            /* UPLOAD STATE */
                                            <div className="space-y-4">
                                                <p className="text-xs text-slate-500">
                                                    Upload a JSON or CSV file containing question bank data. CSV header keys should include: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">question</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">difficulty</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">type</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">category</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">evaluationGuide</code> (semicolon separated).
                                                </p>
                                                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-10 text-center transition-colors relative cursor-pointer">
                                                    <input 
                                                        type="file" 
                                                        accept=".csv,.json"
                                                        onChange={handleFileUpload}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                    />
                                                    <Upload size={32} className="text-slate-400 mx-auto mb-3" />
                                                    <p className="text-xs font-bold text-slate-700">Click to upload or drag-and-drop</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Supports CSV or JSON (max 5MB)</p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* PREVIEW & VALIDATION REPORT STATE */
                                            <div className="space-y-5 flex-1 overflow-y-auto max-h-[50vh] pr-2">
                                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Validation Report</p>
                                                        <h4 className="text-sm font-black text-slate-800 mt-0.5">{importFileName}</h4>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="text-center">
                                                            <span className="text-xs font-black text-emerald-600 block">{importPreviewData.validCount}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Valid</span>
                                                        </div>
                                                        {importPreviewData.warningsCount > 0 && (
                                                            <div className="text-center">
                                                                <span className="text-xs font-black text-amber-600 block">{importPreviewData.warningsCount}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Warnings</span>
                                                            </div>
                                                        )}
                                                        {importPreviewData.errorsCount > 0 && (
                                                            <div className="text-center">
                                                                <span className="text-xs font-black text-rose-600 block">{importPreviewData.errorsCount}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Errors</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Error Logs */}
                                                {importPreviewData.errors.length > 0 && (
                                                    <div className="p-4 bg-rose-50/50 border border-rose-200/60 rounded-2xl space-y-2">
                                                        <p className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Validation Errors & Warnings Log</p>
                                                        <div className="text-[11px] font-medium space-y-1.5 max-h-[15vh] overflow-y-auto">
                                                            {importPreviewData.errors.map((err, i) => (
                                                                <div key={i} className="flex gap-2">
                                                                    <span className="font-mono text-slate-400">Row {err.row}:</span>
                                                                    <span className={err.severity === 'error' ? 'text-rose-600 font-bold' : 'text-amber-600'}>
                                                                        [{err.severity.toUpperCase()}] {err.msg}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Merge Strategy Option */}
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-700">Merge Strategy</h4>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Define how questions are loaded into the database bank.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setImportMergeStrategy('append')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                                                                importMergeStrategy === 'append' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                                                            }`}
                                                        >
                                                            Append New
                                                        </button>
                                                        <button 
                                                            onClick={() => setImportMergeStrategy('replace')}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                                                                importMergeStrategy === 'replace' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                                                            }`}
                                                        >
                                                            Replace All
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Preview Table */}
                                                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                                                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                                                        <thead className="bg-slate-50 text-slate-500 font-bold">
                                                            <tr>
                                                                <th className="px-4 py-2">Status</th>
                                                                <th className="px-4 py-2">Question Text</th>
                                                                <th className="px-4 py-2">Difficulty</th>
                                                                <th className="px-4 py-2">Stage</th>
                                                                <th className="px-4 py-2">Category</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {importPreviewData.questions.slice(0, 5).map((q, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-2">
                                                                        {q.isValid ? (
                                                                            <span className="text-emerald-600 font-bold">✓ Valid</span>
                                                                        ) : (
                                                                            <span className="text-rose-600 font-bold">✕ Error</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2 max-w-[200px] truncate" title={q.question}>{q.question}</td>
                                                                    <td className="px-4 py-2 capitalize">{q.difficulty}</td>
                                                                    <td className="px-4 py-2">{q.type}</td>
                                                                    <td className="px-4 py-2">{q.category}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {importPreviewData.questions.length > 5 && (
                                                        <div className="p-2 bg-slate-50 text-center text-[10px] text-slate-400 font-semibold border-t border-slate-100">
                                                            + {importPreviewData.questions.length - 5} more questions in file...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                                            <button 
                                                onClick={() => { setImportModalOpen(false); setImportPreviewData(null); }} 
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                            {importPreviewData && (
                                                <button 
                                                    onClick={handleCompleteImport}
                                                    disabled={importPreviewData.validCount === 0}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                                                >
                                                    Complete Import ({importPreviewData.validCount} Valid Rows)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* EDIT / ADD QUESTION MODAL */}
                            {editingQuestion && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                            <h3 className="font-extrabold text-slate-800 text-lg">
                                                {isAddModalOpen ? 'Add New Question' : `Edit Question (v${editingQuestion.version || 1})`}
                                            </h3>
                                            <button 
                                                onClick={() => { setEditingQuestion(null); setIsAddModalOpen(false); }} 
                                                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="p-6 space-y-5 overflow-y-auto flex-1 max-h-[65vh]">
                                            {/* Question Input */}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Text</label>
                                                <textarea 
                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-sm outline-none transition-all resize-y h-24 text-slate-800 font-medium" 
                                                    value={editingQuestion.question} 
                                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })} 
                                                />
                                                                            {selectedRole === 'APTITUDE' ? (
                                                <>
                                                    {/* Category & Difficulty */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                                                            <select
                                                                value={editingQuestion.category || 'Quantitative'}
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-semibold"
                                                            >
                                                                <option value="Quantitative">Quantitative Aptitude</option>
                                                                <option value="Logical">Logical Reasoning</option>
                                                                <option value="Analytical">Analytical Reasoning</option>
                                                                <option value="Verbal">Verbal Aptitude</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                                                            <select 
                                                                value={editingQuestion.difficulty || 'medium'}
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-semibold"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Options A, B, C, D */}
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">MCQ Options</label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {['A', 'B', 'C', 'D'].map((lbl, idx) => {
                                                                const opts = editingQuestion.options || ["", "", "", ""];
                                                                return (
                                                                    <div key={lbl} className="flex gap-2 items-center">
                                                                        <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500 shrink-0">
                                                                            {lbl}
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            value={opts[idx] || ""}
                                                                            onChange={(e) => {
                                                                                const nextOpts = [...opts];
                                                                                nextOpts[idx] = e.target.value;
                                                                                setEditingQuestion({
                                                                                    ...editingQuestion,
                                                                                    options: nextOpts
                                                                                });
                                                                            }}
                                                                            placeholder={`Option ${lbl} text`}
                                                                            className="flex-1 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2 text-xs outline-none transition-all text-slate-800 font-medium"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Correct Answer Selector */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correct Answer Option</label>
                                                        <select
                                                            value={editingQuestion.answer || 'A'}
                                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, answer: e.target.value })}
                                                            className="w-40 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-semibold"
                                                        >
                                                            <option value="A">Option A</option>
                                                            <option value="B">Option B</option>
                                                            <option value="C">Option C</option>
                                                            <option value="D">Option D</option>
                                                        </select>
                                                    </div>

                                                    {/* Solution Explanation */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Solution Explanation</label>
                                                        <textarea
                                                            value={editingQuestion.explanation || ''}
                                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                                                            placeholder="Detail the step-by-step mathematical or logical solution explanation..."
                                                            className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none transition-all resize-y h-20 text-slate-800 font-medium"
                                                        />
                                                    </div>

                                                    {/* Image Attachment & Upload */}
                                                    <div className="space-y-2 border-t border-slate-100 pt-4">
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Optional Image Attachment</label>
                                                        <div className="flex flex-col md:flex-row gap-3 items-stretch">
                                                            <input
                                                                type="text"
                                                                value={editingQuestion.imageUrl || ''}
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
                                                                placeholder="Paste direct Image URL or upload a file..."
                                                                className="flex-1 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800 font-medium"
                                                            />
                                                            <div className="relative">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleImageUpload}
                                                                    id="mcq-img-upload"
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor="mcq-img-upload"
                                                                    className={`px-4 py-2.5 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer h-full ${
                                                                        isUploading ? 'opacity-50 pointer-events-none' : ''
                                                                    }`}
                                                                >
                                                                    {isUploading ? 'Uploading...' : 'Upload File'}
                                                                </label>
                                                            </div>
                                                        </div>
                                                        {editingQuestion.imageUrl && (
                                                            <div className="relative border border-slate-200 rounded-2xl overflow-hidden max-h-40 bg-slate-50 p-2 flex justify-center items-center group max-w-sm mt-2">
                                                                <img src={editingQuestion.imageUrl} alt="Attached Preview" className="object-contain max-h-36" />
                                                                <button
                                                                    onClick={() => setEditingQuestion({ ...editingQuestion, imageUrl: undefined })}
                                                                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-lg p-1.5 hover:bg-red-600 transition-colors text-xs font-bold"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Difficulty */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                                                            <select 
                                                                value={editingQuestion.difficulty || 'medium'}
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-semibold"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard (High Level)</option>
                                                            </select>
                                                        </div>

                                                        {/* Stage / Type */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Flow Stage (Type)</label>
                                                            <select 
                                                                value={editingQuestion.type || 'Core'}
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as any })}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-semibold"
                                                            >
                                                                <option value="Fundamentals">Stage 1: Fundamentals</option>
                                                                <option value="Core">Stage 2: Core Technical</option>
                                                                <option value="Scenario">Stage 3: Scenario Case Study</option>
                                                                <option value="Behavioral Experience">Stage 4: Behavioral Experience</option>
                                                                <option value="Behavioral Situation">Stage 5: Behavioral Situation</option>
                                                            </select>
                                                        </div>

                                                        {/* Category */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                                                            <input 
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800 font-semibold" 
                                                                value={editingQuestion.category || ''} 
                                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })} 
                                                                placeholder="e.g. Technical"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Evaluation Areas Checklist Manager */}
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex justify-between items-center">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Checklist Areas (AI Grading Standard)</label>
                                                            <button 
                                                                onClick={() => {
                                                                    const currentGuide = editingQuestion.evaluationGuide || [];
                                                                    setEditingQuestion({
                                                                        ...editingQuestion,
                                                                        evaluationGuide: [...currentGuide, ""]
                                                                    });
                                                                }}
                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                                            >
                                                                + Add Area
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            {(editingQuestion.evaluationGuide || []).length === 0 ? (
                                                                <p className="text-xs text-rose-500 font-semibold italic">No evaluation areas added. At least one area is required.</p>
                                                            ) : (
                                                                (editingQuestion.evaluationGuide || []).map((area, idx) => (
                                                                    <div key={idx} className="flex gap-3 items-center">
                                                                        <input 
                                                                            className="flex-1 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800 font-medium"
                                                                            value={area}
                                                                            onChange={(e) => {
                                                                                const updated = [...(editingQuestion.evaluationGuide || [])];
                                                                                updated[idx] = e.target.value;
                                                                                setEditingQuestion({
                                                                                    ...editingQuestion,
                                                                                    evaluationGuide: updated
                                                                                });
                                                                            }}
                                                                            placeholder="Describe the expected candidate answer point or checklist item..."
                                                                        />
                                                                        <button 
                                                                            onClick={() => {
                                                                                const updated = (editingQuestion.evaluationGuide || []).filter((_, i) => i !== idx);
                                                                                setEditingQuestion({
                                                                                    ...editingQuestion,
                                                                                    evaluationGuide: updated
                                                                                });
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Preview & Test Evaluation Simulator */}
                                                    <div className="border-t border-slate-100 pt-4 space-y-3">
                                                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                                            <Terminal size={14} className="text-indigo-500" /> Preview/Test AI Grading
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 leading-normal">
                                                            Verify your evaluation guide by grading a mock candidate response before saving.
                                                        </p>
                                                        
                                                        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                            <div>
                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sample Answer</label>
                                                                <textarea 
                                                                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all resize-y h-16 text-slate-800 bg-white" 
                                                                    placeholder="Type a sample answer to test..." 
                                                                    value={testAnswer}
                                                                    onChange={(e) => setTestAnswer(e.target.value)}
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex justify-between items-center">
                                                                <button 
                                                                    onClick={handleTestGrading}
                                                                    disabled={isTesting || !testAnswer.trim()}
                                                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 text-indigo-600 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                                                                >
                                                                    {isTesting ? (
                                                                        <>
                                                                            <RefreshCw size={12} className="animate-spin" /> Testing...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Play size={12} /> Run Test Grading
                                                                        </>
                                                                    )}
                                                                </button>
                                                                
                                                                {testResult && !testResult.error && (
                                                                    <div className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                                                        Expected Score: 
                                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                                                            testResult.contentScore >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                            testResult.contentScore >= 6 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                                            testResult.contentScore >= 4 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                                                        }`}>
                                                                            {testResult.contentScore}/10 ({testResult.verdict})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {testResult && (
                                                                <div className="border-t border-slate-200/60 pt-3 space-y-2 mt-2">
                                                                    {testResult.error ? (
                                                                        <p className="text-xs text-rose-500 font-medium">{testResult.error}</p>
                                                                    ) : (
                                                                        <div className="text-[11px] space-y-2.5">
                                                                            <div>
                                                                                <span className="font-bold text-slate-650 block mb-0.5">AI Feedback:</span>
                                                                                <p className="text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans">{testResult.feedback}</p>
                                                                            </div>
                                                                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/85">
                                                                                <div>
                                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Honesty Score</span>
                                                                                    <span className="font-bold text-slate-700">{testResult.honestyScore !== undefined ? `${testResult.honestyScore}/10` : 'N/A'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Knowledge Admission</span>
                                                                                    <span className="font-bold text-slate-700">{testResult.knowledgeAdmissionScore !== undefined ? `${testResult.knowledgeAdmissionScore}/10` : 'N/A'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bluff Risk</span>
                                                                                    <span className={`font-black uppercase text-[10px] ${
                                                                                        testResult.bluffRisk === 'HIGH' ? 'text-rose-600' :
                                                                                        testResult.bluffRisk === 'MEDIUM' ? 'text-amber-600' :
                                                                                        'text-emerald-600'
                                                                                    }`}>{testResult.bluffRisk || 'LOW'}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <span className="font-bold text-emerald-700 block mb-1">✓ Concepts Explained:</span>
                                                                                    {(testResult.explainedConcepts?.length > 0 || testResult.matchedKeyPoints?.length > 0) ? (
                                                                                        <ul className="list-disc list-inside text-emerald-600 space-y-0.5 pl-1">
                                                                                            {(testResult.explainedConcepts || testResult.matchedKeyPoints).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <span className="text-slate-400 italic text-[10px]">None</span>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-bold text-rose-700 block mb-1">✕ Areas Missed:</span>
                                                                                    {testResult.missingKeyPoints?.length > 0 ? (
                                                                                        <ul className="list-disc list-inside text-rose-600 space-y-0.5 pl-1">
                                                                                            {testResult.missingKeyPoints.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <span className="text-slate-400 italic text-[10px]">None</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}                  </div>
                                        </div>

                                        <div className="p-6 border-t border-slate-100 flex justify-between gap-3 shrink-0">
                                            {!isAddModalOpen ? (
                                                <button
                                                    onClick={() => handleDeleteQuestion(editingQuestion.id)}
                                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                                                >
                                                    Delete Question
                                                </button>
                                            ) : (
                                                <div></div>
                                            )}
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => { setEditingQuestion(null); setIsAddModalOpen(false); }} 
                                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleSaveModal}
                                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                                                >
                                                    {isAddModalOpen ? 'Add Question' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: SYSTEM HEALTH */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">System Verification Panel</h3>
                                    <p className="text-xs text-slate-400">Live operational status of services.</p>
                                </div>
                                {health && (
                                    <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
                                        <Activity size={14} className="text-indigo-500" /> Last Checked: {new Date(health.lastChecked).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Services check */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                                        <Server className="text-indigo-500 shrink-0" size={18} /> Infrastructure Connectivity
                                    </h3>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Database size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Supabase SQL Database</span>
                                            </div>
                                            {health?.database ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">ONLINE</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OFFLINE</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Server size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Storage Buckets (Media)</span>
                                            </div>
                                            {health?.storage ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">CONNECTED</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">DISCONNECTED</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Terminal size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Authentication Service</span>
                                            </div>
                                            {health?.auth ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OPERATIONAL</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OFFLINE</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Environment Data Count */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                                        <Database className="text-indigo-500 shrink-0" size={18} /> Database Records Count
                                    </h3>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Active Technical Question Banks</span>
                                            <span className="text-slate-800 font-bold text-sm">2 Roles (CSE & ECE)</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Interview Session Records</span>
                                            <span className="text-slate-800 font-bold text-sm">{sessions.length} sessions</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Unique Evaluated Candidates</span>
                                            <span className="text-slate-800 font-bold text-sm">
                                                {new Set(sessions.map(s => s.candidate.email)).size} candidates
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SYSTEM ERROR LOGS */}
                    {activeTab === 'errors' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">System Errors Monitor</h3>
                                    <p className="text-xs text-slate-400">View real-time and historical runtime exceptions during interviews and evaluation.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={errorsFilter}
                                        onChange={(e) => setErrorsFilter(e.target.value)}
                                        className="border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl px-4 py-2.5 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm"
                                    >
                                        <option value="all">All Error Categories</option>
                                        <option value="database">Database Errors</option>
                                        <option value="api">API / LLM Errors</option>
                                        <option value="proctoring">Proctoring Errors</option>
                                        <option value="interview">Interview Flow Errors</option>
                                        <option value="evaluation">Grading Errors</option>
                                        <option value="system">Core System Errors</option>
                                    </select>
                                    <button
                                        onClick={handleClearErrorLogs}
                                        disabled={errorLogs.length === 0}
                                        className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 rounded-xl text-xs font-black transition-all active:scale-[0.98] shadow-sm flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Clear Error Logs
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 w-10"></th>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Error Message</th>
                                                <th className="px-6 py-4">Candidate / Session</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredErrors.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                                                        No captured errors matching filter criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredErrors.map((err) => {
                                                    const isExpanded = expandedErrorId === err.id;
                                                    return (
                                                        <React.Fragment key={err.id}>
                                                            <tr 
                                                                onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                                                                className="hover:bg-slate-50/40 cursor-pointer transition-colors"
                                                            >
                                                                <td className="px-6 py-4 text-slate-400">
                                                                    {isExpanded ? '▼' : '▶'}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                                    {new Date(err.timestamp).toLocaleDateString()} {new Date(err.timestamp).toLocaleTimeString()}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                                                                        err.category === 'database' ? 'bg-red-100 text-red-800' :
                                                                        err.category === 'api' ? 'bg-purple-100 text-purple-800' :
                                                                        err.category === 'proctoring' ? 'bg-amber-100 text-amber-800' :
                                                                        err.category === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                        err.category === 'evaluation' ? 'bg-indigo-100 text-indigo-800' :
                                                                        'bg-slate-100 text-slate-800'
                                                                    }`}>
                                                                        {err.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-800 font-medium max-w-sm overflow-hidden text-ellipsis">
                                                                    {err.message}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 text-xs">
                                                                    {err.candidateName ? (
                                                                        <div>
                                                                            <span className="font-semibold">{err.candidateName}</span>
                                                                            {err.sessionId && <span className="text-[10px] text-slate-400 block font-mono">Session: {err.sessionId.substring(0, 8)}...</span>}
                                                                        </div>
                                                                    ) : err.sessionId ? (
                                                                        <span className="font-mono">ID: {err.sessionId.substring(0, 8)}...</span>
                                                                    ) : (
                                                                        <span className="text-slate-300">N/A</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-8 py-4 bg-slate-900 text-red-400 font-mono text-xs border-l-4 border-l-red-500">
                                                                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-500">
                                                                            <span>Exception Context Details</span>
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(err.details || '');
                                                                                }}
                                                                                className="hover:text-white px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 transition-all"
                                                                            >
                                                                                Copy Details
                                                                            </button>
                                                                        </div>
                                                                        <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">{err.details || "No technical details captured for this error."}</pre>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
