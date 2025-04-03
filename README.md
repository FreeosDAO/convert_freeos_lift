# FREEOS to LIFT Converter

A cross-chain dApp that allows users to convert FREEOS tokens from the XPR Network (formerly Proton) to staked LIFT neurons on the Internet Computer for the upcoming Lift Cash SNS Token Launch. Tokens are held in escrow and converted to staked neurons with dissolve delays upon successful SNS launch.

![FREEOS to LIFT Converter Screenshot](docs/screenshot.png)

## Overview

This application enables FREEOS token holders to participate in the Lift Cash SNS Token Launch by:

1. Connecting their XPR Network wallet
2. Connecting their Internet Computer identity
3. Converting FREEOS tokens to LIFT tokens (conversion ratio to be determined)

**Important Notes:**
- The exact conversion ratio of FREEOS to LIFT will be determined in a future iteration when modeling is complete
- FREEOS tokens converted through this application will become staked LIFT neurons in the Lift Cash SNS DAO with dissolve delays (specific dissolve delays to be determined)
- Upon successful SNS DAO Launch, the contributed FREEOS tokens will be burned
- If the SNS Launch does not proceed for any reason, all FREEOS tokens will be returned to their original XPR Network accounts

## Features

- Modern dark-themed UI with responsive design
- Secure cross-chain token conversion
- Real-time balance updates
- Transaction error handling and validation
- Support for both Internet Computer and XPR Network wallets

## Technology Stack

- **Backend**: Internet Computer (Motoko)
- **Frontend**: JavaScript/HTML/CSS
- **Blockchain Integration**:
  - Internet Computer (IC) via Internet Identity authentication
  - XPR Network (formerly Proton) via Proton Web SDK
- **Build & Development**: DFX, Vite

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (v0.14.0+)
- [XPR Network Wallet](https://webauth.xprnetwork.org/) account
- [Internet Identity](https://identity.ic0.app/) or other supported Internet Computer wallet

### Installation

**Important**: DO NOT use `npm install`. This code works with the versions of packages specified in package-lock.json.
Use the following command instead:

```bash
npm ci
```

### Running the Project Locally

```bash
# Start the Internet Computer replica in the background
dfx start --clean --background

# Deploy the backend canisters
dfx deploy

# Start the frontend
npm start
```

The frontend will be available at http://localhost:3000/

## Usage

1. Click "Connect Internet Computer" to authenticate with your Internet Identity
2. Click "Connect XPR Network" to link your XPR Network wallet
3. Enter the amount of FREEOS tokens you wish to convert to staked LIFT
4. Click "Convert to LIFT" to execute the transaction
5. Balances will update automatically after the transaction is complete

**Note on Token Conversion:**
The FREEOS tokens you contribute will be converted to staked LIFT neurons in the Lift Cash SNS DAO with predetermined dissolve delays once the SNS launch is successful. If the SNS launch does not proceed, your FREEOS tokens will be automatically returned to your XPR Network account.

## Development

### Project Structure

- `/src/demo_backend/` - Motoko canister code
- `/src/demo_frontend/` - Frontend JavaScript application
- `/src/declarations/` - Auto-generated type declarations

### Key Files

- `src/demo_backend/main.mo` - Backend Motoko code
- `src/demo_frontend/src/main.js` - Main application logic
- `src/demo_frontend/index.html` - HTML structure
- `src/demo_frontend/src/styles/demostyles.css` - Application styling

## Deployment

To deploy to the Internet Computer mainnet:

```bash
dfx deploy --network ic
```

## License

[MIT License](LICENSE)

## Acknowledgements

- [Internet Computer](https://internetcomputer.org/)
- [XPR Network](https://xprnetwork.org/)
- [FREEOS](https://freeos.io/)
- [Lift Cash](https://lift.cash/)
