/* Minimal structured console logger */
const level = (msg, lvl) => `[${new Date().toISOString()}] [${lvl}] ${msg}`;

module.exports = {
  info: (msg) => console.log(level(msg, 'INFO')),
  warn: (msg) => console.warn(level(msg, 'WARN')),
  error: (msg) => console.error(level(msg, 'ERROR'))
};
