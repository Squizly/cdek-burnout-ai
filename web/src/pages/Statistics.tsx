// src/pages/Statistics.tsx

import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import './Statistics.css';

interface User {
    id: number;
    name: string;
    position: string;
    isHr: boolean;
}

interface StatisticsProps {
    user: User;
    isHr: boolean;
}

interface TimeseriesData {
    test_datetime: string[];
    total_users?: number;
    [key: string]: any;
}

interface Department {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
}

interface Position {
    id: number;
    name: string;
}

const characteristicOptions = [
    { label: 'Уровень выгорания', value: 'burnout_score' },
    { label: 'Эмоциональное истощение', value: 'exhaustion' },
    { label: 'Деперсонализация', value: 'depersonalization' },
    { label: 'Редукция личных достижений', value: 'achievement' },
    { label: 'Среднее время реакции (мс)', value: 'mean_reaction_time_ms' },
];

export const Statistics: React.FC<StatisticsProps> = ({ user }) => {
    // Общие состояния
    const [activeTab, setActiveTab] = useState(0);
    
    // Состояния для личной статистики
    const [personalCharacteristic, setPersonalCharacteristic] = useState<string>(characteristicOptions[0].value);
    const [personalStartDate, setPersonalStartDate] = useState<Date>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date;
    });
    const [personalEndDate, setPersonalEndDate] = useState<Date>(new Date());
    const [personalChartData, setPersonalChartData] = useState({});
    const [personalChartOptions, setPersonalChartOptions] = useState({});
    const [personalLoading, setPersonalLoading] = useState(true);
    const [personalError, setPersonalError] = useState<string | null>(null);

    // Состояния для общей статистики
    const [generalCharacteristic, setGeneralCharacteristic] = useState<string>(characteristicOptions[0].value);
    const [generalStartDate, setGeneralStartDate] = useState<Date>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date;
    });
    const [generalEndDate, setGeneralEndDate] = useState<Date>(new Date());
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [generalChartData, setGeneralChartData] = useState({});
    const [generalChartOptions, setGeneralChartOptions] = useState({});
    const [generalLoading, setGeneralLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    
    // Справочники
    const [cities, setCities] = useState<City[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    
    // Статистика для общего дашборда
    const [stats, setStats] = useState({
        totalUsers: 0,
        avgBurnout: 0,
        trend: 'stable' as 'up' | 'down' | 'stable'
    });

    // Загрузка справочников
    useEffect(() => {
        const loadReferences = async () => {
            try {
                const [citiesRes, depsRes, positionsRes] = await Promise.all([
                    fetch('http://localhost:8000/api/get_cities'),
                    fetch('http://localhost:8000/api/get_departments'),
                    fetch('http://localhost:8000/api/get_positions')
                ]);

                if (citiesRes.ok) {
                    const citiesData = await citiesRes.json();
                    setCities(citiesData);
                }

                if (depsRes.ok) {
                    const depsData = await depsRes.json();
                    setDepartments(depsData);
                }

                if (positionsRes.ok) {
                    const positionsData = await positionsRes.json();
                    setPositions(positionsData);
                }
            } catch (err) {
                console.error('Ошибка при загрузке справочников:', err);
            }
        };

        loadReferences();
    }, []);

    // Функция загрузки данных для личной статистики
    const fetchPersonalChartData = async () => {
        setPersonalLoading(true);
        setPersonalError(null);

        try {
            const requestBody = {
                characteristic: personalCharacteristic,
                user_id: user.id,
                start_date: personalStartDate.toISOString().split('T')[0],
                end_date: personalEndDate.toISOString().split('T')[0],
            };

            const response = await fetch('http://localhost:8000/api/get_timeseries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);

            const data: TimeseriesData = await response.json();

            if (!data || !data.test_datetime || data.test_datetime.length === 0) {
                setPersonalChartData({ labels: [], datasets: [] });
                setPersonalError("Нет данных для выбранных фильтров.");
                return;
            }

            const selectedOption = characteristicOptions.find(opt => opt.value === personalCharacteristic);
            const chartLabel = selectedOption ? selectedOption.label : 'Выбранный показатель';

            const labels = data.test_datetime.map(date => new Date(date).toLocaleDateString('ru-RU'));
            const values = data[personalCharacteristic];

            setPersonalChartData({
                labels,
                datasets: [
                    {
                        label: chartLabel,
                        data: values,
                        fill: false,
                        borderColor: '#42A5F5',
                        tension: 0.4
                    }
                ]
            });

        } catch (err: any) {
            console.error("Ошибка при загрузке данных:", err);
            setPersonalError(err.message || 'Не удалось загрузить данные.');
            setPersonalChartData({ labels: [], datasets: [] });
        } finally {
            setPersonalLoading(false);
        }
    };

    // Функция загрузки данных для общей статистики
    const fetchGeneralChartData = async () => {
        setGeneralLoading(true);
        setGeneralError(null);

        try {
            const requestBody = {
                characteristic: generalCharacteristic,
                start_date: generalStartDate.toISOString().split('T')[0],
                end_date: generalEndDate.toISOString().split('T')[0],
                cities: selectedCities.length > 0 ? selectedCities : undefined,
                departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
                positions: selectedPositions.length > 0 ? selectedPositions : undefined
            };

            const response = await fetch('http://localhost:8000/api/get_timeseries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);

            const data: TimeseriesData = await response.json();

            if (!data || !data.test_datetime || data.test_datetime.length === 0) {
                setGeneralChartData({ labels: [], datasets: [] });
                setGeneralError("Нет данных для выбранных фильтров.");
                return;
            }

            const selectedOption = characteristicOptions.find(opt => opt.value === generalCharacteristic);
            const chartLabel = selectedOption ? selectedOption.label : 'Выбранный показатель';

            const labels = data.test_datetime.map(date => new Date(date).toLocaleDateString('ru-RU'));
            const values = data[generalCharacteristic] as number[];

            // Расчет статистики
            let overallAvg = 0;
            if (values && values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                overallAvg = parseFloat(avg.toFixed(2));
                const lastValue = values[values.length - 1];
                const firstValue = values[0];
                const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
                
                setStats({
                    totalUsers: data.total_users || values.length,
                    avgBurnout: overallAvg,
                    trend
                });
            }

            const avgLine = new Array(values.length).fill(overallAvg);

            setGeneralChartData({
                labels,
                datasets: [
                    {
                        label: chartLabel,
                        data: values,
                        fill: true,
                        backgroundColor: 'rgba(66, 165, 245, 0.2)',
                        borderColor: '#42A5F5',
                        tension: 0.4
                    },
                    {
                        label: `Среднее значение (${overallAvg})`,
                        data: avgLine,
                        fill: false,
                        borderColor: '#FFA726',
                        borderWidth: 4,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.4
                    }
                ]
            });

        } catch (err: any) {
            console.error("Ошибка при загрузке данных:", err);
            setGeneralError(err.message || 'Не удалось загрузить данные.');
            setGeneralChartData({ labels: [], datasets: [] });
        } finally {
            setGeneralLoading(false);
        }
    };

    // Загрузка данных при инициализации
    useEffect(() => {
        fetchPersonalChartData();
    }, []);

    // Обновление опций для личного графика
    useEffect(() => {
        const selectedOption = characteristicOptions.find(opt => opt.value === personalCharacteristic);
        const axisLabel = selectedOption ? selectedOption.label : '';

        setPersonalChartOptions({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#495057' }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#495057' },
                    grid: { color: '#ebedef' },
                    title: { display: true, text: 'Дата тестирования' }
                },
                y: {
                    ticks: { color: '#495057' },
                    grid: { color: '#ebedef' },
                    title: { display: true, text: axisLabel }
                }
            }
        });
    }, [personalCharacteristic]);

    // Обновление опций для общего графика
    useEffect(() => {
        const selectedOption = characteristicOptions.find(opt => opt.value === generalCharacteristic);
        const axisLabel = selectedOption ? selectedOption.label : '';

        setGeneralChartOptions({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#495057' }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    ticks: { color: '#495057' },
                    grid: { color: '#ebedef' },
                    title: { 
                        display: true, 
                        text: 'Дата',
                        color: '#495057'
                    }
                },
                y: {
                    ticks: { color: '#495057' },
                    grid: { color: '#ebedef' },
                    title: { 
                        display: true, 
                        text: axisLabel,
                        color: '#495057'
                    }
                }
            }
        });
    }, [generalCharacteristic]);

    const resetGeneralFilters = () => {
        setGeneralCharacteristic(characteristicOptions[0].value);
        setSelectedCities([]);
        setSelectedDepartments([]);
        setSelectedPositions([]);
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        setGeneralStartDate(date);
        setGeneralEndDate(new Date());
    };

    return (
        <div className="statistics-page">
            {/* Заголовок */}
            <div className="statistics-header">
                <div className="statistics-title-section">
                    <h2 className="statistics-title">Статистика и аналитика</h2>
                    <p className="statistics-subtitle">Анализ показателей выгорания и производительности</p>
                </div>
            </div>

            {/* Табы */}
            <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                {/* Личная статистика */}
                <TabPanel header="Моя статистика" leftIcon="pi pi-user">
                    <div className="tab-content">
                        {/* Панель фильтров для личной статистики */}
                        <div className="filters-card">
                            <h3>Параметры отображения</h3>
                            <div className="filters-panel personal-filters">
                                <div className="filter-group">
                                    <label htmlFor="personal-characteristic">Показатель</label>
                                    <Dropdown
                                        id="personal-characteristic"
                                        value={personalCharacteristic}
                                        options={characteristicOptions}
                                        onChange={(e) => setPersonalCharacteristic(e.value)}
                                        placeholder="Выберите показатель"
                                    />
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="personal-start-date">Начало периода</label>
                                    <Calendar
                                        id="personal-start-date"
                                        value={personalStartDate}
                                        onChange={(e) => setPersonalStartDate(e.value as Date)}
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                    />
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="personal-end-date">Конец периода</label>
                                    <Calendar
                                        id="personal-end-date"
                                        value={personalEndDate}
                                        onChange={(e) => setPersonalEndDate(e.value as Date)}
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                    />
                                </div>
                                <Button
                                    className="apply-button"
                                    label="Применить"
                                    icon="pi pi-check"
                                    onClick={fetchPersonalChartData}
                                    disabled={personalLoading}
                                />
                            </div>
                        </div>

                        {/* График личной статистики */}
                        <div className="chart-card">
                            <h3>История изменений</h3>
                            <div className="chart-wrapper">
                                {personalLoading && <div className="loading-container"><ProgressSpinner /></div>}
                                {!personalLoading && personalError && <div className="error-container"><Message severity="warn" text={personalError} /></div>}
                                {!personalLoading && !personalError && (
                                    <Chart type="line" data={personalChartData} options={personalChartOptions} />
                                )}
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Общая статистика */}
                <TabPanel header="Статистика организации" leftIcon="pi pi-chart-bar">
                    <div className="tab-content">
                        {/* Карточки со статистикой */}
                        <div className="stats-cards-row">
                            <Card className="stat-card">
                                <div className="stat-card-content">
                                    <i className="pi pi-users stat-icon" style={{ color: '#42A5F5' }}></i>
                                    <div className="stat-info">
                                        <span className="stat-label">Всего измерений</span>
                                        <span className="stat-value">{stats.totalUsers}</span>
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className="stat-card">
                                <div className="stat-card-content">
                                    <i className="pi pi-chart-line stat-icon" style={{ color: '#FFA726' }}></i>
                                    <div className="stat-info">
                                        <span className="stat-label">Среднее значение</span>
                                        <span className="stat-value">{stats.avgBurnout}</span>
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className="stat-card">
                                <div className="stat-card-content">
                                    <i className={`pi ${stats.trend === 'up' ? 'pi-arrow-up' : stats.trend === 'down' ? 'pi-arrow-down' : 'pi-minus'} stat-icon`} 
                                       style={{ color: stats.trend === 'up' ? '#EF5350' : stats.trend === 'down' ? '#66BB6A' : '#FFA726' }}></i>
                                    <div className="stat-info">
                                        <span className="stat-label">Тенденция</span>
                                        <span className="stat-value">
                                            {stats.trend === 'up' ? 'Рост' : stats.trend === 'down' ? 'Снижение' : 'Стабильно'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Панель фильтров для общей статистики */}
                        <Card className="filters-card">
                            <div className="filters-header">
                                <h3>Фильтры</h3>
                                <Button 
                                    label="Сбросить" 
                                    icon="pi pi-refresh" 
                                    className="p-button-text"
                                    onClick={resetGeneralFilters}
                                />
                            </div>
                            <Divider />
                            
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label htmlFor="general-characteristic">Показатель</label>
                                    <Dropdown
                                        id="general-characteristic"
                                        value={generalCharacteristic}
                                        options={characteristicOptions}
                                        onChange={(e) => setGeneralCharacteristic(e.value)}
                                        placeholder="Выберите показатель"
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="cities">Города</label>
                                    <MultiSelect
                                        id="cities"
                                        value={selectedCities}
                                        options={cities.map(c => ({ label: c.name, value: c.name }))}
                                        onChange={(e) => setSelectedCities(e.value)}
                                        placeholder="Все города"
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="departments">Отделы</label>
                                    <MultiSelect
                                        id="departments"
                                        value={selectedDepartments}
                                        options={departments.map(d => ({ label: d.name, value: d.name }))}
                                        onChange={(e) => setSelectedDepartments(e.value)}
                                        placeholder="Все отделы"
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="positions">Должности</label>
                                    <MultiSelect
                                        id="positions"
                                        value={selectedPositions}
                                        options={positions.map(p => ({ label: p.name, value: p.name }))}
                                        onChange={(e) => setSelectedPositions(e.value)}
                                        placeholder="Все должности"
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="general-start-date">Начало периода</label>
                                    <Calendar
                                        id="general-start-date"
                                        value={generalStartDate}
                                        onChange={(e) => setGeneralStartDate(e.value as Date)}
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                        className="w-full"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="general-end-date">Конец периода</label>
                                    <Calendar
                                        id="general-end-date"
                                        value={generalEndDate}
                                        onChange={(e) => setGeneralEndDate(e.value as Date)}
                                        dateFormat="dd.mm.yy"
                                        showIcon
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-actions">
                                <Button
                                    label="Применить фильтры"
                                    icon="pi pi-check"
                                    onClick={fetchGeneralChartData}
                                    disabled={generalLoading}
                                    className="apply-button"
                                />
                            </div>
                        </Card>

                        {/* График общей статистики */}
                        <Card className="chart-card">
                            <h3>График изменения показателей</h3>
                            <Divider />
                            <div className="chart-wrapper" style={{ height: '800px' }}>
                                {generalLoading && (
                                    <div className="loading-container">
                                        <ProgressSpinner />
                                        <p>Загрузка данных...</p>
                                    </div>
                                )}
                                {!generalLoading && generalError && (
                                    <div className="error-container">
                                        <Message severity="warn" text={generalError} />
                                    </div>
                                )}
                                {!generalLoading && !generalError && (
                                    <Chart type="line" data={generalChartData} options={generalChartOptions} />
                                )}
                            </div>
                        </Card>
                    </div>
                </TabPanel>
            </TabView>
        </div>
    );
};