"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

          {/* Floating visual elements */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[500px] pointer-events-none opacity-50">
             <div className="absolute top-10 left-[10%] w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-10 right-[15%] w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
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