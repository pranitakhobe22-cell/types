import { Question } from "../types";

export const CSE_QUESTION_BANK: Question[] = [
  // ==========================================
  // FUNDAMENTALS (Medium)
  // ==========================================
  {
    id: "cse_f_1",
    question: "What is the difference between an Array and a Linked List?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Contiguous vs Non-contiguous memory", importance: "high" },
      { concept: "Fixed size vs Dynamic size", importance: "high" },
      { concept: "O(1) access for arrays", importance: "medium" },
      { concept: "O(1) insertion/deletion for linked lists (if pointer known)", importance: "medium" }
    ]
  },
  {
    id: "cse_f_2",
    question: "What are the four pillars of Object-Oriented Programming?",
    topic: "Programming",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Encapsulation", importance: "high" },
      { concept: "Inheritance", importance: "high" },
      { concept: "Polymorphism", importance: "high" },
      { concept: "Abstraction", importance: "high" }
    ]
  },
  
  // ==========================================
  // CORE TECHNICAL (Easy/Medium/Hard)
  // ==========================================
  {
    id: "cse_c_1",
    question: "What is a Stack?",
    topic: "Data Structures",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    keyConcepts: [
      { concept: "LIFO (Last In First Out)", importance: "high" },
      { concept: "Push and Pop operations", importance: "high" },
      { concept: "Use cases like undo/redo or recursion", importance: "low" }
    ]
  },
  {
    id: "cse_c_2",
    question: "Explain the concept of Database Indexing.",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Speeds up data retrieval", importance: "high" },
      { concept: "Uses B-Trees or Hash maps internally", importance: "medium" },
      { concept: "Slows down write operations (insert/update)", importance: "medium" }
    ]
  },
  {
    id: "cse_c_3",
    question: "What is a Deadlock and what are the Coffman conditions?",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "hard",
    keyConcepts: [
      { concept: "Multiple processes blocking each other", importance: "high" },
      { concept: "Mutual Exclusion", importance: "medium" },
      { concept: "Hold and Wait", importance: "medium" },
      { concept: "No Preemption", importance: "medium" },
      { concept: "Circular Wait", importance: "medium" }
    ]
  },

  // ==========================================
  // SCENARIO (Easy/Medium/Hard)
  // ==========================================
  {
    id: "cse_s_1",
    question: "Users report frequent application crashes. How would you debug the issue?",
    topic: "Debugging",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "easy",
    keyConcepts: [
      { concept: "Check application and server logs", importance: "high" },
      { concept: "Reproduce the error locally", importance: "high" },
      { concept: "Isolate the failing component", importance: "medium" }
    ]
  },
  {
    id: "cse_s_2",
    question: "A database query takes 20 seconds to execute. How would you optimize it?",
    topic: "Performance",
    category: "Database",
    type: "Scenario",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Use EXPLAIN to analyze query execution", importance: "high" },
      { concept: "Add proper indexing", importance: "high" },
      { concept: "Avoid SELECT * and optimize joins", importance: "medium" },
      { concept: "Implement caching (Redis/Memcached)", importance: "low" }
    ]
  },
  {
    id: "cse_s_3",
    question: "How would you design a scalable URL shortening service?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "hard",
    keyConcepts: [
      { concept: "Base62 encoding for short links", importance: "high" },
      { concept: "Database choice (NoSQL for scaling or SQL with sharding)", importance: "medium" },
      { concept: "Caching layer for fast redirects", importance: "high" },
      { concept: "Load balancers to handle traffic", importance: "medium" }
    ]
  },

  // ==========================================
  // BEHAVIORAL (Experience / Situation)
  // ==========================================
  {
    id: "cse_b_1",
    question: "Tell me about a challenging technical project you worked on and how you handled difficulties.",
    topic: "Experience",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Described the project scope clearly", importance: "high" },
      { concept: "Explained their specific contribution", importance: "high" },
      { concept: "Highlighted lessons learned", importance: "medium" }
    ]
  },
  {
    id: "cse_b_2",
    question: "What would you do if production went down at midnight?",
    topic: "Situation",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Immediate acknowledgment and communication", importance: "high" },
      { concept: "Check logs and monitoring tools to isolate", importance: "high" },
      { concept: "Rollback to a stable version if necessary", importance: "medium" },
      { concept: "Post-mortem analysis after recovery", importance: "medium" }
    ]
  },
  {
    id: "cse_c_4",
    question: "What is the difference between SQL and NoSQL databases?",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Relational vs Non-relational", importance: "high" },
      { concept: "Structured schemas vs Dynamic schemas", importance: "high" },
      { concept: "Vertical scaling vs Horizontal scaling", importance: "medium" },
      { concept: "ACID compliance", importance: "medium" }
    ]
  },
  {
    id: "cse_c_5",
    question: "What is Database Normalization?",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Reduces data redundancy", importance: "high" },
      { concept: "Improves data integrity", importance: "high" },
      { concept: "1NF, 2NF, 3NF", importance: "medium" }
    ]
  },
  {
    id: "cse_c_6",
    question: "What is Virtual Memory?",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Using disk space as RAM", importance: "high" },
      { concept: "Paging and swapping", importance: "high" },
      { concept: "Allows running larger programs than physical RAM", importance: "medium" }
    ]
  },
  {
    id: "cse_f_3",
    question: "What is an API?",
    topic: "Web Development",
    category: "Software Engineering",
    type: "Fundamentals",
    difficulty: "easy",
    keyConcepts: [
      { concept: "Application Programming Interface", importance: "high" },
      { concept: "Allows different software to communicate", importance: "high" },
      { concept: "Endpoints, requests, responses", importance: "medium" }
    ]
  },
  {
    id: "cse_f_4",
    question: "What is the difference between HTTP and HTTPS?",
    topic: "Networking",
    category: "Networking",
    type: "Fundamentals",
    difficulty: "easy",
    keyConcepts: [
      { concept: "HTTPS is secure (encrypted)", importance: "high" },
      { concept: "Uses SSL/TLS", importance: "high" },
      { concept: "Port 80 vs Port 443", importance: "medium" }
    ]
  },
  {
    id: "cse_s_4",
    question: "How do you secure a REST API?",
    topic: "Security",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "hard",
    keyConcepts: [
      { concept: "Authentication (JWT, OAuth)", importance: "high" },
      { concept: "HTTPS / SSL", importance: "high" },
      { concept: "Rate limiting", importance: "medium" },
      { concept: "Input validation / sanitization", importance: "medium" }
    ]
  },
  {
    id: "cse_b_3",
    question: "Describe a time you had a disagreement with a team member. How did you resolve it?",
    topic: "Teamwork",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Open communication and listening", importance: "high" },
      { concept: "Focus on the problem, not the person", importance: "high" },
      { concept: "Finding a compromise", importance: "medium" }
    ]
  }
];

export const ECE_QUESTION_BANK: Question[] = [
  // ==========================================
  // FUNDAMENTALS (Medium)
  // ==========================================
  {
    id: "ece_f_1",
    question: "What is the difference between Analog and Digital Signals?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Continuous vs Discrete values", importance: "high" },
      { concept: "Susceptibility to noise (Analog is higher)", importance: "high" },
      { concept: "Representation (Sine waves vs Binary)", importance: "medium" }
    ]
  },
  {
    id: "ece_f_2",
    question: "What is Ohm's Law and what is its limitation?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "medium",
    keyConcepts: [
      { concept: "V = IR", importance: "high" },
      { concept: "Proportionality between voltage and current", importance: "medium" },
      { concept: "Fails for non-linear devices (diodes/transistors)", importance: "high" }
    ]
  },

  // ==========================================
  // CORE TECHNICAL (Easy/Medium/Hard)
  // ==========================================
  {
    id: "ece_c_1",
    question: "What is a diode and what is its primary function?",
    topic: "Components",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    keyConcepts: [
      { concept: "Allows current in one direction only", importance: "high" },
      { concept: "PN Junction", importance: "medium" },
      { concept: "Used for rectification", importance: "medium" }
    ]
  },
  {
    id: "ece_c_2",
    question: "Explain Time Division Multiplexing (TDM).",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Transmitting multiple signals over one channel", importance: "high" },
      { concept: "Dividing channel into separate time slots", importance: "high" },
      { concept: "Requires synchronization", importance: "medium" }
    ]
  },
  {
    id: "ece_c_3",
    question: "Explain the working of a MOSFET and compare it with BJT.",
    topic: "Semiconductors",
    category: "Core Electronics",
    type: "Core",
    difficulty: "hard",
    keyConcepts: [
      { concept: "Voltage-controlled device (MOSFET) vs Current-controlled (BJT)", importance: "high" },
      { concept: "High input impedance in MOSFET", importance: "high" },
      { concept: "Gate, Source, Drain terminals", importance: "medium" },
      { concept: "Faster switching speed in MOSFET", importance: "medium" }
    ]
  },

  // ==========================================
  // SCENARIO (Easy/Medium/Hard)
  // ==========================================
  {
    id: "ece_s_1",
    question: "A circuit is not producing the expected output. How would you troubleshoot it?",
    topic: "Troubleshooting",
    category: "Practical",
    type: "Scenario",
    difficulty: "easy",
    keyConcepts: [
      { concept: "Check power supply and grounds", importance: "high" },
      { concept: "Use multimeter to verify voltages", importance: "high" },
      { concept: "Inspect for loose connections or burnt components", importance: "medium" }
    ]
  },
  {
    id: "ece_s_2",
    question: "A communication channel has excessive noise. How would you identify the source?",
    topic: "Troubleshooting",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Use a spectrum analyzer", importance: "high" },
      { concept: "Check for EMI (Electromagnetic Interference)", importance: "medium" },
      { concept: "Verify grounding and shielding", importance: "high" },
      { concept: "Check SNR ratio", importance: "low" }
    ]
  },
  {
    id: "ece_s_3",
    question: "How would you design a scalable IoT sensor network?",
    topic: "System Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "hard",
    keyConcepts: [
      { concept: "Choose appropriate protocol (MQTT, CoAP)", importance: "high" },
      { concept: "Low power consumption strategy (Sleep modes)", importance: "high" },
      { concept: "Edge computing for data processing", importance: "medium" },
      { concept: "Secure communication (TLS/encryption)", importance: "medium" }
    ]
  },

  // ==========================================
  // BEHAVIORAL (Experience / Situation)
  // ==========================================
  {
    id: "ece_b_1",
    question: "Tell me about a project where you learned a new tool or technology quickly.",
    topic: "Experience",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Explained the tool and the context", importance: "medium" },
      { concept: "Described learning methodology", importance: "high" },
      { concept: "Showed adaptability and fast execution", importance: "high" },
      { concept: "Used STAR method formatting", importance: "low" }
    ]
  },
  {
    id: "ece_b_2",
    question: "What would you do if you discovered a critical design flaw just before a project demonstration?",
    topic: "Situation",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    keyConcepts: [
      { concept: "Assess the severity of the flaw", importance: "high" },
      { concept: "Communicate transparently with stakeholders", importance: "high" },
      { concept: "Propose a mitigation or fallback plan", importance: "medium" },
      { concept: "Avoid hiding the issue", importance: "medium" }
    ]
  }
];
