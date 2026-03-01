
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, Info, Megaphone, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'

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
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
}

export default function NoticesPage() {
  const db = useFirestore()
  const noticesQuery = useMemoFirebase(() => query(collection(db, 'notices'), orderBy('publishDate', 'desc')), [db])
  const { data: notices, isLoading } = useCollection(noticesQuery)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto w-full px-6 pt-40 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Notice Board</h1>
            <p className="text-muted-foreground text-lg font-medium">Stay updated with the latest campus news.</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-2xl border border-primary/5"
          >
            <Megaphone size={20} />
            <span className="font-bold text-sm">{notices?.length || 0} Announcements</span>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading updates...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {notices?.map((notice) => (
              <motion.div key={notice.id} variants={item}>
                <Card className={`shadow-sm border-none border-l-4 transition-all hover:translate-x-1 duration-300 rounded-2xl overflow-hidden ${notice.isUrgent ? 'border-l-destructive bg-destructive/[0.02]' : 'border-l-primary bg-white/50'}`}>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[9px] py-0.5 px-3 uppercase tracking-widest font-black ${notice.isUrgent ? 'bg-destructive text-white border-none' : 'bg-primary text-white border-none'}`}>
                          {notice.isUrgent ? 'Urgent' : 'Normal'}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} /> {notice.publishDate ? format(new Date(notice.publishDate), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-5">
                      <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-2xl items-center justify-center ${notice.isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {notice.isUrgent ? <AlertCircle size={24} /> : <Info size={24} />}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-headline font-bold tracking-tight">{notice.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap font-medium">{notice.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {notices?.length === 0 && (
              <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-[2.5rem] bg-white/30 backdrop-blur-sm">
                <Megaphone size={48} className="mx-auto opacity-10 mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">No active notices at the moment.</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
