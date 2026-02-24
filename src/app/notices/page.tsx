
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
      staggerChildren: 0.15
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

export default function NoticesPage() {
  const db = useFirestore()
  const noticesQuery = useMemoFirebase(() => query(collection(db, 'notices'), orderBy('publishDate', 'desc')), [db])
  const { data: notices, isLoading } = useCollection(noticesQuery)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold">Notice Board</h1>
            <p className="text-muted-foreground text-lg">Stay updated with the latest campus news and announcements.</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-2xl"
          >
            <Megaphone size={20} />
            <span className="font-bold text-sm">{notices?.length || 0} Announcements</span>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted-foreground font-medium">Loading notices...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {notices?.map((notice) => (
              <motion.div key={notice.id} variants={item}>
                <Card className={`shadow-sm border-l-4 transition-all hover:translate-x-2 duration-300 ${notice.isUrgent ? 'border-l-destructive border-border/50 bg-destructive/[0.02]' : 'border-l-primary border-border/50'}`}>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={notice.isUrgent ? 'bg-destructive text-white border-none' : 'bg-primary text-white border-none'}>
                          {notice.isUrgent ? 'Urgent' : 'Normal'}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={12} /> {notice.publishDate ? format(new Date(notice.publishDate), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-full items-center justify-center ${notice.isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {notice.isUrgent ? <AlertCircle size={24} /> : <Info size={24} />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-headline font-bold mb-3">{notice.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{notice.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {notices?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
                No active notices at the moment.
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
