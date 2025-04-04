// This file contains the manual content for the help page
export const manualContent = `
# How to Use the FREEOS to LIFT Converter

This guide will walk you through the process of converting your FREEOS tokens from XPR Network to staked LIFT neurons on the Internet Computer.

## Step 1: Connect Your XPR Network Wallet

1. Click the "Connect XPR Network" button at the top of the page
2. Select your wallet provider and authorize the connection
3. Once connected, you'll see your account address and FREEOS balance

## Step 2: Get Your NNS Principal ID

To receive LIFT tokens, you need your NNS Principal ID:

1. Visit the [NNS App](https://nns.ic0.app/) in a new tab
2. Connect using your Internet Identity
3. Click your profile icon in the top-right corner
4. Copy your Principal ID shown there
5. Return to this app and paste your Principal ID

## Step 3: Convert Your FREEOS to LIFT

1. Enter the amount of FREEOS tokens you wish to convert
2. Double-check your Principal ID is correct
3. Confirm all details by checking the confirmation box
4. Review and accept the Terms and Conditions
5. Click "Convert to LIFT" and approve the transaction in your wallet

## What Happens Next?

- Your FREEOS tokens will be held in escrow until the Lift Cash SNS Token Launch
- Upon successful launch, your tokens will be converted to staked LIFT neurons with dissolve delays
- If the SNS launch doesn't proceed, all FREEOS tokens will be returned to your XPR Network account

## Need Help?

If you encounter any issues or have questions, please contact support at:
support@example.com
`;

// This file contains the images used in the help page
export const manualImages = [
  {
    id: 'connect-wallet',
    src: '/manual/freeos_lift_step1.png',
    alt: 'Connecting your XPR Network wallet',
    caption: 'Step 1: Click the Connect XPR Network button to link your wallet'
  },
  {
    id: 'wallet-dialog',
    src: '/manual/freeos_lift_step2.png',
    alt: 'XPR Network wallet connection dialog',
    caption: 'Step 2: Scan the QR code with your wallet app or click Open Wallet'
  },
  {
    id: 'connected-wallet',
    src: '/manual/freeos_lift_step3.png',
    alt: 'Successfully connected to XPR Network',
    caption: 'Step 3: After connecting, you\'ll see your account name and balance'
  },
  {
    id: 'nns-instructions',
    src: '/manual/freeos_lift_step4.png',
    alt: 'NNS Principal ID instructions',
    caption: 'Step 4: Follow instructions to get your NNS Principal ID'
  },
  {
    id: 'principal-input',
    src: '/manual/freeos_lift_step5.png',
    alt: 'Entering your NNS Principal ID',
    caption: 'Step 5: Paste your NNS Principal ID and verify it'
  },
  {
    id: 'conversion-form',
    src: '/manual/freeos_lift_step6.png',
    alt: 'FREEOS to LIFT conversion form',
    caption: 'Step 6: Enter amount to convert, check confirmation boxes and click Convert'
  },
  {
    id: 'confirm-transaction',
    src: '/manual/freeos_lift_step7.png',
    alt: 'Confirming the conversion details',
    caption: 'Step 7: Double-check all details before proceeding'
  },
  {
    id: 'wallet-signing',
    src: '/manual/freeos_lift_step8.png',
    alt: 'Wallet transaction signing request',
    caption: 'Step 8: Approve the transaction in your XPR Network wallet'
  }
];