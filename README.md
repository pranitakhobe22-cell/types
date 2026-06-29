<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Reicrew AI — Smart Interview & Proctoring Platform

Reicrew AI is a state-of-the-art, AI-driven candidate evaluation and interview platform designed to automate and streamline the recruitment pipeline. Combining conversational artificial intelligence with real-time video proctoring, aptitude testing, and detailed evaluation metrics, Reicrew AI provides a comprehensive assessment of candidate capabilities and reliability.

## 🚀 Key Features

*   **Dynamic AI-Guided Interviews**: Conducting live verbal assessments where candidate responses are transcribed in real-time, followed by dynamically generated, adaptive follow-up questions targeting the candidate's specific claims to verify depth and detect bluffing.
*   **Aptitude Testing Screen**: Time-tracked multiple-choice assessments across key areas (Quantitative, Logical, Analytical, Verbal reasoning) with automated scoring and difficulty weighting.
*   **Real-Time Proctoring & Trust Score**: Integrated video proctoring utilizing MediaPipe Tasks Vision (Face Landmarker) to track gaze away events, detect multiple faces, tab switching, and compute an overall integrity/trust score.
*   **Comprehensive Evaluation Reports**: Detailed session feedback evaluating knowledge, reasoning, communication, topic coverage, answer stability (score standard deviation), and technical contradictions across questions.
*   **Admin Dashboard**: A secure administrative console allowing recruiters to view candidate session recordings, view detailed transcripts, inspect individual question evaluations, view proctoring heatmaps/logs, and seed/configure default job posts.

---

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons.
*   **Authentication**: Clerk Authentication.
*   **Backend & Storage**: Supabase Database and Storage for tracking sessions, candidates, question banks, and proctoring telemetry logs.
*   **AI Engine**: OpenRouter API integration using the DeepSeek Chat model by default for both live conversational interaction (follow-up question generation) and robust candidate evaluation/reporting.
*   **ML & Vision**: MediaPipe Tasks Vision for real-time gaze and face tracking.

---

## ⚙️ Environment Configuration

To run the application locally, you must configure the environment variables. Create a `.env.local` file in the root directory and add the following keys:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Orchestration Configuration
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# Admin Dashboard Access
VITE_ADMIN_PASSWORD=your_admin_dashboard_password
```

---

## 💻 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) installed.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/pranitakhobe22-cell/types.git
    cd types
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create `.env.local` as detailed in the [Environment Configuration](#-environment-configuration) section above.

4.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

5.  **Build for Production**:
    ```bash
    npm run build
    ```
