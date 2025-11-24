import { useState, useRef, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ProgressBar } from 'primereact/progressbar'
import { Dialog } from 'primereact/dialog'
import './ReactionTestCDEK.css'

interface ReactionTestProps {
  onComplete: (result: any) => void
  toast: any
}

export function ReactionTest({ onComplete, toast }: ReactionTestProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [attempts, setAttempts] = useState<number[]>([])
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [showGo, setShowGo] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [tooEarly, setTooEarly] = useState(false)
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null)
  
  const maxAttempts = 5
  const timeoutRef = useRef<any>(null)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        
        if (isRunning) {
          handleReaction()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isRunning, isWaiting, showGo, startTime, attempts, currentAttempt])

  const startTest = () => {
    setIsRunning(true)
    setCurrentAttempt(0)
    setAttempts([])
    nextAttempt()
  }

  const nextAttempt = () => {
    setIsWaiting(true)
    setShowGo(false)
    setTooEarly(false)
    setCurrentReactionTime(null)
    
    const delay = Math.random() * 3000 + 2000
    
    timeoutRef.current = setTimeout(() => {
      setShowGo(true)
      setStartTime(Date.now())
      setIsWaiting(false)
    }, delay)
  }

  const handleReaction = () => {
    if (isWaiting) {
      clearTimeout(timeoutRef.current)
      setTooEarly(true)
      setIsWaiting(false)
      
      setTimeout(() => {
        nextAttempt()
      }, 2000)
    } else if (showGo) {
      const reactionTime = Date.now() - startTime
      const newAttempts = [...attempts, reactionTime]
      setAttempts(newAttempts)
      setShowGo(false)
      setCurrentReactionTime(reactionTime)
      
      if (newAttempts.length < maxAttempts) {
        setCurrentAttempt(currentAttempt + 1)
        setTimeout(() => {
          nextAttempt()
        }, 1500)
      } else {
        setTimeout(() => {
          finishTest(newAttempts)
        }, 1000)
      }
    }
  }

  const handleClick = () => {
    handleReaction()
  }

  const calculateStatistics = (times: number[]) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
    const stdDev = Math.sqrt(variance)
    const stability = 100 - (stdDev / avg * 100)
    
    const firstHalf = times.slice(0, Math.floor(times.length / 2))
    const secondHalf = times.slice(Math.floor(times.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    const fatigueTrend = ((secondAvg - firstAvg) / firstAvg) * 100
    
    let cognitiveIndex = 100
    if (avg > 250) cognitiveIndex -= (avg - 250) * 0.1
    if (avg > 350) cognitiveIndex -= (avg - 350) * 0.2
    cognitiveIndex = Math.max(0, Math.min(100, cognitiveIndex))
    
    return {
      times,
      avgTime: Math.round(avg),
      minTime: min,
      maxTime: max,
      stability: Math.round(stability),
      fatigueTrend: Math.round(fatigueTrend),
      cognitiveIndex: Math.round(cognitiveIndex)
    }
  }

  const finishTest = (finalAttempts: number[]) => {
    setIsRunning(false)
    const stats = calculateStatistics(finalAttempts)
    
    localStorage.setItem('lastReactionResult', JSON.stringify(stats))
    
    toast.current?.show({
      severity: 'success',
      summary: 'Тест завершен',
      detail: `Средняя реакция: ${stats.avgTime} мс`,
      life: 3000
    })
    
    setShowResults(true)
    onComplete(stats)
  }

  const stats = attempts.length > 0 ? calculateStatistics(attempts) : null
  const progress = ((currentAttempt) / maxAttempts) * 100

  const displayValueTemplate = (value: number) => {
    return <>{`${Math.round(value)}%`}</>
  }

  return (
    <div className="cdek-reaction-test">
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px' }}>Тест на скорость реакции</h2>
        
        {isRunning && (
          <>
            <ProgressBar 
              value={progress}
              displayValueTemplate={displayValueTemplate}
              style={{ height: '20px', marginBottom: '20px' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <small>Попытка {currentAttempt + 1} из {maxAttempts}</small>
            </div>
          </>
        )}

        {!isRunning ? (
          <div className="cdek-start-screen">
            <div className="cdek-instruction-card">
              <div className="cdek-instruction-step">
                <span className="cdek-step-number">1</span>
                <span className="cdek-step-text">Нажмите "Начать тест"</span>
              </div>
              <div className="cdek-instruction-step">
                <span className="cdek-step-number">2</span>
                <span className="cdek-step-text">Дождитесь зеленого экрана</span>
              </div>
              <div className="cdek-instruction-step">
                <span className="cdek-step-number">3</span>
                <span className="cdek-step-text">Кликните как можно быстрее</span>
              </div>
              <div className="cdek-instruction-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.87 0 2.81-2.27 1.48-3.58L13.48 4.81c-1.33-1.31-3.63-1.31-4.96 0L1.59 15.42C.26 16.73 1.2 19 3.07 19z" 
                        stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Не нажимайте раньше времени</span>
              </div>
            </div>

            <Button 
              label="Начать тест"
              icon="pi pi-play"
              severity="secondary"
              onClick={startTest}
            />
          </div>
        ) : (
          <div className="cdek-test-screen">
            {attempts.length > 0 && (
              <div className="cdek-attempts-row">
                {attempts.map((time, idx) => (
                  <div key={idx} className="cdek-attempt-badge">
                    {time} мс
                  </div>
                ))}
              </div>
            )}

            <div 
              className={`cdek-click-area ${
                isWaiting ? 'waiting' : 
                showGo ? 'active' : 
                tooEarly ? 'error' : 
                currentReactionTime ? 'result' : ''
              }`}
              onClick={handleClick}
              tabIndex={0}
            >
              <div className="cdek-state-content">
                {isWaiting && (
                  <>
                    <div className="cdek-waiting-indicator">
                      <div className="cdek-dot"></div>
                      <div className="cdek-dot"></div>
                      <div className="cdek-dot"></div>
                    </div>
                    <h3>Ожидайте...</h3>
                    <p>Приготовьтесь нажать</p>
                  </>
                )}

                {showGo && (
                  <>
                    <div className="cdek-go-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white"/>
                      </svg>
                    </div>
                    <h3>КЛИК!</h3>
                  </>
                )}

                {tooEarly && (
                  <>
                    <div className="cdek-error-icon">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3>Слишком рано!</h3>
                    <p>Дождитесь зеленого сигнала</p>
                  </>
                )}

                {currentReactionTime && !isWaiting && !showGo && !tooEarly && (
                  <div className="cdek-reaction-result">
                    <span className="cdek-reaction-value">{currentReactionTime}</span>
                    <span className="cdek-reaction-unit">мс</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        visible={showResults}
        onHide={() => setShowResults(false)}
        header="Результаты теста"
        modal
        style={{ width: '90vw', maxWidth: '500px' }}
      >
        {stats && (
          <div className="cdek-results">
            <div className="cdek-result-main">
              <div className="cdek-result-circle">
                <span className="cdek-result-number">{stats.avgTime}</span>
                <span className="cdek-result-label">мс</span>
              </div>
              <p className="cdek-result-subtitle">Средняя скорость реакции</p>
            </div>

            <div className="cdek-stats-grid">
              <div className="cdek-stat">
                <span className="cdek-stat-label">Минимум</span>
                <span className="cdek-stat-value">{stats.minTime} мс</span>
              </div>
              <div className="cdek-stat">
                <span className="cdek-stat-label">Максимум</span>
                <span className="cdek-stat-value">{stats.maxTime} мс</span>
              </div>
              <div className="cdek-stat">
                <span className="cdek-stat-label">Стабильность</span>
                <span className="cdek-stat-value">{stats.stability}%</span>
              </div>
              <div className="cdek-stat">
                <span className="cdek-stat-label">Индекс</span>
                <span className="cdek-stat-value">{stats.cognitiveIndex}/100</span>
              </div>
            </div>

            {stats.fatigueTrend > 10 && (
              <div className="cdek-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4m0 4h.01" stroke="#FFB800" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5.07 19h13.86c1.87 0 2.81-2.27 1.48-3.58L13.48 4.81c-1.33-1.31-3.63-1.31-4.96 0L1.59 15.42C.26 16.73 1.2 19 3.07 19z" 
                        stroke="#FFB800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Обнаружено замедление реакции на {stats.fatigueTrend}%</span>
              </div>
            )}

            <Button 
              label="Продолжить"
              icon="pi pi-check"
              severity="secondary"
              style={{ width: '100%' }}
              onClick={() => setShowResults(false)}
            />
          </div>
        )}
      </Dialog>
    </div>
  )
}