// HomePage.tsx
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import './HomePage.css'

interface HomePageProps {
  // Добавляем пропс для навигации
  onNavigate?: (page: 'diagnosis' | 'dashboard') => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const benefits = [
    {
      icon: 'pi pi-shield',
      title: 'Конфиденциальность',
      description: 'Все данные защищены и анонимизированы'
    },
    {
      icon: 'pi pi-clock',
      title: 'Быстро',
      description: 'Тестирование занимает 5-10 минут'
    },
    {
      icon: 'pi pi-sparkles',
      title: 'AI-анализ',
      description: 'Персонализированные рекомендации'
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Динамика',
      description: 'Отслеживание изменений состояния'
    }
  ]

  const infoBlocks = [
    {
      icon: 'pi pi-heart',
      title: 'Эмоциональное истощение',
      description: 'Чувство усталости и опустошенности'
    },
    {
      icon: 'pi pi-users',
      title: 'Деперсонализация',
      description: 'Отстраненность от работы и коллег'
    },
    {
      icon: 'pi pi-chart-bar',
      title: 'Снижение продуктивности',
      description: 'Ощущение неэффективности'
    }
  ]

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Забота о благополучии сотрудников</h1>
            <p className="hero-description">
              Современный AI-инструмент для ранней диагностики профессионального выгорания 
              и поддержания здорового баланса между работой и личной жизнью
            </p>
            <div className="hero-actions">
              <Button 
                label="Начать диагностику"
                icon="pi pi-arrow-right"
                iconPos="right"
                size="large"
                // Используем onNavigate для перехода
                onClick={() => onNavigate?.('diagnosis')}
                className="hero-button-primary"
              />
            </div>
          </div>
          <div className="hero-illustration">
            <div className="illustration-circle">
              <i className="pi pi-heart-fill" style={{ fontSize: '120px', color: '#00a652' }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="benefits-section">
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-item">
              <div className="benefit-icon">
                <i className={benefit.icon}></i>
              </div>
              <h4>{benefit.title}</h4>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
        <div className="info-header">
          <h2>Что такое профессиональное выгорание?</h2>
          <p>
            Профессиональное выгорание — это состояние физического, эмоционального и умственного 
            истощения, вызванное длительным стрессом на работе. Оно проявляется в трех основных аспектах:
          </p>
        </div>
        
        <div className="info-blocks">
          {infoBlocks.map((block, index) => (
            <div key={index} className="info-block">
              <div className="info-block-icon">
                <i className={block.icon}></i>
              </div>
              <h3>{block.title}</h3>
              <p>{block.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card className="how-it-works-card">
        <h2 className="card-title">
          <i className="pi pi-lightbulb"></i>
          Как работает диагностика
        </h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Пройдите тест</h4>
              <p>Ответьте на вопросы о вашем самочувствии и отношении к работе</p>
            </div>
          </div>
          
          <div className="step-divider">
            <i className="pi pi-arrow-right"></i>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Получите анализ</h4>
              <p>AI обработает ваши ответы и определит уровень выгорания</p>
            </div>
          </div>
          
          <div className="step-divider">
            <i className="pi pi-arrow-right"></i>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Следуйте рекомендациям</h4>
              <p>Получите персональные советы по улучшению состояния</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}