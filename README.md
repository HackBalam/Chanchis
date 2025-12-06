# Chanchis

<p align="center">
  <img src="apps/web/public/cerditoCara.png" alt="Chanchis Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Your unified reward wallet for everyday savings</strong>
</p>

<p align="center">
  <a href="https://chanchis-web-pb1n.vercel.app/">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Overview

**Chanchis** is a Farcaster MiniApp built on the Celo blockchain that enables users to save money through their everyday purchases. It provides a unified reward wallet where users can receive, send, and manage CHNC tokens while earning cashback from affiliated stores.

## Features

- **Wallet Integration**: Automatic wallet connection through Farcaster
- **Token Balance**: View your CHNC token balance in real-time
- **Send Tokens**: Transfer CHNC tokens to any wallet address
- **Receive Tokens**: Generate QR codes to receive payments
- **Transaction History**: Track all incoming and outgoing transactions
- **Affiliated Stores**: Browse stores that accept CHNC and offer cashback
- **Create Store**: Register your business to accept CHNC payments
- **Cashback Calculator**: Calculate cashback rewards for store owners

## Screenshots

| Home | Stores | Menu |
|------|--------|------|
| Balance & Actions | Affiliated Stores | User Profile |

## Installation

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- A Supabase account (for database)
- A Farcaster developer account (for MiniApp manifest)

### Step 1: Clone the repository

```bash
git clone https://github.com/your-username/chanchis.git
cd chanchis
```

### Step 2: Install dependencies

```bash
pnpm install
```

### Step 3: Configure environment variables

Create a `.env.local` file in the `apps/web` directory:

```bash
cd apps/web
touch .env.local
```

Add the following environment variables:

```env
# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Farcaster MiniApp Configuration (generate at https://farcaster.xyz/~/developers/mini-apps/manifest)
NEXT_PUBLIC_FARCASTER_HEADER=your_farcaster_header
NEXT_PUBLIC_FARCASTER_PAYLOAD=your_farcaster_payload
NEXT_PUBLIC_FARCASTER_SIGNATURE=your_farcaster_signature

# Blockchain Configuration
ETHERSCAN_API_KEY=your_celoscan_api_key

# Gasless Transactions - Sponsor wallet that pays gas fees for users
SPONSOR_WALLET_PRIVATE_KEY=your_sponsor_wallet_private_key
```

### Step 4: Set up Supabase database

Create a new table called `businesses` in your Supabase project with the following schema:

```sql
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  cashback_percentage NUMERIC NOT NULL DEFAULT 5,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read businesses" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own business" ON businesses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own business" ON businesses
  FOR UPDATE USING (true);
```

### Step 5: Run the development server

```bash
# From the root directory
pnpm dev
```

### Step 6: Open the app

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: For full functionality, test within the Farcaster Warpcast app using the developer tools.

## Project Structure

```
chanchis/
├── apps/
│   └── web/                    # Next.js application
│       ├── public/             # Static assets (icons, images)
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   │   ├── api/        # API routes (transactions, businesses)
│       │   │   └── .well-known/ # Farcaster manifest endpoint
│       │   ├── components/     # React components
│       │   │   ├── ui/         # Base UI components (shadcn/ui)
│       │   │   ├── navbar.tsx
│       │   │   ├── send-modal.tsx
│       │   │   ├── receive-modal.tsx
│       │   │   ├── business-card.tsx
│       │   │   ├── business-list.tsx
│       │   │   ├── business-modal.tsx
│       │   │   └── transaction-history.tsx
│       │   ├── contexts/       # React contexts (MiniApp)
│       │   └── lib/            # Utilities (env, supabase, wagmi)
│       └── manifest.json       # App manifest
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Blockchain** | Celo (EVM-compatible) |
| **Web3** | wagmi, viem |
| **Farcaster** | @farcaster/miniapp-sdk, @farcaster/frame-sdk |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI |
| **Monorepo** | Turborepo |
| **Package Manager** | pnpm |

## Smart Contract

The CHNC token is deployed on Celo Mainnet:

| Property | Value |
|----------|-------|
| **Token Name** | Chanchis |
| **Symbol** | CHNC |
| **Contract Address** | `0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418` |
| **Network** | Celo Mainnet |
| **Explorer** | [View on Celoscan](https://celoscan.io/token/0xd85E17185cC11A02c7a8C5055FE7Cb6278Df9418) |

## Gasless Transactions (EIP-2612 Permit)

Chanchis implements **gasless token transfers** using the EIP-2612 Permit standard. This allows users to send CHNC tokens without needing CELO for gas fees.

### Why Gasless?

- **Better UX**: Users don't need to hold CELO to pay for gas
- **Lower barrier**: New users can start using the app immediately
- **Seamless experience**: Transactions feel instant and free

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │   Backend   │     │  Blockchain │
│  (Signer)   │     │  (Sponsor)  │     │   (Celo)    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Sign Permit    │                   │
       │   (off-chain)     │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ 2. Submit Permit  │
       │                   │    (pays gas)     │
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 3. TransferFrom   │
       │                   │    (pays gas)     │
       │                   │──────────────────>│
       │                   │                   │
       │                   │ 4. Confirmation   │
       │                   │<──────────────────│
       │                   │                   │
       │ 5. Success        │                   │
       │<──────────────────│                   │
       │                   │                   │
```

### Technical Implementation

1. **User signs a Permit message** (EIP-712 typed data) that authorizes the sponsor wallet to spend their tokens
2. **Backend receives the signature** and calls `permit()` on the token contract
3. **Backend executes `transferFrom()`** to move tokens from user to recipient
4. **Sponsor wallet pays all gas fees** - user pays nothing

### API Endpoints for Gasless Transfers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transfer/nonce` | POST | Get user's permit nonce and token metadata |
| `/api/transfer` | POST | Execute gasless transfer with permit signature |

### Environment Variables Required

```env
# Sponsor wallet that pays gas fees
SPONSOR_WALLET_PRIVATE_KEY=your_sponsor_wallet_private_key
```

> **Important**: The sponsor wallet must have CELO balance to pay for gas fees on behalf of users.

### Code Flow

**Frontend (`send-modal.tsx`)**:
```typescript
// 1. Get nonce from backend
const { nonce, spender } = await fetch("/api/transfer/nonce", {
  method: "POST",
  body: JSON.stringify({ owner: userAddress }),
}).then(res => res.json());

// 2. User signs EIP-2612 Permit
const signature = await signTypedDataAsync({
  domain: { name: "Chanchis", version: "1", chainId: 42220, verifyingContract: TOKEN_ADDRESS },
  types: { Permit: [...] },
  message: { owner, spender, value, nonce, deadline },
});

// 3. Send to backend for execution
await fetch("/api/transfer", {
  method: "POST",
  body: JSON.stringify({ from, to, amount, deadline, signature }),
});
```

**Backend (`/api/transfer/route.ts`)**:
```typescript
// 1. Parse signature into v, r, s
const { v, r, s } = parseSignature(signature);

// 2. Call permit() - sponsor pays gas
await walletClient.writeContract({
  functionName: "permit",
  args: [owner, spender, value, deadline, v, r, s],
});

// 3. Call transferFrom() - sponsor pays gas
await walletClient.writeContract({
  functionName: "transferFrom",
  args: [from, to, amount],
});
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript type checking |

## Deployment

The app is deployed on Vercel. To deploy your own instance:

1. Fork this repository
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions?address=` | GET | Get transaction history for an address |
| `/api/businesses` | GET | List all affiliated businesses |
| `/api/businesses?wallet=` | GET | Get business by wallet address |
| `/api/businesses` | POST | Create a new business |
| `/api/businesses` | PUT | Update an existing business |
| `/api/transfer/nonce` | POST | Get permit nonce for gasless transfer |
| `/api/transfer` | POST | Execute gasless transfer with permit signature |
| `/.well-known/farcaster.json` | GET | Farcaster MiniApp manifest |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Team

Built with love for the Celo ecosystem.

---

<p align="center">
  <strong>Chanchis - Save with every purchase</strong>
</p>
