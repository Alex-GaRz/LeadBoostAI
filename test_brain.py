# test_brain.py
import shutil
import os
from microservice_optimizer.core.math_core import ROIPredictor

# 1. Limpieza: Borrar memoria previa para empezar de cero
if os.path.exists("model_store"):
    shutil.rmtree("model_store")
    print("🧹 Memoria borrada. Iniciando en modo COLD START.")

# 2. Inicializar Predictor
brain = ROIPredictor()

# 3. Predicción en Frío (Cold Start)
roi_cold, conf_cold = brain.predict_roi(budget=1000, platform_id="META", historical_ctr=0.02)
print(f"\n🥶 [Cold Start] Predicción para $1000 en Meta:")
print(f"   ROI Esperado: {roi_cold:.2f} (Debe ser ~1.2 por defecto)")
print(f"   Confianza: {conf_cold:.2f} (Debe ser 0.1)")

# 4. Entrenamiento (Simulamos que una campaña real dio un ROI fabuloso de 4.0)
print(f"\n🎓 Entrenando con 1 dato real (Inversión: $1000 -> Retorno Real: 4.0x)...")
brain.train_incremental(budget=1000, platform_id="META", historical_ctr=0.02, actual_roi=4.0)

# 5. Predicción en Caliente (Warm Start)
roi_warm, conf_warm = brain.predict_roi(budget=1000, platform_id="META", historical_ctr=0.02)
print(f"\n🔥 [Warm Start] Predicción para $1000 en Meta (Mismos inputs):")
print(f"   ROI Esperado: {roi_warm:.2f} (¡Debe haber subido acercándose a 4.0!)")
print(f"   Confianza: {conf_warm:.2f} (Debe haber subido ligeramente)")

# 6. Prueba de Curva Logarítmica (Diminishing Returns)
roi_huge, _ = brain.predict_roi(budget=50000, platform_id="META", historical_ctr=0.02)
print(f"\n📉 [Diminishing Returns] Si invertimos $50,000:")
print(f"   ROI Esperado: {roi_huge:.2f} (Debe ser menor que el ROI de $1000 debido a la saturación)")