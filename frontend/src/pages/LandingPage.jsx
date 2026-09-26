import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import EvidenceSection from '../components/landing/EvidenceSection';
import CapabilitySection from '../components/landing/CapabilitySection';
import TrajectorySection from '../components/landing/TrajectorySection';
import RoleGapSection from '../components/landing/RoleGapSection';
import DevelopmentSection from '../components/landing/DevelopmentSection';
import AICopilotSection from '../components/landing/AICopilotSection';
import ContinuousLoopSection from '../components/landing/ContinuousLoopSection';
import FinalCTA from '../components/landing/FinalCTA';

export default function LandingPage() {
  const containerRef = useRef(null);
  
  // Track scroll progress for the hero scale effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Calculate the scale and border radius of the hero section
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);
  const heroBorderRadius = useTransform(scrollYProgress, [0, 0.5], ["0px", "40px"]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], ["0%", "5%"]);

  return (
    <div className="relative bg-[#00a859]">
      {/* Hero section that scales down to reveal the green background */}
      <div ref={containerRef} className="relative h-[150vh]">
        <motion.div 
          style={{ 
            scale: heroScale, 
            borderRadius: heroBorderRadius,
            y: heroY
          }}
          className="sticky top-0 h-screen w-full bg-[#030712] overflow-hidden flex flex-col justify-center origin-top z-10 shadow-2xl"
        >
          <Navbar />
          <Hero />
        </motion.div>
      </div>

      {/* Main content that slides up over the scaled-down hero */}
      <div className="relative z-20 bg-white rounded-t-[40px] -mt-[50vh] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] pb-24 text-gray-900">
        <EvidenceSection />
        <CapabilitySection />
        <TrajectorySection />
        <RoleGapSection />
        <DevelopmentSection />
        <ContinuousLoopSection />
        <AICopilotSection />
      </div>

      <FinalCTA />
    </div>
  );
}
