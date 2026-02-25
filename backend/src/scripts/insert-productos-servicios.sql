-- =====================================================
-- SCRIPT PARA INSERTAR PRODUCTOS/SERVICIOS
-- Inserta los productos con sus precios en efectivo
-- =====================================================

-- Verificar productos existentes antes de insertar
SELECT 
    'PRODUCTOS EXISTENTES' AS verificacion,
    id_product_service,
    description,
    price,
    available
FROM `Products_Services`
ORDER BY id_product_service DESC
LIMIT 10;

-- Insertar productos/servicios
-- Nota: Los precios están en formato decimal (5000.00 = $5.000)
INSERT INTO `Products_Services` 
    (`description`, `available`, `long_description`, `price`, `url_image`, `featured`)
VALUES
    ('Gaseosas', 100, 'Gaseosas varias', 5000.00, NULL, 0),
    ('Cervezas Común', 100, 'Cervezas comunes', 7000.00, NULL, 0),
    ('Fernet c/Coca', 100, 'Fernet con Coca Cola', 11000.00, NULL, 0),
    ('Tragos Combinados', 100, 'Tragos combinados varios', 11000.00, NULL, 0),
    ('Tragos Frozen', 100, 'Tragos frozen', 11000.00, NULL, 0),
    ('Champagne 1°', 100, 'Champagne primera calidad', 45000.00, NULL, 0),
    ('Champagne 2° / Vino', 100, 'Champagne segunda calidad o Vino', 35000.00, NULL, 0),
    ('Champagne Baron B', 100, 'Champagne Baron B', 65000.00, NULL, 0),
    ('Champagne Baby', 100, 'Champagne Baby', 18000.00, NULL, 0),
    ('Lata / Cerveza 1°', 100, 'Lata o Cerveza primera calidad', 10000.00, NULL, 0),
    ('Speed con Vodka', 100, 'Speed con Vodka', 12000.00, NULL, 0),
    ('Sup. Alcohólico 1°', 100, 'Superior alcohólico primera calidad', 15000.00, NULL, 0),
    ('Sup. Alcohólico 2°', 100, 'Superior alcohólico segunda calidad', 14000.00, NULL, 0),
    ('Whisky Importado 1°', 100, 'Whisky importado primera calidad', 18000.00, NULL, 0),
    ('Whisky Importado 2°', 100, 'Whisky importado segunda calidad', 17000.00, NULL, 0),
    ('Whisky Nacional', 100, 'Whisky nacional', 9000.00, NULL, 0),
    ('Cigarrillos', 100, 'Cigarrillos', 11000.00, NULL, 0),
    ('Kiosco / Descartables', 100, 'Productos de kiosco y descartables', 4000.00, NULL, 0);

-- Verificar productos insertados
SELECT 
    'PRODUCTOS INSERTADOS' AS verificacion,
    id_product_service,
    description,
    price,
    available,
    featured
FROM `Products_Services`
WHERE description IN (
    'Gaseosas',
    'Cervezas Común',
    'Fernet c/Coca',
    'Tragos Combinados',
    'Tragos Frozen',
    'Champagne 1°',
    'Champagne 2° / Vino',
    'Champagne Baron B',
    'Champagne Baby',
    'Lata / Cerveza 1°',
    'Speed con Vodka',
    'Sup. Alcohólico 1°',
    'Sup. Alcohólico 2°',
    'Whisky Importado 1°',
    'Whisky Importado 2°',
    'Whisky Nacional',
    'Cigarrillos',
    'Kiosco / Descartables'
)
ORDER BY description;


