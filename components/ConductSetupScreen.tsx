import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
    Building2, FileText, Target, Link as LinkIcon, CheckCircle, 
    Cpu, Plus, Trash2, Edit2, Play, Copy, ArrowRight, Settings
} from 'lucide-react';
import { AIService, GeneratedQuestion } from '../services/aiService';
import { AccessService } from '../services/accessService';

interface ConductSetupScreenProps {
    onComplete: (data: any) => void;
    onBack: () => void;
}

export const ConductSetupScreen: React.FC<ConductSetupScreenProps> = ({ onComplete, onBack }) => {
    const [loading, setLoading] = useState(false);
    
    // 1. Interview Details
    const [formData, setFormData] = useState({
        company_name: '',
        interview_title: '',
        role: '',
        skills: '',
        experience_level: 'Intermediate',
        interview_type: 'Technical',
    });

    // 2. Question Setup
    const [questionMode, setQuestionMode] = useState<'AI' | 'Manual'>('AI');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [currentCustomQuestion, setCurrentCustomQuestion] = useState({ question: '', ideal_answer: '' });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // 3. Evaluation Criteria
    const EVALUATION_OPTIONS = [
        'Technical Knowledge',
        'Communication Skills',
        'Problem Solving',
        'Confidence',
        'Cultural Fit'
    ];
    
    const [criteria, setCriteria] = useState<{name: string, weight: number}[]>([
        { name: 'Technical Knowledge', weight: 40 },
        { name: 'Communication Skills', weight: 20 },
        { name: 'Problem Solving', weight: 20 },
        { name: 'Confidence', weight: 10 },
        { name: 'Cultural Fit', weight: 10 },
    ]);

    // 4. Access & Sharing
    const [accessData, setAccessData] = useState({
        interview_id: '',
        access_key: '',
        link: ''
    });

    // --- Handlers ---

    const handleGenerateQuestions = async () => {
        setLoading(true);
        try {
            const generated = await AIService.generateQuestions(
                formData.role,
                formData.experience_level,
                formData.interview_type,
                numberOfQuestions,
                formData.skills
            );
            setQuestions(generated);
        } catch (error: any) {
            console.error("Failed to generate questions:", error);
            alert(error.message || "Failed to generate questions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomQuestion = () => {
        if (currentCustomQuestion.question && currentCustomQuestion.ideal_answer) {
            if (editingIndex !== null) {
                const updated = [...questions];
                updated[editingIndex] = currentCustomQuestion;
                setQuestions(updated);
                setEditingIndex(null);
            } else {
                setQuestions([...questions, currentCustomQuestion]);
            }
            setCurrentCustomQuestion({ question: '', ideal_answer: '' });
        }
    };

    const handleEditQuestion = (index: number) => {
        setCurrentCustomQuestion(questions[index]);
        setEditingIndex(index);
        document.getElementById('question-input-area')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleUpdateCriterionWeight = (index: number, newWeight: number) => {
        const updated = [...criteria];
        updated[index].weight = newWeight;
        setCriteria(updated);
    };

    const handleGenerateAccess = () => {
        // Use AccessService for cryptographically secure keys
        const record = AccessService.create({ maxAttempts: 5 });
        const link = `${window.location.origin}/?jobId=${record.interview_id}`;
        setAccessData({
            interview_id: record.interview_id,
            access_key: record.access_key,
            link: link
        });
    };

    const handleStartInterview = () => {
        // Validation
        if (!formData.company_name || !formData.role) return alert("Please fill out Company Name and Role.");
        if (questions.length === 0) return alert("Please add at least one question.");
        if (!accessData.interview_id) return alert("Please generate access credentials first (Section 4).");

        // Activate the interview access record so candidates can join
        AccessService.activate(accessData.interview_id);

        // Transform criteria into weights object for compatibility
        const weightsObj = {
            concept: criteria.find(c => c.name === 'Technical Knowledge')?.weight || 0,
            grammar: criteria.find(c => c.name === 'Communication Skills')?.weight || 0,
            fluency: criteria.find(c => c.name === 'Problem Solving')?.weight || 0,
            camera: criteria.find(c => c.name === 'Confidence')?.weight || 0,
        };

        onComplete({
            ...formData,
            ...accessData,
            questions,
            weights: weightsObj,
            custom_criteria: criteria,
            interview_mode: questionMode,
            status: 'ACTIVE'
        });
    };

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    return (
        <div className="min-h-screen bg-slate-50 overflow-y-auto w-full">
            {/* Header */}
            <div className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">← Back</button>
                        <Logo variant="white" className="w-8 h-8" />
                        <h1 className="text-xl font-bold tracking-tight">Conduct Interview</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-12 my-8">
                
                {/* 1. INTERVIEW DETAILS */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">1. Interview Details</h2>
                            <p className="text-sm text-slate-500">Provide the basic context for this assessment.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name *</label>
                            <input 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. Acme Corp"
                                value={formData.company_name}
                                onChange={e => setFormData({...formData, company_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interview Title</label>
                            <input 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. Frontend Engineer Assessment"
                                value={formData.interview_title}
                                onChange={e => setFormData({...formData, interview_title: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role *</label>
                            <input 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. Senior Developer"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Level</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                                value={formData.experience_level}
                                onChange={e => setFormData({...formData, experience_level: e.target.value})}
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skills / Technologies *</label>
                            <input 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all"
                                placeholder="e.g. React, Node.js, TypeScript, SQL"
                                value={formData.skills}
                                onChange={e => setFormData({...formData, skills: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interview Type</label>
                            <div className="flex gap-4">
                                {['Technical', 'HR', 'Mixed'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({...formData, interview_type: type})}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.interview_type === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. QUESTION SETUP */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">2. Question Setup</h2>
                            <p className="text-sm text-slate-500">How would you like to create questions?</p>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8">
                        {['AI', 'Manual'].map((m: any) => (
                            <button
                                key={m}
                                onClick={() => setQuestionMode(m)}
                                className={`flex-1 py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${questionMode === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50'}`}
                            >
                                {m === 'AI' ? <Cpu size={18} /> : <Edit2 size={18} />}
                                {m === 'AI' ? 'Generate with AI' : 'Add Manually'}
                            </button>
                        ))}
                    </div>

                    {questionMode === 'AI' && (
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-8 flex flex-col items-center text-center space-y-4">
                            <p className="text-indigo-800 font-medium">Generate questions automatically based on Role: <span className="font-bold">{formData.role || '[Not Set]'}</span>, <span className="font-bold">{formData.experience_level}</span>, <span className="font-bold">{formData.interview_type}</span></p>
                            
                            <div className="flex items-center gap-4 w-full max-w-sm justify-center">
                                <label className="text-sm font-bold text-indigo-800">Number of Questions:</label>
                                <input 
                                    type="number" min="1" max="20"
                                    className="w-20 px-3 py-2 rounded-lg border border-indigo-200 outline-none text-center font-bold"
                                    value={numberOfQuestions}
                                    onChange={e => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={handleGenerateQuestions}
                                    disabled={loading || !formData.role || !formData.skills}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all"
                                >
                                    {loading ? <span className="animate-pulse">Generating...</span> : <><Cpu size={18}/> Generate Now</>}
                                </button>
                                
                                <button 
                                    onClick={async () => {
                                        const models = await AIService.listModels();
                                        alert("Available Models:\n" + (models.join("\n") || "No models found or error. Check console."));
                                    }}
                                    className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition-all text-xs"
                                >
                                    <Settings size={14}/> Debug: List Models
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Question List (Editable in both modes) */}
                    <div className="space-y-4 mb-8">
                        <h3 className="font-bold text-slate-700 flex justify-between items-center">
                            <span>Question List ({questions.length})</span>
                            {questions.length > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Items ready</span>}
                        </h3>
                        
                        {questions.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 italic">
                                No questions added yet. Generate with AI or add manually below.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative group">
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditQuestion(idx)} className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 hover:bg-indigo-50 border border-slate-100"><Edit2 size={14}/></button>
                                            <button onClick={() => handleDeleteQuestion(idx)} className="p-2 bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50 border border-slate-100"><Trash2 size={14}/></button>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="font-black text-indigo-400 text-lg">Q{idx+1}.</span>
                                            <div className="space-y-2 pr-16 flex-1">
                                                <p className="font-bold text-slate-800 leading-snug">{q.question}</p>
                                                <div className="bg-white p-3 rounded-lg text-sm text-slate-600 border border-slate-100 shadow-sm relative before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-300 before:rounded-l-lg">
                                                    <span className="text-xs font-bold text-indigo-500 uppercase block mb-1">Ideal Answer</span>
                                                    {q.ideal_answer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manual Entry Form */}
                    <div id="question-input-area" className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-bold text-slate-700">{editingIndex !== null ? `Edit Question ${editingIndex+1}` : "Add New Question"}</h4>
                        <div className="space-y-3">
                            <textarea 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all resize-none h-20 text-sm"
                                placeholder="Write the interview question here..."
                                value={currentCustomQuestion.question}
                                onChange={e => setCurrentCustomQuestion({...currentCustomQuestion, question: e.target.value})}
                            />
                            <textarea 
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all resize-none h-20 text-sm"
                                placeholder="Write the ideal answer components here..."
                                value={currentCustomQuestion.ideal_answer}
                                onChange={e => setCurrentCustomQuestion({...currentCustomQuestion, ideal_answer: e.target.value})}
                            />
                            <button 
                                onClick={handleAddCustomQuestion}
                                disabled={!currentCustomQuestion.question || !currentCustomQuestion.ideal_answer}
                                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                            >
                                {editingIndex !== null ? (
                                    <>Save Changes</>
                                ) : (
                                    <><Plus size={18}/> Add Question to List</>
                                )}
                            </button>
                            {editingIndex !== null && (
                                <button
                                    onClick={() => {
                                        setEditingIndex(null);
                                        setCurrentCustomQuestion({ question: '', ideal_answer: '' });
                                    }}
                                    className="w-full py-2 text-slate-500 font-bold hover:text-slate-700"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. EVALUATION CRITERIA */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Target size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">3. Evaluation Criteria</h2>
                            <p className="text-sm text-slate-500">What should be evaluated? Assign weights (total 100%).</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {criteria.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <label className="w-1/3 font-bold text-slate-700 text-sm">{c.name}</label>
                                <div className="flex-1 flex items-center gap-4">
                                    <input 
                                        type="range" min="0" max="100" step="5"
                                        value={c.weight}
                                        onChange={(e) => handleUpdateCriterionWeight(idx, parseInt(e.target.value))}
                                        className="w-full accent-indigo-600"
                                    />
                                    <div className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-black text-indigo-600">
                                        {c.weight}%
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className={`p-4 rounded-xl font-bold text-center ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            Total Weight: {totalWeight}% {totalWeight !== 100 && "(Must sum to 100%)"}
                        </div>
                    </div>
                </section>

                {/* 4. ACCESS & SHARING */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <LinkIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">4. Access & Sharing</h2>
                            <p className="text-sm text-slate-500">Generate secure credentials for the candidate.</p>
                        </div>
                    </div>

                    {!accessData.interview_id ? (
                        <div className="text-center py-6">
                            <button 
                                onClick={handleGenerateAccess}
                                className="px-8 py-4 bg-slate-900 border-2 border-slate-800 text-white hover:bg-slate-800 rounded-xl font-black shadow-lg shadow-slate-200 transition-all text-lg"
                            >
                                Generate Credentials
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 relative">
                                <button onClick={() => { navigator.clipboard.writeText(accessData.interview_id); alert("Copied ID"); }} className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-800"><Copy size={16}/></button>
                                <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">Interview ID</label>
                                <p className="text-2xl font-black text-emerald-900 font-mono tracking-tighter">{accessData.interview_id}</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative">
                                <button onClick={() => { navigator.clipboard.writeText(accessData.access_key); alert("Copied Key"); }} className="absolute top-4 right-4 text-blue-600 hover:text-blue-800"><Copy size={16}/></button>
                                <label className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Access Key</label>
                                <p className="text-2xl font-black text-blue-900 font-mono tracking-tighter">{accessData.access_key}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl text-white md:col-span-2 relative">
                                <button onClick={() => { navigator.clipboard.writeText(accessData.link); alert("Copied Link"); }} className="absolute top-4 right-4 text-slate-400 hover:text-white"><Copy size={16}/></button>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Shareable Link</label>
                                <p className="text-sm font-medium text-slate-300 break-all">{accessData.link}</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* 5. START INTERVIEW */}
                <section className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">5. Ready to Launch</h2>
                            <p className="text-slate-400">Review all details above. Once activated, the interview link will go live immediately.</p>
                        </div>
                        
                        <button 
                            onClick={handleStartInterview}
                            className="w-full md:w-auto px-10 py-5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-lg shadow-[0_0_40px_-10px_rgba(99,102,241,1)] transition-all flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                            START INTERVIEW <Play size={24} fill="currentColor" />
                        </button>
                    </div>
                </section>

                {/* Bottom Padding */}
                <div className="h-12 w-full"></div>

            </div>
        </div>
    );
};
