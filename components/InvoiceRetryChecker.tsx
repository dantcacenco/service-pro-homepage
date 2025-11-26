// Component to automatically retry failed Bill.com invoice sends
// Triggers when dashboard loads, similar to MaintenanceChecker
// Checks database for pending retries and processes them silently

'use client'

import { useEffect, useState } from 'react'

export function InvoiceRetryChecker() {
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  useEffect(() => {
    // Check for pending retries on component mount
    checkAndRetry()

    // Also check every 5 minutes while page is open
    const interval = setInterval(() => {
      checkAndRetry()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  async function checkAndRetry() {
    // Prevent multiple simultaneous checks
    if (checking) return

    setChecking(true)
    
    try {
      const response = await fetch('/api/billcom/retry-send-invoice', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLastCheck(new Date())
        
        // Log if any retries were processed
        if (data.processed > 0) {
          console.log(`✅ Processed ${data.processed} invoice retry attempt(s)`)
        }
      }
    } catch (error) {
      console.error('Error checking invoice retries:', error)
    } finally {
      setChecking(false)
    }
  }

  // This component doesn't render anything visible
  // It works silently in the background
  return null
}
