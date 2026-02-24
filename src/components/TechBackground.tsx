"use client"

import React from 'react'

export default function TechBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background">
      <div className="absolute inset-0 tech-grid opacity-20"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[15%] w-[20%] h-[20%] bg-primary/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Floating Tech Elements (SVG icons/shapes) */}
      <svg className="absolute top-1/4 left-1/4 w-12 h-12 text-primary/10 animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
      <svg className="absolute bottom-1/4 right-1/3 w-16 h-16 text-secondary/10 animate-float" style={{ animationDelay: '3s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    </div>
  )
}