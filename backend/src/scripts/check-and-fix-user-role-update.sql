-- =====================================================
-- SCRIPT PARA VERIFICAR Y CORREGIR EL UPDATE DE Users_Roles
-- =====================================================

-- 1. Verificar qué roles existen
SELECT 
    'ROLES EXISTENTES' AS verificacion,
    id_role,
    description
FROM `Roles`
ORDER BY id_role;

-- 2. Verificar el registro que se quiere actualizar
SELECT 
    'REGISTRO ACTUAL' AS verificacion,
    ur.id_user_role,
    ur.id_user,
    ur.id_role AS rol_actual,
    r.description AS descripcion_rol_actual,
    u.username,
    u.name,
    u.surname
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user_role = 107;

-- 3. Verificar si existe el rol 7
SELECT 
    'VERIFICAR ROL 7' AS verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM `Roles` WHERE id_role = 7) 
        THEN '✓ El rol 7 EXISTE'
        ELSE '✗ El rol 7 NO EXISTE - Por eso falla el UPDATE'
    END AS resultado;

-- =====================================================
-- OPCIONES PARA SOLUCIONAR:
-- =====================================================

-- OPCIÓN 1: Si quieres crear el rol 7 primero
-- INSERT INTO `Roles` (description) VALUES ('NUEVO_ROL');

-- OPCIÓN 2: Si quieres cambiar a un rol existente (por ejemplo, rol 3 = ADMIN)
-- UPDATE `Users_Roles` 
-- SET id_role = 3 
-- WHERE id_user_role = 107;

-- OPCIÓN 3: Si quieres eliminar la asignación (no recomendado, mejor usar un rol válido)
-- DELETE FROM `Users_Roles` WHERE id_user_role = 107;

-- =====================================================
-- SCRIPT COMPLETO PARA ACTUALIZAR A UN ROL VÁLIDO
-- =====================================================
-- Cambia el 3 por el id_role que necesites (1-6)
UPDATE `Users_Roles` 
SET id_role = 3 
WHERE id_user_role = 107;

-- Verificar el cambio
SELECT 
    ur.id_user_role,
    ur.id_user,
    ur.id_role,
    r.description AS rol,
    u.username
FROM `Users_Roles` ur
LEFT JOIN `Roles` r ON ur.id_role = r.id_role
LEFT JOIN `Users` u ON ur.id_user = u.id_user
WHERE ur.id_user_role = 107;


