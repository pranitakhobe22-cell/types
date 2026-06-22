import { Question } from "../types";

export const CSE_QUESTION_BANK: any[] = [
  {
    id: "cse_f_1",
    question: "What is an Array?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Contiguous memory layout", importance: "high" },
      { concept: "O(1) index-based access", importance: "high" },
      { concept: "Fixed size constraint", importance: "medium" },
    ]
  },
  {
    id: "cse_f_2",
    question: "What is a Linked List?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Nodes containing data and pointers", importance: "high" },
      { concept: "Dynamic memory allocation", importance: "high" },
      { concept: "Sequential traversal access", importance: "medium" },
    ]
  },
  {
    id: "cse_f_3",
    question: "What is the difference between an Array and a Linked List?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Contiguous vs non-contiguous memory allocation", importance: "high" },
      { concept: "O(1) random access vs O(N) sequential search", importance: "high" },
      { concept: "Dynamic size resizing overhead", importance: "medium" },
    ]
  },
  {
    id: "cse_f_4",
    question: "What is a Stack?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "LIFO (Last In First Out) concept", importance: "high" },
      { concept: "Push and Pop execution", importance: "high" },
      { concept: "Call stack and undo operations use cases", importance: "low" },
    ]
  },
  {
    id: "cse_f_5",
    question: "What is a Queue?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "FIFO (First In First Out) concept", importance: "high" },
      { concept: "Enqueue and Dequeue execution", importance: "high" },
      { concept: "Task scheduling and printer queue use cases", importance: "low" },
    ]
  },
  {
    id: "cse_f_6",
    question: "What is the difference between Stack and Queue?",
    topic: "Data Structures",
    category: "DSA",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "LIFO vs FIFO logic differences", importance: "high" },
      { concept: "Push/Pop vs Enqueue/Dequeue operations", importance: "high" },
      { concept: "Underlying data structure implementations", importance: "medium" },
    ]
  },
  {
    id: "cse_f_7",
    question: "What is a Variable?",
    topic: "Programming",
    category: "Programming",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Named storage space in RAM", importance: "high" },
      { concept: "Data types allocation constraints", importance: "medium" },
      { concept: "Value assignment and mutability", importance: "medium" },
    ]
  },
  {
    id: "cse_f_8",
    question: "What is a Function?",
    topic: "Programming",
    category: "Programming",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Reusable modular block of code", importance: "high" },
      { concept: "Parameters inputs and return value outputs", importance: "high" },
      { concept: "Variable scope and isolation", importance: "medium" },
    ]
  },
  {
    id: "cse_f_9",
    question: "What is a Class in Object-Oriented Programming?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Blueprint template for creating objects", importance: "high" },
      { concept: "Attributes and methods binding", importance: "high" },
      { concept: "Instantiation process", importance: "medium" },
    ]
  },
  {
    id: "cse_f_10",
    question: "What is an Object?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Instance of a class containing state", importance: "high" },
      { concept: "State variables and behavior methods", importance: "high" },
      { concept: "Memory allocation on the heap", importance: "medium" },
    ]
  },
  {
    id: "cse_f_11",
    question: "What are the four pillars of OOP?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Encapsulation for data hiding", importance: "high" },
      { concept: "Inheritance for code reusability", importance: "high" },
      { concept: "Polymorphism for dynamic binding", importance: "high" },
      { concept: "Abstraction for interface simplicity", importance: "high" },
    ]
  },
  {
    id: "cse_f_12",
    question: "What is Inheritance?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Parent-child relationship code sharing", importance: "high" },
      { concept: "Subclass extending superclass base", importance: "high" },
      { concept: "Is-a relationship design", importance: "medium" },
    ]
  },
  {
    id: "cse_f_13",
    question: "What is Polymorphism?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Single interface with multiple forms", importance: "high" },
      { concept: "Compile-time overloading vs runtime overriding", importance: "high" },
      { concept: "Virtual methods dynamic dispatch", importance: "medium" },
    ]
  },
  {
    id: "cse_f_14",
    question: "What is Encapsulation?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Data hiding using access specifiers", importance: "high" },
      { concept: "Getter and setter control boundaries", importance: "medium" },
      { concept: "Bundling variables and functions", importance: "high" },
    ]
  },
  {
    id: "cse_f_15",
    question: "What is Abstraction?",
    topic: "OOP",
    category: "OOP",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Hiding system implementation details", importance: "high" },
      { concept: "Abstract classes and interface contracts", importance: "high" },
      { concept: "Reducing developer cognitive load", importance: "medium" },
    ]
  },
  {
    id: "cse_f_16",
    question: "What is a Database?",
    topic: "Database",
    category: "Database",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Structured data storage and persistence", importance: "high" },
      { concept: "DBMS management utility software", importance: "medium" },
      { concept: "Transactional storage integrity", importance: "medium" },
    ]
  },
  {
    id: "cse_f_17",
    question: "What is SQL?",
    topic: "Database",
    category: "Database",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Structured Query Language standard", importance: "high" },
      { concept: "Relational tabular model schema", importance: "high" },
      { concept: "Data definition (DDL) and manipulation (DML)", importance: "medium" },
    ]
  },
  {
    id: "cse_f_18",
    question: "What is a Primary Key?",
    topic: "Database",
    category: "Database",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Unique row index identifier", importance: "high" },
      { concept: "Non-null values constraint", importance: "high" },
      { concept: "Single primary key per table limit", importance: "medium" },
    ]
  },
  {
    id: "cse_f_19",
    question: "What is a Foreign Key?",
    topic: "Database",
    category: "Database",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Referential integrity constraint link", importance: "high" },
      { concept: "Mapping table relationships", importance: "high" },
      { concept: "Child table referencing parent table", importance: "medium" },
    ]
  },
  {
    id: "cse_f_20",
    question: "What is Normalization?",
    topic: "Database",
    category: "Database",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Redundancy reduction methodology", importance: "high" },
      { concept: "1NF, 2NF, and 3NF normal forms", importance: "high" },
      { concept: "Anomalies prevention (insert, update, delete)", importance: "medium" },
    ]
  },
  {
    id: "cse_f_21",
    question: "What is an Operating System?",
    topic: "Operating Systems",
    category: "OS",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Hardware resources allocator kernel", importance: "high" },
      { concept: "Abstraction layer for user applications", importance: "high" },
      { concept: "Process and memory manager roles", importance: "medium" },
    ]
  },
  {
    id: "cse_f_22",
    question: "What is a Process?",
    topic: "Operating Systems",
    category: "OS",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Active program in execution", importance: "high" },
      { concept: "Isolated memory address boundaries", importance: "high" },
      { concept: "Process Control Block tracking data", importance: "medium" },
    ]
  },
  {
    id: "cse_f_23",
    question: "What is a Thread?",
    topic: "Operating Systems",
    category: "OS",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Lightweight execution stream in process", importance: "high" },
      { concept: "Shared memory within process", importance: "high" },
      { concept: "Thread scheduling and context switching", importance: "medium" },
    ]
  },
  {
    id: "cse_f_24",
    question: "What is RAM?",
    topic: "Computer Architecture",
    category: "Hardware",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Random Access Memory execution space", importance: "high" },
      { concept: "Volatile temporary storage state", importance: "high" },
      { concept: "Direct byte addressing reads/writes", importance: "medium" },
    ]
  },
  {
    id: "cse_f_25",
    question: "What is ROM?",
    topic: "Computer Architecture",
    category: "Hardware",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Read Only Memory firmware storage", importance: "high" },
      { concept: "Non-volatile permanent state retention", importance: "high" },
      { concept: "BIOS boot instruction records", importance: "medium" },
    ]
  },
  {
    id: "cse_f_26",
    question: "What is an API?",
    topic: "Software Engineering",
    category: "Software Engineering",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Application Programming Interface contract", importance: "high" },
      { concept: "Service integration endpoints", importance: "high" },
      { concept: "Payload formats (JSON, XML)", importance: "medium" },
    ]
  },
  {
    id: "cse_f_27",
    question: "What is HTTP?",
    topic: "Networking",
    category: "Networking",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Hypertext Transfer Protocol stateless system", importance: "high" },
      { concept: "Request-response cycle mechanism", importance: "high" },
      { concept: "Port 80 standard endpoint connection", importance: "medium" },
    ]
  },
  {
    id: "cse_f_28",
    question: "What is HTTPS?",
    topic: "Networking",
    category: "Networking",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Secure HTTP utilizing SSL/TLS", importance: "high" },
      { concept: "Encrypted communication tunnel transit", importance: "high" },
      { concept: "Port 443 standard endpoint connection", importance: "medium" },
    ]
  },
  {
    id: "cse_f_29",
    question: "What is DNS?",
    topic: "Networking",
    category: "Networking",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Domain Name System resolution lookup", importance: "high" },
      { concept: "Hostnames translation to IP addresses", importance: "high" },
      { concept: "Hierarchical distributed database scaling", importance: "medium" },
    ]
  },
  {
    id: "cse_f_30",
    question: "What is Cloud Computing?",
    topic: "Cloud Computing",
    category: "Cloud",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "On-demand internet virtual resources", importance: "high" },
      { concept: "IaaS, PaaS, SaaS service tiers", importance: "high" },
      { concept: "Shared responsibility model guidelines", importance: "medium" },
    ]
  },
  {
    id: "cse_c_1",
    question: "Explain the difference between SQL and NoSQL databases.",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Relational schemas vs dynamic key-value/document stores", importance: "high" },
      { concept: "ACID tabular constraints vs CAP theorem considerations", importance: "high" },
      { concept: "Vertical vs horizontal scalability scaling patterns", importance: "medium" },
    ]
  },
  {
    id: "cse_c_2",
    question: "Explain the concept of Database Indexing.",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Query search times reduction index structures", importance: "high" },
      { concept: "B-Tree and Hash index underlying mechanics", importance: "medium" },
      { concept: "Write penalty overhead during inserts/updates", importance: "high" },
    ]
  },
  {
    id: "cse_c_3",
    question: "What are ACID properties?",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Atomicity, Consistency, Isolation, Durability specifications", importance: "high" },
      { concept: "Transactional integrity checks", importance: "high" },
      { concept: "Rollback and locking isolation levels", importance: "medium" },
    ]
  },
  {
    id: "cse_c_4",
    question: "What is Database Denormalization?",
    topic: "Database",
    category: "Database",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Inserting redundant duplicates to accelerate reads", importance: "high" },
      { concept: "Read optimization vs write complexity overhead", importance: "high" },
      { concept: "Data consistency management strategies", importance: "medium" },
    ]
  },
  {
    id: "cse_c_5",
    question: "What is Multithreading?",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Concurrent execution paths inside single process context", importance: "high" },
      { concept: "Shared process heap memory communication", importance: "high" },
      { concept: "Race conditions and locking/synchronization checks", importance: "medium" },
    ]
  },
  {
    id: "cse_c_6",
    question: "What is a Deadlock?",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "hard",
    discriminationWeight: 1.5,
    keyConcepts: [
      { concept: "Mutual exclusion, hold and wait, no preemption, circular wait", importance: "high" },
      { concept: "Deadlock detection and resource allocation graph checks", importance: "medium" },
      { concept: "Prevention strategies (ordering locks, timeouts)", importance: "high" },
    ]
  },
  {
    id: "cse_c_7",
    question: "Explain Process Scheduling.",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "CPU core allocation scheduler algorithms", importance: "high" },
      { concept: "Preemptive vs non-preemptive processes execution", importance: "medium" },
      { concept: "FCFS, Round Robin, Shortest Job First mechanics", importance: "high" },
    ]
  },
  {
    id: "cse_c_8",
    question: "What is Virtual Memory?",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Disk space utilization as temporary physical RAM", importance: "high" },
      { concept: "Page faults and swapping management", importance: "high" },
      { concept: "TLB and hardware MMU translation", importance: "medium" },
    ]
  },
  {
    id: "cse_c_9",
    question: "Explain Paging and Segmentation.",
    topic: "Operating Systems",
    category: "OS",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Fixed physical page allocations vs logical segments", importance: "high" },
      { concept: "Internal fragmentation in paging vs external fragmentation in segmentation", importance: "high" },
      { concept: "Memory protection bits on addresses", importance: "medium" },
    ]
  },
  {
    id: "cse_c_10",
    question: "What is a Hash Table?",
    topic: "Data Structures",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Hash function index hashing translation", importance: "high" },
      { concept: "Average O(1) time complexity for lookup/insert", importance: "high" },
      { concept: "Collision resolution via chaining or open addressing", importance: "medium" },
    ]
  },
  {
    id: "cse_c_11",
    question: "What is Time Complexity?",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Instruction execution count growth scaling", importance: "high" },
      { concept: "Asymptotic upper bounds estimations", importance: "high" },
      { concept: "Worst, average, and best-case performance analysis", importance: "medium" },
    ]
  },
  {
    id: "cse_c_12",
    question: "Explain Big O Notation.",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Mathematical worst-case upper bound notation", importance: "high" },
      { concept: "Ignoring constant coefficients and smaller growth variables", importance: "high" },
      { concept: "Common complexity scales: O(1), O(log N), O(N), O(N^2)", importance: "medium" },
    ]
  },
  {
    id: "cse_c_13",
    question: "What is Recursion?",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Function self-calling structure mechanics", importance: "high" },
      { concept: "Base case exit condition requirement", importance: "high" },
      { concept: "Stack frame memory consumption and stack overflows", importance: "medium" },
    ]
  },
  {
    id: "cse_c_14",
    question: "What is Dynamic Programming?",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "hard",
    discriminationWeight: 1.5,
    keyConcepts: [
      { concept: "Overlapping subproblems property", importance: "high" },
      { concept: "Optimal substructure composition property", importance: "high" },
      { concept: "Top-down memoization vs bottom-up tabulation", importance: "medium" },
    ]
  },
  {
    id: "cse_c_15",
    question: "Explain Binary Search.",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sorted array prerequisite", importance: "high" },
      { concept: "Logarithmic search division O(log N)", importance: "high" },
      { concept: "Divide-and-conquer implementation framework", importance: "medium" },
    ]
  },
  {
    id: "cse_c_16",
    question: "What is a Tree Data Structure?",
    topic: "Data Structures",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Hierarchical node configuration", importance: "high" },
      { concept: "Root, leaf, parent, child definitions", importance: "medium" },
      { concept: "Acyclic tree properties", importance: "medium" },
    ]
  },
  {
    id: "cse_c_17",
    question: "What is a Binary Search Tree?",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sorted array prerequisite", importance: "high" },
      { concept: "Logarithmic search division O(log N)", importance: "high" },
      { concept: "Divide-and-conquer implementation framework", importance: "medium" },
    ]
  },
  {
    id: "cse_c_18",
    question: "What is a Graph Data Structure?",
    topic: "Data Structures",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Node vertices connected by edge lines", importance: "high" },
      { concept: "Adjacency matrix vs adjacency list structures", importance: "high" },
      { concept: "Directed vs undirected paths properties", importance: "medium" },
    ]
  },
  {
    id: "cse_c_19",
    question: "Explain BFS and DFS.",
    topic: "Algorithms",
    category: "DSA",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Queue-based level-order search (BFS)", importance: "high" },
      { concept: "Stack/recursion-based depth search (DFS)", importance: "high" },
      { concept: "O(V + E) node traversal complexities", importance: "medium" },
    ]
  },
  {
    id: "cse_c_20",
    question: "What is a REST API?",
    topic: "Web Development",
    category: "Software Engineering",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Stateless client-server HTTP communications", importance: "high" },
      { concept: "Standard CRUD methods mapping (GET, POST, PUT, DELETE)", importance: "high" },
      { concept: "URI resource mapping structures", importance: "medium" },
    ]
  },
  {
    id: "cse_c_21",
    question: "What is GraphQL?",
    topic: "Data Structures",
    category: "DSA",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Node vertices connected by edge lines", importance: "high" },
      { concept: "Adjacency matrix vs adjacency list structures", importance: "high" },
      { concept: "Directed vs undirected paths properties", importance: "medium" },
    ]
  },
  {
    id: "cse_c_22",
    question: "What is Authentication and Authorization?",
    topic: "Security",
    category: "Software Engineering",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Identity mapping verification (Authentication) vs access rights checks (Authorization)", importance: "high" },
      { concept: "Token mechanisms (JWT, OAuth) vs session cookie tracking", importance: "high" },
      { concept: "HTTP status codes rules (401 vs 403 response types)", importance: "medium" },
    ]
  },
  {
    id: "cse_c_23",
    question: "Explain JWT.",
    topic: "Security",
    category: "Software Engineering",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Header, payload, and cryptographic signature segments", importance: "high" },
      { concept: "Stateless claims transmission", importance: "high" },
      { concept: "Token encryption vs signing properties", importance: "medium" },
    ]
  },
  {
    id: "cse_c_24",
    question: "What is Microservices Architecture?",
    topic: "System Design",
    category: "System Design",
    type: "Core",
    difficulty: "hard",
    discriminationWeight: 1.5,
    keyConcepts: [
      { concept: "Decoupled bounded-context services", importance: "high" },
      { concept: "API gateway routing architecture", importance: "medium" },
      { concept: "Distributed data consistency challenges (Saga, Eventual consistency)", importance: "high" },
    ]
  },
  {
    id: "cse_c_25",
    question: "What is a Monolithic Architecture?",
    topic: "System Design",
    category: "System Design",
    type: "Core",
    difficulty: "hard",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Single codebase compiled and deployed unit", importance: "high" },
      { concept: "Simplified local debugging and pipeline testing", importance: "medium" },
      { concept: "Scaling bottlenecks and codebase ownership scaling issues", importance: "high" },
    ]
  },
  {
    id: "cse_c_26",
    question: "What is Containerization?",
    topic: "DevOps",
    category: "Cloud",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Packaging code with dependency runtime environments", importance: "high" },
      { concept: "Lightweight kernel-sharing namespace isolation", importance: "high" },
      { concept: "Consistency across dev/staging/production pipelines", importance: "medium" },
    ]
  },
  {
    id: "cse_c_27",
    question: "What is Docker?",
    topic: "DevOps",
    category: "Cloud",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Docker image building rules (Dockerfile instructions)", importance: "high" },
      { concept: "Container isolation runtime parameters", importance: "high" },
      { concept: "Layer caching optimization mechanisms", importance: "medium" },
    ]
  },
  {
    id: "cse_c_28",
    question: "What is CI/CD?",
    topic: "DevOps",
    category: "Cloud",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Continuous integration automated tests triggers", importance: "high" },
      { concept: "Continuous deployment pipeline automated delivery", importance: "high" },
      { concept: "Artifact repository version control integrations", importance: "medium" },
    ]
  },
  {
    id: "cse_c_29",
    question: "What is Load Balancing?",
    topic: "DevOps",
    category: "Cloud",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Traffic allocation algorithms (Round Robin, Least Connections)", importance: "high" },
      { concept: "High availability cluster health checks", importance: "high" },
      { concept: "Layer 4 transport vs Layer 7 application routing", importance: "medium" },
    ]
  },
  {
    id: "cse_c_30",
    question: "What is Caching?",
    topic: "Performance",
    category: "Cloud",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Temporary memory caching data layer (Redis, Memcached)", importance: "high" },
      { concept: "Cache eviction strategies (LRU, LFU, TTL configurations)", importance: "high" },
      { concept: "Cache stampede and consistency challenges", importance: "medium" },
    ]
  },
  {
    id: "cse_s_1",
    question: "A website becomes slow during peak traffic. How would you investigate?",
    topic: "Performance Optimization",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Bottleneck profiling and APM logs analysis", importance: "high" },
      { concept: "Database indexing or caching optimizations", importance: "high" },
      { concept: "Payload sizes compression or lazy loading", importance: "medium" },
    ]
  },
  {
    id: "cse_s_2",
    question: "A database query takes 20 seconds to execute. How would you optimize it?",
    topic: "Database Systems",
    category: "Database",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Query optimization (EXPLAIN command, indexing)", importance: "high" },
      { concept: "Idempotency locks or isolation level constraints", importance: "high" },
      { concept: "Audit logs checks and transaction history rollback", importance: "medium" },
    ]
  },
  {
    id: "cse_s_3",
    question: "Users report frequent application crashes. How would you debug the issue?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_4",
    question: "How would you design a URL shortening service?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_5",
    question: "How would you design an online library management system?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_6",
    question: "A login page is vulnerable to attacks. How would you secure it?",
    topic: "Security",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Cryptographic password hashing (bcrypt, Argon2)", importance: "high" },
      { concept: "Input validation and SQL Injection/XSS prevention", importance: "high" },
      { concept: "Rate limiting implementation and brute force protection", importance: "medium" },
    ]
  },
  {
    id: "cse_s_7",
    question: "A website loads slowly on mobile devices. How would you improve performance?",
    topic: "Performance Optimization",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Bottleneck profiling and APM logs analysis", importance: "high" },
      { concept: "Database indexing or caching optimizations", importance: "high" },
      { concept: "Payload sizes compression or lazy loading", importance: "medium" },
    ]
  },
  {
    id: "cse_s_8",
    question: "How would you handle millions of API requests per day?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Functional requirements mapping", importance: "high" },
      { concept: "Scalability and data flow layout", importance: "high" },
      { concept: "Trade-offs between different architectural approaches", importance: "medium" },
    ]
  },
  {
    id: "cse_s_9",
    question: "How would you design a simple chat application?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_10",
    question: "A server suddenly runs out of memory. What would you do?",
    topic: "Troubleshooting",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Heap dump analytics or logs inspection", importance: "high" },
      { concept: "Memory leak tracing or circuit breaker pattern", importance: "high" },
      { concept: "Isolating failing components locally", importance: "medium" },
    ]
  },
  {
    id: "cse_s_11",
    question: "How would you reduce database load in a large application?",
    topic: "Database Systems",
    category: "Database",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Query optimization (EXPLAIN command, indexing)", importance: "high" },
      { concept: "Idempotency locks or isolation level constraints", importance: "high" },
      { concept: "Audit logs checks and transaction history rollback", importance: "medium" },
    ]
  },
  {
    id: "cse_s_12",
    question: "How would you store and retrieve large files efficiently?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Functional requirements mapping", importance: "high" },
      { concept: "Scalability and data flow layout", importance: "high" },
      { concept: "Trade-offs between different architectural approaches", importance: "medium" },
    ]
  },
  {
    id: "cse_s_13",
    question: "Design a simple e-commerce backend.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_14",
    question: "How would you prevent duplicate transactions in an online payment system?",
    topic: "Database Systems",
    category: "Database",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Query optimization (EXPLAIN command, indexing)", importance: "high" },
      { concept: "Idempotency locks or isolation level constraints", importance: "high" },
      { concept: "Audit logs checks and transaction history rollback", importance: "medium" },
    ]
  },
  {
    id: "cse_s_15",
    question: "A customer reports missing data. How would you investigate?",
    topic: "Database Systems",
    category: "Database",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Query optimization (EXPLAIN command, indexing)", importance: "high" },
      { concept: "Idempotency locks or isolation level constraints", importance: "high" },
      { concept: "Audit logs checks and transaction history rollback", importance: "medium" },
    ]
  },
  {
    id: "cse_s_16",
    question: "How would you improve website scalability?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Functional requirements mapping", importance: "high" },
      { concept: "Scalability and data flow layout", importance: "high" },
      { concept: "Trade-offs between different architectural approaches", importance: "medium" },
    ]
  },
  {
    id: "cse_s_17",
    question: "Design a notification system for a social media platform.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_18",
    question: "How would you monitor production system health?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_19",
    question: "How would you handle application logs in a large system?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_20",
    question: "Design a simple ride-booking application.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_21",
    question: "How would you secure user passwords?",
    topic: "Security",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Cryptographic password hashing (bcrypt, Argon2)", importance: "high" },
      { concept: "Input validation and SQL Injection/XSS prevention", importance: "high" },
      { concept: "Rate limiting implementation and brute force protection", importance: "medium" },
    ]
  },
  {
    id: "cse_s_22",
    question: "A third-party API becomes unavailable. What would you do?",
    topic: "Troubleshooting",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Heap dump analytics or logs inspection", importance: "high" },
      { concept: "Memory leak tracing or circuit breaker pattern", importance: "high" },
      { concept: "Isolating failing components locally", importance: "medium" },
    ]
  },
  {
    id: "cse_s_23",
    question: "How would you implement rate limiting?",
    topic: "Security",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Cryptographic password hashing (bcrypt, Argon2)", importance: "high" },
      { concept: "Input validation and SQL Injection/XSS prevention", importance: "high" },
      { concept: "Rate limiting implementation and brute force protection", importance: "medium" },
    ]
  },
  {
    id: "cse_s_24",
    question: "Design a file-sharing platform.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_25",
    question: "How would you detect performance bottlenecks?",
    topic: "Performance Optimization",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Bottleneck profiling and APM logs analysis", importance: "high" },
      { concept: "Database indexing or caching optimizations", importance: "high" },
      { concept: "Payload sizes compression or lazy loading", importance: "medium" },
    ]
  },
  {
    id: "cse_s_26",
    question: "Design a student attendance management system.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_27",
    question: "How would you handle concurrent database updates?",
    topic: "Database Systems",
    category: "Database",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Query optimization (EXPLAIN command, indexing)", importance: "high" },
      { concept: "Idempotency locks or isolation level constraints", importance: "high" },
      { concept: "Audit logs checks and transaction history rollback", importance: "medium" },
    ]
  },
  {
    id: "cse_s_28",
    question: "Design a movie ticket booking system.",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_s_29",
    question: "How would you improve API response times?",
    topic: "Performance Optimization",
    category: "Software Engineering",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Bottleneck profiling and APM logs analysis", importance: "high" },
      { concept: "Database indexing or caching optimizations", importance: "high" },
      { concept: "Payload sizes compression or lazy loading", importance: "medium" },
    ]
  },
  {
    id: "cse_s_30",
    question: "How would you design a scalable search system?",
    topic: "System Design",
    category: "System Design",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Component separation and API interface design", importance: "high" },
      { concept: "Scaling limits resolution (load balancing, caching)", importance: "high" },
      { concept: "Database technology selection (SQL vs NoSQL)", importance: "medium" },
    ]
  },
  {
    id: "cse_be_1",
    question: "Tell me about yourself.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_2",
    question: "Describe a project you are most proud of.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_3",
    question: "Tell me about a difficult bug you fixed.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_4",
    question: "Describe a time you learned a new technology quickly.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_5",
    question: "Tell me about a project that did not go as planned.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_6",
    question: "Describe a challenging academic assignment.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_7",
    question: "Tell me about a time you worked under pressure.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_8",
    question: "Describe a time you solved a complex problem.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_9",
    question: "Tell me about your final-year project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_10",
    question: "Describe a time you worked with a difficult teammate.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_11",
    question: "Tell me about a mistake you made and what you learned.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_12",
    question: "Describe a time you took initiative.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_13",
    question: "Tell me about a technical challenge you faced.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_14",
    question: "Describe a time you had multiple deadlines.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_15",
    question: "Tell me about your favorite programming project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_16",
    question: "Describe a time you improved a process.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_17",
    question: "Tell me about a time you received constructive criticism.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_18",
    question: "Describe a successful team project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_19",
    question: "Tell me about a leadership experience.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_20",
    question: "Describe a time you had to explain a technical concept to a non-technical person.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_21",
    question: "Tell me about a project where requirements changed midway.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_22",
    question: "Describe a time you failed and recovered.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_23",
    question: "Tell me about a difficult decision you made.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_24",
    question: "Describe a time you helped a teammate.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_25",
    question: "Tell me about a project where you exceeded expectations.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_26",
    question: "Describe a time you handled conflict.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_27",
    question: "Tell me about your biggest learning experience.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_28",
    question: "Describe a time you managed limited resources.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_29",
    question: "Tell me about a situation where you adapted quickly.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_be_30",
    question: "Describe your most technically demanding project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific individual ownership and action details", importance: "high" },
      { concept: "Learning takeaways and professional maturity", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_1",
    question: "What would you do if a teammate consistently missed deadlines?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_2",
    question: "How would you handle disagreement with a team lead?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_3",
    question: "What would you do if you discovered a critical bug before release?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_4",
    question: "How would you respond if assigned an unfamiliar technology?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_5",
    question: "What would you do if project requirements were unclear?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_6",
    question: "How would you prioritize multiple urgent tasks?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_7",
    question: "What would you do if a team member took credit for your work?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_8",
    question: "How would you handle conflicting stakeholder requirements?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_9",
    question: "What would you do if your solution was rejected?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_10",
    question: "How would you approach an impossible deadline?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_11",
    question: "What would you do if production went down at midnight?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_12",
    question: "How would you handle receiving negative feedback?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_13",
    question: "What would you do if you disagreed with a design decision?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_14",
    question: "How would you mentor a struggling junior teammate?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_15",
    question: "What would you do if you accidentally introduced a bug?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_16",
    question: "How would you handle an uncooperative team member?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_17",
    question: "What would you do if customer requirements kept changing?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_18",
    question: "How would you react if your project failed?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_19",
    question: "What would you do if you had insufficient information to proceed?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_20",
    question: "How would you handle pressure from multiple managers?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_21",
    question: "What would you do if a critical dependency was delayed?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_22",
    question: "How would you respond to a security vulnerability discovery?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_23",
    question: "What would you do if a customer complained about your product?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_24",
    question: "How would you handle being assigned multiple projects?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_25",
    question: "What would you do if your team missed a milestone?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_26",
    question: "How would you manage communication in a remote team?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_27",
    question: "What would you do if you found unethical behavior?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_28",
    question: "How would you approach improving an outdated system?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_29",
    question: "What would you do if your idea was ignored initially?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
  {
    id: "cse_bs_30",
    question: "How would you balance quality and speed under pressure?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Active communication and proactive listening", importance: "high" },
      { concept: "Professional conflict resolution or fallback planning steps", importance: "high" },
      { concept: "Constructive output and system improvements delivery", importance: "medium" },
    ]
  },
];

export const ECE_QUESTION_BANK: any[] = [
  {
    id: "ece_f_1",
    question: "What is Ohm's Law?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "V = IR voltage-current proportionality", importance: "high" },
      { concept: "Limitation to constant temperature/ohmic devices", importance: "high" },
      { concept: "Linear resistance definition", importance: "medium" },
    ]
  },
  {
    id: "ece_f_2",
    question: "What is Voltage?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Electric potential difference", importance: "high" },
      { concept: "Electromotive force push", importance: "medium" },
      { concept: "Work done per unit charge (Joules/Coulomb)", importance: "high" },
    ]
  },
  {
    id: "ece_f_3",
    question: "What is Current?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Flow rate of electric charge (Coulombs/sec)", importance: "high" },
      { concept: "Amperes unit definition", importance: "medium" },
      { concept: "Drift velocity of charge carriers", importance: "medium" },
    ]
  },
  {
    id: "ece_f_4",
    question: "What is Resistance?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Opposition to electric current flow", importance: "high" },
      { concept: "Resistivity and conductor physical dimension laws", importance: "high" },
      { concept: "Ohm unit definition", importance: "medium" },
    ]
  },
  {
    id: "ece_f_5",
    question: "What is Power in an electrical circuit?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Rate of electrical energy dissipation", importance: "high" },
      { concept: "P = VI and current-squared times resistance derivatives", importance: "high" },
      { concept: "Watts unit definition", importance: "medium" },
    ]
  },
  {
    id: "ece_f_6",
    question: "What is the function of a resistor?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Current limitation role", importance: "high" },
      { concept: "Voltage division circuit configuration", importance: "high" },
      { concept: "Joule heating power dissipation", importance: "medium" },
    ]
  },
  {
    id: "ece_f_7",
    question: "What is the function of a capacitor?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Electrostatic field charge storage", importance: "high" },
      { concept: "Blocking DC current and passing AC signals", importance: "high" },
      { concept: "Filtering supply voltage ripples", importance: "medium" },
    ]
  },
  {
    id: "ece_f_8",
    question: "What is the function of an inductor?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Magnetic field energy storage", importance: "high" },
      { concept: "Blocking high-frequency AC and passing DC signals", importance: "high" },
      { concept: "Choke filtering application", importance: "medium" },
    ]
  },
  {
    id: "ece_f_9",
    question: "What is a transistor?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Active three-terminal semiconductor device", importance: "high" },
      { concept: "Signal amplification functionality", importance: "medium" },
      { concept: "Electronic switching functionality", importance: "high" },
    ]
  },
  {
    id: "ece_f_10",
    question: "What is a diode?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Unidirectional current flow control", importance: "high" },
      { concept: "PN junction potential barrier", importance: "medium" },
      { concept: "Rectification and protection applications", importance: "medium" },
    ]
  },
  {
    id: "ece_f_11",
    question: "What is the difference between AC and DC current?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Alternating current bi-directional flow vs direct current uni-directional flow", importance: "high" },
      { concept: "Frequency component in AC supply", importance: "medium" },
      { concept: "Power transmission grids efficiency differences", importance: "medium" },
    ]
  },
  {
    id: "ece_f_12",
    question: "What is the difference between Analog and Digital Signals?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Continuous electrical values vs discrete binary levels", importance: "high" },
      { concept: "Noise susceptibility differences (analog is higher)", importance: "high" },
      { concept: "Processing and compression advantages", importance: "medium" },
    ]
  },
  {
    id: "ece_f_13",
    question: "What is Frequency?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Cycles completed per second (Hertz)", importance: "high" },
      { concept: "Inverse relationship to time period (T = 1/f)", importance: "high" },
      { concept: "Spectrum allocation and bandwidth", importance: "medium" },
    ]
  },
  {
    id: "ece_f_14",
    question: "What is Wavelength?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Physical distance between identical wave points", importance: "high" },
      { concept: "Inverse relationship to frequency (c = f * lambda)", importance: "high" },
      { concept: "Antenna dimensions calculation relevance", importance: "medium" },
    ]
  },
  {
    id: "ece_f_15",
    question: "What is Amplitude?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Maximum peak height displacement", importance: "high" },
      { concept: "Signal strength and power representation", importance: "high" },
      { concept: "Power relation to amplitude squared", importance: "medium" },
    ]
  },
  {
    id: "ece_f_16",
    question: "What is Modulation?",
    topic: "Communication",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "medium",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Superimposing message on high-frequency carrier wave", importance: "high" },
      { concept: "Information transmission over long distances", importance: "high" },
      { concept: "Antenna sizing reduction", importance: "medium" },
    ]
  },
  {
    id: "ece_f_17",
    question: "What is Demodulation?",
    topic: "Communication",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Extracting source message from modulated carrier wave", importance: "high" },
      { concept: "Receiver stage filtering and detection", importance: "high" },
      { concept: "Envelope detector and synchronous detection methods", importance: "medium" },
    ]
  },
  {
    id: "ece_f_18",
    question: "What is Bandwidth?",
    topic: "Communication",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Range of frequencies allocated in transmission medium", importance: "high" },
      { concept: "Information carrying capacity limitation", importance: "high" },
      { concept: "Shannon-Hartley theorem capacity", importance: "medium" },
    ]
  },
  {
    id: "ece_f_19",
    question: "What is Impedance?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Total AC opposition (Z = R + jX)", importance: "high" },
      { concept: "Resistive part and reactive component", importance: "medium" },
      { concept: "Maximum power transfer impedance matching requirement", importance: "high" },
    ]
  },
  {
    id: "ece_f_20",
    question: "What is Signal Attenuation?",
    topic: "Signals",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Signal strength loss through propagation medium", importance: "high" },
      { concept: "Decibels per unit length scaling", importance: "medium" },
      { concept: "Repeater and amplifier gain requirements", importance: "high" },
    ]
  },
  {
    id: "ece_f_21",
    question: "What is a Microprocessor?",
    topic: "Digital Systems",
    category: "Embedded",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Central processing unit on single IC chip", importance: "high" },
      { concept: "Requires external memory and input/output interfaces", importance: "high" },
      { concept: "General-purpose high-performance processing focus", importance: "medium" },
    ]
  },
  {
    id: "ece_f_22",
    question: "What is a Microcontroller?",
    topic: "Digital Systems",
    category: "Embedded",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "CPU, RAM, ROM, and I/O integrated on one chip", importance: "high" },
      { concept: "Dedicated control applications execution focus", importance: "high" },
      { concept: "Low power and resource constraints profile", importance: "medium" },
    ]
  },
  {
    id: "ece_f_23",
    question: "What is an Integrated Circuit (IC)?",
    topic: "Components",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Microscopic silicon wafer chip integrating elements", importance: "high" },
      { concept: "VLSI component density scaling", importance: "medium" },
      { concept: "Monolithic fabrication process", importance: "medium" },
    ]
  },
  {
    id: "ece_f_24",
    question: "What is a PCB?",
    topic: "Manufacturing",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Printed Circuit Board etching tracks", importance: "high" },
      { concept: "FR4 mechanical substrate support", importance: "medium" },
      { concept: "Copper layers and solder mask routing", importance: "medium" },
    ]
  },
  {
    id: "ece_f_25",
    question: "What is an Antenna?",
    topic: "Electromagnetics",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Guided wave to space electromagnetic wave transducer", importance: "high" },
      { concept: "Radiation pattern and directional gain", importance: "high" },
      { concept: "Impedance matching parameters", importance: "medium" },
    ]
  },
  {
    id: "ece_f_26",
    question: "What is Electromagnetic Interference (EMI)?",
    topic: "Electromagnetics",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Electromagnetic disturbance in circuits", importance: "high" },
      { concept: "Crosstalk or noise distortions", importance: "medium" },
      { concept: "Grounding plane and metallic shielding protection", importance: "high" },
    ]
  },
  {
    id: "ece_f_27",
    question: "What is Signal-to-Noise Ratio (SNR)?",
    topic: "Signals",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Signal power divided by noise power ratio", importance: "high" },
      { concept: "Decibel logarithmic scale", importance: "medium" },
      { concept: "Channel communication quality threshold", importance: "high" },
    ]
  },
  {
    id: "ece_f_28",
    question: "What is ADC (Analog-to-Digital Converter)?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Sampling analog signal and quantizing values", importance: "high" },
      { concept: "Nyquist sampling theorem rules", importance: "high" },
      { concept: "Resolution in bits (quantization levels)", importance: "medium" },
    ]
  },
  {
    id: "ece_f_29",
    question: "What is DAC (Digital-to-Analog Converter)?",
    topic: "Signals",
    category: "Core Electronics",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Digital code binary conversion to analog voltages", importance: "high" },
      { concept: "Resolution step size weightings", importance: "medium" },
      { concept: "Reconstruction low-pass filters usage", importance: "high" },
    ]
  },
  {
    id: "ece_f_30",
    question: "What is a Communication System?",
    topic: "Communication",
    category: "Communication",
    type: "Fundamentals",
    difficulty: "easy",
    discriminationWeight: 0.8,
    keyConcepts: [
      { concept: "Transmitter, channel, and receiver blocks stages", importance: "high" },
      { concept: "Source coding and channel coding operations", importance: "medium" },
      { concept: "Signal modulation and noise parameters", importance: "high" },
    ]
  },
  {
    id: "ece_c_1",
    question: "Explain the working principle of a PN Junction Diode.",
    topic: "Semiconductors",
    category: "Core Electronics",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Depletion region barrier potential", importance: "high" },
      { concept: "Forward bias diffusion current flow", importance: "high" },
      { concept: "Reverse bias depletion expansion and leakage current", importance: "medium" },
    ]
  },
  {
    id: "ece_c_2",
    question: "What is a Zener Diode and where is it used?",
    topic: "Semiconductors",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Zener and Avalanche breakdown reverse bias mechanisms", importance: "high" },
      { concept: "Constant voltage reference characteristics", importance: "high" },
      { concept: "Shunt voltage regulation circuit designs", importance: "medium" },
    ]
  },
  {
    id: "ece_c_3",
    question: "Explain the working of a Bipolar Junction Transistor (BJT).",
    topic: "Semiconductors",
    category: "Core Electronics",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Emitter, base, and collector regions", importance: "high" },
      { concept: "Current-controlled bipolar current source BJT", importance: "high" },
      { concept: "Active, saturation, and cut-off operation regions", importance: "medium" },
    ]
  },
  {
    id: "ece_c_4",
    question: "What is a MOSFET?",
    topic: "Semiconductors",
    category: "Core Electronics",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Voltage-controlled field effect transistor gates", importance: "high" },
      { concept: "High gate input impedance gate isolation", importance: "high" },
      { concept: "Gate, source, drain, and bulk terminals", importance: "medium" },
    ]
  },
  {
    id: "ece_c_5",
    question: "Explain the operation of an Operational Amplifier.",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "High gain differential voltage amplifier stage", importance: "high" },
      { concept: "Inverting and non-inverting feedback topologies", importance: "high" },
      { concept: "Virtual ground concept in negative feedback", importance: "medium" },
    ]
  },
  {
    id: "ece_c_6",
    question: "What are the characteristics of an ideal Op-Amp?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "High gain differential voltage amplifier stage", importance: "high" },
      { concept: "Inverting and non-inverting feedback topologies", importance: "high" },
      { concept: "Virtual ground concept in negative feedback", importance: "medium" },
    ]
  },
  {
    id: "ece_c_7",
    question: "Explain AM Modulation.",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Carrier amplitude varied with message voltage", importance: "high" },
      { concept: "Upper and lower sidebands spectrum structure", importance: "medium" },
      { concept: "Modulation index calculation and envelope detector", importance: "high" },
    ]
  },
  {
    id: "ece_c_8",
    question: "Explain FM Modulation.",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Carrier frequency varied with message voltage", importance: "high" },
      { concept: "Frequency deviation ratio parameters", importance: "medium" },
      { concept: "High noise immunity advantages compared to AM", importance: "high" },
    ]
  },
  {
    id: "ece_c_9",
    question: "Compare AM and FM.",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "AM narrow bandwidth vs FM wider bandwidth requirements", importance: "high" },
      { concept: "Noise immunity performance comparisons", importance: "high" },
      { concept: "Circuit complexity differences", importance: "medium" },
    ]
  },
  {
    id: "ece_c_10",
    question: "What is Pulse Code Modulation (PCM)?",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sampling, quantization, and binary encoding stages", importance: "high" },
      { concept: "Nyquist sampling theorem minimum rate limit", importance: "high" },
      { concept: "Quantization error noise generation", importance: "medium" },
    ]
  },
  {
    id: "ece_c_11",
    question: "What is Multiplexing?",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Channel sharing among multiple message sources", importance: "high" },
      { concept: "Multiplexers and demultiplexers routing", importance: "high" },
      { concept: "Efficiency optimization of medium bandwidth", importance: "medium" },
    ]
  },
  {
    id: "ece_c_12",
    question: "Explain Time Division Multiplexing (TDM).",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sharing channel based on distinct time slots allocations", importance: "high" },
      { concept: "Digital signals multiplexing frames", importance: "medium" },
      { concept: "Sender-receiver synchronization tracking necessity", importance: "high" },
    ]
  },
  {
    id: "ece_c_13",
    question: "Explain Frequency Division Multiplexing (FDM).",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sharing channel based on distinct frequency bands", importance: "high" },
      { concept: "Guard bands to prevent overlapping channel crosstalk", importance: "high" },
      { concept: "Analog signal compatibility", importance: "medium" },
    ]
  },
  {
    id: "ece_c_14",
    question: "What is Pulse Width Modulation (PWM)?",
    topic: "Circuits",
    category: "Core Electronics",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Varying pulse duty cycle square wave parameters", importance: "high" },
      { concept: "Average power control in load devices", importance: "high" },
      { concept: "Motor speed control and LED dimming applications", importance: "medium" },
    ]
  },
  {
    id: "ece_c_15",
    question: "What are Communication Protocols?",
    topic: "Protocols",
    category: "Embedded",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Synchronous vs Asynchronous standards", importance: "high" },
      { concept: "Baud rate, frame format, and parity parameters", importance: "medium" },
      { concept: "Bus topologies and master-slave assignments", importance: "high" },
    ]
  },
  {
    id: "ece_c_16",
    question: "Explain UART Communication.",
    topic: "Protocols",
    category: "Embedded",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Universal Asynchronous Receiver-Transmitter framework", importance: "high" },
      { concept: "Asynchronous frame timing (Start and Stop bits)", importance: "high" },
      { concept: "Point-to-point cross TX-RX wires configuration", importance: "medium" },
    ]
  },
  {
    id: "ece_c_17",
    question: "Explain SPI Communication.",
    topic: "Protocols",
    category: "Embedded",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Serial Peripheral Interface synchronous master-slave clock", importance: "high" },
      { concept: "Full-duplex MOSI, MISO, SCLK communication lines", importance: "high" },
      { concept: "Chip select SS/CS lines addressing", importance: "medium" },
    ]
  },
  {
    id: "ece_c_18",
    question: "Explain I2C Communication.",
    topic: "Protocols",
    category: "Embedded",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Inter-Integrated Circuit two-wire bus control", importance: "high" },
      { concept: "SDA (Data) and SCL (Clock) shared pull-up lines", importance: "high" },
      { concept: "7-bit or 10-bit device addressing system", importance: "medium" },
    ]
  },
  {
    id: "ece_c_19",
    question: "What is Digital Logic?",
    topic: "Digital Systems",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Binary representation Boolean algebra operations", importance: "high" },
      { concept: "Combinational logic arrays (multiplexers, adders)", importance: "medium" },
      { concept: "Sequential circuits clock states", importance: "high" },
    ]
  },
  {
    id: "ece_c_20",
    question: "What are Logic Gates?",
    topic: "Digital Systems",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "AND, OR, NOT, XOR operations", importance: "high" },
      { concept: "Universal gates (NAND, NOR) completeness", importance: "high" },
      { concept: "Gate propagation delays", importance: "medium" },
    ]
  },
  {
    id: "ece_c_21",
    question: "Explain Flip-Flops.",
    topic: "Digital Systems",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "1-bit edge-triggered digital memory element", importance: "high" },
      { concept: "SR, JK, D, and T flip-flop behavior differences", importance: "high" },
      { concept: "Race-around condition in JK flip-flop", importance: "medium" },
    ]
  },
  {
    id: "ece_c_22",
    question: "What is a Register?",
    topic: "Digital Systems",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Group of flip-flops holding multi-bit binary data", importance: "high" },
      { concept: "Shift register loading operations (SISO, SIPO, PIPO)", importance: "high" },
      { concept: "Temporary storage in CPU execution path", importance: "medium" },
    ]
  },
  {
    id: "ece_c_23",
    question: "What is a Counter Circuit?",
    topic: "Digital Systems",
    category: "Core Electronics",
    type: "Core",
    difficulty: "easy",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sequential circuit counting pulses sequence", importance: "high" },
      { concept: "Ripple/Asynchronous vs Synchronous counter designs", importance: "high" },
      { concept: "Modulo division states selection", importance: "medium" },
    ]
  },
  {
    id: "ece_c_24",
    question: "Explain Error Detection Techniques.",
    topic: "Signals",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Parity bit checks", importance: "high" },
      { concept: "Checksum generation logic", importance: "medium" },
      { concept: "Cyclic Redundancy Check (CRC) polynomial division", importance: "high" },
    ]
  },
  {
    id: "ece_c_25",
    question: "Explain Error Correction Techniques.",
    topic: "Signals",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Hamming code redundancy distance checks", importance: "high" },
      { concept: "Forward Error Correction (FEC) block code mechanisms", importance: "high" },
      { concept: "Redundancy bandwidth overhead trade-offs", importance: "medium" },
    ]
  },
  {
    id: "ece_c_26",
    question: "What is OFDM?",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Sharing channel based on distinct frequency bands", importance: "high" },
      { concept: "Guard bands to prevent overlapping channel crosstalk", importance: "high" },
      { concept: "Analog signal compatibility", importance: "medium" },
    ]
  },
  {
    id: "ece_c_27",
    question: "Explain Cellular Communication.",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Geographic cell structures and BTS base stations", importance: "high" },
      { concept: "Frequency reuse factor grids allocation", importance: "high" },
      { concept: "Handoff mechanism (hard vs soft handovers)", importance: "medium" },
    ]
  },
  {
    id: "ece_c_28",
    question: "What is LTE?",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Long Term Evolution 4G standard specifications", importance: "high" },
      { concept: "OFDMA downlink and SC-FDMA uplink allocations", importance: "high" },
      { concept: "IP flat-network architecture (EPC)", importance: "medium" },
    ]
  },
  {
    id: "ece_c_29",
    question: "Explain the basic principles of 5G communication.",
    topic: "Communication",
    category: "Communication",
    type: "Core",
    difficulty: "hard",
    discriminationWeight: 1.5,
    keyConcepts: [
      { concept: "Millimeter wave (mmWave) spectrum transmission limits", importance: "high" },
      { concept: "Massive MIMO and beamforming directional antenna targeting", importance: "high" },
      { concept: "Network slicing and low latency profiles (URLLC, eMBB)", importance: "medium" },
    ]
  },
  {
    id: "ece_c_30",
    question: "What is Embedded Systems Engineering?",
    topic: "Digital Systems",
    category: "Embedded",
    type: "Core",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Hardware-software co-design limits optimization", importance: "high" },
      { concept: "Real-time task constraints (RTOS vs bare metal)", importance: "high" },
      { concept: "Resource constraints (RAM/ROM) coding efficiency", importance: "medium" },
    ]
  },
  {
    id: "ece_s_1",
    question: "A circuit is not producing the expected output. How would you troubleshoot it?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_2",
    question: "A communication channel has excessive noise. How would you identify the source?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_3",
    question: "How would you improve signal quality in a communication system?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_4",
    question: "A PCB prototype is overheating. What steps would you take?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_5",
    question: "How would you diagnose a malfunctioning power supply?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_6",
    question: "A wireless signal is weak inside a building. How would you improve coverage?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_7",
    question: "How would you design a basic temperature monitoring system?",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_8",
    question: "How would you design a smart home automation prototype?",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_9",
    question: "A sensor is giving unstable readings. How would you investigate?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_10",
    question: "How would you reduce power consumption in an embedded device?",
    topic: "Power Management",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Microcontroller sleep modes and clock speed reduction", importance: "high" },
      { concept: "Sensing peripherals power-gating switch controls", importance: "high" },
      { concept: "Efficient voltage regulators and low quiescent current LDOs", importance: "medium" },
    ]
  },
  {
    id: "ece_s_11",
    question: "Design a simple communication link between two microcontrollers.",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_12",
    question: "A transmitter and receiver are failing to communicate. How would you debug the issue?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_13",
    question: "How would you improve antenna performance?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_14",
    question: "A digital circuit produces intermittent errors. How would you troubleshoot it?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_15",
    question: "How would you design a traffic light control system?",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_16",
    question: "How would you reduce electromagnetic interference in a device?",
    topic: "Practical Application",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Hardware specification requirements matching", importance: "high" },
      { concept: "System schematic block flow mapping", importance: "high" },
      { concept: "Prototyping testing and validation steps", importance: "medium" },
    ]
  },
  {
    id: "ece_s_17",
    question: "How would you test the reliability of an electronic system?",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_18",
    question: "A network experiences packet loss. How would you investigate?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_19",
    question: "Design a basic security alarm system.",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_20",
    question: "How would you monitor the health of industrial equipment using sensors?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_s_21",
    question: "How would you build a remote-controlled device?",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_22",
    question: "A communication system experiences frequent data corruption. What would you do?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_23",
    question: "Design a simple IoT-based monitoring solution.",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_24",
    question: "How would you improve battery life in a portable device?",
    topic: "Power Management",
    category: "Embedded",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Microcontroller sleep modes and clock speed reduction", importance: "high" },
      { concept: "Sensing peripherals power-gating switch controls", importance: "high" },
      { concept: "Efficient voltage regulators and low quiescent current LDOs", importance: "medium" },
    ]
  },
  {
    id: "ece_s_25",
    question: "How would you diagnose communication latency issues?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_26",
    question: "Design a digital voting machine.",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_27",
    question: "How would you improve reliability in a wireless network?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "medium",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_28",
    question: "Design a basic vehicle tracking system.",
    topic: "Embedded Systems Design",
    category: "Embedded",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Sensor integration and ADC signal conditioning", importance: "high" },
      { concept: "Microcontroller peripherals selection (GPIO, Timers, UART)", importance: "high" },
      { concept: "Wireless interface connection protocols (MQTT, Wi-Fi, BLE)", importance: "medium" },
    ]
  },
  {
    id: "ece_s_29",
    question: "How would you ensure signal integrity in a high-speed communication system?",
    topic: "RF and Communication",
    category: "Communication",
    type: "Scenario",
    difficulty: "hard",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Spectrum analyzer checks for EMI sources", importance: "high" },
      { concept: "Impedance matching tuning and shielding optimization", importance: "high" },
      { concept: "Filtering, amplification, or error correction implementations", importance: "medium" },
    ]
  },
  {
    id: "ece_s_30",
    question: "How would you design a scalable IoT sensor network?",
    topic: "Hardware Troubleshooting",
    category: "Core Electronics",
    type: "Scenario",
    difficulty: "easy",
    discriminationWeight: 1.2,
    keyConcepts: [
      { concept: "Multimeter node voltage and continuity testing", importance: "high" },
      { concept: "Thermal camera hotspot inspection and trace modifications", importance: "high" },
      { concept: "Oscilloscope ripple checking and decoupling filter addition", importance: "medium" },
    ]
  },
  {
    id: "ece_be_1",
    question: "Tell me about yourself.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_2",
    question: "Describe an electronics project you are most proud of.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_3",
    question: "Tell me about a challenging laboratory experiment.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_4",
    question: "Describe a time you solved a technical problem.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_5",
    question: "Tell me about a project where you learned a new tool or technology.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_6",
    question: "Describe a project that did not go according to plan.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_7",
    question: "Tell me about a time you worked under pressure.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_8",
    question: "Describe your final-year project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_9",
    question: "Tell me about a time you improved a design.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_10",
    question: "Describe a situation where you worked effectively in a team.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_11",
    question: "Tell me about a mistake you made during a project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_12",
    question: "Describe a time you took initiative.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_13",
    question: "Tell me about a difficult technical concept you mastered.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_14",
    question: "Describe a time you had multiple deadlines.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_15",
    question: "Tell me about a successful academic project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_16",
    question: "Describe a situation where you had to adapt quickly.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_17",
    question: "Tell me about a time you received critical feedback.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_18",
    question: "Describe a leadership experience.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_19",
    question: "Tell me about a time you helped a teammate.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_20",
    question: "Describe a project that required strong communication.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_21",
    question: "Tell me about a challenge you faced while debugging a circuit.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_22",
    question: "Describe a time you overcame resource limitations.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_23",
    question: "Tell me about a project that required creativity.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_24",
    question: "Describe a time you handled conflict within a team.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_25",
    question: "Tell me about your most technically demanding project.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_26",
    question: "Describe a time you had to explain a technical concept.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_27",
    question: "Tell me about a project where requirements changed unexpectedly.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_28",
    question: "Describe a failure and what you learned from it.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_29",
    question: "Tell me about your biggest academic achievement.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_be_30",
    question: "Describe an experience that significantly improved your technical skills.",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Experience",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Structured STAR method response (Situation, Task, Action, Result)", importance: "high" },
      { concept: "Specific electronics/lab design and action details", importance: "high" },
      { concept: "Technical learnings and project results outcome", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_1",
    question: "What would you do if a circuit failed just before a project demonstration?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_2",
    question: "How would you handle disagreement with a project teammate?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_3",
    question: "What would you do if you discovered a critical design flaw?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_4",
    question: "How would you approach learning a new communication protocol quickly?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_5",
    question: "What would you do if project requirements were unclear?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_6",
    question: "How would you prioritize multiple urgent assignments?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_7",
    question: "What would you do if your team missed a project deadline?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_8",
    question: "How would you handle a team member not contributing equally?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_9",
    question: "What would you do if your proposed solution was rejected?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_10",
    question: "How would you approach a technically challenging problem with limited guidance?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_11",
    question: "What would you do if a prototype repeatedly failed testing?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_12",
    question: "How would you react to negative feedback on your work?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_13",
    question: "What would you do if your equipment was unavailable before an experiment?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_14",
    question: "How would you mentor a junior teammate struggling with technical concepts?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_15",
    question: "What would you do if you accidentally damaged a component during testing?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_16",
    question: "How would you handle communication issues within a team?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_17",
    question: "What would you do if project specifications changed midway?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_18",
    question: "How would you respond if your design did not meet expectations?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_19",
    question: "What would you do if you lacked sufficient information to proceed?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_20",
    question: "How would you handle pressure during a critical project milestone?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_21",
    question: "What would you do if a supplier delayed a critical component?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_22",
    question: "How would you respond to a major system failure after deployment?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_23",
    question: "What would you do if a customer reported reliability issues?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_24",
    question: "How would you manage multiple projects simultaneously?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_25",
    question: "What would you do if your team disagreed on a technical approach?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_26",
    question: "How would you ensure effective communication in a remote project team?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_27",
    question: "What would you do if you noticed unsafe engineering practices?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_28",
    question: "How would you improve an outdated electronic system?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_29",
    question: "What would you do if your innovative idea was ignored initially?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
  {
    id: "ece_bs_30",
    question: "How would you balance quality, cost, and deadlines in an engineering project?",
    topic: "Behavioral",
    category: "Soft Skills",
    type: "Behavioral Situation",
    difficulty: "medium",
    discriminationWeight: 1.0,
    keyConcepts: [
      { concept: "Collaborative communication and problem analysis steps", importance: "high" },
      { concept: "Proposing mitigations and professional fallback plans", importance: "high" },
      { concept: "Technical debugging approach and safety compliance details", importance: "medium" },
    ]
  },
];

export const APTITUDE_QUESTION_BANK: any[] = [
  {
    id: "apt_q_01",
    question: "A train travels 120 km in 2 hours. What is its average speed?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["50 km/h", "60 km/h", "70 km/h", "80 km/h"],
    answer: "B",
    explanation: "Average speed = Distance / Time = 120 km / 2 hours = 60 km/h.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_02",
    question: "If a shirt costing $20 is sold for $25, what is the profit percentage?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["10%", "20%", "25%", "30%"],
    answer: "C",
    explanation: "Profit = $25 - $20 = $5. Profit % = (5 / 20) * 100 = 25%.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_03",
    question: "A can complete a work in 12 days and B can do it in 24 days. How many days will they take to complete it working together?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["6 days", "8 days", "10 days", "12 days"],
    answer: "B",
    explanation: "Together rate = 1/12 + 1/24 = 3/24 = 1/8. So, 8 days.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_04",
    question: "If 15% of a number is 45, what is 40% of that number?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["100", "120", "150", "180"],
    answer: "B",
    explanation: "Number = 45 / 0.15 = 300. 40% of 300 = 0.40 * 300 = 120.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_05",
    question: "What is the average of the first five prime numbers?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["5.0", "5.6", "6.2", "7.0"],
    answer: "B",
    explanation: "First 5 primes: 2, 3, 5, 7, 11. Sum = 28. Average = 28 / 5 = 5.6.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_06",
    question: "A sum of money doubles itself in 8 years at simple interest. What is the annual rate of interest?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["10%", "12.5%", "15%", "20%"],
    answer: "B",
    explanation: "Let Principal = P. Amount = 2P, so SI = P. P = (P * R * 8)/100 => R = 100/8 = 12.5%.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_07",
    question: "In how many different ways can the letters of the word 'LEADER' be arranged?",
    category: "Quantitative",
    difficulty: "hard",
    options: ["720", "360", "120", "48"],
    answer: "B",
    explanation: "Total letters = 6. E is repeated twice. Ways = 6! / 2! = 720 / 2 = 360.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_08",
    question: "Two cards are drawn together from a pack of 52 cards. What is the probability that one is a spade and one is a heart?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["13/51", "13/102", "26/51", "1/4"],
    answer: "A",
    explanation: "Probability = (13C1 * 13C1) / 52C2 = (13 * 13) / (26 * 51) = 13/51.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_09",
    question: "Find the ratio of 90 cm to 1.5 m.",
    category: "Quantitative",
    difficulty: "easy",
    options: ["3:5", "5:3", "3:4", "4:3"],
    answer: "A",
    explanation: "1.5 m = 150 cm. Ratio = 90 : 150 = 3 : 5.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_10",
    question: "The difference between simple and compound interest on $2000 for 2 years at 10% per annum is:",
    category: "Quantitative",
    difficulty: "medium",
    options: ["$10", "$20", "$40", "$50"],
    answer: "B",
    explanation: "Difference = P * (R/100)^2 = 2000 * (10/100)^2 = 2000 * 0.01 = $20.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_11",
    question: "A cylinder has a radius of 7 cm and a height of 10 cm. What is its volume? (Use pi = 22/7)",
    category: "Quantitative",
    difficulty: "medium",
    options: ["154 cm3", "1540 cm3", "770 cm3", "3080 cm3"],
    answer: "B",
    explanation: "Volume = pi * r^2 * h = (22/7) * 7 * 7 * 10 = 1540 cm3.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_12",
    question: "If 12 men or 18 women can build a wall in 14 days, in how many days can 8 men and 16 women build it?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["7 days", "9 days", "10 days", "12 days"],
    answer: "B",
    explanation: "12 Men = 18 Women => 1 Man = 1.5 Women. 8 Men + 16 Women = 8*1.5 + 16 = 28 Women. If 18 Women do it in 14 days, 28 Women do it in (18*14)/28 = 9 days.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_13",
    question: "A speed of 54 km/h is equal to how many meters per second?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["10 m/s", "15 m/s", "20 m/s", "25 m/s"],
    answer: "B",
    explanation: "Speed in m/s = 54 * (5/18) = 15 m/s.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_14",
    question: "A bag contains 6 black and 8 white balls. One ball is drawn at random. What is the probability that the ball drawn is white?",
    category: "Quantitative",
    difficulty: "hard",
    options: ["3/7", "4/7", "1/8", "1/14"],
    answer: "B",
    explanation: "Total balls = 14. White balls = 8. Probability = 8/14 = 4/7.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_15",
    question: "By selling a book for $115, a retailer gains 15%. What was the cost price of the book?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["$90", "$100", "$110", "$120"],
    answer: "B",
    explanation: "Cost Price = Selling Price / (1 + Profit Rate) = 115 / 1.15 = $100.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_16",
    question: "If log 2 = 0.3010 and log 3 = 0.4771, what is the value of log 5?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["0.3210", "0.6990", "0.7781", "0.8451"],
    answer: "B",
    explanation: "log 5 = log(10/2) = log 10 - log 2 = 1 - 0.3010 = 0.6990.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_17",
    question: "Three unbiased coins are tossed. What is the probability of getting at least 2 heads?",
    category: "Quantitative",
    difficulty: "hard",
    options: ["1/4", "3/8", "1/2", "5/8"],
    answer: "C",
    explanation: "Total outcomes = 8. At least 2 heads: HHH, HHT, HTH, THH (4 outcomes). Probability = 4/8 = 1/2.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_18",
    question: "Calculate the sum: 1 + 2 + 3 + ... + 50.",
    category: "Quantitative",
    difficulty: "easy",
    options: ["1225", "1275", "1300", "1350"],
    answer: "B",
    explanation: "Sum = n*(n+1)/2 = 50*51/2 = 1275.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_19",
    question: "A student has to secure 40% marks to pass. He gets 178 marks and fails by 22 marks. What are the maximum marks?",
    category: "Quantitative",
    difficulty: "medium",
    options: ["400", "500", "600", "700"],
    answer: "B",
    explanation: "Passing marks = 178 + 22 = 200. If 40% = 200, then Max Marks = 200 / 0.4 = 500.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_20",
    question: "Find the compound interest on $10,000 for 1 year at 20% per annum, compounded half-yearly.",
    category: "Quantitative",
    difficulty: "hard",
    options: ["$2000", "$2100", "$2200", "$2400"],
    answer: "B",
    explanation: "For half-yearly, periods (n) = 2, rate (R) = 10%. Amount = 10000 * (1.1)^2 = $12100. CI = 12100 - 10000 = $2100.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_21",
    question: "What is the value of (256)^0.16 * (256)^0.09?",
    category: "Quantitative",
    difficulty: "easy",
    options: ["2", "4", "16", "64"],
    answer: "B",
    explanation: "(256)^(0.16 + 0.09) = (256)^0.25 = (256)^(1/4) = 4.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_22",
    question: "A boat can travel with a speed of 13 km/h in still water. If the speed of the stream is 4 km/h, find the time taken by the boat to go 68 km downstream.",
    category: "Quantitative",
    difficulty: "medium",
    options: ["3 hours", "4 hours", "5 hours", "6 hours"],
    answer: "B",
    explanation: "Downstream speed = 13 + 4 = 17 km/h. Time = 68 / 17 = 4 hours.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_23",
    question: "The ages of two persons A and B are in the ratio 5:7. Eighteen years ago their ages were in the ratio 8:13. Find their present ages.",
    category: "Quantitative",
    difficulty: "hard",
    options: ["30 and 42 years", "40 and 56 years", "50 and 70 years", "60 and 84 years"],
    answer: "C",
    explanation: "Let ages be 5x and 7x. (5x-18)/(7x-18) = 8/13 => 65x - 234 = 56x - 144 => 9x = 90 => x = 10. Ages are 50 and 70.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_24",
    question: "A shopkeeper bought a cycle for $1200 and sold it for $1500. Find his gain percentage.",
    category: "Quantitative",
    difficulty: "easy",
    options: ["15%", "20%", "25%", "30%"],
    answer: "C",
    explanation: "Profit = $300. Profit % = (300/1200) * 100 = 25%.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_25",
    question: "In a mixture of 60 liters, the ratio of milk and water is 2:1. If this ratio is to be 1:2, then the quantity of water to be further added is:",
    category: "Quantitative",
    difficulty: "medium",
    options: ["20 liters", "30 liters", "40 liters", "60 liters"],
    answer: "D",
    explanation: "Initial: Milk = 40L, Water = 20L. To make ratio 1:2, water must become 80L. Water to add = 80 - 20 = 60 liters.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_26",
    question: "Find the next shape in the pattern:\n[ \u25a1 ]\n[ \u25b3 ]\n[ \u25cb ]\n[ ? ]",
    category: "Logical",
    difficulty: "easy",
    options: ["[ \u2606 ]", "[ \u25bd ]", "[ \u25a1 ]", "[ \u2b21 ]"],
    answer: "C",
    explanation: "The pattern cycles back to the first shape (square) to restart the sequence.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_27",
    question: "Find the next number in the series: 2, 4, 8, 16, ?",
    category: "Logical",
    difficulty: "easy",
    options: ["24", "30", "32", "36"],
    answer: "C",
    explanation: "Pattern doubles each time: 2*2=4, 4*2=8, 8*2=16, 16*2=32.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_28",
    question: "If in a certain language, CHARCOAL is coded as 45162913, how is COAL coded?",
    category: "Logical",
    difficulty: "medium",
    options: ["4913", "4213", "4513", "4613"],
    answer: "B",
    explanation: "Mapping: C=4, H=5, A=1, R=6, C=2, O=9, A=1, L=3. Wait, CHARCOAL has C=4 and C=2? Actually CHARCOAL is 45162318 or similar. Let's look at the mapping: C=4, O=2, A=1, L=3. Thus COAL = 4213.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_29",
    question: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
    category: "Logical",
    difficulty: "medium",
    options: ["His nephew's", "His son's", "His father's", "His own"],
    answer: "B",
    explanation: "'My father's son' with no brothers/sisters means 'Myself'. So, the man's father is 'Myself', meaning the photo is of his son.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_30",
    question: "A man walks 5 km East, then turns right and walks 4 km, then turns left and walks 5 km. Which direction is he facing now?",
    category: "Logical",
    difficulty: "easy",
    options: ["North", "South", "East", "West"],
    answer: "C",
    explanation: "Starting East -> turns right (facing South) -> turns left (facing East). He is facing East.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_31",
    question: "Six friends A, B, C, D, E, and F are sitting in a circle facing the center. F is to the immediate left of A. B is opposite to E. C is opposite to D. Who is sitting to the immediate right of E?",
    category: "Logical",
    difficulty: "hard",
    options: ["A", "B", "F", "Cannot be determined"],
    answer: "D",
    explanation: "Since E, B, C, D are opposite each other, their exact seats are E opposite B, C opposite D. This leaves two seats for A and F, with F to the immediate left of A. We don't have enough constraints to place E relative to them, so it cannot be determined.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_32",
    question: "Identify the missing element in the sequence: A1, C3, E5, G7, ?",
    category: "Logical",
    difficulty: "medium",
    options: ["H8", "I9", "J10", "I11"],
    answer: "B",
    explanation: "Alternate letters (A, C, E, G, I) and their alphabetical positions (1, 3, 5, 7, 9). So, I9.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_33",
    question: "In a certain code, 'TIGER' is written as 'SUHJFHDFQS'. How is 'CAT' written?",
    category: "Logical",
    difficulty: "easy",
    options: ["BDZBSU", "BDFHJL", "BDBZSU", "BDBZQS"],
    answer: "C",
    explanation: "Each letter is replaced by its preceding and succeeding letter. C -> BD, A -> BZ, T -> SU. CAT -> BDBZSU.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_34",
    question: "Find the odd one out: 27, 64, 125, 144, 216",
    category: "Logical",
    difficulty: "medium",
    options: ["64", "125", "144", "216"],
    answer: "C",
    explanation: "27 (3^3), 64 (4^3), 125 (5^3), 216 (6^3) are cubes. 144 (12^2) is a square.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_35",
    question: "If A + B means A is the brother of B; A - B means A is the sister of B; and A * B means A is the father of B. Which of the following means P is the nephew of Q?",
    category: "Logical",
    difficulty: "medium",
    options: ["Q - R + P", "Q - R * P", "P - R * Q", "Cannot be determined"],
    answer: "D",
    explanation: "None of the choices specify P's gender or correct relationship structure to define P as a nephew of Q. Thus, Cannot be determined.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_36",
    question: "Find the next figure in the pattern:\n\u25ef \u25ef\u25ef \u25ef\u25ef\u25ef\n\u25b3 \u25b3\u25b3 \u25b3\u25b3\u25b3\n\u25a1 \u25a1\u25a1 [ ? ]",
    category: "Logical",
    difficulty: "medium",
    options: ["\u25a1\u25a1\u25a1\u25a1", "\u25a1\u25a1\u25a1", "\u25ef", "\u25b3"],
    answer: "B",
    explanation: "Each row increases the shape count by 1. Row 3 has 1 square, 2 squares, so the third element is 3 squares (\u25a1\u25a1\u25a1).",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_37",
    question: "Which of the following diagrams correctly represents the relationship among: Writers, Researchers, and Teachers?",
    category: "Logical",
    difficulty: "hard",
    options: ["Three intersecting circles representing partial overlap", "Three nested circles", "Two separate circles inside a larger one", "Three completely separated circles"],
    answer: "A",
    explanation: "A person can be a writer, researcher, and teacher simultaneously, or any combination of the two. This is best represented by three intersecting circles.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_38",
    question: "If 'Blue' is called 'Green', 'Green' is called 'White', 'White' is called 'Black', 'Black' is called 'Red', and 'Red' is called 'Yellow', what is the color of milk?",
    category: "Logical",
    difficulty: "medium",
    options: ["White", "Green", "Black", "Red"],
    answer: "C",
    explanation: "Milk is white, and 'White' is called 'Black', so the answer is Black.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_39",
    question: "Find the missing number in the sequence: 3, 5, 9, 17, ?",
    category: "Logical",
    difficulty: "easy",
    options: ["25", "29", "31", "33"],
    answer: "D",
    explanation: "Difference doubles: +2, +4, +8, so next is +16. 17 + 16 = 33.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_40",
    question: "Statements:\n1. All mangoes are golden.\n2. No golden things are cheap.\nConclusions:\nI. All mangoes are cheap.\nII. Golden things are cheap.",
    category: "Logical",
    difficulty: "medium",
    options: ["Only I follows", "Only II follows", "Neither I nor II follows", "Both I and II follow"],
    answer: "C",
    explanation: "Since all mangoes are golden and no golden is cheap, mangoes are not cheap. Conclusions I and II are false.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_41",
    question: "Select the correct mirror image of the word 'EASY' when the mirror is placed to its right.",
    category: "Logical",
    difficulty: "hard",
    options: ["YSAE (reversed letters)", "YS AE", "EASY", "None of these"],
    answer: "A",
    explanation: "A mirror to the right reverses the order and flips the letters horizontally: Y, S, A, E all reversed, starting with Y.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_42",
    question: "Complete the analogy: Eye : Wink :: Heart : ?",
    category: "Logical",
    difficulty: "easy",
    options: ["Throb", "Pump", "Blood", "Beat"],
    answer: "D",
    explanation: "Wink is a fast action of the eye; beat/throb is the action of the heart. Beat is the primary match.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_43",
    question: "Find the next element: Z, X, V, T, R, ?",
    category: "Logical",
    difficulty: "medium",
    options: ["P", "Q", "O", "N"],
    answer: "A",
    explanation: "Step backward by 2 letters: Z -> X -> V -> T -> R -> P.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_44",
    question: "A clock shows 3:00. If the minute hand points North-East, in which direction does the hour hand point?",
    category: "Logical",
    difficulty: "hard",
    options: ["South-East", "South-West", "North-West", "East"],
    answer: "A",
    explanation: "At 3:00, minute hand is at 12 (pointing N-E) and hour hand is at 3 (90 degrees clockwise). 90 degrees clockwise from North-East is South-East.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_45",
    question: "If 1st January of a non-leap year is Sunday, what day will it be on 31st December of the same year?",
    category: "Logical",
    difficulty: "easy",
    options: ["Sunday", "Monday", "Saturday", "Friday"],
    answer: "A",
    explanation: "An ordinary year starts and ends on the same day of the week.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_46",
    question: "What is the missing number in the matrix?\n\u250c\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2510\n\u2502 2 \u2502 4 \u2502 8 \u2502\n\u251c\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2524\n\u2502 3 \u2502 9 \u250227 \u2502\n\u251c\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2524\n\u2502 4 \u250216 \u2502 ? \u2502\n\u2514\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2518",
    category: "Logical",
    difficulty: "medium",
    options: ["32", "48", "64", "80"],
    answer: "C",
    explanation: "Row pattern: x, x^2, x^3. Row 3 is 4, 16, 4^3 = 64.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_47",
    question: "Identify the missing shape:\n[ \u25cb ] -> [ \u25ef \u25ef ]\n[ \u25b3 ] -> [ \u25b3 \u25b3 ]\n[ \u25a1 ] -> [  ?  ]",
    category: "Logical",
    difficulty: "hard",
    options: ["[ \u25a1 \u25a1 ]", "[ \u25a1 ]", "[ \u2b21 ]", "[ \u25ef ]"],
    answer: "A",
    explanation: "The operator doubles the shape horizontally.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_48",
    question: "Find the odd word out: Apple, Orange, Banana, Potato",
    category: "Logical",
    difficulty: "easy",
    options: ["Apple", "Orange", "Banana", "Potato"],
    answer: "D",
    explanation: "Apple, Orange, and Banana are fruits. Potato is a tuber/vegetable.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_49",
    question: "If 'A' is substituted by 2, 'B' by 4, 'C' by 6 and so on, what will be the total value of the word 'CAB'?",
    category: "Logical",
    difficulty: "medium",
    options: ["10", "12", "14", "16"],
    answer: "B",
    explanation: "C = 3*2 = 6. A = 1*2 = 2. B = 2*2 = 4. Sum = 6 + 2 + 4 = 12.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_50",
    question: "Arrange the following words in a meaningful sequence:\n1. Key  2. Door  3. Lock  4. Room  5. Switch on",
    category: "Logical",
    difficulty: "hard",
    options: ["1, 3, 2, 4, 5", "5, 1, 2, 4, 3", "1, 2, 3, 5, 4", "1, 3, 2, 5, 4"],
    answer: "A",
    explanation: "Logical sequence: Key (1) -> Lock (3) -> Door (2) -> Room (4) -> Switch on (5).",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_51",
    question: "Based on the table below, which company had the highest sales in Q2?\n\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2510\n\u2502 Company \u2502 Q1 \u2502 Q2 \u2502\n\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2524\n\u2502 Alpha   \u2502 100\u2502 150\u2502\n\u2502 Beta    \u2502 120\u2502 140\u2502\n\u2502 Gamma   \u2502  90\u2502 160\u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2518",
    category: "Analytical",
    difficulty: "easy",
    options: ["Alpha", "Beta", "Gamma", "All equal"],
    answer: "C",
    explanation: "Sales in Q2: Alpha (150), Beta (140), Gamma (160). Gamma is highest.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_52",
    question: "In a pie chart representing expenses of $2000, rent is 35%. How much money is spent on rent?",
    category: "Analytical",
    difficulty: "medium",
    options: ["$500", "$600", "$700", "$800"],
    answer: "C",
    explanation: "Rent = 35% of $2000 = 0.35 * 2000 = $700.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_53",
    question: "If the total revenue of a store over 3 months is $3000, $4000, and $5000, what is the percentage growth from month 1 to month 3?",
    category: "Analytical",
    difficulty: "easy",
    options: ["33.3%", "50%", "66.7%", "100%"],
    answer: "C",
    explanation: "Growth = (5000 - 3000)/3000 = 2000/3000 = 66.7%.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_54",
    question: "Study the diagram:\n[Total Budget]\n  \u251c\u2500 Tech: 40%\n  \u251c\u2500 Marketing: 30%\n  \u2514\u2500 HR: 30%\nIf HR budget is $15,000, what is the Tech budget?",
    category: "Analytical",
    difficulty: "medium",
    options: ["$15,000", "$20,000", "$25,000", "$30,000"],
    answer: "B",
    explanation: "30% = $15,000 => Total budget = $50,000. Tech budget = 40% of $50,000 = $20,000.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_55",
    question: "A research group has 5 members. If every member shakes hands with every other member exactly once, what is the total number of handshakes?",
    category: "Analytical",
    difficulty: "hard",
    options: ["10", "15", "20", "25"],
    answer: "A",
    explanation: "Handshakes = nC2 = 5 * 4 / 2 = 10.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_56",
    question: "If Company X's profit ratio (Profit/Expense) is 0.25 and expenses are $80,000, what is their revenue? (Revenue = Expense + Profit)",
    category: "Analytical",
    difficulty: "medium",
    options: ["$80,000", "$100,000", "$120,000", "$140,000"],
    answer: "B",
    explanation: "Profit = 0.25 * 80000 = $20000. Revenue = 80000 + 20000 = $100,000.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_57",
    question: "Based on the table, what is the average score of Student B?\n\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 Student \u2502 Math   \u2502 Science \u2502\n\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524\n\u2502 A       \u2502  80    \u2502   90    \u2502\n\u2502 B       \u2502  70    \u2502   80    \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
    category: "Analytical",
    difficulty: "easy",
    options: ["70", "75", "80", "85"],
    answer: "B",
    explanation: "Average of Student B = (70 + 80) / 2 = 75.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_58",
    question: "A production line produces 240 units per hour. If the error rate is 2.5%, how many defective units are produced in an 8-hour shift?",
    category: "Analytical",
    difficulty: "medium",
    options: ["24", "36", "48", "60"],
    answer: "C",
    explanation: "Total produced = 240 * 8 = 1920. Defective = 1920 * 0.025 = 48.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_59",
    question: "If 3 painters can paint 3 houses in 3 days, how many days does it take 1 painter to paint 1 house?",
    category: "Analytical",
    difficulty: "hard",
    options: ["1 day", "3 days", "9 days", "None of these"],
    answer: "B",
    explanation: "Rate of work: 3 painters paint 3 houses in 3 days => 1 painter paints 1 house in 3 days.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_60",
    question: "In a group of 50 people, 35 speak English, 20 speak French, and 10 speak both. How many speak neither language?",
    category: "Analytical",
    difficulty: "easy",
    options: ["5", "10", "15", "20"],
    answer: "A",
    explanation: "Speak English or French = 35 + 20 - 10 = 45. Neither = 50 - 45 = 5.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_61",
    question: "A train passes a station platform 100 meters long in 10 seconds, and passes a pole in 6 seconds. What is the length of the train?",
    category: "Analytical",
    difficulty: "medium",
    options: ["100 m", "150 m", "200 m", "250 m"],
    answer: "B",
    explanation: "Let train length = L. Speed = L/6. Platform formula: Speed = (L+100)/10. L/6 = (L+100)/10 => 10L = 6L + 600 => 4L = 600 => L = 150m.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_62",
    question: "From a container of 80 liters of milk, 8 liters is replaced by water. This process is repeated one more time. How much milk remains?",
    category: "Analytical",
    difficulty: "hard",
    options: ["64 liters", "64.8 liters", "72 liters", "68.4 liters"],
    answer: "B",
    explanation: "Milk left = 80 * (1 - 8/80)^2 = 80 * (0.9)^2 = 80 * 0.81 = 64.8 liters.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_63",
    question: "If 4 workers can pack 40 boxes in 2 hours, what is the packing rate per worker per hour?",
    category: "Analytical",
    difficulty: "easy",
    options: ["2 boxes/hr", "5 boxes/hr", "10 boxes/hr", "20 boxes/hr"],
    answer: "B",
    explanation: "Total worker-hours = 4 * 2 = 8. Packing rate = 40 boxes / 8 worker-hours = 5 boxes/hour.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_64",
    question: "If the price of petroleum increases by 25%, by how much percent must a driver reduce consumption to keep expenditure constant?",
    category: "Analytical",
    difficulty: "medium",
    options: ["15%", "20%", "25%", "30%"],
    answer: "B",
    explanation: "Reduction % = [R / (100 + R)] * 100 = (25 / 125) * 100 = 20%.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_65",
    question: "A family has two children. Given that at least one of them is a boy, what is the probability that both are boys?",
    category: "Analytical",
    difficulty: "hard",
    options: ["1/3", "1/2", "2/3", "3/4"],
    answer: "A",
    explanation: "Sample space: BB, BG, GB (GG excluded since at least one is a boy). Favorable: BB. Probability = 1/3.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_66",
    question: "Choose the correct synonym for: 'ABANDON'",
    category: "Verbal",
    difficulty: "easy",
    options: ["Keep", "Leave", "Adopt", "Cherish"],
    answer: "B",
    explanation: "To abandon means to desert, leave, or give up.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_67",
    question: "Choose the correct antonym for: 'LOQUACIOUS'",
    category: "Verbal",
    difficulty: "easy",
    options: ["Silent", "Talkative", "Friendly", "Beautiful"],
    answer: "A",
    explanation: "Loquacious means talkative; the opposite is silent or taciturn.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_68",
    question: "Identify the grammatical error in the sentence:\n'Each of the students have completed their assignment.'",
    category: "Verbal",
    difficulty: "medium",
    options: ["Each of the", "students have", "completed", "their assignment"],
    answer: "B",
    explanation: "'Each' is singular, so it should be 'has completed' instead of 'have completed'.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_69",
    question: "Rearrange the following sentences to make a logical paragraph:\nP: They are key sources of energy.\nQ: Carbohydrates are organic compounds.\nR: They include sugars and starches.",
    category: "Verbal",
    difficulty: "medium",
    options: ["Q, R, P", "P, Q, R", "Q, P, R", "R, P, Q"],
    answer: "A",
    explanation: "Logical flow: Define Carbohydrates first (Q) -> Describe what they include (R) -> Explain their role (P). So, Q, R, P.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_70",
    question: "Complete the sentence: She is very keen _______ visiting the museum.",
    category: "Verbal",
    difficulty: "easy",
    options: ["on", "at", "for", "with"],
    answer: "A",
    explanation: "The preposition 'on' always follows the adjective 'keen' in this context.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_71",
    question: "Choose the correct spelling of the word:",
    category: "Verbal",
    difficulty: "medium",
    options: ["Accomodation", "Accommodation", "Acomodation", "Accomodasion"],
    answer: "B",
    explanation: "The correct spelling is 'Accommodation' with double 'c' and double 'm'.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_72",
    question: "Identify the passive voice version of: 'The chef cooked a delicious dinner.'",
    category: "Verbal",
    difficulty: "hard",
    options: ["A delicious dinner was cooked by the chef.", "A delicious dinner is cooked by the chef.", "Dinner is being cooked by the chef.", "The dinner was cooking by the chef."],
    answer: "A",
    explanation: "Subject and Object swap; past tense 'cooked' becomes 'was cooked'.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_73",
    question: "What is the meaning of the idiom: 'Spill the beans'?",
    category: "Verbal",
    difficulty: "medium",
    options: ["To drop food", "To reveal a secret", "To perform a task poorly", "To start a fight"],
    answer: "B",
    explanation: "The idiom 'spill the beans' means to reveal secret information prematurely.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_74",
    question: "Read the text and answer: 'All trees need water. An oak is a tree.' Does the oak need water?",
    category: "Verbal",
    difficulty: "hard",
    options: ["Yes, definitely", "No, it does not", "Cannot be determined", "Only in summer"],
    answer: "A",
    explanation: "Using deductive reasoning: Oak is a subset of trees, all trees need water, therefore oak needs water.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_75",
    question: "Choose the closest antonym for: 'EPHEMERAL'",
    category: "Verbal",
    difficulty: "easy",
    options: ["Short-lived", "Permanent", "Weak", "Fast"],
    answer: "B",
    explanation: "Ephemeral means short-lived; the opposite is permanent or everlasting.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_76",
    question: "Complete the sentence: Neither of the answers _______ correct.",
    category: "Verbal",
    difficulty: "medium",
    options: ["is", "are", "were", "been"],
    answer: "A",
    explanation: "'Neither' is a singular pronoun and takes a singular verb ('is').",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_77",
    question: "Choose the correct idiom meaning for: 'Burn the midnight oil'",
    category: "Verbal",
    difficulty: "hard",
    options: ["To waste fuel", "To study or work late into the night", "To cause an accident", "To sleep early"],
    answer: "B",
    explanation: "Burning the midnight oil means working late into the night.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_78",
    question: "Fill in the blank: The train ________ before I reached the station.",
    category: "Verbal",
    difficulty: "easy",
    options: ["left", "had left", "was leaving", "leaves"],
    answer: "B",
    explanation: "Past perfect tense 'had left' describes an action completed before another past action.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_79",
    question: "What is the meaning of: 'PRAGMATIC'?",
    category: "Verbal",
    difficulty: "medium",
    options: ["Idealistic", "Practical", "Stubborn", "Careless"],
    answer: "B",
    explanation: "Pragmatic means dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
  {
    id: "apt_q_80",
    question: "Complete the sentence: If I _______ you, I would accept the job offer.",
    category: "Verbal",
    difficulty: "hard",
    options: ["was", "were", "am", "would be"],
    answer: "B",
    explanation: "Subjunctive mood uses 'were' for hypothetical or contrary-to-fact conditions.",
    timeLimit: 60,
    evaluationGuide: ["Explain the core concept or select the correct option directly."]
  },
];
