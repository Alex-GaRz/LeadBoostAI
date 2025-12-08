import requests
import json
import time

# Configuración del Experimento
URL = "http://localhost:8001/simulation/run"

payload = {
    # Definimos a la audiencia (Víctimas)
    "target_audience_description": "Desarrolladores de software Senior, 28-45 años, con burnout, cínicos ante el marketing, buscan optimización cognitiva.",
    
    # El estímulo V4 (Ganador: Enfoque 'Open Source')
    "ad_copy": "La mayoría de las bebidas energéticas son deuda técnica para tu sistema nervioso (picos de azúcar == crashes). NeuroCode no es una cura mágica. Es una herramienta de mantenimiento: Ratio 1:2 de Cafeína/L-Teanina para 'garbage collection' mental. Hemos publicado la fórmula completa y los ensayos en GitHub. No confíes en nosotros. Haz un fork de la fórmula o compila el binario (compra la lata).",
    
    # 🔥 STRESS TEST: 50 Agentes Simultáneos
    "sample_size": 50
}

print(f"🧪 INICIANDO STRESS TEST: {payload['sample_size']} Agentes Sintéticos...")
print(f"📡 Conectando con 'The Audience Architect'...")
print("-" * 60)

try:
    start_time = time.time()
    # Enviamos la petición
    response = requests.post(URL, json=payload, timeout=120) # Timeout extendido a 2 min por seguridad
    duration = time.time() - start_time
    
    if response.status_code == 200:
        report = response.json()
        
        print(f"\n✅ PRUEBA COMPLETADA EXITOSAMENTE ({duration:.2f}s)")
        print(f"🆔 Simulación ID: {report['simulation_id']}")
        print("=" * 60)
        
        # Métricas Clave
        print(f"📊 MUESTRA TOTAL:        {report['demographic_breakdown']['sample_size']} Agentes")
        print(f"🔥 Viral Score:          {report['viral_score']}/100")
        print(f"💰 Tasa de Conversión:   {report['conversion_probability']}/100")
        
        # Análisis Cualitativo
        print("-" * 30)
        print(f"🧠 Emociones Dominantes:")
        for emotion, count in report['dominant_emotions'].items():
            print(f"   - {emotion}: {count}")
            
        print("-" * 30)
        print(f"🛡️  Top 3 Objeciones (Patrones detectados):")
        if report['top_objections']:
            for obj in report['top_objections']:
                print(f"   • {obj}")
        else:
            print("   • (Ninguna objeción significativa detectada)")
            
        print("-" * 30)
        print("💡 Recomendaciones Finales:")
        for rec in report['recommendations']:
            print(f"   - {rec}")
            
    else:
        print(f"❌ Error {response.status_code}: {response.text}")

except Exception as e:
    print(f"⚠️ Error Crítico: {e}")