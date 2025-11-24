// LoginPage.tsx
import React, { useState } from 'react';
import logo from '../assets/logo.png'; 

import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import './LoginPage.css';

interface UserLoginData {
    id: number;
    name: string; // Добавлено имя
    position: string;
    isHr: boolean; // Добавлено isHr
}

interface LoginPageProps {
    // Обновленный тип данных
    onLoginSuccess: (userData: UserLoginData) => void; 
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        if (!username || !password) {
            setError('Пожалуйста, введите имя пользователя и пароль');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка авторизации');
            }

            const data = await response.json();
            // ! ВАЖНО: Мы эмулируем получение ВСЕХ данных пользователя,
            // ! которые вам нужны в App.tsx, из ответа API.
            // ! Вам нужно убедиться, что ваш API-эндпоинт возвращает 'name' и 'isHr'.
            onLoginSuccess({ 
                id: data.user_id, 
                name: data.name || "Иван Иванов", // Предполагаем, что API возвращает name
                position: data.position,
                isHr: data.is_hr || true, // Предполагаем, что API возвращает is_hr
            });

        } catch (error: any) {
            setError(error.message || 'Не удалось подключиться к серверу');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDownUsername = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            document.getElementById('password')?.focus();
        }
    };

    const handleKeyDownPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Содержимое LoginPage остается прежним */}
            <Card className="login-card" style={{ width: '25rem', marginBottom: '2em' }}>
                
                <div className="login-header">
                    <img src={logo} alt="" className="login-logo" />
                    <h2 className="login-title">Вход в кабинет</h2>
                </div>

                <div className="login-form">
                    <div className="p-field">
                        <label htmlFor="username">Имя пользователя</label>
                        <InputText
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Введите ваш логин"
                            onKeyDown={handleKeyDownUsername}
                            className={error ? 'p-invalid' : ''}
                        />
                    </div>

                    <div className="p-field" style={{ marginTop: '20px' }}>
                        <label htmlFor="password">Пароль</label>
                        <Password
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            toggleMask
                            placeholder="Введите ваш пароль"
                            feedback={false}
                            onKeyDown={handleKeyDownPassword}
                            className={error ? 'p-invalid' : ''}
                        />
                    </div>
                    
                    {error && 
                        <Message 
                            severity="error" 
                            text={error} 
                            style={{ width: '100%', marginTop: '20px' }} 
                        />
                    }

                    <Button
                        label={loading ? 'Входим...' : 'Войти'}
                        icon="pi pi-sign-in"
                        className="login-button-cdek"
                        style={{ width: '100%', marginTop: '30px' }}
                        onClick={handleLogin}
                        disabled={loading}
                    />
                </div>
            </Card>
        </div>
    );
};