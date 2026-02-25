
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText, Loader2, Cpu, Zap, Globe, Shield, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import LogoLoop, { type LogoItem } from '@/components/LogoLoop'

// Custom SVGs for Tech Stack Icons
const NextJsIcon = () => (
  <svg width="48" height="48" viewBox="0 0 128 128" fill="currentColor">
    <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c11.2 0 21.7-2.9 30.8-7.9L48.4 55.4v33.3h-9.2V40.1h9.2l40.3 52.3c6.1-7.7 9.7-17.4 9.7-28.4 0-24.8-20.2-45-45-45-2 0-3.9.1-5.8.4L84.8 35.8c2.9-.5 5.8-.8 8.9-.8 19.8 0 35.8 16 35.8 35.8 0 8.8-3.2 16.8-8.5 23l-3.3-2.6c4.2-5.4 6.8-12.2 6.8-19.6 0-17.1-13.9-31-31-31-1.4 0-2.8.1-4.2.3L44.8 35c2.4-.6 4.9-.9 7.5-.9 19.8 0 35.8 16 35.8 35.8 0 7.3-2.2 14.1-6 19.8l-1.4-1.8c3.1-4.9 4.9-10.7 4.9-16.9 0-17.1-13.9-31-31-31-1.3 0-2.5.1-3.7.2l41.5 53.9c13.7-10.3 22.7-26.6 22.7-45 0-35.3-28.7-64-64-64z"/>
  </svg>
)

const GithubIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const ReactIcon = () => (
  <svg width="48" height="48" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
)

const TailwindIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7zm-6 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7z" />
  </svg>
)

const techStackLogos: LogoItem[] = [
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><Cpu size={48} /></div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><Zap size={48} /></div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><GithubIcon /></div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300 text-3xl font-bold font-code">TS</div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300 text-3xl font-bold font-code">JS</div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><NextJsIcon /></div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><ReactIcon /></div> },
  { node: <div className="p-4 text-white hover:text-primary transition-all duration-300"><TailwindIcon /></div> },
]

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const db = useFirestore()
  const resourcesQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  const { data: resources, isLoading } = useCollection(resourcesQuery)

  const filtered = resources?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-32 pt-32 pb-20">
        {/* Technologies I Use Section */}
        <section className="text-center space-y-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-7xl font-headline font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent inline-block">
              Technologies I Use
            </h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 mx-auto rounded-full mt-4"></div>
            <p className="text-muted-foreground/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              I leverage a cutting-edge tech stack to architect high-performance digital solutions.
            </p>
          </motion.div>

          <div className="relative py-20 flex flex-col items-center">
            {/* Logo Loop - Increased speed and gap for better visibility */}
            <div className="w-full relative z-10">
              <LogoLoop 
                logos={techStackLogos} 
                speed={50} 
                logoHeight={60} 
                gap={100} 
                fadeOut={true} 
                fadeOutColor="#050505"
                scaleOnHover={true}
                className="py-10"
              />
            </div>
            
            {/* Glowing Orb Indicator - Larger and more prominent */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-10">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                  boxShadow: [
                    "0 0 20px rgba(168,85,247,0.5)",
                    "0 0 50px rgba(168,85,247,0.9)",
                    "0 0 20px rgba(168,85,247,0.5)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-purple-500 blur-sm border border-white/30"
              />
            </div>
          </div>
        </section>

        {/* Study Materials Content */}
        <section className="space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-6 py-2 rounded-full">
              Academic Repository
            </Badge>
            <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter text-white">Study Resources</h1>
            <p className="text-muted-foreground/70 text-xl font-medium max-w-2xl">
              Access an elite collection of lecture notes, past examinations, and technical guides designed for excellence.
            </p>
          </motion.div>

          {/* Filters - Matching the premium grid style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-8 items-center bg-white/[0.03] p-8 rounded-[3rem] shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={28} />
              <input 
                placeholder="Search resources..." 
                className="w-full pl-20 h-20 bg-white/[0.05] border-none shadow-none rounded-[2rem] focus-visible:ring-2 focus-visible:ring-primary text-xl font-medium text-white outline-none placeholder:text-muted-foreground/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="outline" className="h-20 px-12 rounded-[2rem] flex items-center gap-4 font-bold border-white/10 hover:bg-white/10 text-white text-lg">
                <Filter size={24} /> Filter
              </Button>
              <Button className="h-20 px-12 bg-primary hover:bg-primary/90 rounded-[2rem] shadow-2xl shadow-primary/30 text-xl font-bold">
                Search
              </Button>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-40 flex flex-col items-center gap-8">
              <div className="p-12 bg-white/[0.05] rounded-full shadow-inner animate-pulse">
                <Loader2 className="animate-spin text-primary" size={64} />
              </div>
              <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-sm">Syncing Repository...</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Card className="bg-white/[0.03] backdrop-blur-xl border-white/10 group hover:bg-white/[0.08] transition-all duration-700 rounded-[3.5rem] overflow-hidden h-full shadow-2xl hover:translate-y-[-10px]">
                      <CardContent className="p-12">
                        <div className="flex justify-between items-start mb-10">
                          <div className="p-6 bg-primary/10 text-primary rounded-3xl group-hover:bg-primary group-hover:text-white transition-all duration-700 transform group-hover:rotate-6">
                            <FileText size={40} />
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-white/50 border-none uppercase tracking-widest text-[11px] font-black px-5 py-2 rounded-full">
                            {item.semester}
                          </Badge>
                        </div>
                        <h3 className="text-3xl font-headline font-bold mb-6 tracking-tight group-hover:text-primary transition-colors leading-tight text-white">{item.title}</h3>
                        <p className="text-muted-foreground/60 font-bold uppercase tracking-widest text-xs flex items-center gap-3 mb-10">
                          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(125,107,219,0.8)]"></span>
                          {item.subject}
                        </p>
                        <div className="flex items-center justify-between pt-10 border-t border-white/10">
                          <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{item.materialType}</span>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 flex items-center gap-4 font-black text-sm uppercase tracking-widest group-hover:translate-x-3 transition-all">
                              Download <Download size={20} />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-40 text-muted-foreground border-2 border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]">
              <div className="flex flex-col items-center gap-6">
                <Search size={48} className="opacity-20" />
                <p className="text-xl font-medium">No matches found in the repository.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
