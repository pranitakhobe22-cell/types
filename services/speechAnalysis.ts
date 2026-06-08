export class SpeechAnalyzer {
    private startTime: number = 0;
    private endTime: number = 0;
    private pauseCount: number = 0;
    private totalPauseDuration: number = 0;
    private lastSpeechTime: number = 0;
    private isSpeaking: boolean = false;
    private transcript: string = '';

    private fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];

    start() {
        this.startTime = Date.now();
        this.lastSpeechTime = this.startTime;
        this.pauseCount = 0;
        this.totalPauseDuration = 0;
        this.isSpeaking = false;
        this.transcript = '';
    }

    onSpeechStart() {
        const now = Date.now();
        if (!this.isSpeaking && this.lastSpeechTime > 0) {
            const pauseDuration = now - this.lastSpeechTime;
            if (pauseDuration > 1000) { // 1 second threshold for a pause
                this.pauseCount++;
                this.totalPauseDuration += pauseDuration;
            }
        }
        this.isSpeaking = true;
    }

    onSpeechResult(interimTranscript: string, finalTranscript: string) {
        if (finalTranscript) {
            this.transcript += ' ' + finalTranscript;
        }
        this.isSpeaking = true;
        this.lastSpeechTime = Date.now();
    }

    onSpeechEnd() {
        this.isSpeaking = false;
        this.lastSpeechTime = Date.now();
    }

    stop() {
        this.endTime = Date.now();
        this.isSpeaking = false;
    }

    getMetrics() {
        const totalDurationSec = (this.endTime - this.startTime) / 1000;
        const words = this.transcript.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        
        // WPM calculation
        const wpm = totalDurationSec > 0 ? Math.round((wordCount / totalDurationSec) * 60) : 0;

        // Filler words calculation
        let fillerCount = 0;
        const lowerTranscript = this.transcript.toLowerCase();
        for (const filler of this.fillerWords) {
            // Count occurrences using regex
            const regex = new RegExp(`\\b${filler}\\b`, 'g');
            const matches = lowerTranscript.match(regex);
            if (matches) {
                fillerCount += matches.length;
            }
        }

        const avgPauseDuration = this.pauseCount > 0 ? Math.round(this.totalPauseDuration / this.pauseCount) : 0;
        const totalSpeechDurationMs = this.endTime - this.startTime - this.totalPauseDuration;
        const silencePercentage = totalDurationSec > 0 ? (this.totalPauseDuration / (totalDurationSec * 1000)) * 100 : 0;

        return {
            wpm,
            fillers: fillerCount,
            pauses: this.pauseCount,
            avgPauseDurationMs: avgPauseDuration,
            totalSpeechDurationMs: totalSpeechDurationMs > 0 ? totalSpeechDurationMs : 0,
            silencePercentage: Math.min(100, Math.max(0, silencePercentage))
        };
    }
}
