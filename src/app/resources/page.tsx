
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText, Loader2, Cpu, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import LogoLoop, { type LogoItem } from '@/components/LogoLoop'

// Custom SVGs for Tech Stack Icons to match the screenshot style
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

const TailwindIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
    <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7zm-6 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8 1.1.2 1.9.9 2.8 1.8.7.7 1.6 1.6 3.4 1.6 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.1-1.7-.8-2.6-1.7-.8-.7-1.7-1.7-3.6-1.7z" />
  </svg>
)

const TypeScriptIcon = () => (
  <svg width="48" height="48" viewBox="0 0 128 128" fill="white">
    <path d="M1.5 1.5h125v125H1.5V1.5zm101.4 100.3c0-2.4-.3-4.5-1-6.5-.7-2-1.7-3.6-3-5-1.3-1.4-2.8-2.4-4.6-3.1-1.8-.7-3.8-1.1-6-1.1-2.7 0-5.1.5-7.1 1.6-2 1.1-3.6 2.6-4.9 4.6l9.6 5.9c.7-1 1.4-1.8 2.2-2.3 1-.5 1.8-.8 2.8-.8s1.6.2 2.2.6.9.9.9 1.6c0 .7-.3 1.2-.8 1.6-.5.4-1.2.7-2.2 1.1-1.3.5-2.7 1.1-4.2 1.8s-2.9 1.6-4.2 2.6c-1.3 1-2.4 2.2-3.3 3.7s-1.3 3.3-1.3 5.3c0 2.6.5 4.8 1.5 6.7s2.4 3.5 4.3 4.7 4 2.1 6.6 2.6 5.3.8 8.1.8c3 0 5.8-.4 8.5-1.2s4.9-2.1 6.9-3.8c1.9-1.7 3.4-3.8 4.5-6.4s1.6-5.7 1.6-9.1zm-60.6-20.4H28v11h11.4v40.6h12.3v-40.6H63v-11h-20.7z"/>
  </svg>
)

const techStackLogos: LogoItem[] = [
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><VercelIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><GithubIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><TypeScriptIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><div className="text-4xl font-bold font-code text-white">JS</div></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><NextJsIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><ReactIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><TailwindIcon /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><Cpu size={48} className="text-white" /></div> },
  { node: <div className="p-4 opacity-70 hover:opacity-100 transition-opacity"><Zap size={48} className="text-white" /></div> },
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
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-32 pt-40 pb-20">
        {/* Technologies I Use Section - EXACT MATCH */}
        <section className="text-center space-y-10 relative overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-5xl md:text-6xl font-headline font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[#4CA9FF] to-[#A056FF] bg-clip-text text-transparent">
                Technologies I Use
              </span>
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-1 bg-gradient-to-r from-[#4CA9FF] to-[#A056FF] rounded-full"></div>
            </div>
            <p className="text-[#888] text-lg font-medium max-w-2xl mx-auto leading-relaxed">
              I leverage a modern tech stack to build high-quality web applications.
            </p>
          </motion.div>

          <div className="relative pt-12 pb-16 flex flex-col items-center">
            <div className="w-full relative z-10">
              <LogoLoop 
                logos={techStackLogos} 
                speed={40} 
                logoHeight={48} 
                gap={80} 
                fadeOut={true} 
                fadeOutColor="#000000"
                scaleOnHover={true}
              />
            </div>
            
            {/* Center Pulsing Purple Orb */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
              <motion.div 
                animate={{ 
                  boxShadow: [
                    "0 0 10px 2px rgba(160, 86, 255, 0.4)",
                    "0 0 25px 6px rgba(160, 86, 255, 0.7)",
                    "0 0 10px 2px rgba(160, 86, 255, 0.4)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-10 h-10 rounded-full bg-black border-[3px] border-[#A056FF]/50 flex items-center justify-center"
              >
                <div className="w-4 h-4 rounded-full bg-[#A056FF]/80 blur-[2px]"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Study Materials Content */}
        <section className="space-y-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-headline font-bold text-white/90">Campus Repository</h2>
            <p className="text-[#888] text-lg max-w-2xl">
              Access the technical library for TechXera students.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center bg-white/[0.05] p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input 
                placeholder="Search resources..." 
                className="w-full pl-14 h-14 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 text-lg outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-14 px-10 bg-white text-black hover:bg-white/90 rounded-2xl font-bold transition-transform active:scale-95">
              Search Library
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="animate-spin text-white/20 mx-auto" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-all duration-500 rounded-[2.5rem] overflow-hidden group">
                      <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="p-4 bg-white/5 text-white/40 rounded-2xl group-hover:text-white group-hover:bg-primary/20 transition-all">
                            <FileText size={32} />
                          </div>
                          <Badge className="bg-white/10 text-white/60 border-none uppercase text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full">
                            {item.semester}
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-headline font-bold mb-4 text-white/90 group-hover:text-white transition-colors">{item.title}</h3>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-10">{item.subject}</p>
                        <div className="flex items-center justify-between pt-8 border-t border-white/10">
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{item.materialType}</span>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" className="text-white hover:bg-white/10 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                              Get <Download size={16} />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-20 text-white/20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p>No repository matches found.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
