-- Script para limpiar URLs de imágenes en Products_Services
-- Remueve /v1/ de las URLs y convierte URLs completas a rutas relativas

-- 1. Limpiar URLs que tienen /v1/uploads/ y convertirlas a /uploads/
UPDATE Products_Services
SET url_image = REPLACE(url_image, '/v1/uploads/', '/uploads/')
WHERE url_image LIKE '%/v1/uploads/%';

-- 2. Limpiar URLs completas de localhost que tienen /v1/ y convertirlas a rutas relativas
UPDATE Products_Services
SET url_image = SUBSTRING(url_image, LOCATE('/uploads/', url_image))
WHERE url_image LIKE 'http://localhost:3000/v1/uploads/%'
   OR url_image LIKE 'http://localhost:3000/v1/uploads/%';

-- 3. Limpiar URLs completas de localhost sin /v1/ y convertirlas a rutas relativas
UPDATE Products_Services
SET url_image = SUBSTRING(url_image, LOCATE('/uploads/', url_image))
WHERE url_image LIKE 'http://localhost:3000/uploads/%'
   AND url_image NOT LIKE '/uploads/%';

-- 4. Verificar resultados
SELECT 
    id_product_service,
    description,
    url_image,
    CASE 
        WHEN url_image LIKE 'http://%' THEN 'URL completa'
        WHEN url_image LIKE '/uploads/%' THEN 'Ruta relativa correcta'
        WHEN url_image LIKE '/v1/%' THEN 'Tiene /v1/ - necesita limpieza'
        ELSE 'Otro formato'
    END AS tipo_url
FROM Products_Services
WHERE url_image IS NOT NULL AND url_image != ''
ORDER BY id_product_service DESC;

