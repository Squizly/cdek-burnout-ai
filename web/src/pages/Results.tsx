import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'

export function Results() {
  const maslachResult = localStorage.getItem('lastMaslachResult') 
    ? JSON.parse(localStorage.getItem('lastMaslachResult')!) 
    : null
    
  const reactionResult = localStorage.getItem('lastReactionResult')
    ? JSON.parse(localStorage.getItem('lastReactionResult')!)
    : null

  return (
    <div>
      <h1>Мои результаты</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {maslachResult && (
          <Card>
            <h3>Последний тест Маслач</h3>
            <div style={{ marginTop: '20px' }}>
              <p>Уровень выгорания: 
                <Tag 
                  value={maslachResult.burnoutLevel === 'low' ? 'Низкий' : 
                         maslachResult.burnoutLevel === 'medium' ? 'Средний' : 'Высокий'}
                  severity={maslachResult.burnoutLevel === 'low' ? 'success' : 
                           maslachResult.burnoutLevel === 'medium' ? 'warning' : 'danger'}
                  style={{ marginLeft: '10px' }}
                />
              </p>
              <p>Эмоциональное истощение: <strong>{maslachResult.exhaustion}</strong></p>
              <p>Деперсонализация: <strong>{maslachResult.depersonalization}</strong></p>
            </div>
          </Card>
        )}
        
        {reactionResult && (
          <Card>
            <h3>Последний тест на реакцию</h3>
            <div style={{ marginTop: '20px' }}>
              <p>Средняя реакция: <strong>{reactionResult.avgTime || reactionResult.averageTime} мс</strong></p>
              {reactionResult.minTime && (
                <p>Минимум: <strong>{reactionResult.minTime} мс</strong></p>
              )}
              {reactionResult.maxTime && (
                <p>Максимум: <strong>{reactionResult.maxTime} мс</strong></p>
              )}
              {reactionResult.stability && (
                <p>Стабильность: <strong>{reactionResult.stability}%</strong></p>
              )}
              {reactionResult.cognitiveIndex && (
                <p>Когнитивный индекс: <strong>{reactionResult.cognitiveIndex}/100</strong></p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}