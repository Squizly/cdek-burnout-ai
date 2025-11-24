import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { RadioButton } from 'primereact/radiobutton'
import { ProgressBar } from 'primereact/progressbar'
import { maslachQuestions, answerOptions } from '../data/maslachTest'

interface MaslachTestProps {
  onComplete: () => void
  toast: any
}

export function MaslachTest({ onComplete, toast }: MaslachTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  
  const [progressBarValue, setProgressBarValue] = useState(0);
  
  const interval = useRef<NodeJS.Timeout | null>(null);

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [maslachQuestions[currentQuestion].id]: value })
  }

  const calculateResults = useCallback(() => {
    let exhaustion = 0
    let depersonalization = 0
    let achievement = 0

    Object.entries(answers).forEach(([questionId, value]) => {
      const question = maslachQuestions.find(q => q.id === parseInt(questionId))
      if (question) {
        switch(question.category) {
          case 'exhaustion':
            exhaustion += value
            break
          case 'depersonalization':
            depersonalization += value
            break
          case 'achievement':
            achievement += (6 - value)
            break
        }
      }
    })

    let burnoutLevel = parseFloat(Math.sqrt(((exhaustion / 54) ** 2 + (depersonalization / 30) ** 2 + (1 - (achievement / 48)) ** 2) / 3).toFixed(4));

    const result = {
      exhaustion,
      depersonalization,
      achievement,
      burnoutLevel,
      date: new Date()
    }

    localStorage.setItem('lastMaslachResult', JSON.stringify(result))

    toast.current?.show({
      severity: 'success',
      summary: 'Анализ завершён',
      detail: 'Результаты сохранены. Переход к тесту на реакцию.',
      life: 2500
    })

    onComplete()
  }, [answers, onComplete, toast]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < maslachQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setCurrentQuestion(maslachQuestions.length); 
      setTimeout(() => {
        calculateResults()
      }, 400);
    }
  }, [currentQuestion, calculateResults]);

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }
  
  useEffect(() => {
    if (interval.current) {
      clearInterval(interval.current);
    }
    const targetProgress = (currentQuestion / maslachQuestions.length) * 100;
    interval.current = setInterval(() => {
      setProgressBarValue((prevValue) => {
        if (prevValue < targetProgress) {
          const newValue = prevValue + 2;
          if (newValue >= targetProgress) {
            if (interval.current) clearInterval(interval.current);
            return targetProgress;
          }
          return newValue;
        }
        else if (prevValue > targetProgress) {
          const newValue = prevValue - 2;
          if (newValue <= targetProgress) {
            if (interval.current) clearInterval(interval.current);
            return targetProgress;
          }
          return newValue;
        }
        else {
          if (interval.current) clearInterval(interval.current);
          return prevValue;
        }
      });
    }, 20);
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [currentQuestion]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        const isNextEnabled = answers[maslachQuestions[currentQuestion]?.id] !== undefined;
        if (isNextEnabled) {
          nextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestion, answers, nextQuestion]);

  const displayValueTemplate = (value: number) => {
    return <>{`${Math.round(value)}%`}</>;
  }

  return (
    <div className="maslach-test">
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px' }}>Анализ рабочего состояния</h2>
        <ProgressBar 
          value={progressBarValue}
          displayValueTemplate={displayValueTemplate} 
          style={{ height: '20px', marginBottom: '20px' }} 
        />
        
        {currentQuestion < maslachQuestions.length && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <small>Вопрос {currentQuestion + 1} из {maslachQuestions.length}</small>
            </div>
            <div className="question-section">
              <h3>{maslachQuestions[currentQuestion].text}</h3>
              <div style={{ marginTop: '30px' }}>
                {answerOptions.map((option) => (
                  <div 
                    key={option.value} 
                    className="answer-option" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleAnswer(option.value)}
                  >
                    <RadioButton
                      inputId={`answer-${option.value}`}
                      value={option.value}
                      onChange={(e) => handleAnswer(e.value)}
                      checked={answers[maslachQuestions[currentQuestion].id] === option.value}
                    />
                    <label 
                      htmlFor={`answer-${option.value}`}
                      style={{ 
                        flex: 1, 
                        marginLeft: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="test-navigation" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
          <Button
            label="Назад"
            icon="pi pi-arrow-left"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            severity="secondary"
          />
          <Button
            label={currentQuestion === maslachQuestions.length - 1 ? 'Завершить' : 'Далее'}
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={nextQuestion}
            disabled={answers[maslachQuestions[currentQuestion]?.id] === undefined || currentQuestion >= maslachQuestions.length}
            severity="secondary" 
          />
        </div>
      </Card>
    </div>
  )
}