import random
import time
from datetime import datetime

# Configuración
NUM_EVENTS = 20
EVENT_TYPES = ['click', 'conversion', 'view']
CAMPAIGNS = ['CMP-001', 'CMP-002', 'CMP-003']

print("--- Simulación de tráfico sintético ---")
for i in range(NUM_EVENTS):
    event = {
        'timestamp': datetime.now().isoformat(),
        'campaign_id': random.choice(CAMPAIGNS),
        'event_type': random.choices(EVENT_TYPES, weights=[0.7, 0.2, 0.1])[0],
        'value': round(random.uniform(0.5, 5.0), 2)
    }
    print(f"Evento {i+1}: {event}")
    time.sleep(random.uniform(0.1, 0.5))

print("--- Fin de simulación ---")
