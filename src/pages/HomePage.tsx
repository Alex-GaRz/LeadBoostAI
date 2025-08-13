import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Pricing from '../components/Pricing';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <Features />
      <Pricing />
    </div>
  );
};

export default HomePage;