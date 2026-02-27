<template>
<div>
    <v-card 
        elevation="2" 
        :class="['product-card', { 'featured-card': item.featured }]"
        :style="item.featured ? 'border: solid 2px #FF9800;' : ''"
        class="overflow-hidden">
        
        <!-- Imagen del producto con fondo -->
        <div class="product-image-container">
            <v-img 
                v-if="getImageUrl(item.url_image)"
                :src="getImageUrl(item.url_image)" 
                :lazy-src="getImageUrl(item.url_image)"
                class="product-image"
                contain
                aspect-ratio="1"
                @error="handleImageError">
                <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular
                            color="orange"
                            indeterminate
                            size="40">
                        </v-progress-circular>
                    </div>
                </template>
            </v-img>
            <div v-else class="d-flex align-center justify-center fill-height product-image-placeholder">
                <v-icon color="grey" size="48">mdi-image-off</v-icon>
            </div>
            <v-chip
                v-if="item.featured"
                x-small
                color="orange"
                dark
                class="featured-badge"
                absolute
                top
                right>
                <v-icon x-small left>mdi-star</v-icon>
                Destacado
            </v-chip>
        </div>

        <!-- Contenido de la tarjeta -->
        <v-card-text class="pa-2 pb-1">
            <div class="product-title mb-1">{{item.description}}</div>
            <div class="product-description mb-2">{{item.long_description}}</div>
            
            <!-- Precio -->
            <div class="d-flex align-center justify-space-between mb-2">
                <div class="product-price-container">
                    <span class="product-price">${{formatNumber(item.price)}}</span>
                    <span class="price-unit">c/u</span>
                </div>
            </div>
        </v-card-text>

        <!-- Acciones -->
        <v-card-actions class="pa-2 pt-0">
            <v-divider class="mb-2"></v-divider>
            
            <!-- Selector de cantidad -->
            <div class="quantity-selector">
                <v-btn 
                    fab 
                    :dark="item.cantidad > 0" 
                    elevation="0" 
                    x-small 
                    color="orange" 
                    :disabled="item.cantidad == 0" 
                    @click="$emit('remove')"
                    class="quantity-btn">
                    <v-icon size="16">mdi-minus</v-icon>
                </v-btn>

                <div class="quantity-display">
                    <span class="quantity-number">{{item.cantidad}}</span>
                    <span class="quantity-label">Cantidad</span>
                </div>

                <v-btn 
                    fab 
                    dark 
                    elevation="0" 
                    x-small 
                    color="orange" 
                    @click="$emit('add')"
                    class="quantity-btn">
                    <v-icon size="16">mdi-plus</v-icon>
                </v-btn>
            </div>

            <!-- Botón eliminar -->
            <v-btn 
                v-if="item.cantidad > 0"
                icon 
                x-small 
                color="error" 
                class="delete-btn"
                @click="$emit('delete')"
                absolute
                top
                right>
                <v-icon size="16">mdi-close-circle</v-icon>
            </v-btn>
        </v-card-actions>
    </v-card>
</div>
</template>

<script>
    export default{
        props:{
            item: {}
        },
        data(){
            return{
                imageError: false
            }
        },
        methods: {
            formatNumber(num) {
                if (!num && num !== 0) return '0';
                return num.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            },
            getImageUrl(url) {
                if (!url || !url.trim()) {
                    return null;
                }
                
                let cleanUrl = url.trim();
                
                // Origen = mismo que el API (VUE_APP_DEGIRA)
                let apiOrigin = 'http://localhost:3000';
                try {
                    if (process.env.VUE_APP_DEGIRA) apiOrigin = new URL(process.env.VUE_APP_DEGIRA).origin;
                } catch (_e) {
                    // fallback apiOrigin
                }
                
                // Si ya es URL completa, reconstruir con origen correcto (por si en BD tiene otro puerto)
                if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                    try {
                        const pathname = new URL(cleanUrl).pathname;
                        return pathname ? `${apiOrigin}${pathname}` : cleanUrl;
                    } catch (_e) {
                        return cleanUrl;
                    }
                }
                
                cleanUrl = cleanUrl.replace(/^\/v1\//, '/');
                
                if (cleanUrl.startsWith('/uploads/')) {
                    return `${apiOrigin}${cleanUrl}`;
                }
                
                if (cleanUrl && !cleanUrl.includes('/')) {
                    return `${apiOrigin}/uploads/products-services/${cleanUrl}`;
                }
                
                return null;
            },
            handleImageError(event) {
                console.warn('Error al cargar imagen:', event.target.src);
                this.imageError = true;
                // Intentar cargar una imagen por defecto o mostrar placeholder
                if (event.target) {
                    event.target.style.display = 'none';
                }
            }
        }
    }
</script>

<style scoped>
.product-card {
    transition: all 0.3s ease;
    border-radius: 8px !important;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.featured-card {
    background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%);
}

.product-image-container {
    position: relative;
    width: 100%;
    height: 120px;
    background: #f5f5f5;
    overflow: hidden;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
}

.product-image-placeholder {
    background: #f5f5f5;
    width: 100%;
    height: 100%;
}

.featured-badge {
    margin: 4px !important;
    font-weight: 600;
    font-size: 0.65rem !important;
    height: 20px !important;
}

.product-title {
    font-size: 0.9rem !important;
    font-weight: 600;
    line-height: 1.3;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.6em;
}

.product-description {
    font-size: 0.7rem !important;
    line-height: 1.2;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.4em;
}

.product-price-container {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.product-price {
    font-size: 0.95rem !important;
    font-weight: 700;
    color: #FF9800;
    line-height: 1;
}

.price-unit {
    font-size: 0.65rem !important;
    color: #999;
    font-weight: 400;
}

.quantity-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 4px 0;
}

.quantity-btn {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.quantity-btn:hover {
    transform: scale(1.1);
    transition: transform 0.2s;
}

.quantity-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 40px;
    padding: 0 8px;
}

.quantity-number {
    font-size: 1.1rem !important;
    font-weight: 700;
    color: #333;
    line-height: 1.2;
}

.quantity-label {
    font-size: 0.6rem !important;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.delete-btn {
    position: absolute !important;
    top: 4px;
    right: 4px;
    z-index: 10;
}

.product-card ::v-deep .v-card__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px !important;
}

.product-card ::v-deep .v-card__actions {
    padding: 8px !important;
    padding-top: 0 !important;
}

.product-card ::v-deep .v-divider {
    margin: 0 !important;
}

/* Mejoras para pantallas pequeñas */
@media (max-width: 600px) {
    .product-image-container {
        height: 100px;
    }
    
    .product-title {
        font-size: 0.85rem !important;
    }
    
    .product-price {
        font-size: 1rem !important;
    }
}
</style>