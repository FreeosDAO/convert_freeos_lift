// import App from './App';
// import './index.scss';
import './styles/demostyles.css';

import { demo_backend } from "../../declarations/demo_backend";
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
let endpoints = ['https://testnet.protonchain.com'];
let chainId =
  '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd';

// mainnet
// let endpoints = ['https://proton.greymass.com'];
// let chainId =
//   '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';

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
          
        // Show balance card when logged into Proton
        document.getElementById('balanceCard').style.display = 'block';
        
        // Update balances
        updateBalances();
        
        // Set up auto-refresh of balances every 30 seconds
        if (!window.balanceInterval) {
          window.balanceInterval = setInterval(updateBalances, 30000);
        }
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

const rpc = new JsonRpc('https://testnet.protonchain.com', { fetch });

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

  try {
    // proton balance
    if (proton_account != '') {
      // First try to get token balance
      try {
        const balanceResult = await rpc.get_currency_balance('freeostokens', proton_account, 'FREEOS');
        console.log('FREEOS token balance result:', balanceResult);
        
        if (balanceResult.length > 0) {
          // Parse the balance (format is like "10.0000 FREEOS")
          const balanceString = balanceResult[0];
          proton_balance_str = parseFloat(balanceString.split(' ')[0]).toString();
        }
      } catch (error) {
        console.error('Error getting FREEOS token balance:', error);
        
        // Fallback to getting the balance from the contract table
        try {
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
          if (result.rows && result.rows.length > 0) {
            let proton_balance = result.rows[0].balance;
            proton_balance_str = proton_balance.toString();
          }
        } catch (tableError) {
          console.error('Error getting balance from contract table:', tableError);
        }
      }
    }

    // IC balance
    if (principal !== '') {
      ic_balance_str = await demo_backend.get_balance(proton_account);
    }
    
    // Store previous values to check for changes
    const prevProtonBalance = document.getElementById('proton_balance').innerText;
    const prevIcBalance = document.getElementById('ic_balance').innerText;
    
    // Update display
    document.getElementById('proton_balance').innerText = proton_balance_str;
    document.getElementById('ic_balance').innerText = ic_balance_str;
    
    // Add highlight animation if values changed
    if (prevProtonBalance !== proton_balance_str) {
      const protonBalanceBox = document.getElementById('proton_balance').closest('.balance-box');
      protonBalanceBox.classList.remove('highlight'); 
      // Force DOM reflow
      void protonBalanceBox.offsetWidth;
      protonBalanceBox.classList.add('highlight');
    }
    
    if (prevIcBalance !== ic_balance_str) {
      const icBalanceBox = document.getElementById('ic_balance').closest('.balance-box');
      icBalanceBox.classList.remove('highlight');
      // Force DOM reflow
      void icBalanceBox.offsetWidth; 
      icBalanceBox.classList.add('highlight');
    }
    
  } catch (error) {
    console.error('Error updating balances:', error);
  }
}

document.getElementById('convertBtn').addEventListener('click', async () => {
  // Get the amount the user wants to transfer
  const amountInput = document.getElementById('amountFreeos').value;
  
  if (!amountInput || isNaN(amountInput) || parseFloat(amountInput) <= 0) {
    alert('Please enter a valid amount greater than 0');
    return;
  }

  try {
    // Check FREEOS balance first
    const balanceResult = await rpc.get_currency_balance('freeostokens', session.auth.actor, 'FREEOS');
    console.log('Balance result:', balanceResult);
    
    if (balanceResult.length === 0) {
      alert('You don\'t have any FREEOS tokens');
      return;
    }
    
    // Parse the balance (format is like "10.0000 FREEOS")
    const balanceString = balanceResult[0];
    const balanceAmount = parseFloat(balanceString.split(' ')[0]);
    console.log(`Current balance: ${balanceAmount} FREEOS`);
    
    if (parseFloat(amountInput) > balanceAmount) {
      alert(`You don't have enough FREEOS. Your balance is ${balanceAmount} FREEOS`);
      return;
    }
    
    // Format the quantity with 4 decimal places
    let freeos_quantity = parseFloat(amountInput).toFixed(4) + ' FREEOS';
    console.log(`Attempting to transfer ${freeos_quantity}`);

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
              to: 'freeosgov2',
              quantity: freeos_quantity,
              memo: 'IC SWAP ' + principal,
            },
            authorization: [session.auth],
          },
        ],
      },
      broadcast: true,
    });
    
    console.log('Transaction result:', result);
    alert('Transfer successful!');
    
    // Update balances after transfer
    updateBalances();
    
  } catch (error) {
    console.error('Transaction error:', error);
    alert('Transaction failed: ' + error.message);
  }
});

function showFunctionTable() {
  if (principal !== '' && proton_account !== '') {
    console.log('Making functionTable visible');
    document.getElementById('functionTable').style.display = 'block';
  } else {
    console.log('Making functionTable hidden');
    document.getElementById('functionTable').style.display = 'none';
  }
  
  // Control balance card visibility - only show if logged into Proton
  if (proton_account !== '') {
    document.getElementById('balanceCard').style.display = 'block';
  } else {
    document.getElementById('balanceCard').style.display = 'none';
    
    // Clear interval if Proton disconnected
    if (window.balanceInterval) {
      clearInterval(window.balanceInterval);
      window.balanceInterval = null;
    }
  }
}

async function createLink({ restoreSession }) {
  const result = await ConnectWallet({
    linkOptions: {
      endpoints: ['https://testnet.protonchain.com'],
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
