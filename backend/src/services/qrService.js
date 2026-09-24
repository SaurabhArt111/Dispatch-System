const QRCodeLib = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('../models/QRCode');

// Generates a signed-looking opaque code + PNG data URL for a roll.
async function generateForRoll(roll, userId) {
  const code = `QR-${roll.rollId}-${uuidv4().slice(0, 8).toUpperCase()}`;
  const payload = {
    rollId: roll.rollId,
    code
  };
  const dataUrl = await QRCodeLib.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320
  });

  const qr = await QRCode.create({
    roll: roll._id,
    code,
    dataUrl,
    generatedBy: userId
  });

  return qr;
}

module.exports = { generateForRoll };
