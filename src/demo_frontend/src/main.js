// import App from './App';
// import './index.scss';
// CSS now imported directly in the HTML for faster loading

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

// Chain configuration
let chainId =
  '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd'; // Testnet

// mainnet chain ID (commented out)
// const mainnetChainId = '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';

// Wait for the DOM to be fully loaded
// Error recovery helper
function handleSessionError() {
  // Clear any existing error states
  if (window.recoveringFromError) {
    return; // Prevent multiple recovery attempts
  }
  
  window.recoveringFromError = true;
  console.log('Recovering from session error...');
  
  // Reset session variables safely
  setTimeout(() => {
    // Wait a bit before allowing new logins
    window.recoveringFromError = false;
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize error recovery state
  window.recoveringFromError = false;
  
  // Prevent Enter key from submitting the form
  document.getElementById('amountFreeos')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('convertBtn')?.click();
    }
  });
  
  document
    .getElementById('protonSignInBtn')
    .addEventListener('click', async () => {
      if (window.recoveringFromError) {
        alert('Please wait a moment before trying again...');
        return;
      }
      
      try {
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
      } catch (loginError) {
        console.error('Login error:', loginError);
        alert('Error connecting to XPR Network: ' + (loginError.message || 'Unknown error'));
        handleSessionError();
      }
    });

  document
    .getElementById('dfinitySignInBtn')
    .addEventListener('click', async () => {
      if (window.recoveringFromError) {
        alert('Please wait a moment before trying again...');
        return;
      }
      
      try {
        client = await AuthClient.create();
        const isAuthenticated = await client.isAuthenticated();

        if (isAuthenticated) {
          const identity = client.getIdentity();
          principal = identity.getPrincipal().toString();
          console.log('Auth. already authenticated. principal = ' + principal);
          signedIn = true;
          
          document.getElementById('principal_id').innerText = principal;
          showFunctionTable();
          return;
        }

        const result = await new Promise((resolve, reject) => {
          client.login({
            identityProvider: 'https://identity.ic0.app',
            onSuccess: () => {
              const identity = client.getIdentity();
              const principal = identity.getPrincipal().toString();
              resolve({ identity, principal });
            },
            onError: (error) => {
              console.error('II login error:', error);
              reject(new Error('Internet Identity login failed'));
            },
          });
        });
        
        principal = result.principal;
        console.log('Auth. signed in. principal = ' + principal);
        signedIn = true;

        document.getElementById('principal_id').innerText = principal;
        showFunctionTable();
      } catch (error) {
        console.error('Internet Computer login error:', error);
        alert('Error connecting to Internet Computer: ' + (error.message || 'Unknown error'));
        handleSessionError();
      }
    });
});

const login = async (restoreSession) => {
  try {
    // Ensure we have a working RPC connection before attempting login
    await ensureRpcConnection();
    
    console.log(
      `Beginning login with endpoints = ${rpcEndpoints}, chainId = ${chainId}, appIdentifier = ${appIdentifier}`
    );
    
    // Use our tested and working endpoint for the login
    const { link: localLink, session: localSession } = await ProtonWebSDK({
      linkOptions: {
        endpoints: [rpc.endpoint], // Use the currently working endpoint
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
    
    // If we got here, the login was successful
    return true;
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Re-throw to allow proper handling up the chain
  }
};

const logout = async () => {
  if (link && session) {
    await link.removeSession(appIdentifier, session.auth, chainId);
  }
  session = undefined;
  link = undefined;
};

// Configure multiple fallback endpoints for better reliability
const rpcEndpoints = [
  'https://testnet.protonchain.com',
  'https://testnet-proton.eoscafeblock.com', 
  'https://test.proton.eosusa.news'
];

// Create RPC instance with the primary endpoint
let rpc = new JsonRpc(rpcEndpoints[0], { 
  fetch,
  // Add a reasonable timeout for network requests
  fetchConfiguration: {
    timeout: 15000, // 15 seconds timeout
    // Signal available for aborting requests in case of timeouts
    signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
  }
});

// Function to test and switch endpoints if needed
async function ensureRpcConnection() {
  let endpointIndex = 0;
  let connected = false;
  
  while (!connected && endpointIndex < rpcEndpoints.length) {
    try {
      // Test the connection with a simple info request
      await rpc.get_info();
      connected = true;
      console.log(`Connected to XPR Network via ${rpcEndpoints[endpointIndex]}`);
    } catch (error) {
      console.warn(`Endpoint ${rpcEndpoints[endpointIndex]} failed:`, error);
      endpointIndex++;
      
      if (endpointIndex < rpcEndpoints.length) {
        console.log(`Trying next endpoint: ${rpcEndpoints[endpointIndex]}`);
        rpc = new JsonRpc(rpcEndpoints[endpointIndex], { 
          fetch,
          fetchConfiguration: {
            timeout: 15000,
            signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
          }
        });
      } else {
        console.error('All endpoints failed');
        throw new Error('Unable to connect to XPR Network. Please try again later.');
      }
    }
  }
  
  return connected;
}

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
    // First ensure we have a working RPC connection
    try {
      await ensureRpcConnection();
    } catch (connError) {
      console.error('Connection error during balance update:', connError);
      // Don't show alert here, just log the error to avoid interrupting the user
      return;
    }

    // proton balance
    if (proton_account != '') {
      // First try to get token balance with retries
      let retryCount = 0;
      const maxRetries = 3;
      let fetchSuccess = false;
      
      while (!fetchSuccess && retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to fetch FREEOS balance...`);
          const balanceResult = await rpc.get_currency_balance('freeostokens', proton_account, 'FREEOS');
          console.log('FREEOS token balance result:', balanceResult);
          
          if (balanceResult.length > 0) {
            // Parse the balance (format is like "10.0000 FREEOS")
            const balanceString = balanceResult[0];
            proton_balance_str = parseFloat(balanceString.split(' ')[0]).toString();
            fetchSuccess = true;
          } else {
            console.log('No FREEOS balance found, trying fallback method...');
            break; // Try the fallback method
          }
        } catch (error) {
          console.error(`Error getting FREEOS token balance (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error('Max retries reached, trying fallback method...');
            break; // Try the fallback method
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      // If primary method failed, fallback to getting balance from the contract table
      if (!fetchSuccess) {
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

document.getElementById('convertBtn').addEventListener('click', async (event) => {
  // Prevent any default form submission behavior
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Get the amount the user wants to transfer
  const amountInput = document.getElementById('amountFreeos').value;
  
  if (!amountInput || isNaN(amountInput) || parseFloat(amountInput) <= 0) {
    alert('Please enter a valid amount greater than 0');
    return;
  }

  try {
    // First, ensure we have a working RPC connection
    try {
      await ensureRpcConnection();
    } catch (connError) {
      console.error('Connection error:', connError);
      alert('Unable to connect to XPR Network. Please check your internet connection and try again.');
      return;
    }
    
    // Parse user input to a clean number
    const userAmount = parseFloat(amountInput);
    
    // Check FREEOS balance first with retry mechanism
    let balanceResult;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to fetch FREEOS balance...`);
        balanceResult = await rpc.get_currency_balance('freeostokens', session.auth.actor, 'FREEOS');
        console.log('Balance result:', balanceResult);
        break; // If successful, exit the loop
      } catch (balanceError) {
        retryCount++;
        console.error(`Balance fetch error (attempt ${retryCount}):`, balanceError);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Unable to fetch your FREEOS balance after ${maxRetries} attempts. Please try again later.`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    if (!balanceResult || balanceResult.length === 0) {
      alert('You don\'t have any FREEOS tokens. Make sure you have FREEOS in your XPR Network account to proceed.');
      return;
    }
    
    // Parse the balance (format is like "10.0000 FREEOS")
    const balanceString = balanceResult[0];
    const balanceAmount = parseFloat(balanceString.split(' ')[0]);
    console.log(`Current balance: ${balanceAmount} FREEOS`);
    
    if (userAmount > balanceAmount) {
      alert(`You don't have enough FREEOS. Your balance is ${balanceAmount} FREEOS`);
      return;
    }
    
    // Format the quantity with exactly 4 decimal places as required by the blockchain
    const freeos_quantity = userAmount.toFixed(4) + ' FREEOS';
    console.log(`Formatting transfer amount from ${userAmount} to ${freeos_quantity}`);

    // Show user what's happening
    const confirmMessage = `You are about to convert ${userAmount} FREEOS to LIFT.\n\nDo you want to proceed?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Perform the FREEOS transfer
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
      alert('Transfer successful! Your FREEOS has been submitted for conversion to LIFT.');
      
      // Update balances after transfer
      updateBalances();
    } catch (txError) {
      console.error('Transaction error:', txError);
      
      // Safely extract error message even if it's deeply nested or undefined
      let errorMessage = 'Unknown error occurred';
      try {
        if (txError.message) {
          errorMessage = txError.message;
        } else if (txError.json && txError.json.error && txError.json.error.details) {
          errorMessage = txError.json.error.details
            .map(d => d.message)
            .join(', ');
        } else if (typeof txError === 'string') {
          errorMessage = txError;
        }
      } catch (e) {
        console.error('Error extracting error message:', e);
      }
      
      // Show user-friendly error
      alert('Transaction failed: ' + errorMessage);
    }
  } catch (error) {
    console.error('Pre-transaction error:', error);
    alert('Error preparing transaction: ' + (error.message || 'Unknown error'));
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
