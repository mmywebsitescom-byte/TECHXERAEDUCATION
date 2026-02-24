
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, Cpu } from 'lucide-react'
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Home() {
  return (
    <div className="relative">
      <TechBackground />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto text-center"
          >
            <Badge variant="secondary" className="mb-6 py-1.5 px-4 bg-secondary/10 text-secondary border-secondary/20 font-medium">
              Next-Gen Student Portal
            </Badge>
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 text-foreground leading-[1.1]">
              Empowering Students Through <br />
              <motion.span 
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                className="text-primary italic inline-block"
              >
                Technology
              </motion.span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
              Experience the future of campus management. Access your grades, resources, and campus news in a sleek, integrated environment designed for the modern tech student.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 bg-primary text-white hover:bg-primary/90 rounded-full text-lg shadow-xl shadow-primary/25">
                  Get Started <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link href="/results">
                <Button size="lg" variant="outline" className="h-14 px-8 border-2 rounded-full text-lg hover:bg-muted/50">
                  Check Results
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  title: "Smart Resources",
                  desc: "Access notes, previous questions and digital libraries anytime, anywhere.",
                  icon: <BookOpen className="text-primary" size={32} />
                },
                {
                  title: "Real-time Tracking",
                  desc: "Monitor your academic progress with interactive charts and instant grade updates.",
                  icon: <GraduationCap className="text-secondary" size={32} />
                },
                {
                  title: "Urgent Alerts",
                  desc: "Stay informed with a dynamic notice board that prioritizes critical information.",
                  icon: <ShieldCheck className="text-primary" size={32} />
                }
              ].map((feature, i) => (
                <motion.div key={i} variants={item}>
                  <Card className="glass group hover:shadow-2xl transition-all duration-500 border-border/50 overflow-hidden h-full">
                    <CardContent className="p-8">
                      <div className="mb-6 p-4 w-fit bg-background rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-sm border border-border/50">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-headline font-bold mb-4">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-primary/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Students", value: "5,000+" },
              { label: "Resources", value: "10,000+" },
              { label: "Success Rate", value: "98%" },
              { label: "Faculty Members", value: "250+" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary" size={24} />
            <span className="font-headline font-bold text-foreground">TechXera Campus</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary">Contact Us</Link>
          </div>
          <p className="text-sm">© 2025 TechXera. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
