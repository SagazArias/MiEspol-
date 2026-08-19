# Campus ESPOL+ (prototipos-alta-resolucion)

Prototipo MVP en **Expo (React Native)** inspirado en Mi ESPOL.

---

## 🚀 Módulos nuevos

* **🌤️ Ruta Inteligente según el clima**: 
  * **Origen:** GPS del usuario en tiempo real.
  * **Destinos:** 14 edificios y facultades principales de ESPOL (integración vía KML).
  * **Clima:** Integración en vivo con Open-Meteo (temperatura, radiación UV, humedad, sensación térmica).
  * **Mapa del Campus:** Desarrollado con Leaflet, con trazado de senderos y alternativas de ruta (más rápida, sombreada, sencilla).

* **⚠️ Alertas Inteligentes sobre obstáculos**: 
  * **Reporte colaborativo:** Permite a los usuarios reportar contratiempos en la ruta adjuntando descripción e imagen.
  * **Bandeja de notificaciones:** Panel centralizado donde la comunidad visualiza los obstáculos reportados en tiempo real.
  * **Validación comunitaria:** Pregunta a los usuarios si el obstáculo persiste; si 3 usuarios diferentes confirman que se ha despejado, la alerta se elimina automáticamente del mapa.

* **🏆 Premios & Movilidad Activa**: 
  * Integración del podómetro del móvil para el conteo de pasos durante la navegación.
  * Tabla de clasificación semanal con visualización del Top 3 de ganadores, tu posición en el ranking y puntos acumulados.
  * Sistema de misiones diarias y semanales para equilibrar las oportunidades de recompensa.
  * Catálogo de cupones canjeables por descuentos en productos seleccionados de **ESPOL Shop**.
  * Promoción de los beneficios de la movilidad activa (salud física y reducción de huella de carbono).

---

## 📍 Datos del campus

* **Fuente:** `assets/campus/Mapa-ESPOL.kml` *(y capas derivadas en `assets/campus/`)*.
* **Destinos principales (14 en total):**

| N.º | Destino | N.º | Destino |
|---|---|---|---|
| 1 | CTI | 8 | FCSH |
| 2 | Admisiones | 9 | FCNM |
| 3 | FCV | 10 | UBP |
| 4 | Residencias | 11 | FIEC |
| 5 | FIMCM | 12 | FIMCP |
| 6 | Rectorado | 13 | FICT |
| 7 | Biblioteca | 14 | FADCOM |

---

## ⚡ Arranque del proyecto

1. **Instalar dependencias e iniciar el servidor:**
   ```bash
   npm install
   npm start
