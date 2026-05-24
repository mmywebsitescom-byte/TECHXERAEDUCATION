'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, X, Zap, ArrowRight, Medal } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'

export default function NavigationButtons() {
  const [mounted, setMounted] = useState(false)
  const [isRankingsOpen, setIsRankingsOpen] = useState(false)
  const [rankings, setRankings] = useState<any[]>([])
  const db = useFirestore()
  const { user } = useUser()
  const pathname = usePathname()

  const isHomePage = pathname === '/'
  const isChallengePage = pathname === '/challenges'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch challenge results for rankings
  const resultsRef = useMemoFirebase(
    () => (db ? query(collection(db, 'challengeResults'), orderBy('solvedAt', 'desc')) : null),
    [db]
  )
  const { data: resultsData } = useCollection(resultsRef)

  useEffect(() => {
    if (resultsData && Array.isArray(resultsData)) {
      const userMap = new Map<string, any>()
      resultsData.forEach((result: any) => {
        const key = result.userId
        if (!userMap.has(key)) {
          userMap.set(key, {
            id: result.userId,
            displayName: result.displayName || 'Anonymous',
            userEmail: result.userEmail,
            totalPoints: 0,
            challengesCompleted: 0,
          })
        }
        const student = userMap.get(key)!
        student.totalPoints += result.totalPoints || 0
        student.challengesCompleted += 1
      })
      const sorted = Array.from(userMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10)
      setRankings(sorted)
    }
  }, [resultsData])

  const maxPoints = rankings[0]?.totalPoints || 1
  const myRank = user ? rankings.findIndex(r => r.id === user.uid) + 1 : 0

  const medalColors = [
    { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-400/60', text: 'text-yellow-600 dark:text-yellow-400', badge: 'bg-yellow-400/20 text-yellow-700 dark:text-yellow-300', label: '🥇' },
    { bg: 'from-slate-300 to-slate-400', border: 'border-slate-300/60', text: 'text-slate-500 dark:text-slate-300', badge: 'bg-slate-200/40 text-slate-600 dark:text-slate-300', label: '🥈' },
    { bg: 'from-orange-400 to-orange-500', border: 'border-orange-400/60', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-400/20 text-orange-700 dark:text-orange-300', label: '🥉' },
  ]

  const RankingButton = ({ size }: { size: 'sm' | 'md' }) => (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      onClick={() => setIsRankingsOpen(!isRankingsOpen)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className={`rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-white shadow-lg flex items-center justify-center cursor-pointer font-bold relative ${
        size === 'sm' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
      }`}
      style={{ boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' }}
      title="View Rankings"
    >
      🏆
      {rankings.length > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow">
          {rankings.length}
        </span>
      )}
    </motion.button>
  )

  const ChallengeButton = ({ size }: { size: 'sm' | 'md' }) => (
    <Link href="/challenges" className="pointer-events-auto">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full bg-gradient-to-br from-secondary via-secondary to-orange-500 text-white shadow-lg flex items-center justify-center font-bold ${
          size === 'sm' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
        }`}
        style={{ boxShadow: '0 0 20px rgba(251, 146, 60, 0.5)' }}
        title="Start Challenge"
      >
        ⚡
      </motion.button>
    </Link>
  )

  const HomeButton = ({ size }: { size: 'sm' | 'md' }) => (
    <Link href="/" className="pointer-events-auto">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.2 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full bg-gradient-to-br from-primary via-primary to-emerald-600 text-white shadow-lg flex items-center justify-center font-bold ${
          size === 'sm' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
        }`}
        style={{ boxShadow: '0 0 20px rgba(48, 109, 41, 0.5)' }}
        title="Back to Home"
      >
        🏠
      </motion.button>
    </Link>
  )

  if (!mounted) {
    return null
  }

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (

    <div className="fixed inset-0 pointer-events-none z-[9999]">

      {/* ── Rankings Slide-in Panel ── */}
      <AnimatePresence>
        {isRankingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsRankingsOpen(false)}
              className="fixed inset-0 z-30 pointer-events-auto"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              className="fixed left-0 top-0 h-full z-40 pointer-events-auto flex"
            >
              <div className="w-[340px] h-full bg-white/95 dark:bg-[#111]/95 backdrop-blur-2xl border-r border-border/30 shadow-[8px_0_60px_-10px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="relative px-6 pt-8 pb-5 bg-gradient-to-br from-yellow-400/10 via-amber-300/5 to-transparent border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-headline font-black text-xl tracking-tight">Leaderboard</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {rankings.length} challengers ranked
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsRankingsOpen(false)}
                      className="w-8 h-8 rounded-xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* My Rank badge */}
                  {user && myRank > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between"
                    >
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Your Rank</span>
                      <span className="text-lg font-black text-primary">#{myRank}</span>
                    </motion.div>
                  )}
                </div>

                {/* Rankings List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin">
                  {rankings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-muted-foreground">No challengers yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Be the first to complete a challenge!</p>
                      </div>
                      <Link href="/challenges" className="pointer-events-auto" onClick={() => setIsRankingsOpen(false)}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30"
                        >
                          <Zap size={14} /> Start a Challenge
                        </motion.div>
                      </Link>
                    </div>
                  ) : (
                    rankings.map((student, idx) => {
                      const rank = idx + 1
                      const medal = medalColors[idx] || null
                      const isMe = user?.uid === student.id
                      const barWidth = Math.max(8, (student.totalPoints / maxPoints) * 100)

                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                          className={`relative rounded-2xl overflow-hidden border transition-all ${
                            isMe
                              ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/10'
                              : medal
                              ? `border-[1px] ${medal.border} bg-gradient-to-r from-white/80 to-white/40 dark:from-white/5 dark:to-transparent`
                              : 'border-border/30 bg-white/50 dark:bg-white/[0.03]'
                          }`}
                        >
                          {/* Progress bar background */}
                          <div
                            className={`absolute left-0 top-0 h-full opacity-10 ${medal ? `bg-gradient-to-r ${medal.bg}` : 'bg-primary'} transition-all duration-700`}
                            style={{ width: `${barWidth}%` }}
                          />

                          <div className="relative flex items-center gap-3 px-4 py-3">
                            {/* Rank badge */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              medal
                                ? `bg-gradient-to-br ${medal.bg} text-white shadow-sm`
                                : 'bg-muted/60 text-muted-foreground'
                            }`}>
                              {rank <= 3 ? medal?.label : `#${rank}`}
                            </div>

                            {/* Name & email */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : ''}`}>
                                {student.displayName}
                                {isMe && <span className="ml-2 text-[9px] font-black bg-primary/15 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wide">You</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">{student.userEmail}</p>
                            </div>

                            {/* Points & challenges */}
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-black ${medal ? medal.text : 'text-foreground'}`}>
                                {student.totalPoints.toLocaleString()}
                                <span className="text-[9px] font-bold text-muted-foreground ml-0.5">pts</span>
                              </p>
                              <p className="text-[9px] text-muted-foreground font-bold">
                                {student.challengesCompleted} solved
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Footer CTA */}
                <div className="px-4 py-4 border-t border-border/20 bg-muted/20">
                  <Link href="/rankings" onClick={() => setIsRankingsOpen(false)} className="pointer-events-auto block">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
                    >
                      <Medal size={16} /> View Full Rankings <ArrowRight size={14} />
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating Buttons ── */}
      {/* HOME PAGE */}
      {isHomePage && (
        <>
          <div className="fixed left-4 z-[9999] pointer-events-auto" style={{ top: 'calc(50% - 36px)' }}>
            <RankingButton size="md" />
          </div>
          <div className="fixed left-4 z-[9999] pointer-events-auto" style={{ top: 'calc(50% + 12px)' }}>
            <ChallengeButton size="md" />
          </div>
        </>
      )}

      {/* OTHER PAGES - Rankings, Challenges & Home */}
      {!isHomePage && (
        <>
          <div className="fixed left-4 z-[9999] pointer-events-auto" style={{ top: 'calc(50% - 60px)' }}>
            <RankingButton size={isChallengePage ? 'sm' : 'md'} />
          </div>
          <div className="fixed left-4 z-[9999] pointer-events-auto" style={{ top: 'calc(50% - 4px)' }}>
            <ChallengeButton size={isChallengePage ? 'sm' : 'md'} />
          </div>
          <div className="fixed left-4 z-[9999] pointer-events-auto" style={{ top: 'calc(50% + 52px)' }}>
            <HomeButton size={isChallengePage ? 'sm' : 'md'} />
          </div>
        </>
      )}
    </div>
  )
}
