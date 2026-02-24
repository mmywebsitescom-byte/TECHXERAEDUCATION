"use client"

import React from 'react'

export default function TechBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#F5F5FA]">
      <div className="absolute inset-0 tech-grid opacity-[0.4]"></div>
      
      {/* Dynamic Ambient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] animate-float opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary/15 rounded-full blur-[140px] animate-float opacity-60" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] animate-float opacity-50" style={{ animationDelay: '4s' }}></div>

      {/* Floating Geometric Subtle Shapes */}
      <div className="absolute top-[15%] right-[25%] w-24 h-24 border border-primary/5 rounded-[2rem] rotate-12 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-[25%] left-[15%] w-16 h-16 bg-secondary/5 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
      
      {/* Decorative SVG Patterns */}
      <svg className="absolute top-[40%] left-[5%] w-24 h-24 text-primary/5 opacity-50" viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5 5" />
      </svg>
    </div>
  )
}