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

        // 1. Check Database (Try to read companies table limit 1)
        try {
            const { error } = await supabase.from('companies').select('id').limit(1);
            if (error) {
                health.errors.push(`Database error: ${error.message}`);
            } else {
                health.database = true;
            }
        } catch (e: any) {
            health.errors.push(`Database reachability failed: ${e.message}`);
        }

        // 2. Check Storage (Try to list buckets or get one)
        try {
            // listBuckets often returns [] for anonymous users depending on RLS.
            // As long as it doesn't throw a network error, storage is reachable.
            const { error } = await supabase.storage.listBuckets();
            if (error && error.message.includes("FetchError")) {
                health.errors.push(`Storage reachability failed: ${error.message}`);
            } else {
                health.storage = true;
            }
        } catch (e: any) {
            health.errors.push(`Storage reachability failed: ${e.message}`);
        }

        // 3. Check Auth session ability (Just getting session is enough to test reachability)
        try {
            const { error } = await supabase.auth.getSession();
            if (error) {
                health.errors.push(`Auth error: ${error.message}`);
            } else {
                health.auth = true;
            }
        } catch (e: any) {
            health.errors.push(`Auth reachability failed: ${e.message}`);
        }

        return health;
    }
}
