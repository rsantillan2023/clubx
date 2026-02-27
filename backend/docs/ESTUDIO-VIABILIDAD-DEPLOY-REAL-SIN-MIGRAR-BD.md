# Estudio de viabilidad: desplegar nuevo front + back apuntando a la base REAL sin migrar datos

## Contexto

- **Situación:** Levantaste el nuevo frontend y backend en un servidor apuntando a la **misma base de datos real** (producción), sin tocar la BD. Probás y los procesos andan bien: ves los datos de producción desde el nuevo front/back, que tiene muchos cambios pero casi ningún cambio de modelo.
- **Pregunta:** ¿Es viable **solo** montar en un nuevo servidor el nuevo front + back, ejecutar **algunos scripts de base de datos sobre la base real y única**, y dar el salto así?
- **Referencia:** Comparativo modelo vs base real en `MODELO-DATOS-SERVIDOR.md`.

---

## Conclusión corta

**Sí es viable.** La mayoría de las diferencias entre modelo (código) y base real son “la BD es más permisiva” (VARCHAR más largo, DATETIME en vez de DATE, etc.), así que leer y escribir desde la app sigue siendo compatible. Los riesgos concretos son **dos** (y uno opcional):

1. **Tabla UserDealers** no existe en la BD → si el nuevo código la usa, habrá error.
2. **Ticket_Details.state:** en la BD es `VARCHAR(20)` y en el modelo es `INTEGER` → posibles fallos si el código asume siempre número o siempre string.
3. **Ticket_Details.nro_item** solo existe en la BD → solo importa si el nuevo sistema necesita leerlo o escribirlo.

Con uno o dos scripts sobre la base real (y/o pequeños ajustes en código) se puede desplegar sin migrar datos a otra BD.

---

## Por qué hoy “todo anda” contra la base real

- **Lectura:** Sequelize trae lo que hay en la BD y lo mapea a tipos de JavaScript. Que la BD tenga `VARCHAR(255)` y el modelo `STRING(100)` no rompe la lectura; que sea `DATETIME` y el modelo `DATE` tampoco.
- **Escritura:** En casi todos los casos la BD acepta lo que el modelo manda: longitudes iguales o mayores, tipos compatibles (INT/INTEGER, DECIMAL(10,0) → DECIMAL(10,2), etc.). No hace falta cambiar la BD para que el nuevo back escriba bien.
- **Índices:** Que el modelo no declare índices no impide usar la BD; la BD ya los tiene. Solo afectan rendimiento y restricciones que ya existen en prod.

Por eso, en conjunto, “casi no hiciste cambios de modelo” y la base real es compatible con lo que el código espera, salvo los puntos que se detallan abajo.

---

## Riesgos concretos (según el comparativo)

### 1. Tabla **UserDealers** (MUY DISTINTAS)

| Aspecto | Modelo (código) | Base real |
|--------|------------------|-----------|
| Tabla  | Existe           | **No existe** |

- **Riesgo:** Si en el nuevo backend o front hay alguna ruta, servicio o consulta que use la tabla `UserDealers` (p. ej. un `include` o un endpoint que lee/escribe ahí), la app devolverá error de tabla inexistente.
- **Mitigación:**
  - **Opción A:** Revisar que en el nuevo código **nunca** se use `UserDealers`. Si no se usa, no hace falta tocar la BD.
  - **Opción B:** Si sí se usa (o se usará), ejecutar en la base real un script que cree la tabla con la misma estructura que el modelo (CREATE TABLE UserDealers …). No es una migración de datos, solo crear la tabla vacía o con datos iniciales si los necesitás.

**Script posible (solo si la vas a usar):**  
Crear en la base real la tabla según el modelo (id_user_dealer, id_user, id_dealer, etc.). No se incluye aquí el SQL exacto; se puede generar desde el modelo o desde el describe del doc.

---

### 2. **Ticket_Details** (MUY DISTINTAS)

| Aspecto   | Modelo (código) | Base real        |
|----------|------------------|-------------------|
| state    | INTEGER          | **VARCHAR(20)**  |
| nro_item | No existe        | **Existe (INT)** |

#### 2.1 Campo `state`

- **Riesgo:**
  - **Al leer:** La BD devuelve string (ej. `"pendiente"`, `"1"`). Si en el backend o front tratás `state` como número (`state === 1`, `state === 2`, o cálculos), puede fallar o comportarse distinto.
  - **Al escribir:** Si el backend manda `state: 1` (número), MySQL puede convertirlo a `'1'` y guardarlo en un `VARCHAR(20)`, y podría “andar” en muchos casos. Si en algún flujo se espera un string y se manda número (o al revés), puede haber incoherencia o errores según cómo esté escrito el código.
- **Mitigación:**
  - **Sin tocar la BD:** Ajustar todo el código (back y front) para tratar `state` siempre como **string** (comparar con `'pendiente'`, `'1'`, etc.). Así la BD no se toca y el comportamiento es coherente.
  - **Tocando la BD (alinear a modelo):** Ejecutar un script que:
    1. Añada una columna temporal o rellene una columna numérica.
    2. Migre valores (mapeo string → número como en el script de migración).
    3. Cambie el tipo de `state` a `INT` y elimine la columna temporal si aplica.  
    Esto ya sería “cambiar algo” en la base real; solo tiene sentido si querés que el modelo y la BD coincidan y que el código siga usando números.

#### 2.2 Campo `nro_item`

- **Riesgo:** Solo si algún proceso del **nuevo** sistema necesita leer o escribir `nro_item`. Si el nuevo código no lo usa, no pasa nada: Sequelize no lo trae y las inserciones dejarán `nro_item` en NULL o default en la BD.
- **Mitigación:** Si lo necesitás, añadir `nro_item` al modelo de Ticket_Details y listo. No hace falta script en la BD (la columna ya existe).

---

### 3. Tablas solo DISTINTAS (resto)

En el comparativo figuran como DISTINTAS: Actions, Operations, Operations_Types, Partners, Prices, Products_Services, Tickets, Users_Roles, Visits. Las diferencias son:

- Longitudes mayores en la BD (ej. `description` 255 en BD, 100 en modelo; `observations` 2000 en BD, 255 en modelo).
- Tipos “equivalentes” (DATE vs DATETIME, INTEGER vs BIGINT, BOOLEAN vs TINYINT).
- Orden de columnas distinto (no afecta a Sequelize).
- Índices que están en la BD y no en el modelo (no obligan a cambiar nada para que la app funcione).

**Riesgo en deploy:** En la práctica, **ninguno** para el escenario “mismo servidor de BD, solo cambio de app”. La BD ya acepta lo que el modelo escribe y devuelve lo que el modelo lee. No hace falta ejecutar scripts sobre estas tablas para “hacer viable” el deploy.

---

## Qué scripts de base de datos tendría sentido ejecutar sobre la base REAL

Resumen:

| Objetivo                         | ¿Hace falta? | Comentario |
|----------------------------------|-------------|------------|
| Crear tabla **UserDealers**      | Solo si el nuevo código la usa | Un único `CREATE TABLE` según el modelo. |
| Cambiar **Ticket_Details.state** a INTEGER | Opcional | Solo si querés alinear BD al modelo y seguir usando números en el código; exige migración de datos (string → int). |
| Añadir índices                   | No          | La BD real ya tiene los índices; el modelo no los declara pero no es bloqueante. |
| Cambiar longitudes o tipos en el resto | No   | La BD es más permisiva; no hace falta. |

Es decir: el despliegue puede ser “solo app nueva + (opcionalmente) un script que cree UserDealers y/o alinee Ticket_Details.state”.

---

## Problemas que podés encontrar (checklist)

1. **Error tipo “Table '…'.UserDealers doesn't exist”**  
   → Algún flujo del nuevo back (o un include) usa UserDealers. Solución: dejar de usarla o crear la tabla en la base real.

2. **Comportamiento raro o errores en lógica que usa Ticket_Details.state**  
   → Mezcla de tipos (código espera número, BD devuelve string, o al revés). Solución: unificar en código (todo string) o unificar en BD (campo numérico + script de migración).

3. **Si en el futuro algo necesita Ticket_Details.nro_item**  
   → El modelo no lo tiene. Solución: agregar el campo al modelo (la columna ya está en la BD).

4. **Nada más del comparativo** debería impedir “montar nuevo front + back, apuntar a la base real y ejecutar algunos scripts y listo”. El resto son diferencias que ya convivís en tus pruebas sin tocar la BD.

---

## Recomendación final

- **Es viable** desplegar en un nuevo servidor el nuevo front y back apuntando a la **base real y única**, y usar solo **algunos scripts** sobre esa misma base (sin migrar datos a otra BD).
- **Acciones sugeridas antes del corte:**
  1. Confirmar si el nuevo código usa **UserDealers**. Si no, no hacer nada en BD. Si sí, preparar y ejecutar un script que cree la tabla en la base real.
  2. Revisar todo el uso de **Ticket_Details.state** (back y front): si hoy ya funciona con lo que devuelve la BD (strings), documentar que “state es string” y no tocar la BD. Si preferís que sea número, preparar el script de migración (string → int) y el `ALTER` correspondiente.
  3. No hace falta tocar el resto de tablas ni índices para que el deploy sea viable; las diferencias del comparativo no lo impiden.

Con eso, el esquema “nuevo servidor + nuevo front + nuevo back + base real + (opcional) 1–2 scripts sobre esa base” es coherente con el análisis del documento `MODELO-DATOS-SERVIDOR.md` y con lo que ya probaste en tu entorno.
