@echo off
REM Microservicio Enterprise (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_enterprise && call .\venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Microservicio Memory (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_memory && call .\venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Microservicio Optimizer (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_optimizer && call .\venv_b12\Scripts\activate && pip install -r requirements.txt && python api/api_optimizer.py"