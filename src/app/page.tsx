
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Zap, Sparkles, Cpu } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import LogoLoop, { type LogoItem } from '@/components/LogoLoop'

// Custom SVGs for Tech Stack Icons
const NextJsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 128 128" fill="white">
    <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c11.2 0 21.7-2.9 30.8-7.9L48.4 55.4v33.3h-9.2V40.1h9.2l40.3 52.3c6.1-7.7 9.7-17.4 9.7-28.4 0-24.8-20.2-45-45-45-2 0-3.9.1-5.8.4L84.8 35.8c2.9-.5 5.8-.8 8.9-.8 19.8 0 35.8 16 35.8 35.8 0 8.8-3.2 16.8-8.5 23l-3.3-2.6c4.2-5.4 6.8-12.2 6.8-19.6 0-17.1-13.9-31-31-31-1.4 0-2.8.1-4.2.3L44.8 35c2.4-.6 4.9-.9 7.5-.9 19.8 0 35.8 16 35.8 35.8 0 7.3-2.2 14.1-6 19.8l-1.4-1.8c3.1-4.9 4.9-10.7 4.9-16.9 0-17.1-13.9-31-31-31-1.3 0-2.5.1-3.7.2l41.5 53.9c13.7-10.3 22.7-26.6 22.7-45 0-35.3-28.7-64-64-64z"/>
  </svg>
)

const VercelIcon = () => (
  <svg width="48" height="48" viewBox="0 0 512 512" fill="white">
    <path d="M256 48l240 416H16z" />
  </svg>
)

const GithubIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.805.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const ReactIcon = () => (
  <svg width="48" height="48" viewBox="-11.5 -10.23174 23 20.46348" fill="white">
    <circle cx="0" cy="0" r="2.05" fill="white" />
    <g fill="none" stroke="white" strokeWidth="1">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
)

const techStackLogos: LogoItem[] = [
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><VercelIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><GithubIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><div className="text-4xl font-bold font-code text-white">TS</div></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><div className="text-4xl font-bold font-code text-white">JS</div></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><NextJsIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><ReactIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><Zap size={48} className="text-white" /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><Cpu size={48} className="text-white" /></div> },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <TechBackground />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative py-32 px-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-7xl mx-auto text-center relative z-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-8 py-2 px-6 bg-white/50 backdrop-blur-sm text-primary border-primary/20 font-bold text-sm rounded-full shadow-sm">
                <Sparkles size={14} className="mr-2 text-yellow-500" /> REVOLUTIONIZING CAMPUS LIFE
              </Badge>
            </motion.div>
            
            <h1 className="font-headline text-6xl md:text-8xl font-bold mb-8 text-foreground leading-[0.95] tracking-tighter">
              The Digital Core of <br />
              <motion.span 
                className="text-primary bg-clip-text"
              >
                Tech Excellence
              </motion.span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl text-muted-foreground/80 mb-12 leading-relaxed font-medium">
              A high-performance student portal engineered for TechXera. Manage results, resources, and announcements with a seamless, data-driven interface.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login">
                <Button size="lg" className="h-16 px-10 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                  Get Started <ArrowRight className="ml-2" size={24} />
                </Button>
              </Link>
              <Link href="/results">
                <Button size="lg" variant="outline" className="h-16 px-10 border-2 border-primary/20 rounded-2xl text-xl font-bold hover:bg-white/50 backdrop-blur-sm transition-all">
                  Check Results
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Technologies I Use Section - PREMIUM BLACK THEME */}
        <section className="bg-black py-40 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-7xl font-headline font-bold tracking-tight">
                <span className="bg-gradient-to-r from-[#4CA9FF] to-[#A056FF] bg-clip-text text-transparent">
                  Technologies We Leverage
                </span>
              </h2>
              <div className="flex justify-center">
                <div className="w-24 h-1.5 bg-gradient-to-r from-[#4CA9FF] to-[#A056FF] rounded-full"></div>
              </div>
              <p className="text-[#888] text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Driving innovation with a modern, high-performance tech stack.
              </p>
            </motion.div>

            <div className="relative pt-12 flex flex-col items-center">
              <div className="w-full relative z-10">
                <LogoLoop 
                  logos={techStackLogos} 
                  speed={40} 
                  logoHeight={56} 
                  gap={100} 
                  fadeOut={true} 
                  fadeOutColor="#000000"
                  scaleOnHover={true}
                />
              </div>
              
              {/* Pulsing Purple Orb */}
              <div className="mt-20">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 15px 5px rgba(160, 86, 255, 0.4)",
                      "0 0 40px 15px rgba(160, 86, 255, 0.7)",
                      "0 0 15px 5px rgba(160, 86, 255, 0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-full bg-black border-[4px] border-[#A056FF]/50 flex items-center justify-center"
                >
                  <div className="w-5 h-5 rounded-full bg-[#A056FF]/80 blur-[2px]"></div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              {[
                {
                  title: "Smart Resources",
                  desc: "Advanced repository for lecture notes, research papers, and coding guides.",
                  icon: <BookOpen className="text-primary" size={32} />,
                  accent: "bg-primary/10"
                },
                {
                  title: "Performance Tracking",
                  desc: "Visualize your academic growth with real-time analytics and predictive grading.",
                  icon: <Zap className="text-secondary" size={32} />,
                  accent: "bg-secondary/10"
                },
                {
                  title: "Instant Alerts",
                  desc: "Priority notification system for exam schedules and critical campus updates.",
                  icon: <ShieldCheck className="text-primary" size={32} />,
                  accent: "bg-primary/10"
                }
              ].map((feature, i) => (
                <motion.div key={i} variants={item}>
                  <Card className="glass group hover:bg-white transition-all duration-500 border-none rounded-[2.5rem] overflow-hidden h-full shadow-lg hover:shadow-2xl">
                    <CardContent className="p-10">
                      <div className={`mb-8 p-6 w-fit ${feature.accent} rounded-3xl group-hover:scale-110 transition-transform duration-500`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-3xl font-headline font-bold mb-4 tracking-tight">{feature.title}</h3>
                      <p className="text-muted-foreground/80 leading-relaxed text-lg font-medium">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-32 bg-white/40 backdrop-blur-sm border-y border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: "Active Users", value: "5K+" },
                { label: "Daily Queries", value: "12K+" },
                { label: "Efficiency", value: "99%" },
                { label: "Campus Support", value: "24/7" }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                >
                  <p className="text-5xl md:text-6xl font-headline font-bold text-primary mb-3 tracking-tighter">{stat.value}</p>
                  <p className="text-muted-foreground uppercase text-sm font-bold tracking-[0.2em]">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-white/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white">
              <Zap size={24} />
            </div>
            <span className="font-headline font-bold text-2xl text-foreground tracking-tight">TechXera Campus</span>
          </div>
          <div className="flex gap-12 text-sm font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-primary transition-colors">Security</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Help</Link>
          </div>
          <p className="text-sm font-medium">© 2025 TechXera. High-Performance Campus Engine.</p>
        </div>
      </footer>
    </div>
  )
}
