# DineEasy Platform

DineEasy is a comprehensive restaurant management platform that simplifies dining operations through digital solutions. Our platform provides QR code-based ordering, kitchen management, analytics, and payment processing capabilities.

## 🌟 Features

- **QR Code Ordering System**

  - Digital menu access
  - Table-specific ordering
  - Real-time cart management
  - Seamless checkout process
  - Customer feedback system

- **Dashboard**

  - Kitchen order management
  - Table management
  - Staff management
  - Menu customization
  - Order history tracking
  - Analytics and reporting
  - Billing and payments
  - Printer integration

- **Business Tools**
  - Stripe integration for payments
  - Analytics dashboard
  - Customer feedback management
  - Staff performance tracking

## 🚀 Tech Stack

- **Frontend**: Next.js 15.3
- **UI Components**:
  - Radix UI for accessible components
  - Tailwind CSS for styling
  - Framer Motion for animations
- **Type Safety**: TypeScript
- **State Management**: React Hooks
- **Payment Processing**: Stripe

## 📦 Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn package manager
- Stripe account (for payment processing)

## 🛠 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/dineeasy.git
   cd dineeasy
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add necessary environment variables.

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
dineeasy/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Restaurant management dashboard
│   ├── qr/               # QR code ordering system
│   └── setup/            # Restaurant onboarding
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
└── public/               # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 📄 License

This project is licensed under the terms of the license included in the [LICENSE.md](LICENSE.md) file.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 🔐 Security

For security concerns, please email security@dineeasy.com

## 💡 Support

For support and questions, please contact support@dineeasy.com

## Developed by Beny Dishon K
