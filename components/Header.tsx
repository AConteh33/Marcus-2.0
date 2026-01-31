import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="absolute inset-x-0 top-0 z-50 animate-fade-in">
      <nav className="mx-auto max-w-7xl px-6 py-6 lg:px-8" aria-label="Global">
        <div className="text-xl sm:text-2xl font-bold text-amber-700 tracking-wider">
          Dera Tak
        </div>
      </nav>
    </header>
  );
};

export default Header;