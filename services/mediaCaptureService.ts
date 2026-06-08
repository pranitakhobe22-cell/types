export class MediaCaptureService {
    
    /**
     * Captures a single frame from a video element as a JPEG Blob.
     */
    static async captureSnapshot(videoEl: HTMLVideoElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth || 640;
                canvas.height = videoEl.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error("Could not get 2d context for snapshot");
                }
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                }, 'image/jpeg', 0.8);
            } catch (err) {
                reject(err);
            }
        });
    }
}

/**
 * Maintains a rolling buffer of the last N seconds of video.
 * Useful for capturing the moments leading up to and immediately after a violation.
 */
export class RollingRecorder {
    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private maxChunks: number;
    private intervalMs: number;

    /**
     * @param stream The media stream to record
     * @param bufferSeconds How many seconds of history to keep (e.g. 10)
     * @param intervalSeconds How often to emit a chunk (e.g. 5)
     */
    constructor(stream: MediaStream, bufferSeconds: number = 10, intervalSeconds: number = 5) {
        this.intervalMs = intervalSeconds * 1000;
        this.maxChunks = Math.ceil(bufferSeconds / intervalSeconds) + 1;

        try {
            // Prefer vp9 for better compression, fallback to whatever is supported
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
                ? 'video/webm;codecs=vp9' 
                : 'video/webm';

            this.recorder = new MediaRecorder(stream, { mimeType });
            
            this.recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    this.chunks.push(e.data);
                    // Keep only the most recent chunks
                    if (this.chunks.length > this.maxChunks) {
                        this.chunks.shift();
                    }
                }
            };
            
            this.recorder.start(this.intervalMs);
        } catch (err) {
            console.error("Failed to initialize RollingRecorder:", err);
        }
    }

    /**
     * Stops the recorder and returns the accumulated buffer as a single Blob.
     * Call this when a violation completes to get the clip.
     */
    captureClip(): Blob | null {
        if (!this.chunks || this.chunks.length === 0) return null;
        return new Blob(this.chunks, { type: 'video/webm' });
    }

    stop() {
        if (this.recorder && this.recorder.state !== 'inactive') {
            this.recorder.stop();
        }
        this.chunks = [];
    }
}
