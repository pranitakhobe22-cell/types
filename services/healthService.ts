import { supabase } from './supabaseClient';

export interface SystemHealth {
    database: boolean;
    storage: boolean;
    auth: boolean;
    lastChecked: number;
    errors: string[];
}

export class HealthService {
    static async checkSystemHealth(): Promise<SystemHealth> {
        const health: SystemHealth = {
            database: false,
            storage: false,
            auth: !!supabase, // Basic check
            lastChecked: Date.now(),
            errors: []
        };

        if (!supabase) {
            health.errors.push("Supabase client not initialized (missing env vars).");
            return health;
        }

        // Run all checks in parallel to minimize startup latency
        const [dbCheck, storageCheck, authCheck] = await Promise.all([
            // 1. Check Database
            (async () => {
                try {
                    const { error } = await supabase.from('job_posts').select('id').limit(1);
                    if (error) return { ok: false, error: `Database error: ${error.message}` };
                    return { ok: true };
                } catch (e: any) {
                    return { ok: false, error: `Database reachability failed: ${e.message}` };
                }
            })(),
            
            // 2. Check Storage
            (async () => {
                try {
                    const { error } = await supabase.storage.listBuckets();
                    if (error && error.message.includes("FetchError")) {
                        return { ok: false, error: `Storage reachability failed: ${error.message}` };
                    }
                    return { ok: true };
                } catch (e: any) {
                    return { ok: false, error: `Storage reachability failed: ${e.message}` };
                }
            })(),

            // 3. Check Auth
            (async () => {
                try {
                    const { error } = await supabase.auth.getSession();
                    if (error) return { ok: false, error: `Auth error: ${error.message}` };
                    return { ok: true };
                } catch (e: any) {
                    return { ok: false, error: `Auth reachability failed: ${e.message}` };
                }
            })()
        ]);

        if (dbCheck.ok) health.database = true;
        else health.errors.push(dbCheck.error!);

        if (storageCheck.ok) health.storage = true;
        else health.errors.push(storageCheck.error!);

        if (authCheck.ok) health.auth = true;
        else health.errors.push(authCheck.error!);

        return health;
    }
}
