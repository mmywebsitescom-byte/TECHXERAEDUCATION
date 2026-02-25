
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText, BookOpen, Loader2, Cpu, Globe, Shield, Zap, Cloud, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import LogoLoop, { type LogoItem } from '@/components/LogoLoop'

const partnerLogos: LogoItem[] = [
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Cpu size={32} /> INTEL CORE</div> },
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Globe size={32} /> GOOGLE CLOUD</div> },
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Shield size={32} /> MICROSOFT</div> },
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Zap size={32} /> AWS ENGINE</div> },
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Cloud size={32} /> AZURE CORE</div> },
  { node: <div className="flex items-center gap-3 font-headline font-bold text-primary/40 group-hover:text-primary transition-colors"><Database size={32} /> ORACLE DB</div> },
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
    <div className="min-h-screen bg-[#F5F5FA]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pt-28">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest px-4 py-1">
            Academic Repository
          </Badge>
          <h1 className="text-6xl font-headline font-bold tracking-tighter">Study Resources</h1>
          <p className="text-muted-foreground/80 text-xl font-medium max-w-2xl">
            Access an elite collection of lecture notes, past examinations, and technical guides curated for excellence.
          </p>
        </motion.div>

        {/* Dynamic Partner Loop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-10 border-y border-primary/5 bg-white/30 backdrop-blur-sm rounded-[3rem] overflow-hidden"
        >
          <div className="px-10 mb-6 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Powered by the Tech Ecosystem</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            </div>
          </div>
          <LogoLoop 
            logos={partnerLogos} 
            speed={60} 
            logoHeight={32} 
            gap={64} 
            fadeOut={true} 
            fadeOutColor="#F5F5FA"
            scaleOnHover={true}
          />
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-white"
        >
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={24} />
            <Input 
              placeholder="Search by title, subject or category..." 
              className="pl-16 h-16 bg-[#F5F5FA] border-none shadow-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button variant="outline" className="h-16 px-10 rounded-2xl flex items-center gap-3 font-bold border-2 hover:bg-white/50">
              <Filter size={20} /> Filter
            </Button>
            <Button className="h-16 px-10 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 text-lg font-bold">
              Search Portal
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-6">
            <div className="p-8 bg-white rounded-full shadow-inner">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Syncing with Repository...</p>
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
                  <Card className="glass group hover:bg-white transition-all duration-500 border-none rounded-[3rem] overflow-hidden h-full shadow-lg hover:shadow-2xl">
                    <CardContent className="p-0">
                      <div className="p-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="p-5 bg-primary/5 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:scale-110">
                            <FileText size={32} />
                          </div>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground border-none uppercase tracking-widest text-[10px] font-black px-4 py-1">
                            {item.semester}
                          </Badge>
                        </div>
                        <h3 className="text-3xl font-headline font-bold mb-4 tracking-tight group-hover:text-primary transition-colors leading-[1.1]">{item.title}</h3>
                        <p className="text-muted-foreground/80 font-bold uppercase tracking-wider text-xs flex items-center gap-2 mb-8">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {item.subject}
                        </p>
                        <div className="flex items-center justify-between pt-8 border-t border-black/5">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{item.materialType}</span>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 flex items-center gap-3 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-all">
                              Download <Download size={18} />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filtered.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-primary/10"
          >
            <div className="p-10 bg-muted/20 w-fit mx-auto rounded-full mb-6">
              <Search size={48} className="text-muted-foreground/30" />
            </div>
            <p className="text-2xl font-headline font-bold text-muted-foreground/60">No matching resources found.</p>
            <p className="text-muted-foreground text-sm font-medium mt-2">Try adjusting your search terms or filters.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
