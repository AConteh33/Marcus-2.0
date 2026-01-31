import React from 'react';
import LiquidEther from './LiquidEther';
import Header from './Header';

interface LandingPageProps {
  onBegin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onBegin }) => {
  return (
    // Main container handles fade-in and positioning
    <div className="relative isolate h-full animate-fade-in">
      {/* Background layer */}
      <div className="absolute inset-0 -z-10 h-full w-full">
         <LiquidEther
            colors={['#FBBF24', '#F59E0B', '#D97706']}
            mouseForce={15}
            cursorSize={80}
            isViscous={false}
            resolution={0.4}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.3}
            autoIntensity={1.8}
         />
      </div>
      
      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:pt-48 lg:px-8 lg:pt-40">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-amber-700 sm:text-6xl animate-slide-up-fade-in" style={{ animationDelay: '0.2s' }}>
              Deratak Testing Playgrounds
            </h1>
            <p className="mt-6 text-lg leading-8 text-amber-600/80 animate-slide-up-fade-in" style={{ animationDelay: '0.5s' }}>
              An interactive showcase of web and AI experiments.
            </p>
          </div>
          
          {/* Project cards */}
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <div
                onClick={onBegin}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBegin()}
                className="bg-gray-900/80 border border-amber-500/30 rounded-2xl p-8 backdrop-blur-sm text-left cursor-pointer transition-all duration-300 hover:bg-gray-800/90 hover:border-amber-400/50 transform hover:-translate-y-2 group focus:outline-none focus:ring-2 focus:ring-amber-400 flex flex-col animate-slide-up-fade-in"
                aria-label="Launch the Live AI Voice Assistant"
                style={{ animationDelay: '0.8s' }}
              >
                <h2 className="text-2xl font-semibold leading-7 text-amber-400">Live AI Voice Assistant</h2>
                <p className="mt-4 text-base leading-7 text-gray-300 flex-grow">
                  Engage in real-time conversation. Use cases include virtual receptionists, personal productivity assistants, or a scalable workforce for call centers.
                </p>
                <div className="mt-6 text-amber-400 font-semibold flex items-center group-hover:text-amber-300 transition-colors">
                  <span>Launch Assistant</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Card 2 */}
              <div
                className="bg-gray-900/60 border border-gray-600/80 rounded-2xl p-8 backdrop-blur-sm text-left transition-all duration-300 flex flex-col relative overflow-hidden opacity-60 cursor-not-allowed animate-slide-up-fade-in"
                style={{ animationDelay: '1.0s' }}
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-6 py-1 transform translate-x-1/3 translate-y-1/2 rotate-45">SOON</div>
                <h2 className="text-2xl font-semibold leading-7 text-gray-600">WhatsApp AI Assistant</h2>
                <p className="mt-4 text-base leading-7 text-gray-600/80 flex-grow">
                  Integrate an intelligent assistant directly into WhatsApp for automated customer support, appointment booking, and lead qualification via text.
                </p>
                <div className="mt-6 text-gray-500 font-semibold flex items-center">
                  <span>Coming Soon</span>
                </div>
              </div>

              {/* Card 3 */}
              <div
                className="bg-gray-900/60 border border-gray-600/80 rounded-2xl p-8 backdrop-blur-sm text-left transition-all duration-300 flex flex-col relative overflow-hidden opacity-60 cursor-not-allowed animate-slide-up-fade-in"
                style={{ animationDelay: '1.2s' }}
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-6 py-1 transform translate-x-1/3 translate-y-1/2 rotate-45">SOON</div>
                <h2 className="text-2xl font-semibold leading-7 text-gray-600">No-Code Website Builder</h2>
                <p className="mt-4 text-base leading-7 text-gray-600/80 flex-grow">
                  Create stunning, professional websites with an intuitive drag-and-drop interface. Perfect for portfolios, small businesses, and landing pages.
                </p>
                <div className="mt-6 text-gray-500 font-semibold flex items-center">
                  <span>Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-16 sm:mt-20 p-4 bg-amber-50/80 border border-amber-200/50 rounded-lg max-w-2xl w-full mx-auto animate-slide-up-fade-in" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-start sm:items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mr-3 shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm text-gray-700">
                This is a technology demonstration. All data is temporary and will be cleared when you refresh the page.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;