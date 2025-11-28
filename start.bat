@echo off
REM Backend Node.js
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\backend && npm start"

REM Microservicio Analyst (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI && call microservice_analyst\venv\Scripts\activate && pip install -r microservice_analyst\requirements.txt && python -m microservice_analyst.main"

REM Microservicio Enterprise (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_enterprise && call .\venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Microservicio Actuator Plus (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_actuator_plus && call .\venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Frontend (React/Vite)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI && npm run dev"

REM Microservicio Actuator (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_actuator && call .\.venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Microservicio Memory (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_memory && call .\venv\Scripts\activate && pip install -r requirements.txt && python main.py"

REM Microservicio Optimizer (Python)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\microservice_optimizer && call .\venv_b12\Scripts\activate && pip install -r requirements.txt && python api/api_optimizer.py"

REM Microservicio BFF (FastAPI)
start cmd /k "cd /d C:\Users\Alejandro Ruiz\OneDrive\Desktop\LeadBoostAI\backend\microservice_bff && call .\venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000"