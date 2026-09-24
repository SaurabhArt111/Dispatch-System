const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function pairingCode() {
  return nanoid();
}

function rollId(dcNumber, sequence) {
  const clean = String(dcNumber).replace(/[^A-Za-z0-9]/g, '');
  const seq = String(sequence).padStart(2, '0');
  return `ROLL-${clean}-${seq}`;
}

module.exports = { pairingCode, rollId };
