// DiagnosisFlow.tsx

import { useState, useRef, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MaslachTest } from './MaslachTest';
import { ReactionTest } from './ReactionTest';

interface DiagnosisFlowProps {
  userId: number;
  onComplete: () => void;
}

// Хелпер для определения тега уровня выгорания по числовому значению
const getBurnoutLevelTag = (level: number) => {
  if (level < 0.35) {
    return { value: 'Низкий', severity: 'success' as const };
  }
  if (level < 0.65) {
    return { value: 'Средний', severity: 'warning' as const };
  }
  return { value: 'Высокий', severity: 'danger' as const };
};

export function DiagnosisFlow({ userId, onComplete }: DiagnosisFlowProps) {
  const [step, setStep] = useState<'maslach' | 'reaction' | 'results'>('maslach');
  const toast = useRef<Toast>(null);
  
  const [maslachResult, setMaslachResult] = useState<any>(null);
  const [reactionResult, setReactionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Новое состояние для хранения рекомендаций от LLM
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const handleMaslachComplete = () => {
    setStep('reaction');
  };

  const handleReactionComplete = () => {
    setStep('results');
  };
  
  useEffect(() => {
    if (step === 'results' && !hasSubmitted && userId) {
      
      // 1. Немедленно загружаем данные из localStorage для отображения
      const maslachRaw = localStorage.getItem('lastMaslachResult');
      const reactionRaw = localStorage.getItem('lastReactionResult');
      
      if (maslachRaw) setMaslachResult(JSON.parse(maslachRaw));
      if (reactionRaw) setReactionResult(JSON.parse(reactionRaw));
      
      setHasSubmitted(true); // Отмечаем, что процесс запущен

      // 2. Асинхронно отправляем данные на сервер в фоновом режиме
      const submitData = async () => {
        if (!maslachRaw || !reactionRaw) {
          console.error("Нет данных для отправки.");
          return;
        }

        setIsSubmitting(true);
        toast.current?.show({
          severity: 'info',
          summary: 'Синхронизация...',
          detail: 'Сохраняем ваши результаты и генерируем рекомендации.',
          life: 3000
        });

        try {
          const parsedMaslach = JSON.parse(maslachRaw);
          const parsedReaction = JSON.parse(reactionRaw);
          
          const payload = {
            maslach_result: {
              exhaustion: parsedMaslach.exhaustion,
              depersonalization: parsedMaslach.depersonalization,
              achievement: parsedMaslach.achievement,
              burnoutLevel: parsedMaslach.burnoutLevel,
            },
            reaction_result: {
              times: parsedReaction.times || [],
              avgTime: parsedReaction.avgTime || 0,
              minTime: parsedReaction.minTime || 0,
              maxTime: parsedReaction.maxTime || 0,
              stability: parsedReaction.stability || 0,
              fatigueTrend: parsedReaction.fatigueTrend || 0,
              cognitiveIndex: parsedReaction.cognitiveIndex || 0,
            },
            user_id: userId
          };

          const response = await fetch('http://localhost:8000/api/submit_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errorText}`);
          }

          const responseData = await response.json();

          // 1. Показываем простой тост об успехе
          toast.current?.show({
            severity: 'success',
            summary: 'Успех!',
            detail: 'Результаты сохранены, рекомендации получены.',
            life: 3500
          });

          // 2. Сохраняем рекомендации в состояние для отображения на странице
          if (responseData.message && typeof responseData.message === 'string') {
            setRecommendation(responseData.message);
          }
          console.log(responseData.message)

        } catch (error: any) {
          console.error("💥 Error during submission:", error);
          toast.current?.show({
            severity: 'error',
            summary: 'Ошибка синхронизации',
            detail: 'Не удалось получить рекомендации. Результаты тестов доступны на этой странице.',
            life: 5000
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      submitData();
    }
  }, [step, hasSubmitted, userId]);

  const burnoutTag = maslachResult ? getBurnoutLevelTag(maslachResult.burnoutLevel) : null;

  return (
    <div>
      <Toast ref={toast} />
      {step === 'maslach' && <MaslachTest onComplete={handleMaslachComplete} toast={toast} />}
      {step === 'reaction' && <ReactionTest onComplete={handleReactionComplete} toast={toast} />}
      
      {step === 'results' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <h1>Мои результаты</h1>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {(isSubmitting || recommendation) && (
              <Card title="Персональные рекомендации">
                {isSubmitting && !recommendation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="5" />
                    <span>Анализируем ваши данные и подбираем лучшие советы...</span>
                  </div>
                )}
                {recommendation && (
                  // Используем <pre> для сохранения переносов строк из ответа LLM
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem', margin: 0 }}>
                    {recommendation}
                  </pre>
                )}
              </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {maslachResult && (
                <Card>
                  <h3>Анализ рабочего состояния</h3>
                  <div style={{ marginTop: '20px' }}>
                    {burnoutTag && (
                      <p>Уровень выгорания: 
                        <Tag 
                          value={burnoutTag.value}
                          severity={burnoutTag.severity}
                          style={{ marginLeft: '10px' }}
                        />
                      </p>
                    )}
                    <p>Индекс выгорания: <strong>{maslachResult.burnoutLevel.toFixed(2)}</strong></p>
                    <p>Эмоциональное истощение: <strong>{maslachResult.exhaustion}</strong></p>
                    <p>Деперсонализация: <strong>{maslachResult.depersonalization}</strong></p>
                    <p>Редукция достижений: <strong>{maslachResult.achievement}</strong></p>
                  </div>
                </Card>
              )}
              
              {reactionResult && (
                <Card>
                  <h3>Тест на скорость реакции</h3>
                  <div style={{ marginTop: '20px' }}>
                    <p>Средняя реакция: <strong>{reactionResult.avgTime} мс</strong></p>
                    {reactionResult.minTime != null && (
                      <p>Минимум: <strong>{reactionResult.minTime} мс</strong></p>
                    )}
                    {reactionResult.maxTime != null && (
                      <p>Максимум: <strong>{reactionResult.maxTime} мс</strong></p>
                    )}
                    {reactionResult.stability != null && (
                      <p>Стабильность: <strong>{reactionResult.stability}%</strong></p>
                    )}
                    {reactionResult.cognitiveIndex != null && (
                      <p>Когнитивный индекс: <strong>{reactionResult.cognitiveIndex}/100</strong></p>
                    )}
                  </div>
                </Card>
              )}

              {!maslachResult && !reactionResult && !isSubmitting && (
                <Card>
                  <p>Результаты тестов не найдены. Пожалуйста, пройдите диагностику.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}