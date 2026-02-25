-- Script para agregar las entradas en Operations_Types

-- 1. Base de datos de socios - Rol ADMIN (id_role = 3)
INSERT INTO `Operations_Types` 
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
('Base de datos de socios', 'Muestra una grilla completa de todos los socios con búsqueda, filtros y ordenamiento', 3, NULL, 'mdi-database-search', '/partners-database', 1, 12);

-- 2. CRUD de Tablas - Rol CAJA (id_role = 1)
INSERT INTO `Operations_Types` 
(`description`, `action`, `id_role`, `tag`, `icon`, `path`, `menu_available`, `order`) 
VALUES 
('CRUD de Tablas', 'Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre las tablas del sistema', 1, NULL, 'mdi-database', '/table-crud', 1, 13);

