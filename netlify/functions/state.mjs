// Saves and restores one student's GEARS progress (blocks, robot, world).
// Each request must carry a token: "<studentId>.<HMAC-SHA256 of studentId>",
// signed with STATE_SECRET. The student ID comes from the token, so a
// student can only read or write their own save.
//
// Required environment variable (set in Netlify): STATE_SECRET

import crypto from 'node:crypto';
import {getStore} from '@netlify/blobs';

const MAX_BODY_CHARS = 1024 * 1024;

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {'Content-Type': 'application/json'}
  });
}

function studentFromAuth(authHeader) {
  const token = String(authHeader || '').replace(/^Bearer\s+/i, '');
  const dot = token.lastIndexOf('.');
  if (dot < 1) {
    return null;
  }
  const studentId = token.slice(0, dot);
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(studentId)) {
    return null;
  }
  const expected = crypto.createHmac('sha256', process.env.STATE_SECRET)
    .update(studentId).digest('hex');
  const given = token.slice(dot + 1);
  if (given.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return null;
  }
  return studentId;
}

export default async function(req) {
  if (!process.env.STATE_SECRET) {
    return reply(500, {error: 'Saving is not configured'});
  }

  const studentId = studentFromAuth(req.headers.get('authorization'));
  if (!studentId) {
    return reply(401, {error: 'Invalid or missing token'});
  }

  const store = getStore('gears-state');

  if (req.method === 'GET') {
    const state = await store.get(studentId, {type: 'json'});
    if (state === null) {
      return reply(404, {error: 'No saved state yet'});
    }
    return reply(200, state);
  }

  if (req.method === 'PUT') {
    const body = await req.text();
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
    await store.setJSON(studentId, state);
    return reply(200, {ok: true});
  }

  return reply(405, {error: 'GET or PUT only'});
}
