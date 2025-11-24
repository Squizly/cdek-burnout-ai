import pandas as pd
import psycopg2
from psycopg2 import Error
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
import os

# Загружаем переменные окружения из файла .env
load_dotenv()

# Выводим пароль для проверки, что переменная окружения загружена (можно убрать в продакшене)
print(f"Загружен пароль: {'*' * len(os.getenv('DATASOURCE_PASSWORD', ''))}")

# Конфигурация для подключения к базе данных
db_config = {
  'user': os.getenv('DATASOURCE_USER'),
  'password': os.getenv('DATASOURCE_PASSWORD'),
  'host': 'datasource-db',  # Имя сервиса из docker-compose.yml
  'dbname': os.getenv('DATASOURCE_DB'),
  'port': 5432
}


def save_burnout_test_result(user_id: int, scores: Dict[str, Any], llm_response: Dict[str, Any]):
    """
    Сохраняет результаты одного теста на выгорание в базу данных.
    """
    connection = None
    cursor = None
    try:
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()

        # Подготовка данных для вставки
        score1 = scores.get('exhaustion')
        score2 = scores.get('depersonalization')
        score3 = scores.get('achievement')
        burnout_score = scores.get('burnout')
        mean_reaction_time = scores.get('mean_reaction_time_ms')

        llm_verdict = llm_response.get('score')

        sql_query = """
        INSERT INTO burnout_tests (
            user_id, test_datetime, score1, score2, score3, 
            burnout_score, mean_reaction_time_ms, llm_burnout_verdict
        ) VALUES (
            %s, NOW(), %s, %s, %s, %s, %s, %s
        );
        """
        
        data_to_insert = (
            user_id, score1, score2, score3, 
            burnout_score, mean_reaction_time, llm_verdict
        )

        cursor.execute(sql_query, data_to_insert)
        connection.commit()
        print(f"Результаты теста для пользователя {user_id} успешно сохранены в БД.")

    except Error as e:
        print(f"Ошибка при сохранении данных в PostgreSQL: {e}")
        if connection:
            connection.rollback()  # Откатываем транзакцию в случае ошибки

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def get_user_data(user_id: int):
    """Возвращает информацию о пользователе по id"""
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = "SELECT * FROM employees WHERE id = %s"
        # .to_dict('records') вернет список словарей, берем первый элемент [0]
        user_data = pd.read_sql(query, connection, params=[user_id]).to_dict('records')[0]
        return user_data
    except (Error, IndexError) as e:
        print(f"Ошибка при работе с PostgreSQL или пользователь не найден: {e}")
        return None
    finally:
        if connection:
            connection.close()


def get_user_burnout_stats(user_id: int, n: int = 3):
    """
    Получает N последних записей о тестах на выгорание для пользователя
    и рассчитывает средние значения по ключевым показателям.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        
        query_last_n = """
        SELECT * FROM burnout_tests 
        WHERE user_id = %s 
        ORDER BY test_datetime DESC 
        LIMIT %s;
        """
        df_last_n = pd.read_sql(query_last_n, connection, params=[user_id, n]).to_dict('list')
        
        query_overall_avg = """
        SELECT
            AVG(exhaustion) as avg_score1, AVG(depersonalization) as avg_score2,
            AVG(achievement) as avg_score3, AVG(burnout_score) as avg_burnout_score,
            AVG(mean_reaction_time_ms) as avg_reaction_time_ms
        FROM burnout_tests WHERE user_id = %s;
        """
        averages = pd.read_sql(query_overall_avg, connection, params=[user_id]).to_dict('records')[0]
        
        return df_last_n, averages
    except (Error, IndexError) as e:
        print(f"Ошибка при работе с PostgreSQL или записи не найдены: {e}")
        return None, None
    finally:
        if connection:
            connection.close()


def login_user(email: str, password: str):
    """
    Авторизует пользователя по email и паролю.
    Returns:
        tuple(int, str): (ID пользователя, Должность) или (-1, '') в случае неудачи.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = "SELECT id, position FROM employees WHERE email = %s AND password = %s"
        result_df = pd.read_sql(query, connection, params=[email, password])
        
        if not result_df.empty:
            user_id = int(result_df.iloc[0]['id'])
            position = result_df.iloc[0]['position']
            return user_id, position
        else:
            return -1, ''
    except Error as e:
        print(f"Ошибка при работе с PostgreSQL: {e}")
        return -1, ''
    finally:
        if connection:
            connection.close()


def get_burnout_timeseries(
    characteristic: str,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    cities: Optional[List[str]] = None,
    positions: Optional[List[str]] = None,
    departments: Optional[List[str]] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None
):
    print(characteristic, user_id)
    """
    Возвращает временной ряд для заданной характеристики с фильтрацией.
    """
    valid_characteristics = ['exhaustion', 'depersonalization', 'achievement', 'burnout_score', 'mean_reaction_time_ms']
    if characteristic not in valid_characteristics:
        print(f"Ошибка: Недопустимое имя характеристики '{characteristic}'.")
        return None

    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        
        base_query = f"""
            SELECT b.test_datetime, b.{characteristic}
            FROM burnout_tests b JOIN employees e ON b.user_id = e.id
        """
        
        where_clauses = []
        params = []

        if start_date:
            where_clauses.append("b.test_datetime >= %s")
            params.append(start_date)
        if end_date:
            where_clauses.append("b.test_datetime <= %s")
            params.append(f"{end_date} 23:59:59")
        if min_age is not None:
            where_clauses.append("e.age >= %s")
            params.append(min_age)
        if max_age is not None:
            where_clauses.append("e.age <= %s")
            params.append(max_age)
        if cities:
            where_clauses.append("e.city IN %s")
            params.append(tuple(cities))
        if positions:
            where_clauses.append("e.position IN %s")
            params.append(tuple(positions))
        if departments:
            where_clauses.append("e.department IN %s")
            params.append(tuple(departments))

        if user_id is not None:
            where_clauses.append("b.user_id = %s")
            params.append(user_id)

        if where_clauses:
            query = base_query + " WHERE " + " AND ".join(where_clauses)
        else:
            query = base_query
            
        query += " ORDER BY b.test_datetime ASC;"
        
        timeseries = pd.read_sql(query, connection, params=params).to_dict('list')
        timeseries['test_datetime'] = [
            dt.isoformat() for dt in timeseries['test_datetime']
        ]
        print(timeseries)
        return timeseries
    except Error as e:
        print(f"Ошибка при работе с PostgreSQL: {e}")
        return None
    finally:
        if connection:
            connection.close()

# Добавьте эти функции в db_utils.py

def get_user_role(user_id: int) -> str:
    """
    Возвращает роль пользователя по его ID.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT role_type 
        FROM employees 
        WHERE id = %s
        """
        df = pd.read_sql(query, connection, params=[user_id])
        if not df.empty:
            return df.iloc[0]['role_type']
        return 'Сотрудник'
        
    except Error as e:
        print(f"Ошибка при получении роли пользователя: {e}")
        return 'Сотрудник'
        
    finally:
        if connection:
            connection.close()

def get_user_department(user_id: int) -> str:
    """
    Возвращает отдел пользователя по его ID.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT department 
        FROM employees 
        WHERE id = %s
        """
        df = pd.read_sql(query, connection, params=[user_id])
        if not df.empty:
            return df.iloc[0]['department']
        return 'Отдел не определен'
        
    except Error as e:
        print(f"Ошибка при получении отдела пользователя: {e}")
        return 'Отдел не определен'
        
    finally:
        if connection:
            connection.close()


def get_departments_list():
    """
    Возвращает список всех уникальных отделов из таблицы employees.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT DISTINCT department 
        FROM employees 
        WHERE department IS NOT NULL AND department != ''
        ORDER BY department;
        """
        df = pd.read_sql(query, connection)
        departments = df['department'].tolist()
        return departments

    except Error as e:
        print(f"Ошибка при работе с PostgreSQL: {e}")
        return []

    finally:
        if connection:
            connection.close()


def get_city_list():
    """
    Возвращает список всех уникальных отделов из таблицы employees.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT DISTINCT city 
        FROM employees 
        WHERE city IS NOT NULL AND city != ''
        ORDER BY city;
        """
        df = pd.read_sql(query, connection)
        departments = df['city'].tolist()
        return departments

    except Error as e:
        print(f"Ошибка при работе с PostgreSQL: {e}")
        return []

    finally:
        if connection:
            connection.close()


def get_position_list():
    """
    Возвращает список всех уникальных отделов из таблицы employees.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT DISTINCT position 
        FROM employees 
        WHERE position IS NOT NULL AND position != ''
        ORDER BY position;
        """
        df = pd.read_sql(query, connection)
        departments = df['position'].tolist()
        return departments

    except Error as e:
        print(f"Ошибка при работе с PostgreSQL: {e}")
        return []

    finally:
        if connection:
            connection.close()


def get_user_statistics(user_id: int):
    """
    Возвращает статистику для конкретного пользователя.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT 
            AVG(burnout_score) as avg_burnout_score,
            COUNT(*) as total_tests,
            SUM(CASE WHEN burnout_score > 30 THEN 1 ELSE 0 END) as high_risk_count,
            MIN(burnout_score) as min_burnout_score,
            MAX(burnout_score) as max_burnout_score
        FROM burnout_tests 
        WHERE user_id = %s
        """
        df = pd.read_sql(query, connection, params=[user_id])
        if not df.empty:
            return {
                'avg_burnout_score': float(df.iloc[0]['avg_burnout_score']) if df.iloc[0]['avg_burnout_score'] else 0,
                'total_tests': int(df.iloc[0]['total_tests']),
                'high_risk_count': int(df.iloc[0]['high_risk_count']),
                'min_burnout_score': float(df.iloc[0]['min_burnout_score']) if df.iloc[0]['min_burnout_score'] else 0,
                'max_burnout_score': float(df.iloc[0]['max_burnout_score']) if df.iloc[0]['max_burnout_score'] else 0
            }
        return {
            'avg_burnout_score': 0,
            'total_tests': 0,
            'high_risk_count': 0,
            'min_burnout_score': 0,
            'max_burnout_score': 0
        }
        
    except Error as e:
        print(f"Ошибка при получении статистики пользователя: {e}")
        return {
            'avg_burnout_score': 0,
            'total_tests': 0,
            'high_risk_count': 0,
            'min_burnout_score': 0,
            'max_burnout_score': 0
        }
        
    finally:
        if connection:
            connection.close()


def get_all_user_ids_and_emails():
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = "SELECT id, email FROM employees WHERE email IS NOT NULL;"
        users_df = pd.read_sql(query, connection)
        users_list = list(users_df.itertuples(index=False, name=None))
        return users_list
    except Error as e:
        print(f"Ошибка при получении списка пользователей: {e}")
        return []
    finally:
        if connection:
            connection.close()

def get_user_role(user_id: int) -> Optional[str]:
    """
    Возвращает роль пользователя ('Сотрудник' или 'Руководитель') по его ID.
    """
    user_data = get_user_data(user_id)
    return user_data.get('role_type') if user_data else None


def get_user_department(user_id: int) -> Optional[str]:
    """
    Возвращает отдел пользователя по его ID.
    """
    user_data = get_user_data(user_id)
    return user_data.get('department') if user_data else None


def get_departments_list() -> List[str]:
    """
    Возвращает список всех уникальных отделов из таблицы employees.
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_config)
        query = """
        SELECT DISTINCT department 
        FROM employees 
        WHERE department IS NOT NULL AND department != '' AND department != 'Отдел не определен'
        ORDER BY department;
        """
        df = pd.read_sql(query, connection)
        return df['department'].tolist()
    except Error as e:
        print(f"Ошибка при получении списка отделов: {e}")
        return []
    finally:
        if connection:
            connection.close()