// Emails a student's GEARS project zip to the coach.
// The recipient comes only from the COACH_EMAIL environment variable,
// never from the browser, so the form cannot be used to email anyone else.
//
// Required environment variables (set in Netlify under Environment variables):
//   RESEND_API_KEY  - API key from the email provider
//   COACH_EMAIL     - where submissions are sent
//   FROM_EMAIL      - a sender address verified with the email provider

const MAX_BASE64_CHARS = Math.floor(2.7 * 1024 * 1024);
const JSON_HEADERS = {'Content-Type': 'application/json'};

function reply(statusCode, body) {
  return {statusCode: statusCode, headers: JSON_HEADERS, body: JSON.stringify(body)};
}

// Keep header-like text on one line and within a length limit.
function clean(text, maxLength) {
  return String(text || '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return reply(405, {error: 'POST only'});
  }

  if (!process.env.RESEND_API_KEY || !process.env.COACH_EMAIL || !process.env.FROM_EMAIL) {
    return reply(500, {error: 'Submit is not configured'});
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
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
        'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: [process.env.COACH_EMAIL],
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
};
