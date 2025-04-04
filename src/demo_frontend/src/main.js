// import App from './App';
// import './index.scss';
// CSS now imported directly in the HTML for faster loading

import { demo_backend } from "../../declarations/demo_backend";
import ProtonWebSDK from '@proton/web-sdk';
import { JsonRpc, Api } from 'eosjs';
import { termsAndConditionsText } from './termsandconditions.js';
import { marked } from 'marked';
import HelpPage from './HelpPage.js';

let principal = '';
let proton_account = '';
let chain = 'dfinity';
let btc_price = 0;
let link, session;
let principalVerified = false;

// Constants
const appIdentifier = 'freeosclaim';

// Chain configuration
let chainId =
  '71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd'; // Testnet

// mainnet chain ID (commented out)
// const mainnetChainId = '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0';

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

// Validate a principal ID (basic check)
function isValidPrincipalId(principalId) {
  // Basic pattern check for principal IDs
  // They are typically a series of groups of 5 lowercase characters or numbers separated by dashes
  const principalPattern = /^[a-z0-9\-]+$/;
  
  if (!principalId || principalId.trim() === '') {
    return false;
  }
  
  // Principals should be alphanumeric with dashes
  if (!principalPattern.test(principalId)) {
    return false;
  }
  
  // Principal IDs are usually more than 20 characters long
  if (principalId.length < 20) {
    return false;
  }
  
  return true;
}

// Validate and update UI based on checkbox states
function updateConvertButtonState() {
  const detailsConfirmed = document.getElementById('confirmDetailsCheck').checked;
  const termsAgreed = document.getElementById('termsCheck').checked;
  const convertBtn = document.getElementById('convertBtn');
  
  if (detailsConfirmed && termsAgreed && principalVerified) {
    convertBtn.disabled = false;
  } else {
    convertBtn.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize error recovery state
  window.recoveringFromError = false;
  
  // Set up event handlers for UI components
  setupEventHandlers();
  
  // Set up Terms and Conditions
  setupTermsAndConditions();
  
  // Initialize the Help Page
  initializeHelpPage();
});

function setupEventHandlers() {
  // Prevent Enter key from submitting the form
  document.getElementById('amountFreeos')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('convertBtn')?.click();
    }
  });
  
  // Principal ID input and verification
  document.getElementById('nnsPrincipalInput')?.addEventListener('input', (e) => {
    const principalInput = e.target.value.trim();
    const valid = isValidPrincipalId(principalInput);
    
    if (valid) {
      e.target.classList.remove('is-invalid');
      e.target.classList.add('is-valid');
    } else {
      e.target.classList.remove('is-valid');
      if (principalInput.length > 0) {
        e.target.classList.add('is-invalid');
      } else {
        e.target.classList.remove('is-invalid');
      }
    }
  });
  
  document.getElementById('verifyPrincipalBtn')?.addEventListener('click', () => {
    const principalInput = document.getElementById('nnsPrincipalInput').value.trim();
    verifyPrincipalId(principalInput);
  });
  
  // Checkbox event listeners
  document.getElementById('confirmDetailsCheck')?.addEventListener('change', updateConvertButtonState);
  document.getElementById('termsCheck')?.addEventListener('change', updateConvertButtonState);
  
  // Proton sign in button
  document.getElementById('protonSignInBtn')?.addEventListener('click', handleProtonSignIn);
  
  // Nav bar connect button
  document.getElementById('navConnectBtn')?.addEventListener('click', handleProtonSignIn);
  
  // Nav bar help button
  document.getElementById('navHelpBtn')?.addEventListener('click', toggleHelpPage);
  
  // Convert button
  document.getElementById('convertBtn')?.addEventListener('click', handleConvertButtonClick);
  
  // Debug button
  document.getElementById('showVariablesBtn')?.addEventListener('click', showVariables);
}

function setupTermsAndConditions() {
  const termsLink = document.getElementById('termsLink');
  const termsModal = new bootstrap.Modal(document.getElementById('termsModal'));
  const termsContent = document.getElementById('termsContent');
  const acceptTermsBtn = document.getElementById('acceptTermsBtn');
  
  // Render markdown terms to HTML
  termsContent.innerHTML = marked.parse(termsAndConditionsText);
  
  termsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    termsModal.show();
  });
  
  acceptTermsBtn?.addEventListener('click', () => {
    const termsCheck = document.getElementById('termsCheck');
    termsCheck.checked = true;
    updateConvertButtonState();
  });
}

async function handleProtonSignIn() {
  if (window.recoveringFromError) {
    alert('Please wait a moment before trying again...');
    return;
  }
  
  try {
    await login(false);

    if (session) {
      proton_account = session.auth.actor;
      
      // Update both places that show the account name
      document.getElementById('proton_account').innerText = session.auth.actor;
      document.getElementById('nav_proton_account').innerText = session.auth.actor;
      
      // Show account info in navbar
      document.getElementById('navBarAccountInfo').style.display = 'flex';
      document.getElementById('navConnectBtn').style.display = 'none';
        
      // Show balance card and NNS instructions when logged into Proton
      document.getElementById('balanceCard').style.display = 'block';
      document.getElementById('nnsInstructionsCard').style.display = 'block';
      
      // Update balances
      updateBalances();
      
      // Set up auto-refresh of balances every 30 seconds
      if (!window.balanceInterval) {
        window.balanceInterval = setInterval(updateBalances, 30000);
      }
    } else {
      console.log('No Proton session established');
    }
  } catch (loginError) {
    console.error('Login error:', loginError);
    alert('Error connecting to XPR Network: ' + (loginError.message || 'Unknown error'));
    handleSessionError();
  }
}

// Verify Principal ID and update UI
function verifyPrincipalId(inputPrincipal) {
  if (!isValidPrincipalId(inputPrincipal)) {
    alert('Please enter a valid NNS Principal ID');
    principalVerified = false;
    updateConvertButtonState();
    return;
  }
  
  // Set as verified (in a real app, you might want to check this against the IC network)
  principal = inputPrincipal;
  principalVerified = true;
  
  // Update the UI
  document.getElementById('displayPrincipalId').textContent = principal;
  document.getElementById('convertFormCard').style.display = 'block';
  
  // Scroll to the conversion form
  document.getElementById('convertFormCard').scrollIntoView({ behavior: 'smooth' });
  
  // Update button state
  updateConvertButtonState();
}

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
    
    // Store previous values to check for changes
    const prevProtonBalance = document.getElementById('proton_balance').innerText;
    
    // Update display in both locations
    document.getElementById('proton_balance').innerText = proton_balance_str;
    document.getElementById('nav_proton_balance').innerText = proton_balance_str;
    
    // Add highlight animation if values changed
    if (prevProtonBalance !== proton_balance_str) {
      // Highlight main balance box
      const protonBalanceBox = document.getElementById('proton_balance').closest('.balance-box');
      protonBalanceBox.classList.remove('highlight'); 
      // Force DOM reflow
      void protonBalanceBox.offsetWidth;
      protonBalanceBox.classList.add('highlight');
      
      // Highlight navbar balance
      const navBalanceBadge = document.getElementById('nav_proton_balance').closest('.balance-badge');
      navBalanceBadge.style.transition = 'background-color 0.5s';
      navBalanceBadge.style.backgroundColor = 'rgba(235, 85, 40, 0.3)';
      
      setTimeout(() => {
        navBalanceBadge.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }, 1500);
    }
    
  } catch (error) {
    console.error('Error updating balances:', error);
  }
}

async function handleConvertButtonClick(event) {
  // Prevent any default form submission behavior
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Double-check that principal is verified
  if (!principalVerified) {
    alert('Please verify your NNS Principal ID first');
    return;
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
    const confirmMessage = `You are about to convert ${userAmount} FREEOS to LIFT.\n\nYour NNS Principal ID is: ${principal}\n\nPlease confirm this is correct before proceeding.`;
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
      
      // Reset form
      document.getElementById('amountFreeos').value = '';
      document.getElementById('confirmDetailsCheck').checked = false;
      document.getElementById('termsCheck').checked = false;
      document.getElementById('convertBtn').disabled = true;
      
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
}

function showVariables() {
  console.log(
    'showVariables - principal = [' +
      principal +
      '] proton_account = [' +
      proton_account +
      ']'
  );
}

// Help page handling functions
function initializeHelpPage() {
  // Create the help page component
  const helpPageElement = HelpPage();
  
  // Convert the JSX-like object to HTML and add it to the help container
  document.getElementById('helpPageContainer').innerHTML = '';
  document.getElementById('helpPageContainer').appendChild(renderHelpPage(helpPageElement));
}

// Function to toggle between main content and help page
function toggleHelpPage() {
  const mainContent = document.getElementById('mainContent');
  const helpPageContainer = document.getElementById('helpPageContainer');
  const helpBtn = document.getElementById('navHelpBtn');
  
  console.log('Toggle help page. Current display:', helpPageContainer.style.display);
  console.log('Computed style:', window.getComputedStyle(helpPageContainer).display);
  
  // Check if help page is currently hidden (either by style.display='none' or computed style)
  const isHelpHidden = helpPageContainer.style.display === 'none' || 
                        window.getComputedStyle(helpPageContainer).display === 'none';
  
  if (isHelpHidden) {
    console.log('Showing help page');
    // Show help page, hide main content
    mainContent.style.display = 'none';
    
    // Recreate the help page content to ensure it has the latest changes
    const helpPageElement = HelpPage();
    helpPageContainer.innerHTML = '';
    helpPageContainer.appendChild(renderHelpPage(helpPageElement));
    
    helpPageContainer.style.display = 'block';
    helpBtn.innerHTML = '<i class="fas fa-home me-1"></i>Home';
  } else {
    console.log('Hiding help page');
    // Show main content, hide help page
    mainContent.style.display = 'block';
    helpPageContainer.style.display = 'none';
    helpBtn.innerHTML = '<i class="fas fa-question-circle me-1"></i>Help';
  }
}

// Helper function to convert JSX-like component to DOM elements
function renderHelpPage(component) {
  // Create a container div
  const container = document.createElement('div');
  container.className = 'help-page';
  
  // Add container with bootstrap classes
  const innerContainer = document.createElement('div');
  innerContainer.className = 'container py-4';
  container.appendChild(innerContainer);
  
  // Add page title
  const titleRow = document.createElement('div');
  titleRow.className = 'row mb-4';
  innerContainer.appendChild(titleRow);
  
  const titleCol = document.createElement('div');
  titleCol.className = 'col-12 text-center';
  titleRow.appendChild(titleCol);
  
  const pageTitle = document.createElement('h2');
  pageTitle.className = 'mb-3';
  pageTitle.textContent = 'FREEOS to LIFT Converter Guide';
  titleCol.appendChild(pageTitle);
  
  const pageSubtitle = document.createElement('p');
  pageSubtitle.className = 'text-muted';
  pageSubtitle.textContent = 'A complete step-by-step guide for converting your FREEOS tokens to LIFT';
  titleCol.appendChild(pageSubtitle);

  // Create content row
  const row = document.createElement('div');
  row.className = 'row';
  innerContainer.appendChild(row);
  
  // Left column - Manual content
  const leftCol = document.createElement('div');
  leftCol.className = 'col-lg-5';
  row.appendChild(leftCol);
  
  const leftCard = document.createElement('div');
  leftCard.className = 'card shadow-sm mb-4';
  leftCol.appendChild(leftCard);
  
  const leftCardHeader = document.createElement('div');
  leftCardHeader.className = 'card-header';
  leftCardHeader.innerHTML = '<h5 class="card-title mb-0">Written Instructions</h5>';
  leftCard.appendChild(leftCardHeader);
  
  const leftCardBody = document.createElement('div');
  leftCardBody.className = 'card-body';
  leftCard.appendChild(leftCardBody);
  
  // Add intro text
  const writtenIntro = document.createElement('p');
  writtenIntro.className = 'text-muted mb-4';
  writtenIntro.textContent = 'Follow these step-by-step instructions to convert your FREEOS tokens to LIFT.';
  leftCardBody.appendChild(writtenIntro);
  
  const manualContent = document.createElement('div');
  manualContent.className = 'manual-content';
  manualContent.innerHTML = marked.parse(component.manualContent);
  leftCardBody.appendChild(manualContent);
  
  // Quick resources section below manual content
  const resourcesCard = document.createElement('div');
  resourcesCard.className = 'card shadow-sm';
  leftCol.appendChild(resourcesCard);
  
  const resourcesCardHeader = document.createElement('div');
  resourcesCardHeader.className = 'card-header';
  resourcesCardHeader.innerHTML = '<h5 class="card-title mb-0">Quick Resources</h5>';
  resourcesCard.appendChild(resourcesCardHeader);
  
  const resourcesCardBody = document.createElement('div');
  resourcesCardBody.className = 'card-body';
  resourcesCard.appendChild(resourcesCardBody);
  
  const resourcesList = document.createElement('ul');
  resourcesList.className = 'list-group list-group-flush';
  resourcesCardBody.appendChild(resourcesList);
  
  // Add NNS App resource link
  const nnsItem = document.createElement('li');
  nnsItem.className = 'list-group-item bg-transparent';
  nnsItem.innerHTML = `
    <a href="https://nns.ic0.app/" target="_blank" rel="noopener noreferrer" class="resource-link">
      <i class="fas fa-external-link-alt me-2"></i>
      NNS App
    </a>
  `;
  resourcesList.appendChild(nnsItem);
  
  // Add Lift Cash Website link
  const liftItem = document.createElement('li');
  liftItem.className = 'list-group-item bg-transparent';
  liftItem.innerHTML = `
    <a href="https://lift.cash/" target="_blank" rel="noopener noreferrer" class="resource-link">
      <i class="fas fa-external-link-alt me-2"></i>
      Lift Cash Website
    </a>
  `;
  resourcesList.appendChild(liftItem);
  
  // Add FREEOS Website link
  const freesosItem = document.createElement('li');
  freesosItem.className = 'list-group-item bg-transparent';
  freesosItem.innerHTML = `
    <a href="https://freeos.io/" target="_blank" rel="noopener noreferrer" class="resource-link">
      <i class="fas fa-external-link-alt me-2"></i>
      FREEOS Website
    </a>
  `;
  resourcesList.appendChild(freesosItem);
  
  // Add XPR Network link
  const xprItem = document.createElement('li');
  xprItem.className = 'list-group-item bg-transparent';
  xprItem.innerHTML = `
    <a href="https://xprnetwork.org/" target="_blank" rel="noopener noreferrer" class="resource-link">
      <i class="fas fa-external-link-alt me-2"></i>
      XPR Network
    </a>
  `;
  resourcesList.appendChild(xprItem);
  
  // Right column - Images section (larger)
  const rightCol = document.createElement('div');
  rightCol.className = 'col-lg-7';
  row.appendChild(rightCol);
  
  // Images section
  const imagesCard = document.createElement('div');
  imagesCard.className = 'card shadow-sm mb-4';
  rightCol.appendChild(imagesCard);
  
  const imagesCardHeader = document.createElement('div');
  imagesCardHeader.className = 'card-header';
  imagesCardHeader.innerHTML = '<h5 class="card-title mb-0">Visual Instructions</h5>';
  imagesCard.appendChild(imagesCardHeader);
  
  const imagesCardBody = document.createElement('div');
  imagesCardBody.className = 'card-body';
  imagesCard.appendChild(imagesCardBody);
  
  // Add a header for the visual guide with instructions
  const imagesIntro = document.createElement('p');
  imagesIntro.className = 'text-muted mb-4';
  imagesIntro.innerHTML = 'Click any image to view it in full size. <i class="fas fa-search-plus"></i>';
  imagesCardBody.appendChild(imagesIntro);
  
  // Add each image
  component.manualImages.forEach(image => {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'manual-image-container';
    
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt;
    img.className = 'img-fluid rounded mb-2';
    img.loading = 'lazy'; // Add lazy loading for better performance
    img.onerror = function() {
      // Try alternative paths if the image doesn't load
      if (this.src.startsWith('/manual/')) {
        // Try with assets prefix
        this.src = '/assets' + this.src;
      } else if (this.src.startsWith('/assets/manual/')) {
        // Try without assets prefix
        this.src = this.src.replace('/assets/manual/', '/manual/');
      } else {
        // Fallback to logo
        this.src = '/your-logo.png';
        this.style.opacity = '0.5';
        this.title = 'Image could not be loaded';
      }
    };
    
    // Add click handler to open image in full view
    img.style.cursor = 'pointer';
    img.onclick = function() {
      window.open(this.src, '_blank');
    };
    
    const caption = document.createElement('p');
    caption.className = 'image-caption text-muted small';
    caption.textContent = image.caption;
    
    imageContainer.appendChild(img);
    imageContainer.appendChild(caption);
    imagesCardBody.appendChild(imageContainer);
  });
  
  // Add support section below images
  const supportAlert = document.createElement('div');
  supportAlert.className = 'alert alert-info';
  supportAlert.setAttribute('role', 'alert');
  supportAlert.innerHTML = `
    <i class="fas fa-info-circle me-2"></i>
    Having trouble? Contact our support team at <a href="mailto:support@example.com" class="alert-link">support@example.com</a>
  `;
  rightCol.appendChild(supportAlert);
  
  // Add a back button to return to main view
  const backButtonContainer = document.createElement('div');
  backButtonContainer.className = 'text-center mt-4';
  
  const backButton = document.createElement('button');
  backButton.className = 'btn btn-outline-light';
  backButton.innerHTML = '<i class="fas fa-arrow-left me-2"></i>Return to Converter';
  backButton.onclick = toggleHelpPage;
  
  backButtonContainer.appendChild(backButton);
  innerContainer.appendChild(backButtonContainer);
  
  return container;
}
