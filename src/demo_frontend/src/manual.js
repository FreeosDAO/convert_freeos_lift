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

// This file contains placeholder content for the images that will be used in the help page
export const manualImages = [
  {
    id: 'connect-wallet',
    src: '/assets/manual/connect-wallet.png', // This path will be populated when images are added
    alt: 'Connecting your XPR Network wallet',
    caption: 'Step 1: Click the Connect XPR Network button to link your wallet'
  },
  {
    id: 'nns-principal',
    src: '/assets/manual/nns-principal.png', // This path will be populated when images are added
    alt: 'Getting your NNS Principal ID',
    caption: 'Step 2: Copy your Principal ID from the NNS App profile section'
  },
  {
    id: 'convert-tokens',
    src: '/assets/manual/convert-tokens.png', // This path will be populated when images are added
    alt: 'Converting FREEOS to LIFT tokens',
    caption: 'Step 3: Enter the amount of FREEOS to convert and confirm all details'
  }
];