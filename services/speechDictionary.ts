export const speechDictionary: Record<string, string> = {
  // Common homophones and STT errors
  "necklace": "linked list",
  "neckless": "linked list",
  "linkedlist": "linked list",
  "gate": "git",
  "gated": "git",
  "sequel": "SQL",
  "sequal": "SQL",
  "oops": "OOP",
  "cplusplus": "C++",
  "csharp": "C#",
  
  // Standard abbreviations and correct casings
  "ml": "ML",
  "ai": "AI",
  "api": "API",
  "ui": "UI",
  "ux": "UX",
  "sql": "SQL",
  "nosql": "NoSQL",
  "mysql": "MySQL",
  "mongodb": "MongoDB",
  "redis": "Redis",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "aws": "AWS",
  "gcp": "GCP",
  "html": "HTML",
  "css": "CSS",
  "dom": "DOM",
  "json": "JSON",
  "http": "HTTP",
  "https": "HTTPS",
  "url": "URL",
  "rest": "REST",
  "jwt": "JWT",
  "dry": "DRY",
  "solid": "SOLID",
  "mvc": "MVC",
  "spa": "SPA",
  "seo": "SEO",
  "sdk": "SDK",
  "dns": "DNS",
  "ip": "IP",
  "vpc": "VPC",
  "ssl": "SSL",
  "tls": "TLS",
  "cli": "CLI",
  "cicd": "CI/CD",
  "git": "git",
  "github": "GitHub",
  "gitlab": "GitLab",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "K8s",
  "npm": "npm",
  "npx": "npx",
  "yarn": "Yarn",
  "pnpm": "pnpm",
  "react": "React",
  "redux": "Redux",
  "angular": "Angular",
  "vue": "Vue",
  "svelte": "Svelte",
  "nextjs": "Next.js",
  "nuxtjs": "Nuxt.js",
  "nodejs": "Node.js",
  "expressjs": "Express",
  "typescript": "TypeScript",
  "javascript": "JavaScript",
  "python": "Python",
  "java": "Java",
  "golang": "Go",
  "rust": "Rust",
  "ruby": "Ruby",
  "php": "PHP",
  "graphql": "GraphQL",
  "saas": "SaaS",
  "paas": "PaaS",
  "iaas": "IaaS",
  "ram": "RAM",
  "cpu": "CPU",
  "gpu": "GPU",
  "tpu": "TPU",
  "llm": "LLM",
  "gpt": "GPT",
  "rag": "RAG",
  "cnn": "CNN",
  "rnn": "RNN",
  "lstm": "LSTM",
  "svm": "SVM",
  "knn": "KNN",
  "pca": "PCA",
  "lan": "LAN",
  "wan": "WAN",
  "crud": "CRUD",
  "oauth": "OAuth",
  "saml": "SAML",
  "csrf": "CSRF",
  "cors": "CORS"
};

const phraseReplacements: [RegExp, string][] = [
  [/\bc plus plus\b/gi, "C++"],
  [/\bc plus\b/gi, "C++"],
  [/\bc sharp\b/gi, "C#"],
  [/\bgit hub\b/gi, "GitHub"],
  [/\bgit lab\b/gi, "GitLab"],
  [/\breact js\b/gi, "React"],
  [/\bnode js\b/gi, "Node.js"],
  [/\bnext js\b/gi, "Next.js"],
  [/\bnuxt js\b/gi, "Nuxt.js"],
  [/\bexpress js\b/gi, "Express"],
  [/\bweb pack\b/gi, "Webpack"],
  [/\bno sql\b/gi, "NoSQL"],
  [/\bmy sql\b/gi, "MySQL"],
  [/\bpost gres\b/gi, "PostgreSQL"],
  [/\bmongo db\b/gi, "MongoDB"],
  [/\bci cd\b/gi, "CI/CD"],
  [/\blinked list\b/gi, "linked list"],
  [/\bnecklace\b/gi, "linked list"]
];

export const normalizeSpeechText = (text: string): string => {
  if (!text) return "";
  
  // 1. Normalize multiple spaces
  let normalized = text.replace(/\s+/g, " ").trim();
  
  // 2. Normalize acronyms with dots (e.g. S.Q.L. -> SQL)
  normalized = normalized.replace(/\b([a-zA-Z])\.([a-zA-Z])\.(?:\.?)\b/g, "$1$2");
  normalized = normalized.replace(/\b([a-zA-Z])\.([a-zA-Z])\.([a-zA-Z])(?:\.?)\b/g, "$1$2$3");
  normalized = normalized.replace(/\b([a-zA-Z])\.([a-zA-Z])\.([a-zA-Z])\.([a-zA-Z])(?:\.?)\b/g, "$1$2$3$4");
  
  // 3. Apply phrase-level replacements
  for (const [regex, replacement] of phraseReplacements) {
    normalized = normalized.replace(regex, replacement);
  }
  
  // 4. Split into words and check the single-word dictionary
  return normalized
    .split(/\s+/)
    .map(word => {
      const punctuationMatch = word.match(/^([^\w]*)(.*?)([^\w]*)$/);
      if (!punctuationMatch) return word;
      const leading = punctuationMatch[1];
      const core = punctuationMatch[2];
      const trailing = punctuationMatch[3];
      
      const cleanCore = core.replace(/\./g, "").toLowerCase();
      if (speechDictionary[cleanCore]) {
        return leading + speechDictionary[cleanCore] + trailing;
      }
      return word;
    })
    .join(" ");
};

export const logLowConfidenceSTT = (
  original: string,
  corrected: string,
  confidence: number,
  questionId?: string | number
): void => {
  try {
    const key = 'reicrew_stt_low_confidence_logs_v1';
    const logsStr = localStorage.getItem(key);
    const logs = logsStr ? JSON.parse(logsStr) : [];
    
    const newLog = {
      id: `stt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      original,
      corrected,
      confidence,
      questionId
    };
    
    logs.unshift(newLog);
    if (logs.length > 200) {
      logs.pop();
    }
    localStorage.setItem(key, JSON.stringify(logs));
    console.log(`[STT-LOG] Low confidence STT logged: "${original}" -> "${corrected}" (conf: ${confidence})`);
  } catch (e) {
    console.error("Failed to log low confidence STT:", e);
  }
};
