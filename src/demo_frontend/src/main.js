// import App from './App';
// import './index.scss';
import './styles/demostyles.css';

import { demo_backend } from '../../declarations/demo_backend';
import ProtonWebSDK from '@proton/web-sdk';
import { AuthClient } from '@dfinity/auth-client';
import { JsonRpc, Api } from 'eosjs';

let signedIn = false;
let client;
let principal = '';
let proton_account = '';
let chain = 'dfinity';
let btc_price = 0;
let link, session;

// Constants
const appIdentifier = 'freeosclaim';

// Testnet
// let endpoints = ['https://protontest.greymass.com'];
// let chainId =
//   '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd';

// mainnet
let endpoints = ['https://proton.greymass.com'];
let chainId =
  '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById('protonSignInBtn')
    .addEventListener('click', async () => {
      // Create link
      // await login({ restoreSession: false });
      await login(false);

      if (session) {
        // console.log('User authorization:', session.auth); // { actor: 'fred', permission: 'active }
        proton_account = session.auth.actor;
        document.getElementById('proton_account').innerText =
          session.auth.actor;
      } else {
        console.log('No Proton session established');
      }

      showFunctionTable();
    });

  document
    .getElementById('dfinitySignInBtn')
    .addEventListener('click', async () => {
      client = await AuthClient.create();
      const isAuthenticated = await client.isAuthenticated();

      if (isAuthenticated) {
        const identity = client.getIdentity();
        principal = identity.getPrincipal().toString();
        console.log('Auth. already authenticated. principal = ' + principal);
        signedIn = true;
      }

      const result = await new Promise((resolve, reject) => {
        client.login({
          identityProvider: 'https://identity.ic0.app',
          onSuccess: () => {
            const identity = client.getIdentity();
            const principal = identity.getPrincipal().toString();
            resolve({ identity, principal });
          },
          onError: reject,
        });
      });
      principal = result.principal;
      console.log('Auth. signed in. principal = ' + principal);
      signedIn = true;

      document.getElementById('principal_id').innerText = principal;
      showFunctionTable();
    });
});

const login = async (restoreSession) => {
  try {
    console.log(
      `Beginning login with endpoints = ${endpoints}, chainId = ${chainId}, appIdentifier = ${appIdentifier}`
    );
    const { link: localLink, session: localSession } = await ProtonWebSDK({
      linkOptions: {
        endpoints,
        chainId,
        restoreSession,
      },
      transportOptions: {
        requestAccount: appIdentifier,
      },
      selectorOptions: {
        appName: 'freeosclaim',
        appLogo: 'https://freeos.io/assets/logo/logo.svg',
        customStyleOptions: {
          modalBackgroundColor: '#F4F7FA',
          logoBackgroundColor: 'white',
          isLogoRound: true,
          optionBackgroundColor: 'white',
          optionFontColor: 'black',
          primaryFontColor: 'black',
          secondaryFontColor: '#6B727F',
          linkColor: '#752EEB',
        },
      },
    });

    link = localLink;
    session = localSession;
    console.log(`Ending login with link = ${link} and session = ${session}`);
  } catch (error) {
    console.error('Login error:', error);
  }
};

const logout = async () => {
  if (link && session) {
    await link.removeSession(appIdentifier, session.auth, chainId);
  }
  session = undefined;
  link = undefined;
};

const rpc = new JsonRpc('https://protontestnet.greymass.com', { fetch });

async function getBTCPrice() {
  var request = new XMLHttpRequest();

  // Open a new connection, using the GET request on the URL endpoint
  request.open(
    'GET',
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin',
    true
  );

  request.onload = function () {
    // Begin accessing JSON data here
    var newdata = JSON.parse(this.response);

    newdata.forEach((object) => {
      console.log('object name: ' + object.name);
      console.log('object current_price: ' + object.current_price);
      console.log('object symbol: ' + object.symbol);
      if (object.symbol == 'btc') {
        console.log(
          'btc symbol found: setting btc_price to ' + object.current_price
        );
        btc_price = object.current_price;
      }
    });
  }; // end of request.onload

  // Send request
  request.send();
}

// update balances
async function updateBalances() {
  console.log('Proton account = >' + proton_account + '<');
  let proton_balance_str = '0';
  let ic_balance_str = '0';

  // proton balance
  if (proton_account != '') {
    // get balance
    let user_params = {
      json: true,
      code: 'dfinityclaim', // account containing smart contract
      scope: 'dfinityclaim', // the subset of the table to query
      table: 'users', // the name of the table
      lower_bound: proton_account,
      upper_bound: proton_account,
      limit: 1, // limit on number of rows returned
    };

    let result = await rpc.get_table_rows(user_params);
    let proton_balance = result.rows[0].balance;
    proton_balance_str = proton_balance.toString();
    console.log(proton_balance_str);
  }

  // IC balance
  ic_balance_str = await demo_backend.get_balance(proton_account);

  // update display
  document.getElementById('proton_balance').innerText = proton_balance_str;
  document.getElementById('ic_balance').innerText = ic_balance_str;
}

document.getElementById('convertBtn').addEventListener('click', async () => {
  // format the quantity
  let freeos_quantity =
    document.getElementById('amountFreeos').value + '.0000 FREEOS';

  // perform the FREEOS transfer
  const result = await session.transact({
    transaction: {
      actions: [
        {
          // FREEOS smart contract
          account: 'freeostokens',
          // Action names
          name: 'transfer',
          // Action parameters
          data: {
            from: session.auth.actor,
            to: 'freeosgov',
            quantity: freeos_quantity,
            memo: 'IC SWAP ' + principal,
          },
          authorization: [session.auth],
        },
      ],
    },
    broadcast: true,
  });
});

function showFunctionTable() {
  if (principal !== '' && proton_account !== '') {
    console.log('Making functionTable visible');
    document.getElementById('functionTable').style.display = 'block';
  } else {
    console.log('Making functionTable hidden');
    document.getElementById('functionTable').style.display = 'none';
  }
}

async function createLink({ restoreSession }) {
  const result = await ConnectWallet({
    linkOptions: {
      endpoints: ['https://proton.greymass.com'],
      restoreSession,
    },
    transportOptions: {
      requestAccount: 'tommccann4', // Your proton account
      requestStatus: true,
    },
    selectorOptions: {
      appName: 'dfinity',
      appLogo: 'https://freeos.io/freeos-appLogo.svg?v=3',
      customStyleOptions: {
        modalBackgroundColor: '#F4F7FA',
        logoBackgroundColor: 'white',
        isLogoRound: true,
        optionBackgroundColor: 'white',
        optionFontColor: 'black',
        primaryFontColor: 'black',
        secondaryFontColor: '#6B727F',
        linkColor: '#752EEB',
      },
    },
  });
  link = result.link;
  session = result.session;
  proton_account = session.auth.actor;
}

document
  .getElementById('showVariablesBtn')
  .addEventListener('click', showVariables);

function showVariables() {
  console.log(
    'showVariables - principal = [' +
      principal +
      '] proton_account = [' +
      proton_account +
      ']'
  );
}
