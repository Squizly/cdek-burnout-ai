import React, { useState, useEffect } from 'react';
import { Avatar } from 'primereact/avatar';
// Добавим MenuItem
import { Menu } from 'primereact/menu';
import { useRef } from 'react';

import { DiagnosisFlow } from './pages/DiagnosisFlow';
import { Statistics } from './pages/Statistics';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

import './App.css';
import logo from './assets/logo.png'

type PageType = 'home' | 'dashboard' | 'diagnosis';

// Добавим константу для ключа localStorage
const USER_STORAGE_KEY = 'currentUserData'; 

interface User {
    id: number;
    name: string;
    position: string;
    isHr: boolean;
}

function App() {
    // Инициализируем стейт с проверкой localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem(USER_STORAGE_KEY);
    });
    const [currentPage, setCurrentPage] = useState<PageType>('home');
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        // Приводим данные к типу User при инициализации
        return storedUser ? JSON.parse(storedUser) as User : null;
    });

    // Референс для меню аватара
    const menu = useRef(null);

    // Эффект для синхронизации состояния и localStorage
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem(USER_STORAGE_KEY);
            setIsAuthenticated(false);
        }
    }, [currentUser]);

    const handleLogin = (userData: { id: number; name: string; position: string; isHr: boolean }) => {
        // Устанавливаем и сохраняем все данные пользователя
        const fullUserData: User = {
            id: userData.id,
            name: userData.name,
            position: userData.position,
            isHr: userData.isHr,
        };
        setCurrentUser(fullUserData);
        setCurrentPage('home'); // Перенаправляем на главную
        // Сохранение в localStorage произойдет благодаря useEffect
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('home');
        // Удаление из localStorage произойдет благодаря useEffect
    };

    // Меню для кнопки профиля
    const menuItems = [
        {
            label: 'Выход',
            icon: 'pi pi-sign-out',
            command: handleLogout
        }
    ];

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const items = [
    {
      label: 'Диагностика',
      icon: 'pi pi-chart-line',
      className: currentPage === 'diagnosis' ? 'active-menu-item' : '',
      command: () => setCurrentPage('diagnosis')
    },
    {
      label: 'Дашборд',
      icon: 'pi pi-th-large',
      className: currentPage === 'dashboard' ? 'active-menu-item' : '',
      command: () => setCurrentPage('dashboard')
    },
  ];

  return (
    <div className="app-container">
      <header className="cdek-header">
        <div className="header-container">

          {/* Логотип */}
          <div className="logo-section">
            <img
                alt="Логотип СДЭК"
                src={logo}
                height="32"
                style={{ cursor: 'pointer' }}
                onClick={() => setCurrentPage('home')}
            />
          </div>

          <div className="header-divider"></div>

          {/* Навигация */}
          <nav className="navigation-menu">
            {items.map((item, index) => (
              <button
                key={index}
                className={`nav-item ${item.className}`}
                onClick={item.command}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Профиль с кнопкой меню */}
          <div className="profile-section" onClick={(event) => menu.current.toggle(event)}>
            <div className="profile-info">
              <span className="profile-name">{currentUser.name}</span>
              <span className="profile-role">{currentUser.position}</span>
            </div>
            <Avatar
              image="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png"
              shape="circle"
              size="large"
              className="profile-avatar"
            />
            {/* Меню для выхода */}
            <Menu model={menuItems} popup ref={menu} id="profile_menu" />
          </div>

        </div>
      </header>

      <main className="main-content">
  <div className="content-wrapper">
    {(() => {
      switch (currentPage) {
        case 'home': 
          return <HomePage onNavigate={setCurrentPage} />; // ← Добавили onNavigate
        case 'dashboard': 
          return <Statistics user={currentUser} isHr={currentUser.isHr} />;
        case 'diagnosis': 
          return <DiagnosisFlow userId={currentUser.id} onComplete={() => setCurrentPage('dashboard')} />;
        default: 
          return <HomePage onNavigate={setCurrentPage} />; // ← И здесь тоже
      }
    })()}
  </div>
</main>

      <footer className="cdek-footer">
          <div className="footer-container">
              <p>© 2025 СДЭК. Все права защищены</p>
          </div>
      </footer>
    </div>
  );
}

export default App;