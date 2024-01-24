const crypto = require('crypto');

class Signer {
  constructor(secretkey) {
    this._secret = secretkey;
  }

  sign(path, params = '', method = 'GET') {
    const hmac = crypto.createHmac('sha256', this._secret);
    const ts = new Date().toISOString();
    return [
      ts,
      hmac.update(`${ts}${method}${path}${params && JSON.stringify(params)}`).digest('base64')
    ];
  }
}

module.exports = Signer;