目前能绕过cloudflare的只有：
1） zenrow， 专业爬虫工具， 不知道怎么做自动化测试
2） puppeteer-real-browser
    需要修改package.json  "type": "module"


调试方法：

1.在node代码端
 node --inspect-brk legion.js

2. 打开chrome（edge）浏览器
 chrome://inspect

3. 设置超时时间， 让错误尽快报出来，而不是等待30秒。
page.setDefaultTimeout(200);

5. 原因分析

const vm = require('vm')
const assert = require('assert')
const readline = require('readline')

async function debug (context) {
  context = context || {}
  assert.strictEqual(Object.prototype.toString.call(context), '[object Object]')

  context.console = console // for debug
  vm.createContext(context)
}

这里新建了vm-context， 这样才能在新建的VM-Context里继续调试。
 
====================================================================
简单的方法：

1） 启动legion.js (--auto-open-devtools-for-tabs 自动打开devTools)
node --inspect legion.js

2) 点击 Console左边的绿色图标 Open Dedicated DevTools for Nodejs.
新打开DevTools的Console里可以用browser、page

3) Console里输入如下命令，设置超时时间为0.2秒
page.setDefaultTimeout(200);



# unlock

const passwordInput = await page.$('input.okui-input-input[type="password"]');
await passwordInput.type('Hn75@sui1314');

const [unlockBtn] = await page.$x('//button/span[text()="Unlock"]');
await unlockBtn.click();

# change Network


const [networkBtn] = await page.$x('//div[contains(@class, "_wallet-icon_1x7se_1")]/picture');
await networkBtn.click();


await page.goto('https://bitcoinfaucet.uo1.net/');

let btcInput = await page.$('#validationTooltipAddress')
await btcInput.type('')

btc testnet


Omnisat 项目

1） 领取btc测试币 

https://bitcoinfaucet.uo1.net/
https://beyondfaucet.com/btc-testnet

https://bitcoinfaucet.uo1.net/


2） 交互Omnisat




"chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#connect/af8be23a-44f6-4dbc-85e1-2683394b8a2f"


