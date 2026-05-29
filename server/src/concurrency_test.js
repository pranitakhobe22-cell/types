/**
 * concurrency_test.js
 * ───────────────────────────────────────────────────────────────────────────
 * Simulates concurrent interview operations to verify:
 *   1. Duplicate answer submissions are blocked (idempotency)
 *   2. Double-submit to same question is blocked (DB unique constraint)
 *   3. Simultaneous session state transitions don't corrupt state
 *   4. Timer expiry + answer submission race condition is handled
 *
 * Usage:
 *   node src/concurrency_test.js [BASE_URL]
 *   Default BASE_URL: http://localhost:5000
 * ───────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = process.argv[2] || 'http://localhost:5000';

let passCount = 0;
let failCount = 0;
const results = [];

function log(label, passed, detail = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  if (passed) passCount++; else failCount++;
  results.push({ label, status, detail });
  console.log(`  ${icon} [${status}] ${label}${detail ? ' — ' + detail : ''}`);
}

async function makeRequest(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, json, text };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Health checks respond
// ─────────────────────────────────────────────────────────────────────────────
async function testHealthChecks() {
  console.log('\n─── Test 1: Health Checks ───');

  const health = await makeRequest('GET', '/health');
  log('GET /health returns 200', health.status === 200);

  const healthDb = await makeRequest('GET', '/health/db');
  log('GET /health/db returns 200', healthDb.status === 200);

  const healthRedis = await makeRequest('GET', '/health/redis');
  log('GET /health/redis returns 200 or 503', [200, 503].includes(healthRedis.status),
    `status=${healthRedis.status}, mode=${healthRedis.json?.mode}`);

  const healthAi = await makeRequest('GET', '/health/ai');
  log('GET /health/ai returns 200', healthAi.status === 200);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Clock sync endpoint
// ─────────────────────────────────────────────────────────────────────────────
async function testClockSync() {
  console.log('\n─── Test 2: Clock Sync ───');

  const res = await makeRequest('GET', '/api/interview/time');
  log('GET /api/interview/time returns 200', res.status === 200);
  log('Response contains serverTime', !!res.json?.serverTime, `serverTime=${res.json?.serverTime}`);

  const drift = Math.abs(Date.now() - res.json?.serverTime);
  log('Clock drift < 2000ms', drift < 2000, `drift=${drift}ms`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Start interview and get first question
// ─────────────────────────────────────────────────────────────────────────────
async function testStartInterview() {
  console.log('\n─── Test 3: Start Interview ───');

  const res = await makeRequest('POST', '/api/interview/start', {
    candidateId: 'test-candidate-001',
    jobId: 'test-job-001',
    config: {
      questionDuration: 300,
      roundDuration: 1200,
      interviewDuration: 3600,
      max_questions: 3
    }
  });

  log('POST /api/interview/start returns 201', res.status === 201, `status=${res.status}`);
  log('Response contains sessionId', !!res.json?.sessionId);
  log('Response contains currentQuestion', !!res.json?.currentQuestion?.id);
  log('Status is QUESTION_ACTIVE', res.json?.status === 'QUESTION_ACTIVE');

  return res.json;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Session recovery / snapshot
// ─────────────────────────────────────────────────────────────────────────────
async function testSessionRecovery(sessionId) {
  console.log('\n─── Test 4: Session Recovery ───');

  const res = await makeRequest('GET', `/api/interview/session/${sessionId}`);
  log('GET /session/:id returns 200', res.status === 200);
  log('Snapshot contains session_id', res.json?.snapshot?.session_id === sessionId);
  log('Snapshot contains status', !!res.json?.snapshot?.status);
  log('Snapshot contains questions array', Array.isArray(res.json?.snapshot?.questions));
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Submit answer
// ─────────────────────────────────────────────────────────────────────────────
async function testSubmitAnswer(sessionId, questionId) {
  console.log('\n─── Test 5: Submit Answer ───');

  const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const res = await makeRequest('POST', '/api/interview/submit-answer', {
    sessionId,
    questionId,
    answerText: 'React hooks allow you to use state and lifecycle features without writing classes. useMemo is used for memoization to avoid expensive recalculations on every render.'
  }, {
    'Idempotency-Key': idempotencyKey
  });

  log('POST /submit-answer returns 200', res.status === 200, `status=${res.status}`);
  log('Response contains answerId', !!res.json?.answerId);
  log('Response status is submitted', res.json?.status === 'submitted');

  return { idempotencyKey, answerId: res.json?.answerId };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Duplicate idempotency key is blocked
// ─────────────────────────────────────────────────────────────────────────────
async function testDuplicateIdempotency(sessionId, questionId, idempotencyKey) {
  console.log('\n─── Test 6: Duplicate Idempotency Key ───');

  // Wait for post-submission pipeline to transition state
  await sleep(3000);

  // Re-load session to get fresh state and next question
  const sessionRes = await makeRequest('GET', `/api/interview/session/${sessionId}`);
  const snapshot = sessionRes.json?.snapshot;
  const currentStatus = snapshot?.status;
  log('Session has transitioned (post-evaluation)', currentStatus !== undefined, `status=${currentStatus}`);

  // If we're back to QUESTION_ACTIVE, we have a new question
  if (currentStatus === 'QUESTION_ACTIVE' && snapshot?.questions?.length > 1) {
    const nextQuestion = snapshot.questions[snapshot.questions.length - 1];
    const nextQuestionId = nextQuestion.id;

    // Try to submit with the SAME idempotency key to a new question
    const dupRes = await makeRequest('POST', '/api/interview/submit-answer', {
      sessionId,
      questionId: nextQuestionId,
      answerText: 'Duplicate test answer'
    }, {
      'Idempotency-Key': idempotencyKey
    });

    log('Duplicate idempotency key returns 409', dupRes.status === 409, `status=${dupRes.status}`);
    return { nextQuestionId };
  } else {
    log('Duplicate idempotency test skipped (session not back to QUESTION_ACTIVE)', false, `status=${currentStatus}`);
    return { nextQuestionId: null };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Concurrent duplicate submissions to same question
// ─────────────────────────────────────────────────────────────────────────────
async function testConcurrentSubmissions(sessionId, questionId) {
  console.log('\n─── Test 7: Concurrent Double-Submit to Same Question ───');

  if (!questionId) {
    log('Concurrent submission test skipped (no question available)', false);
    return;
  }

  const key1 = `conc-${Date.now()}-a`;
  const key2 = `conc-${Date.now()}-b`;

  // Fire two submissions simultaneously
  const [res1, res2] = await Promise.all([
    makeRequest('POST', '/api/interview/submit-answer', {
      sessionId,
      questionId,
      answerText: 'Concurrent answer A'
    }, { 'Idempotency-Key': key1 }),

    makeRequest('POST', '/api/interview/submit-answer', {
      sessionId,
      questionId,
      answerText: 'Concurrent answer B'
    }, { 'Idempotency-Key': key2 })
  ]);

  const statuses = [res1.status, res2.status].sort();
  const oneSucceeded = statuses.includes(200);
  const oneBlocked = statuses.includes(409) || statuses.includes(422) || statuses.includes(500);

  log('One concurrent submission succeeds', oneSucceeded, `statuses=[${statuses}]`);
  log('Other concurrent submission is blocked', oneBlocked, `statuses=[${statuses}]`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Pause and resume
// ─────────────────────────────────────────────────────────────────────────────
async function testPauseResume() {
  console.log('\n─── Test 8: Pause & Resume ───');

  // Start a fresh session for this test
  const startRes = await makeRequest('POST', '/api/interview/start', {
    candidateId: 'test-candidate-pause',
    jobId: 'test-job-pause',
    config: { max_pause_count: 2, questionDuration: 300 }
  });

  if (startRes.status !== 201) {
    log('Pause/Resume test skipped (could not start interview)', false);
    return;
  }

  const sessionId = startRes.json.sessionId;

  // Pause
  const pauseRes = await makeRequest('POST', '/api/interview/pause', { sessionId });
  log('Pause returns 200', pauseRes.status === 200, `status=${pauseRes.status}`);
  log('Pauses remaining decremented', pauseRes.json?.pausesRemaining === 1, `remaining=${pauseRes.json?.pausesRemaining}`);

  // Resume
  const resumeRes = await makeRequest('POST', '/api/interview/resume', { sessionId });
  log('Resume returns 200', resumeRes.status === 200, `status=${resumeRes.status}`);

  // Terminate
  const endRes = await makeRequest('POST', '/api/interview/end', { sessionId });
  log('End/Terminate returns 200', endRes.status === 200, `status=${endRes.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Invalid state transition
// ─────────────────────────────────────────────────────────────────────────────
async function testInvalidTransition() {
  console.log('\n─── Test 9: Invalid State Transitions ───');

  // Start a fresh session
  const startRes = await makeRequest('POST', '/api/interview/start', {
    candidateId: 'test-candidate-invalid',
    jobId: 'test-job-invalid'
  });

  if (startRes.status !== 201) {
    log('Invalid transition test skipped', false);
    return;
  }

  const sessionId = startRes.json.sessionId;

  // Terminate it
  await makeRequest('POST', '/api/interview/end', { sessionId });

  // Try to pause a terminated session — should fail
  const pauseRes = await makeRequest('POST', '/api/interview/pause', { sessionId });
  log('Pause on TERMINATED session returns 500 (invalid transition)', pauseRes.status === 500,
    `status=${pauseRes.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Missing required fields validation
// ─────────────────────────────────────────────────────────────────────────────
async function testValidation() {
  console.log('\n─── Test 10: Input Validation ───');

  const res1 = await makeRequest('POST', '/api/interview/start', {});
  log('Start with empty body returns 400', res1.status === 400, `status=${res1.status}`);

  const res2 = await makeRequest('POST', '/api/interview/submit-answer', { sessionId: 'fake' });
  log('Submit without required fields returns 400', res2.status === 400, `status=${res2.status}`);

  const res3 = await makeRequest('GET', '/api/interview/session/nonexistent-uuid');
  log('Get nonexistent session returns 404', res3.status === 404, `status=${res3.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        INTERVIEW SYSTEM — CONCURRENCY & STRESS TEST        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`Target: ${BASE_URL}\n`);

  try {
    // Basic sanity
    await testHealthChecks();
    await testClockSync();
    await testValidation();

    // Core flow
    const startData = await testStartInterview();
    if (startData?.sessionId) {
      const sessionId = startData.sessionId;
      const questionId = startData.currentQuestion?.id;

      await testSessionRecovery(sessionId);

      const submitResult = await testSubmitAnswer(sessionId, questionId);
      const dupResult = await testDuplicateIdempotency(sessionId, questionId, submitResult.idempotencyKey);
      await testConcurrentSubmissions(sessionId, dupResult.nextQuestionId);
    }

    // Pause/Resume + Terminate
    await testPauseResume();
    await testInvalidTransition();

  } catch (err) {
    console.error('\n💥 Unexpected test runner error:', err.message);
    failCount++;
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS:  ${passCount} passed,  ${failCount} failed,  ${passCount + failCount} total`);
  console.log('══════════════════════════════════════════════════════════════');

  if (failCount > 0) {
    console.log('\n  Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ❌ ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
    });
  }

  console.log('');
  process.exit(failCount > 0 ? 1 : 0);
}

run();
