/**
 * Thin adapter around the real System 1 API.
 * Swap USE_MOCK_SYSTEM1=false and fill SYSTEM1_API_URL / SYSTEM1_API_KEY in .env
 * to point this at production. The rest of the app never talks to System 1 directly,
 * only through ingestDC(), so switching source is a one-file change.
 */
const mockSystem1 = require('./mockSystem1');

async function pollForNewDCs() {
  const useMock = process.env.USE_MOCK_SYSTEM1 !== 'false';
  if (useMock) {
    return mockSystem1.fetchRecentDCs(1 + Math.floor(Math.random() * 2));
  }

  if (!process.env.SYSTEM1_API_URL) {
    throw new Error('SYSTEM1_API_URL is not configured');
  }

  const res = await fetch(`${process.env.SYSTEM1_API_URL}/dc/recent`, {
    headers: { Authorization: `Bearer ${process.env.SYSTEM1_API_KEY}` }
  });
  if (!res.ok) throw new Error(`System 1 API error: ${res.status}`);
  return res.json();
}

module.exports = { pollForNewDCs };
