# Imágenes de Productos y Servicios

## Dónde se guardan

- **Carpeta en disco**: el backend guarda los archivos en:
  - **Desarrollo**: `backend/src/uploads/products-services/`
  - **Producción (dist)**: `backend/uploads/products-services/`
- **Subida**: desde http://localhost:8080/products-services, al crear/editar un producto se adjunta una imagen. La petición va a `POST {API}/products_services/upload`.
- **Respuesta del upload**: el backend devuelve una URL relativa, ej. `/uploads/products-services/product-1234567890-abc-nombre.jpg`. Esa es la que se guarda en la BD (campo `url_image`).

## Cómo se sirven

- El **mismo servidor del API** (Express) sirve los estáticos con `app.use('/uploads', express.static(uploadsPath))`.
- En desarrollo, `uploadsPath` = `backend/src/uploads`. En producción, `backend/uploads`.
- Las imágenes se piden al mismo host y puerto que el API. Ej.: si el backend está en `http://localhost:3000`, las imágenes están en `http://localhost:3000/uploads/products-services/...`.

## Cómo las consume el frontend

- En **.env** del frontend:
  - **VUE_APP_UPLOADS_ORIGIN** (opcional): origen para las URLs de imagen, ej. `http://localhost:3000`. Si lo definís, las imágenes se piden ahí. **Recomendado** si el backend corre en un puerto distinto a VUE_APP_DEGIRA (ej. backend en 3000 y DEGIRA en 3001).
  - Si no está definido, se usa el origen de **VUE_APP_DEGIRA** (ej. `http://localhost:3001`).
- Las imágenes se arman como: `{origen}/uploads/products-services/...`
- Se usa en: ProductsServices.vue, ProductCard.vue (venta), ProductCard.vue (lockers).

## Si no se ven las imágenes

1. **Puerto correcto**: el backend por defecto usa el puerto **3000** (`PORT` en .env o `process.env.PORT || 3000`). Si tu backend corre en 3000 pero en el frontend tenés `VUE_APP_DEGIRA=http://localhost:3001/v1/`, las imágenes se pedirán a 3001 y fallarán. **Solución**: en el frontend agregá en `.env`:
   ```
   VUE_APP_UPLOADS_ORIGIN=http://localhost:3000
   ```
   (o hacé correr el backend con `PORT=3001` y dejad todo en 3001.)

2. **Comprobar que el archivo existe**: en la consola del backend al arrancar debería salir "Serving static files from: ..." y "Upload directory (absolute): ...". Verificá que en esa carpeta exista `products-services/product-xxxxx.png`.

3. **Probar la URL en el navegador**: si en la BD `url_image` es `/uploads/products-services/product-1772118056879-5xmevj-ima1.png`, abrí directamente:
   `http://localhost:3000/uploads/products-services/product-1772118056879-5xmevj-ima1.png`
   (reemplazá 3000 por el puerto donde corre tu backend). Si responde 404, el archivo no está en la carpeta que sirve Express o el puerto es otro.
