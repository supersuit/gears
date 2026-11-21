// Cloudflare Worker for GEARS. Serves the static site from public/ and handles
// the two server routes. The paths match the old Netlify ones, so the browser
// code does not need to change.
//
//   /.netlify/functions/submit  emails a student's project zip to the coach
//   /.netlify/functions/state   saves and restores one student's progress
//
// Secrets (set with `wrangler secret put`): RESEND_API_KEY, STATE_SECRET
// Variables (set in wrangler.jsonc or the dashboard): COACH_EMAIL, FROM_EMAIL
// Storage: a KV namespace bound as GEARS_STATE

const MAX_BASE64_CHARS = Math.floor(2.7 * 1024 * 1024);
const MAX_BODY_CHARS = 1024 * 1024;
const JSON_HEADERS = {'Content-Type': 'application/json'};

function reply(status, body) {
  return new Response(JSON.stringify(body), {status: status, headers: JSON_HEADERS});
}

// Keep header-like text on one line and within a length limit.
function clean(text, maxLength) {
  return String(text || '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(function(b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

// Compare two strings without stopping at the first mismatch.
function sameText(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function studentFromAuth(authHeader, secret) {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '');
  const dot = token.lastIndexOf('.');
  if (dot < 1) {
    return null;
  }
  const studentId = token.slice(0, dot);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(studentId)) {
    return null;
  }
  // Short signature (8 hex chars) so links stay easy to share.
  const expected = (await hmacHex(secret, studentId)).slice(0, 8);
  return sameText(token.slice(dot + 1), expected) ? studentId : null;
}

async function handleSubmit(request, env) {
  if (request.method !== 'POST') {
    return reply(405, {error: 'POST only'});
  }
  if (!env.RESEND_API_KEY || !env.COACH_EMAIL || !env.FROM_EMAIL) {
    return reply(500, {error: 'Submit is not configured'});
  }

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return reply(400, {error: 'Invalid JSON'});
  }

  const zipBase64 = typeof data.zipBase64 === 'string' ? data.zipBase64 : '';
  if (!zipBase64) {
    return reply(400, {error: 'Missing project file'});
  }
  if (zipBase64.length > MAX_BASE64_CHARS) {
    return reply(413, {error: 'Project is too large to send'});
  }

  const studentName = clean(data.studentName, 60) || 'Anonymous';
  const projectName = clean(data.projectName, 60) || 'gearsBot';
  const fileName = (projectName.replace(/[^A-Za-z0-9_-]+/g, '_') || 'gearsBot') + '.zip';

  const subject = 'GEARS submission: ' + studentName + ' - ' + projectName;
  const text = studentName + ' sent the project "' + projectName + '" from the GEARS simulator. ' +
    'The attached zip has the blocks, robot config, world settings and any Python code.';

  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.COACH_EMAIL],
        subject: subject,
        text: text,
        attachments: [{filename: fileName, content: zipBase64}]
      })
    });
  } catch (err) {
    return reply(502, {error: 'Email provider unreachable'});
  }

  if (!res.ok) {
    return reply(502, {error: 'Email provider rejected the message', status: res.status});
  }
  return reply(200, {ok: true});
}

async function handleState(request, env) {
  if (!env.STATE_SECRET) {
    return reply(500, {error: 'Saving is not configured'});
  }
  const studentId = await studentFromAuth(request.headers.get('authorization'), env.STATE_SECRET);
  if (!studentId) {
    return reply(401, {error: 'Invalid or missing token'});
  }

  if (request.method === 'GET') {
    const state = await env.GEARS_STATE.get(studentId, 'json');
    if (state === null) {
      return reply(404, {error: 'No saved state yet'});
    }
    return reply(200, state);
  }

  if (request.method === 'PUT') {
    const body = await request.text();
    if (body.length > MAX_BODY_CHARS) {
      return reply(413, {error: 'Save is too large'});
    }
    let state;
    try {
      state = JSON.parse(body);
    } catch (err) {
      return reply(400, {error: 'Invalid JSON'});
    }
    if (state.version !== 1 || typeof state.blocks !== 'string') {
      return reply(400, {error: 'Unexpected save format'});
    }
    await env.GEARS_STATE.put(studentId, JSON.stringify(state));
    return reply(200, {ok: true});
  }

  return reply(405, {error: 'GET or PUT only'});
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/.netlify/functions/submit') {
      return handleSubmit(request, env);
    }
    if (path === '/.netlify/functions/state') {
      return handleState(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
