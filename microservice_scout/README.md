# Microservice Scout

Este microservicio implementa la exploración y análisis de tendencias, redes sociales y fuentes externas para LeadBoostAI, integrando adaptadores para TikTok, Reddit, RSS y visión computacional.

## Estructura principal

- **main_scout.py**: Punto de entrada principal del microservicio.
- **requirements.txt**: Dependencias Python necesarias.
- **test_rss.py**: Pruebas de integración con fuentes RSS.

## Subcarpetas y módulos

### core/
Módulos centrales de lógica y adaptadores:
- **db_adapter.py**: Adaptador de base de datos.
- **network/**: Cliente de red y proxy (ghost_client.py).
- **postgres_adapter.py**: Adaptador para base de datos PostgreSQL.
- **reddit_scout.py**: Adaptador para exploración de Reddit.
- **scout_normalizer.py**: Normalización de datos externos.
- **tiktok_scout.py**: Adaptador para exploración de TikTok.
- **trends_scout.py**: Análisis de tendencias.
- **vision_engine.py**: Motor de visión computacional.

### tests/
Pruebas unitarias y de integración:
- **test_ghost.py**: Pruebas del cliente ghost.
- **test_infra_proxy.py**: Pruebas de proxy de infraestructura.
- **test_tiktok_integration.py**: Pruebas de integración con TikTok.
- **test_vision_standalone.py**: Pruebas del motor de visión.

## Uso

1. Instala las dependencias:
	```bash
	pip install -r requirements.txt
	```
2. Configura variables de entorno y parámetros según la documentación interna.
3. Ejecuta el microservicio:
	```bash
	python main_scout.py
	```

## Recomendaciones

- Revisa y adapta los adaptadores de red y normalización según los requisitos del entorno.
- Utiliza los módulos de tendencias y visión para análisis avanzado de fuentes externas.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
