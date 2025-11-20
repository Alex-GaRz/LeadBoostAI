import firebase_admin
from firebase_admin import credentials, firestore
import requests
import datetime
import json
import time

# ==========================================
# ZONA DE CREDENCIALES (SOLUCIÓN #3)
# ==========================================
# COPIA AQUÍ EL CONTENIDO DE TU serviceAccountKey.json
# Asegúrate de mantener las comillas y estructura correcta.
cred_dict = {
  "type": "service_account",
  "project_id": "leadboost-ai-1966c",
  "private_key_id": "77e6afc7b191fc57241955f903d22af0b5fb8b0a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCepM+8hpdN9Nx+\n21v6REFfAZudDYebdAh8nTE90aV7n74FyYHQWJ4wAGPuKLYuTyhpVhGOsb3IIuxR\ntoyL/4Bd5bWSd97yibkOZvORU0sv7DLzTudjbs4fsQOnnTA0EudcL6QkEtw4BFRa\nGVFWuuImtI1wbN91fDMAdYFVa5ZbIQLdIMKkaDssOQDWb3l8Ge+s9tMeu5kZI4y5\njftdrZQnhdQbOXmcSOAyA5g7iXvtHFqORO/yNhFdQ4Qi9z+FDIzfPTq9LbGZQp3P\nSWlDarqzFnK5LgnotdcpBDovEmrzRN99548P9dSw9RIYLuO97XrybVMEqBVAbO2W\nmGIZboBXAgMBAAECggEADlnZYvQH7ujmI2GjleWjxjzmf1QQftsFw4QSxsVWw3Kl\nZW+fmyHRGYWHhK1RIapOfQzopLBmexrRpuitGSMBUT0s6jWGyQj1YRymDvDqfcjP\nqRvrqZ6F7e785iY9jJBjNn8myY6dNkIKAWaF6aMZPygZHWDz6/RSxslabEhBvzd+\nRKDeGpck/1uia8c7jtKmrDFWLFh/j24Svz5HZPZtMHCKMJmp7nlLhdNPqnawZidy\nNZWfLiiM24aG9bJ5hvjXTnz2K5trA5xtHeeqMdSOJoJf7r99OZkGyQUdU4uG4lQX\nzB148Dd9UJVbz3wflJIbUBVc21HaSq6FME4aStw0lQKBgQDSbqKpQC1hqHsjdIxe\n5zN1IMXkglPtKjKCF5DsuOQfPYPsqY8V6/kjXkP8GCFXmkSeS7jDNVJEamsjSDTG\nMn6R4qAJyU23fO37M9v9WSZuVB2+rlndFfKxaFvxgx/RCfsqzznlyeaP6cMTg63X\nfEBdijc0M0e0i5hHKMBK6yOyqwKBgQDA/0X/KSWv40ZDJIqh7kxM3l1ZiptdFmdJ\nJUIkKLwmeyxCYK4aA/yoM/EeGhuFz+F1AnPJmmvXp3+6VoUair01axpue6IHPIvg\nMN2UnRdTbabrp4lzfFL9Px4yZ6QqYWA9r/vWq6sQssjf0fm3DTP0DYXxiNKsd2RR\n2DVhIVwJBQKBgFasv08bYhXhgabe8Jp+fJF4CErQ66S6RseS0VzP4xaDDf3C8W7E\nHYBV6YbCoakln7Hb2qR9J/+KHcsQiLxCPCP2xpiBVAOJ77QSbkByIgQ7nWzW/6iy\ny54LMCPQMKC3jb7aUCy39sG8NV+qU0Z4pUJiFc7oeFaDURuuS1YQeEm1AoGBAJXm\n8KAyfoIx/gXyoPcLVxoxcMI2pVvVJd4rYUcimJku/H6GB1RPmnOu/G3MC2qQv2YZ\nxINnPLIg+FVsFDA8aJ/QE5SS1JPYVDCK4+Alb9OuDINm+pzHiNIIr1SpKVp9jbn8\nMZhYeCMdKmal+dZTG/JIeqvTAQdSKIpla3iI56pdAoGAbygoOylnnYM/8qaRa9cX\njNncymfuFPOErZQkGO+lpGodcF3IlrHhy2einopngAZqS3hR8eT0T0Ga76saATpY\nj0U/ATzCTe7mDXLgDgtpvGtS+SZzOnnbItPQOx7bfJ5PpSAxn9ZTaQBJoDhwLcj/\nreuUaZSooOrSqk9ZbuEwHvA=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@leadboost-ai-1966c.iam.gserviceaccount.com",
  "client_id": "114400417490176202844",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40leadboost-ai-1966c.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

def check_time_sync():
    """Verifica si la hora del sistema coincide con la de internet"""
    print("\n1. 🕒 Verificando Sincronización de Hora...")
    try:
        # Pedimos la hora a un servidor neutral
        google_time = requests.get("https://google.com").headers['Date']
        # Convertimos formato fecha HTTP a objeto datetime
        server_time = datetime.datetime.strptime(google_time, '%a, %d %b %Y %H:%M:%S %Z')
        local_time = datetime.datetime.utcnow()
        
        print(f"   - Hora Servidor Google (GMT): {server_time.time()}")
        print(f"   - Hora Local Sistema (UTC):   {local_time.time()}")
        print(f"   - Fecha Local Sistema:        {local_time.date()}")

        diff = abs((server_time - local_time).total_seconds())
        
        # Si la diferencia es mayor a 5 minutos (300 segundos)
        if diff > 300:
            print(f"   ❌ ERROR CRÍTICO: Tu reloj está desfasado por {diff/3600:.1f} horas.")
            print("      Google RECHAZARÁ la conexión por seguridad (Invalid JWT).")
            print("      SOLUCIÓN: Ajusta la fecha de tu PC a la fecha real de HOY.")
            return False
        else:
            print("   ✅ Sincronización Correcta (< 5 min diferencia).")
            return True
    except Exception as e:
        print(f"   ⚠️ No se pudo verificar hora online: {e}")
        return True # Intentamos continuar

def connect_firestore():
    print("\n2. 🔥 Intentando Conexión con Credenciales Hardcodeadas...")
    try:
        # Limpiar apps previas si existen
        if firebase_admin._apps:
            for app_name in list(firebase_admin._apps):
                firebase_admin.delete_app(firebase_admin.get_app(app_name))

        # Usar diccionario directo (Solución #3)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        # Prueba real de lectura
        print("   📡 Leyendo base de datos...")
        docs = db.collection('signals').limit(1).get()
        
        print("\n✅ ¡ÉXITO TOTAL! CONEXIÓN ESTABLECIDA.")
        print("   El problema NO eran las credenciales, era la lectura del archivo o la hora.")
        
    except Exception as e:
        print(f"\n❌ ERROR DE CONEXIÓN:\n{e}")
        if "Invalid JWT" in str(e):
             print("\n🛑 DIAGNÓSTICO FINAL: Es 100% un problema de FECHA/HORA (Causa #2).")
             print("   Google no acepta tokens firmados en el futuro (2025).")

if __name__ == "__main__":
    print("--- TEST DE DIAGNÓSTICO FINAL ---")
    time_ok = check_time_sync()
    
    if time_ok:
        connect_firestore()
    else:
        print("\n⚠️ CORRIGE TU RELOJ PRIMERO. La prueba de conexión fallará si no lo haces.")
        # Preguntar si quiere intentar de todos modos
        retry = input("¿Quieres intentar conectar de todos modos? (s/n): ")
        if retry.lower() == 's':
            connect_firestore()