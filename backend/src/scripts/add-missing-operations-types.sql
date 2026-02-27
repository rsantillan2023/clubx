-- =====================================================
-- Agrega las pantallas que faltan en Operations_Types
-- (existen en el router del frontend pero no en la BD).
-- Seguro: solo inserta si el path no existe.
-- =====================================================

SET NAMES utf8mb4;

-- /accessMembership - Validación de Membresia
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Validación de Membresia', 'Validar membresía de socio al acceso', 1, NULL, 'mdi-card-account-details', '/accessMembership', 1, 50
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/accessMembership');

-- /account - Usuario
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Usuario', 'Cuenta y datos del usuario logueado', 1, NULL, 'mdi-account', '/account', 1, 51
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/account');

-- /historicalVisits - Histórico de Visitantes
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Histórico de Visitantes por Día', 'Ver histórico de visitantes por día', 1, NULL, 'mdi-calendar-clock', '/historicalVisits', 1, 52
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/historicalVisits');

-- /visitsConsumptions - Consumos por Visita
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Consumos por Visita', 'Ver consumos por visita', 1, NULL, 'mdi-format-list-bulleted', '/visitsConsumptions', 1, 53
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/visitsConsumptions');

-- /table-crud - CRUD de Tablas
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'CRUD de Tablas', 'Operaciones CRUD sobre las tablas del sistema', 1, NULL, 'mdi-database', '/table-crud', 1, 54
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/table-crud');

-- /partners-database - Base de datos de socios
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Base de datos de socios', 'Grilla de socios con búsqueda y filtros', 3, NULL, 'mdi-database-search', '/partners-database', 1, 55
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/partners-database');

-- /products-services - Gestión de Productos y Servicios
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Gestión de Productos y Servicios', 'Alta, modificación y precios de productos/servicios', 1, NULL, 'mdi-store', '/products-services', 1, 56
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/products-services');

-- /prices-management - Gestión de Precios
INSERT INTO `Operations_Types` (`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`)
SELECT 'Gestión de Precios', 'Gestionar precios de productos y servicios', 1, NULL, 'mdi-currency-usd', '/prices-management', 1, 57
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Operations_Types` WHERE `path` = '/prices-management');
