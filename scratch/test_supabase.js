
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

    // 1. Try to fetch from 'interviews'
    const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching interviews:', error);
    } else {
        console.log('Successfully fetched interviews:', data);
    }

    // 2. Try to insert a test record
    const testId = `test_${Date.now()}`;
    console.log('Attempting to insert test record:', testId);
    
    const { error: insertError } = await supabase
        .from('interviews')
        .insert([{
            id: testId,
            candidate_name: 'Test Candidate',
            candidate_email: 'test@example.com',
            position: 'Tester',
            status: 'IN_PROGRESS',
            date: new Date().toLocaleDateString()
        }]);

    if (insertError) {
        console.error('Error inserting test record:', insertError);
    } else {
        console.log('Successfully inserted test record');
        
        // 3. Simulate saveResponse: Fetch then Update
        console.log('Simulating saveResponse for:', testId);
        const { data: currentData, error: fetchError } = await supabase
            .from('interviews')
            .select('results, questions_attempted, questions_skipped')
            .eq('id', testId)
            .single();
            
        if (fetchError) {
            console.error('Error fetching record for update:', fetchError);
        } else {
            console.log('Current record state:', currentData);
            
            const updatedResults = [...(currentData.results || []), { question: 'Test?', answer: 'Yes', ideal_answer: 'Yes' }];
            const { error: updateError } = await supabase
                .from('interviews')
                .update({ 
                    results: updatedResults,
                    questions_attempted: (currentData.questions_attempted || 0) + 1
                })
                .eq('id', testId);
                
            if (updateError) {
                console.error('Error updating record:', updateError);
            } else {
                console.log('Successfully updated record (simulated saveResponse)');
            }
        }

        // Cleanup
        const { error: deleteError } = await supabase
            .from('interviews')
            .delete()
            .eq('id', testId);
            
        if (deleteError) {
            console.error('Error deleting test record:', deleteError);
        } else {
            console.log('Successfully cleaned up test record');
        }
    }
}

testSupabase();
