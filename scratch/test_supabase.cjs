const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log("Testing Candidate Upsert...");
        const { data: cand, error: candErr } = await supabase
            .from('candidates')
            .upsert({ email: 'test@example.com', name: 'Test', role: 'Tester' }, { onConflict: 'email' })
            .select()
            .single();

        if (candErr) {
            console.error("Candidate error:", candErr);
            return;
        }
        console.log("Candidate ID:", cand.id);

        console.log("Testing Create Session...");
        const { data: session, error: sessErr } = await supabase
            .from('interview_sessions')
            .insert({
                candidate_id: cand.id,
                status: 'CREATED',
                device_type: 'Desktop',
                os_name: 'Windows',
                browser_name: 'Chrome',
                ip_hash: '123',
                network_type: '4g',
                interview_metadata: {}
            })
            .select('*')
            .single();

        if (sessErr) {
            console.error("Session error:", sessErr);
        } else {
            console.log("Session ID:", session.id);
        }
    } catch (e) {
        console.error("Crash:", e);
    }
}

run();
