import React from 'react';
import { AppLogo } from './Icons';

interface PricingPageProps {
  onBack: () => void;
}

const PricingCard: React.FC<{ title: string; price: string; description: string; features: string[]; isFeatured?: boolean }> = ({ title, price, description, features, isFeatured }) => (
    <div className={`flex flex-col p-8 rounded-2xl border ${isFeatured ? 'bg-gray-800/50 border-blue-500/50' : 'bg-[#1C1C1F] border-gray-700/50'}`}>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-gray-400">{description}</p>
        <div className="mt-6">
            <span className="text-5xl font-bold text-white">{price}</span>
            <span className="text-gray-400">{price !== "Free" && " / month"}</span>
        </div>
        <ul className="mt-8 space-y-4 text-gray-300 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button className={`w-full mt-8 py-3 rounded-lg font-semibold transition-colors ${isFeatured ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600/50 text-gray-200 hover:bg-gray-700'}`}>
            Get Started
        </button>
    </div>
);


export const PricingPage: React.FC<PricingPageProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col min-h-screen w-screen bg-[#0B0C10] text-gray-300 overflow-y-auto font-sans">
       <header className="fixed top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-white" />
            <span className="text-white font-bold">codegen<span className="font-light">studio</span></span>
          </div>
          <button onClick={onBack} className="text-sm text-gray-300 hover:text-white transition-colors">
            &larr; Back to Home
          </button>
        </div>
      </header>
       <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">Find the right plan for you</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl">Start for free, then scale up as you grow. All plans include access to our powerful AI code generation features.</p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full text-left">
            <PricingCard
                title="Hobby"
                price="Free"
                description="For personal projects and exploration."
                features={[
                    "Access to Gemini Flash model",
                    "10 generations per day",
                    "Community support",
                    "Download projects as ZIP",
                ]}
            />
             <PricingCard
                title="Pro"
                price="$20"
                description="For professionals and small teams."
                features={[
                    "Everything in Hobby, plus:",
                    "Access to all AI models (OpenAI, DeepSeek)",
                    "Unlimited generations",
                    "Priority support",
                    "GitHub integration",
                ]}
                isFeatured
            />
             <PricingCard
                title="Enterprise"
                price="Custom"
                description="For large organizations with specific needs."
                features={[
                    "Everything in Pro, plus:",
                    "On-premise deployment options",
                    "Custom model fine-tuning",
                    "Dedicated account manager",
                    "SAML SSO",
                ]}
            />
        </div>

       </main>
    </div>
  )
}
