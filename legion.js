const puppeteer = require('puppeteer-extra');
const debug = require('puppeteer-debug');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

const appConfig = {
  walletExtension: '/Users/harry/Documents/Legion/browsers/extension/okx/2.75.4_0',
  walletExtensionId: 'mcohilncbfahbmgdjkbpemcciiolgcge',
  walletPassword: 'Hn75@sui1314',
  apBaseUrl: 'http://localhost:50325',
};

async function main() {
  const profileId = 'jda6lv6';
  axios.defaults.baseURL = appConfig.apBaseUrl;

  const checkRes = await axios.get(`/api/v1/browser/active?user_id=${profileId}`);
  if (checkRes.data.code != 0) {
    throw new Error('检查浏览器状态失败');
  }

  let endpoint = '';
  // &launch_args=["--auto-open-devtools-for-tabs"]  自动打开DevTools
  if (checkRes.data.data.status == 'Inactive') {
    const startRes = await axios.get(
      `/api/v1/browser/start?user_id=${profileId}&open_tabs=1`
    );
    if (startRes.data.code === 0 && startRes.data.data.ws) {
      endpoint = startRes.data.data.ws.puppeteer;
    }
  } else {
    endpoint = checkRes.data.data.ws.puppeteer;
  }

  puppeteer.use(stealthPlugin());

  const browser = await puppeteer.connect({
    browserWSEndpoint: endpoint,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
  });

  const defaultContext = browser.defaultBrowserContext();

  defaultContext.on('targetcreated', async target => {
    let page = await target.page();
    if(page && page.url().includes(appConfig.walletExtensionId)) {
      await selectorAction(page, 'button[type=button]', 'Confirm', async (item) => {
        await item.click();
      });
    }
  })

  const page = await defaultContext.newPage();
  await page.bringToFront();
  await page.goto(`chrome-extension://${appConfig.walletExtensionId}/home.html`);

  await unlockWallet(page, '', 'P@ssw0rd');
  
  await changeNetwork(page, 'btc testnet');

  await page.goto('https://bitcoinfaucet.uo1.net/');

  let btcAddress = await page.evaluate(async () => {
    let okxwallet = window.okxwallet;
    let { address: btcAddress } = await okxwallet.bitcoinTestnet.connect();
    return btcAddress;
  });

  await selectorAction(page, '#validationTooltipAddress', '', async (item, index) => {
    await item.type(btcAddress);
  });

  await selectorAction(page, 'button[type="submit"]', 'Send testnet bitcoins', async (item, index) => {
    await item.click();
  })

  await debug({ browser, page });
}

async function selectorAction(page, selector, text, callback) {
  await page.waitForSelector(selector);
  const elements = await page.$$(selector);
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (text) {
      let textHandle = await element.getProperty('textContent');
      let textString = await textHandle.jsonValue();
      if (textString.toLowerCase().indexOf(text.toLowerCase()) > -1) {
        if (callback) {
          await callback(element);
        }
      }
    } else {
      await callback(element, i);
    }
  }
}

async function xPathAction(page, path, text, callback) {
  await page.waitForXPath(path);
  const elements = await page.$x(path);
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (text) {
      let textHandle = await element.getProperty('textContent');
      let textString = await textHandle.jsonValue();
      if (textString.toLowerCase().indexOf(text.toLowerCase()) > -1) {
        if (callback) {
          await callback(element);
        }
      }
    } else {
      await callback(element, i);
    }
  }
}

async function unlockWallet(page, mnemonic, walletPwd) {
  try {
    // 初始化、解锁钱包
    console.log('Try to unlock wallet');
    await page.waitForNavigation();
    let hash = await page.evaluate(() => location.hash);
    console.log('hash: ' + hash);
    if (hash.includes('#initialize')) {
      await initialize(page, mnemonic, walletPwd);
    } else if (hash.includes('#unlock')) {
      await unlock(page, walletPwd);
    }
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function unlock(page, password) {
  let passwordSelector = 'input.okui-input-input[type="password"]';
  await selectorAction(page, passwordSelector, '', async (item, index) => {
    await item.type(password);
  });

  let unlockPath = '//button';
  await xPathAction(page, unlockPath, 'Unlock', async (item, index) => {
    await item.click();
  });
}

async function initialize(page, mnemonic, password) {
  console.log('Initialize OKX wallet');

  await page.$$('div');

  await selectorAction(page, 'button.okui-btn', 'Import wallet', async (item) => {
    await item.click();
  });

  await selectorAction(page, 'div.okui-popup', 'Seed phrase', async (item) => {
    await item.click();
  });

  let words = mnemonic.split(' ');

  await selectorAction(page, '.mnemonic-words-inputs__container__input', '', async (item, index) => {
    await item.type(words[index]);
  });

  await page.waitForTimeout(500);
  await selectorAction(page, 'button[type=submit]', 'Confirm', async (item) => {
    await item.click();
  });

  await selectorAction(page, 'input[type="password"]', '', async (item, index) => {
    await item.type(password);
  });

  await selectorAction(page, 'button[type=submit]', 'Confirm', async (item) => {
    await item.click();
  });

  await page.waitForSelector('.custom-anim-pop-in-stay-align');
  await selectorAction(page, 'button', 'Maybe later', async (item) => {
    await item.click();
  });

  await page.waitForTimeout(500);
  await selectorAction(page, 'button', 'Start your Web3 journey', async (item) => {
    await item.click();
  });
}

async function changeNetwork(page, networkName) {
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.location.hash = '#network-management';
  });

  let searchNetwork = 'input[placeholder="Search network name"]';
  await selectorAction(page, searchNetwork, '', async (item, index) => {
    await item.type(networkName);
  });

  await page.waitForTimeout(500);

  let walletItem = '._wallet-spin_1px67_19 ._wallet-list__item_pel99_1._wallet-list__cell_pel99_16';
  await selectorAction(page, walletItem, networkName, async (item, index) => {
    await item.click();
  });
}

main();
