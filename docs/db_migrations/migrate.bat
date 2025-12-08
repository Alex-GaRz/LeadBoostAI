@echo off
REM =============================================================================
REM LEADBOOST AI - SCRIPT DE MIGRACION A POSTGRESQL
REM Ejecuta la migración completa del Blueprint RFC-PHOENIX-01
REM =============================================================================

echo.
echo ========================================================================
echo LEADBOOST AI - MIGRACION A POSTGRESQL (RFC-PHOENIX-01)
echo ========================================================================
echo.

REM Verificar que psql está en el PATH
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encuentra 'psql' en el PATH
    echo.
    echo Soluciones:
    echo 1. Agregar PostgreSQL\bin al PATH del sistema
    echo 2. O ejecutar desde el directorio de PostgreSQL
    echo 3. O usar: SET PATH=%%PATH%%;C:\Program Files\PostgreSQL\15\bin
    echo.
    pause
    exit /b 1
)

REM Configuración de conexión
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGDATABASE=leadboost_ai

echo Configuracion de conexion:
echo   Host: %PGHOST%
echo   Puerto: %PGPORT%
echo   Usuario: %PGUSER%
echo   Base de datos: %PGDATABASE%
echo.

REM Menú de opciones
:MENU
echo Seleccione una opcion:
echo.
echo   1 - Ejecutar migracion COMPLETA (recomendado)
echo   2 - Ejecutar migracion + datos de prueba
echo   3 - Solo insertar datos de prueba
echo   4 - Verificar estado de la base de datos
echo   5 - ROLLBACK - Eliminar todo (EMERGENCIA)
echo   0 - Salir
echo.
set /p OPTION="Opcion: "

if "%OPTION%"=="1" goto FULL_MIGRATION
if "%OPTION%"=="2" goto MIGRATION_WITH_SEED
if "%OPTION%"=="3" goto SEED_ONLY
if "%OPTION%"=="4" goto VERIFY
if "%OPTION%"=="5" goto ROLLBACK
if "%OPTION%"=="0" goto END
goto MENU

REM =============================================================================
REM OPCION 1: MIGRACION COMPLETA
REM =============================================================================
:FULL_MIGRATION
echo.
echo ========================================================================
echo EJECUTANDO MIGRACION COMPLETA
echo ========================================================================
echo.
echo ADVERTENCIA: Este proceso creara todos los esquemas y tablas.
echo Si ya existen, habra errores (ignorables si es re-ejecucion).
echo.
pause

SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f 000_master_migration.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Migracion completada exitosamente
    echo.
) else (
    echo.
    echo [ERROR] Hubo problemas durante la migracion
    echo Revise los mensajes anteriores para mas detalles
    echo.
)

pause
goto MENU

REM =============================================================================
REM OPCION 2: MIGRACION + DATOS DE PRUEBA
REM =============================================================================
:MIGRATION_WITH_SEED
echo.
echo ========================================================================
echo EJECUTANDO MIGRACION COMPLETA + DATOS DE PRUEBA
echo ========================================================================
echo.
pause

SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f 000_master_migration.sql
if %ERRORLEVEL% NEQ 0 goto ERROR_HANDLER

echo.
echo Insertando datos de prueba...
echo.
SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f 008_seed_data.sql
if %ERRORLEVEL% NEQ 0 goto ERROR_HANDLER

echo.
echo [EXITO] Migracion y datos de prueba insertados
echo.
pause
goto MENU

REM =============================================================================
REM OPCION 3: SOLO DATOS DE PRUEBA
REM =============================================================================
:SEED_ONLY
echo.
echo ========================================================================
echo INSERTANDO DATOS DE PRUEBA
echo ========================================================================
echo.

SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f 008_seed_data.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Datos de prueba insertados
    echo.
) else (
    echo.
    echo [ERROR] Error al insertar datos de prueba
    echo.
)

pause
goto MENU

REM =============================================================================
REM OPCION 4: VERIFICAR ESTADO
REM =============================================================================
:VERIFY
echo.
echo ========================================================================
echo VERIFICANDO ESTADO DE LA BASE DE DATOS
echo ========================================================================
echo.

SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -c "SELECT schema_name, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = s.schema_name) as table_count FROM information_schema.schemata s WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration') ORDER BY schema_name;"

echo.
echo Tenants registrados:
SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -c "SELECT id, name, status, tier FROM iam.tenants;" 2>nul

echo.
pause
goto MENU

REM =============================================================================
REM OPCION 5: ROLLBACK DE EMERGENCIA
REM =============================================================================
:ROLLBACK
echo.
echo ========================================================================
echo ROLLBACK - ELIMINAR TODA LA MIGRACION
echo ========================================================================
echo.
echo  !!!!! ADVERTENCIA CRITICA !!!!!
echo.
echo Este proceso eliminara PERMANENTEMENTE:
echo   - Todos los esquemas creados (iam, finanzas, stock, gobernanza, sys, events, migration)
echo   - Todas las tablas y sus datos
echo   - Todas las funciones y triggers
echo   - Todas las vistas
echo.
echo ESTO NO ES REVERSIBLE. Asegurese de tener backups.
echo.
set /p CONFIRM="¿Confirmar ROLLBACK? Escriba 'SI' para continuar: "

if /I NOT "%CONFIRM%"=="SI" (
    echo.
    echo Rollback cancelado.
    echo.
    pause
    goto MENU
)

echo.
echo Ejecutando rollback...
echo.

SET PGCLIENTENCODING=UTF8
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f 999_rollback.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [EXITO] Rollback completado
    echo.
) else (
    echo.
    echo [ERROR] Error durante el rollback
    echo.
)

pause
goto MENU

REM =============================================================================
REM MANEJO DE ERRORES
REM =============================================================================
:ERROR_HANDLER
echo.
echo [ERROR] La operacion fallo con codigo de error: %ERRORLEVEL%
echo.
pause
goto MENU

REM =============================================================================
REM SALIR
REM =============================================================================
:END
echo.
echo Saliendo...
echo.
exit /b 0
