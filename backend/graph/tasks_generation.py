import random
import datetime
import json

project_name_pool = [
    "Jupiter Expedition", "Project Phoenix", "QuantumLeap", "Starlight", "Omega Protocol",
    "Aurora", "Nebula Core", "Atlas", "Helix", "Voyager",
    "Orion Nexus", "NovaEdge", "Hyperion", "Zephyr", "Axiom",
    "Pioneer", "Titan Forge", "Mercury Rise", "Neptune Harbor", "Lunar Gate",
    "Solaris", "Echo Pulse", "Vertex", "Catalyst", "Monolith",
    "Nimbus", "Pulsewave", "Chronos", "Odyssey", "Arcadia",
    "Vectorium", "Prismatica", "Quasar Link", "Equinox Lab", "Polaris Hub",
    "Event Horizon", "BlueShift", "Redwood Ops", "Delta V", "Antares",
    "ZenithWorks", "Gravity Well", "Kepler Station", "Galileo Point", "Tesseract Grid",
    "Aurora Prime", "Nebula Gate", "Helios Trail", "Ion Drift", "Orion Forge",
    "Astra Core", "Photon Ridge", "Cosmos Bay", "Vertex Labs", "Momentum Yard"
]

task_name_pool = [
    # Планирование и аналитика
    "Create project plan", "Define requirements", "Write user stories", "Estimate tasks", "Prepare sprint backlog",
    "Groom backlog", "Define acceptance criteria", "Create architecture decision record",
    # Бэкенд
    "Design REST API", "Implement CRUD endpoints", "Add pagination", "Input validation", "Implement OAuth2",
    "JWT authentication", "Role-based access control", "Rate limiting", "Add caching (Redis)",
    "Implement background jobs", "Design database schema", "Write database migrations", "Optimize SQL queries",
    "Add health checks", "Implement WebSocket endpoints", "GraphQL schema and resolvers", "gRPC service",
    "File upload support", "Serve static files", "Multi-tenant support", "Feature flags backend",
    "Idempotency keys", "Transactional outbox", "Retry policies", "Circuit breaker pattern",
    # Интеграции
    "External API integration", "Webhook receiver", "Webhook sender", "S3 storage integration",
    "Payment provider integration", "SMTP email service", "SMS provider integration",
    # Фронтенд
    "Design UI mockups", "Implement login page", "Sign-up flow", "Password reset flow", "Dashboard page",
    "Responsive layout", "Accessibility improvements", "Form validation", "Global error handling",
    "Client-side caching", "State management setup", "Dark mode support", "Toast/notification system",
    "Internationalization (i18n)", "API client layer", "Skeleton loaders",
    # Тестирование и качество
    "Write unit tests", "Write integration tests", "Write E2E tests", "Test data factory", "Load testing",
    "Contract tests", "Fuzz testing", "Mutation testing", "Flaky test deflaking",
    # DevOps и платформа
    "Dockerize service", "Create Docker Compose", "Write Helm chart", "Kubernetes deployment",
    "GitHub Actions CI", "CD pipeline", "Blue/Green deployment", "Canary release",
    "Secrets management", "Environment variables layout", "Add observability (OTel)", "Tracing spans",
    "Metrics with Prometheus", "Logging with ELK", "Alerting rules", "Autoscaling policy (HPA)",
    "Backup and restore plan", "Disaster recovery runbook",
    # Безопасность
    "Security audit", "Dependency upgrades", "SAST analysis", "DAST scan", "Fix CVEs",
    "Content Security Policy", "CORS configuration", "TLS hardening", "Secrets rotation",
    # Документация и поддержка
    "Update documentation", "API docs (OpenAPI)", "Changelog", "Release notes",
    "Runbook for on-call", "Postmortem template", "Architecture diagram",
    # Оптимизация и рефакторинг
    "Refactor module Y", "Remove dead code", "Improve error messages", "Optimize memory usage",
    "Reduce cold start time", "Improve startup logging", "Parallelize workloads",
    # Наблюдаемость и стабильность
    "Add structured logging", "Correlation IDs", "Graceful shutdown", "Health and readiness probes",
    "Dead letter queue", "Backpressure handling",
    # ML / NLP / CV / RAG
    "Prepare dataset", "Data cleaning", "Data labeling pipeline", "Train baseline model",
    "Hyperparameter tuning", "Cross-validation", "Model evaluation report",
    "Export model to ONNX", "Model quantization", "Model pruning", "Benchmark inference latency",
    "Experiment tracking setup", "Implement embeddings pipeline", "Index documents in vector store",
    "Implement RAG retriever", "Add reranker stage", "Chunking strategy tuning",
    "Prompt template library", "Output parser with Pydantic", "Guardrails for prompts",
    "Feedback loop collection", "Hallucination detection checks",
    # Работа с документами и OCR
    "PDF parsing pipeline", "OCR integration", "Table extraction", "NER pipeline",
    "Text normalization", "Sentence segmentation", "Language detection",
    # Надежность и эксплуатация
    "Graceful retry on failure", "Idempotent consumers", "Schema migration tests",
    "Feature toggle rollout", "Shadow traffic test", "Chaos testing",
    # Производительность
    "Add caching layer", "Optimize hot path", "Batch processing", "Vectorized operations",
    "Connection pooling tuning", "Reduce DB round-trips",
    # Командные практики
    "Code review", "Pair programming session", "Knowledge sharing session"
]

meeting_name_pool = ["Daily Standup", "Sprint Planning", "Retrospective", "Client Demo", "Technical Deep Dive"]
task_status_pool = ["In Progress", "Done", "To Do", "Blocked"]

def generate_random_date(start_year=2025, end_year=2025, start_month=9, start_date=1):
    """Генерирует случайную дату в указанном диапазоне."""
    start_date = datetime.date(start_year, start_month, start_date)
    end_date = datetime.date(end_year, 11, 15)
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)
    return random_date.strftime("%d.%m.%Y")

def generate_project_data(num_projects: int = 2, max_tasks: int = 3, max_meetings: int = 3, max_time_entries: int = 3):
    """
    Генерирует список случайных данных по проектам на основе предопределенных пулов,
    сохраняя исходную структуру, предоставленную пользователем.
    """
    tasks_on_projects = []

    for _ in range(num_projects):
        project = {
            "project_name": random.choice(project_name_pool),
            "tasks": [],
            "meetings": []
        }

        for _ in range(random.randint(1, max_tasks)):
            task = {
                "task_name": random.choice(task_name_pool),
                "task_status": random.choice(task_status_pool),
                "spend_time": [],
                "deadline": generate_random_date()
            }

            for _ in range(random.randint(1, max_time_entries)):
                time_entry = {
                    "date": generate_random_date(),
                    "hours": random.randint(1, 8)
                }
                task["spend_time"].append(time_entry)
            project["tasks"].append(task)

        for _ in range(random.randint(1, max_meetings)):
            meeting = {
                "meetings_name": random.choice(meeting_name_pool),
                "meetings_date": generate_random_date(),
                "spend_time": random.choice([15, 30, 45, 60, 90]) # в минутах
            }
            project["meetings"].append(meeting)

        tasks_on_projects.append(project)

    return tasks_on_projects

if __name__ == "__main__":
    generated_data = generate_project_data(num_projects=3, max_tasks=4, max_meetings=2)
    print(json.dumps(generated_data, indent=4, ensure_ascii=False))