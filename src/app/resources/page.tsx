
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText, Loader2, Cpu, Globe, Shield, Zap, Cloud, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import LogoLoop, { type LogoItem } from '@/components/LogoLoop'

// Custom SVGs for Tech Stack Icons
const NextJsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 128 128" fill="currentColor">
    <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64c11.2 0 21.7-2.9 30.8-7.9L48.4 55.4v33.3h-9.2V40.1h9.2l40.3 52.3c6.1-7.7 9.7-17.4 9.7-28.4 0-24.8-20.2-45-45-45-2 0-3.9.1-5.8.4L84.8 35.8c2.9-.5 5.8-.8 8.9-.8 19.8 0 35.8 16 35.8 35.8 0 8.8-3.2 16.8-8.5 23l-3.3-2.6c4.2-5.4 6.8-12.2 6.8-19.6 0-17.1-13.9-31-31-31-1.4 0-2.8.1-4.2.3L44.8 35c2.4-.6 4.9-.9 7.5-.9 19.8 0 35.8 16 35.8 35.8 0 7.3-2.2 14.1-6 19.8l-1.4-1.8c3.1-4.9 4.9-10.7 4.9-16.9 0-17.1-13.9-31-31-31-1.3 0-2.5.1-3.7.2l41.5 53.9c13.7-10.3 22.7-26.6 22.7-45 0-35.3-28.7-64-64-64z"/>
  </svg>
)

const techStackLogos: LogoItem[] = [
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><Cpu size={32} /></div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><Zap size={32} /></div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><GithubIcon /></div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity text-xl font-bold font-code">TS</div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity text-xl font-bold font-code">JS</div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><NextJsIcon /></div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><ReactIcon /></div> },
  { node: <div className="p-2 opacity-60 hover:opacity-100 transition-opacity"><TailwindIcon /></div> },
]

function GithubIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
}

function ReactIcon() {
  return <svg width="32" height="32" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor"><circle cx="0" cy="0" r="2.05" fill="currentColor"/><g fill="none" stroke="currentColor" strokeWidth="1"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>
}

function TailwindIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7zm-6 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7z"/></svg>
}

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
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-24 pt-32">
        {/* Technologies I Use Section */}
        <section className="text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent inline-block">
              Technologies I Use
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full mt-2"></div>
            <p className="text-muted-foreground/60 text-lg font-medium max-w-2xl mx-auto">
              I leverage a modern tech stack to build high-quality web applications.
            </p>
          </motion.div>

          <div className="relative py-12">
            {/* Logo Loop */}
            <LogoLoop 
              logos={techStackLogos} 
              speed={40} 
              logoHeight={40} 
              gap={60} 
              fadeOut={true} 
              fadeOutColor="#050505"
              scaleOnHover={true}
              className="py-4"
            />
            
            {/* Glowing Orb Indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-4 rounded-full bg-purple-500 blur-sm shadow-[0_0_20px_rgba(168,85,247,0.8)] border border-white/20"></div>
          </div>
        </section>

        {/* Existing Resource Content */}
        <section className="space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Badge className="bg-primary/20 text-primary border-none font-bold uppercase tracking-widest px-4 py-1">
              Academic Repository
            </Badge>
            <h1 className="text-5xl font-headline font-bold tracking-tighter text-white">Study Resources</h1>
            <p className="text-muted-foreground/80 text-xl font-medium max-w-2xl">
              Access an elite collection of lecture notes, past examinations, and technical guides.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-6 items-center bg-white/5 p-6 rounded-[2.5rem] shadow-sm border border-white/10 backdrop-blur-md"
          >
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
              <input 
                placeholder="Search resources..." 
                className="w-full pl-16 h-16 bg-white/5 border-none shadow-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary text-lg font-medium text-white outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="outline" className="h-16 px-10 rounded-2xl flex items-center gap-3 font-bold border-white/10 hover:bg-white/5 text-white">
                <Filter size={20} /> Filter
              </Button>
              <Button className="h-16 px-10 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 text-lg font-bold">
                Search
              </Button>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center gap-6">
              <div className="p-8 bg-white/5 rounded-full shadow-inner">
                <Loader2 className="animate-spin text-primary" size={48} />
              </div>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Syncing Repository...</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-md border-white/10 group hover:bg-white/10 transition-all duration-500 rounded-[3rem] overflow-hidden h-full shadow-lg">
                      <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="p-5 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <FileText size={32} />
                          </div>
                          <Badge variant="secondary" className="bg-white/10 text-white/60 border-none uppercase tracking-widest text-[10px] font-black px-4 py-1">
                            {item.semester}
                          </Badge>
                        </div>
                        <h3 className="text-3xl font-headline font-bold mb-4 tracking-tight group-hover:text-primary transition-colors leading-[1.1] text-white">{item.title}</h3>
                        <p className="text-muted-foreground/80 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {item.subject}
                        </p>
                        <div className="flex items-center justify-between pt-8 border-t border-white/10">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.materialType}</span>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 flex items-center gap-3 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-all">
                              Download <Download size={18} />
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
        </section>
      </main>
    </div>
  )
}
