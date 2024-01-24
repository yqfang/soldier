const qs = require('querystring');
const axios = require('axios');
const Signer = require('../signer');

class OKApi {
  constructor(apiKey, apiSecret, passphrase, opt = {}) {
    if (arguments.length === 1) opt = apiKey;
    opt.baseURL = opt.baseURL || 'https://www.okx.com';

    this.apiKey = apiKey;
    this.passphrase = passphrase;
    this._signer = new Signer(apiSecret);
    this._http = axios.create(opt);
  }

  getSignedHeader(method, path, params) {
    const sign = this._signer.sign(path, params, method);
    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-TIMESTAMP': sign[0],
      'OK-ACCESS-SIGN': sign[1],
      'OK-ACCESS-PASSPHRASE': this.passphrase
    };
  }

  async get(path, params) {
    if (params) {
      for (const key of Object.keys(params || {})) {
        if (params[key] === null || params[key] === undefined) delete params[key];
      }

      path += '?' + qs.encode(params);
    }

    const { data: { data } } = await this._http.get(path, { headers: this.getSignedHeader('GET', path) });
    return data;
  }

  async post(path, body) {
    const headers = {
      ...this.getSignedHeader('POST', path, body),
      'Content-Type': 'application/json'
    };

    const { data: { data } } = await this._http.post(path, body, { headers });
    return data;
  }

  async get1(path, params) {
    const [ret] = await this.get(path, params);
    return ret;
  }


  async post1(path, body) {
    const [ret] = await this.post(path, body);
    return ret;
  }

  

}

module.exports = HttpApi;