# Modelo de datos del servidor (schema degira)

En cada sección se muestra:

- **Describe — CODIGO:** estructura según el modelo Sequelize en el código (`backend/src/database/schemas/degira/models/`).
- **Describe — BASE REAL:** estructura obtenida de la base de datos MySQL del servidor (`degira_develop`).
- **Diff:** comparación entre ambos: **IGUALES**, **DISTINTAS** (diferencias menores: tipos, longitudes, orden, índices) o **MUY DISTINTAS** (campos distintos, tablas faltantes, etc.), con detalle de en qué difieren.

---

## 1. Actions

**Describe — CODIGO**

| Campo        | Tipo           | Null | Key | Extra          |
|-------------|----------------|------|-----|----------------|
| id_action   | INTEGER        | NO   | PRI | auto_increment |
| description | STRING(100)    | YES  |     |                |

**Describe — BASE REAL**

| Field      | Type         | Null | Key | Extra          |
|------------|--------------|------|-----|----------------|
| id_action  | INT(10,0)    | NO   | PRI | auto_increment |
| description | VARCHAR(255) | YES  |     |                |

**Diff:** **DISTINTAS**
- `description`: en código STRING(100), en BD VARCHAR(255) (longitud distinta).

`timestamps: false`

---

## 2. Days

**Describe — CODIGO**

| Campo   | Tipo        | Null | Key | Extra          |
|---------|-------------|------|-----|----------------|
| id_day  | INTEGER     | NO   | PRI | auto_increment |
| name    | STRING(100)  | YES  |     |                |

**Describe — BASE REAL**

| Field     | Type        | Null | Key | Extra          |
|-----------|-------------|------|-----|----------------|
| id_day    | INT(10,0)   | NO   | PRI | auto_increment |
| name      | VARCHAR(100)| YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 3. Operations

**Describe — CODIGO**

| Campo             | Tipo            | Null | Key | Extra          |
|-------------------|-----------------|------|-----|----------------|
| id_operation      | BIGINT          | NO   | PRI | auto_increment |
| id_user           | BIGINT          | YES  |     |                |
| id_operation_type  | INTEGER         | YES  |     |                |
| operation_metadata| JSON            | YES  |     |                |
| operation_log     | JSON            | YES  |     |                |
| id_partner        | BIGINT          | YES  |     |                |
| id_visit          | BIGINT          | YES  |     |                |
| id_role           | INTEGER         | YES  |     |                |
| operation_date    | DATE            | YES  |     |                |
| operation_amount  | DECIMAL(10,2)   | YES  |     |                |
| id_payment_method | INTEGER         | YES  |     |                |
| id_day            | INTEGER         | YES  |     |                |

**Describe — BASE REAL**

| Field              | Type           | Null | Key | Extra          |
|--------------------|----------------|------|-----|----------------|
| id_operation       | BIGINT(19,0)   | NO   | PRI | auto_increment |
| id_user           | BIGINT(19,0)   | YES  | MUL |                |
| id_operation_type | INT(10,0)      | YES  | MUL |                |
| operation_metadata| JSON           | YES  |     |                |
| operation_log     | JSON           | YES  |     |                |
| id_partner        | BIGINT(19,0)   | YES  | MUL |                |
| id_visit          | BIGINT(19,0)   | YES  | MUL |                |
| operation_date    | DATETIME       | YES  |     |                |
| id_role           | INT(10,0)      | YES  | MUL |                |
| operation_amount  | DECIMAL(10,0)  | YES  |     |                |
| id_payment_method | INT(10,0)      | YES  | MUL |                |
| id_day            | INT(10,0)      | YES  | MUL |                |

**Diff:** **DISTINTAS**
- Orden de columnas distinto en BD (operation_date e id_role antes de operation_amount).
- `operation_date`: código DATE, BD DATETIME.
- `operation_amount`: código DECIMAL(10,2), BD DECIMAL(10,0) (sin decimales).
- BD tiene índices MUL en varias FKs; código no los declara.

`timestamps: false`

---

## 4. Operations_Types

**Describe — CODIGO**

| Campo          | Tipo         | Null | Key | Extra          |
|----------------|--------------|------|-----|----------------|
| id_operation_type | INTEGER    | NO   | PRI | auto_increment |
| description    | STRING(255)   | YES  |     |                |
| action         | STRING(255)   | YES  |     |                |
| id_role        | INTEGER      | YES  |     |                |
| tag            | STRING(10)    | YES  |     |                |
| icon           | STRING(255)   | YES  |     |                |
| path           | STRING(45)    | YES  |     |                |
| order          | INTEGER      | YES  |     |                |
| menu_available | TINYINT      | YES  |     |                |

**Describe — BASE REAL**

| Field             | Type         | Null | Key | Extra          |
|-------------------|--------------|------|-----|----------------|
| id_operation_type | INT(10,0)    | NO   | PRI | auto_increment |
| description       | VARCHAR(255) | YES  |     |                |
| action            | VARCHAR(255) | YES  |     |                |
| id_role           | INT(10,0)    | YES  | MUL |                |
| tag               | VARCHAR(10)  | YES  |     |                |
| icon              | VARCHAR(255) | YES  |     |                |
| path              | VARCHAR(45)  | YES  |     |                |
| menu_available    | TINYINT(3,0)  | YES  |     |                |
| order             | INT(10,0)    | YES  |     |                |

**Diff:** **DISTINTAS**
- Orden de columnas: en BD `menu_available` y `order` están al final (y en distinto orden entre sí).
- BD tiene índice MUL en `id_role`; código no.

`timestamps: false`

---

## 5. Partners

**Describe — CODIGO**

| Campo                  | Tipo           | Null | Key | Extra          |
|------------------------|----------------|------|-----|----------------|
| id_partner             | BIGINT         | NO   | PRI | auto_increment |
| alias                  | STRING(20)     | YES  |     |                |
| partner_dni            | STRING(15)     | YES  |     |                |
| partner_name           | STRING(30)     | YES  |     |                |
| partner_birthdate      | DATE           | YES  |     |                |
| partner_phone          | STRING(15)     | YES  |     |                |
| affiliate_dni          | STRING(15)     | YES  |     |                |
| affiliate_name         | STRING(30)     | YES  |     |                |
| affiliate_birthdate    | DATE           | YES  |     |                |
| id_visit_type_usualy   | INTEGER        | YES  |     |                |
| partner_discharge_date | DATE           | YES  |     |                |
| id_state               | INTEGER        | YES  |     |                |
| observations           | STRING(255)    | YES  |     |                |
| suspension_reason      | STRING(255)    | YES  |     |                |
| expultion_reason       | STRING(255)    | YES  |     |                |
| santion_date           | DATE           | YES  |     |                |
| affiliate_phone        | STRING(15)     | YES  |     |                |

**Describe — BASE REAL**

| Field                  | Type           | Null | Key | Extra          |
|------------------------|----------------|------|-----|----------------|
| id_partner             | BIGINT(19,0)   | NO   | PRI | auto_increment |
| alias                  | VARCHAR(100)  | YES  |     |                |
| partner_dni            | VARCHAR(15)   | YES  |     |                |
| partner_name           | VARCHAR(30)   | YES  |     |                |
| partner_birthdate      | DATETIME       | YES  |     |                |
| partner_phone          | VARCHAR(15)   | YES  |     |                |
| affiliate_dni          | VARCHAR(15)   | YES  |     |                |
| affiliate_name         | VARCHAR(30)   | YES  |     |                |
| affiliate_birthdate    | DATETIME       | YES  |     |                |
| id_visit_type_usualy   | BIGINT(19,0)   | YES  | MUL |                |
| partner_discharge_date | DATETIME       | YES  |     |                |
| id_state               | INT(10,0)     | YES  | MUL |                |
| observations           | VARCHAR(2000) | YES  |     |                |
| suspension_reason       | VARCHAR(255)  | YES  |     |                |
| expultion_reason        | VARCHAR(255)  | YES  |     |                |
| santion_date            | DATETIME       | YES  |     |                |
| affiliate_phone         | VARCHAR(45)   | YES  |     |                |

**Diff:** **DISTINTAS**
- `alias`: código STRING(20), BD VARCHAR(100).
- `observations`: código STRING(255), BD VARCHAR(2000).
- `affiliate_phone`: código STRING(15), BD VARCHAR(45).
- `id_visit_type_usualy`: código INTEGER, BD BIGINT.
- Campos fecha (birthdate, discharge_date, santion_date): código DATE, BD DATETIME.
- BD tiene índices MUL en id_visit_type_usualy e id_state; código no.

`timestamps: false`

---

## 6. Payment_Methods

**Describe — CODIGO**

| Campo             | Tipo           | Null | Key | Extra          |
|-------------------|----------------|------|-----|----------------|
| id_payment_method | INTEGER        | NO   | PRI | auto_increment |
| method            | STRING(100)    | YES  |     |                |
| percent           | DECIMAL(10,2)  | YES  |     |                |

**Describe — BASE REAL**

| Field             | Type           | Null | Key | Extra          |
|-------------------|----------------|------|-----|----------------|
| id_payment_method | INT(10,0)      | NO   | PRI | auto_increment |
| method            | VARCHAR(100)   | YES  |     |                |
| percent           | DECIMAL(10,2)  | YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 7. Prices

**Describe — CODIGO**

| Campo                 | Tipo           | Null | Key | Extra          |
|-----------------------|----------------|------|-----|----------------|
| id_price              | INTEGER        | NO   | PRI | auto_increment |
| id_day                | INTEGER        | YES  |     |                |
| id_receivable_concept | INTEGER        | YES  |     |                |
| id_visit_type         | INTEGER        | YES  |     |                |
| total_amount          | DECIMAL(10,2)  | YES  |     |                |

**Describe — BASE REAL**

| Field                 | Type           | Null | Key | Extra          |
|-----------------------|----------------|------|-----|----------------|
| id_price              | BIGINT(19,0)   | NO   | PRI | auto_increment |
| id_day                | INT(10,0)      | YES  | MUL |                |
| id_visit_type         | BIGINT(19,0)   | YES  | MUL |                |
| id_receivable_concept | INT(10,0)      | YES  | MUL |                |
| total_amount          | DECIMAL(10,2)  | YES  |     |                |

**Diff:** **DISTINTAS**
- `id_price`: código INTEGER, BD BIGINT.
- Orden de columnas: en BD aparece id_visit_type antes que id_receivable_concept.
- BD tiene índices MUL en id_day, id_visit_type, id_receivable_concept; código no.

`timestamps: false`

---

## 8. Products_Services

**Describe — CODIGO**

| Campo              | Tipo           | Null | Key | Extra          |
|--------------------|----------------|------|-----|----------------|
| id_product_service | BIGINT         | NO   | PRI | auto_increment |
| description        | STRING(255)    | YES  |     |                |
| available          | NUMBER         | YES  |     |                |
| long_description   | STRING(255)    | YES  |     |                |
| price              | DECIMAL(10,2)  | YES  |     |                |
| url_image          | STRING(255)    | YES  |     |                |
| featured           | BOOLEAN        | YES  |     |                |

**Describe — BASE REAL**

| Field              | Type           | Null | Key | Extra          |
|--------------------|----------------|------|-----|----------------|
| id_product_service | INT(10,0)      | NO   | PRI | auto_increment |
| description        | VARCHAR(255)   | YES  |     |                |
| available          | INT(10,0)      | YES  |     |                |
| long_description   | VARCHAR(255)   | YES  |     |                |
| price              | DECIMAL(10,2)  | YES  |     |                |
| url_image          | VARCHAR(255)   | YES  |     |                |
| featured           | TINYINT(3,0)   | YES  |     |                |

**Diff:** **DISTINTAS**
- `id_product_service`: código BIGINT, BD INT.
- `available`: código NUMBER (genérico), BD INT.
- `featured`: código BOOLEAN, BD TINYINT (equivalente pero distinto nombre de tipo).

`timestamps: false`

---

## 9. Receivable_Concepts

**Describe — CODIGO**

| Campo                 | Tipo        | Null | Key | Extra          |
|-----------------------|-------------|------|-----|----------------|
| id_receivable_concept | INTEGER     | NO   | PRI | auto_increment |
| description           | STRING(100) | YES  |     |                |

**Describe — BASE REAL**

| Field                 | Type        | Null | Key | Extra          |
|------------------------|-------------|------|-----|----------------|
| id_receivable_concept  | INT(10,0)   | NO   | PRI | auto_increment |
| description           | VARCHAR(100)| YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 10. Roles

**Describe — CODIGO**

| Campo       | Tipo         | Null | Key | Extra          |
|-------------|--------------|------|-----|----------------|
| id_role     | INTEGER      | NO   | PRI | auto_increment |
| description | STRING(255)  | YES  |     |                |

**Describe — BASE REAL**

| Field       | Type         | Null | Key | Extra          |
|-------------|--------------|------|-----|----------------|
| id_role     | INT(10,0)    | NO   | PRI | auto_increment |
| description | VARCHAR(255) | YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 11. States

**Describe — CODIGO**

| Campo      | Tipo        | Null | Key | Extra          |
|------------|-------------|------|-----|----------------|
| id_state   | INTEGER     | NO   | PRI | auto_increment |
| description| STRING(100) | YES  |     |                |
| id_action  | INTEGER     | YES  |     |                |

**Describe — BASE REAL**

| Field      | Type        | Null | Key | Extra          |
|------------|-------------|------|-----|----------------|
| id_state   | INT(10,0)   | NO   | PRI | auto_increment |
| description| VARCHAR(100)| YES  |     |                |
| id_action  | INT(10,0)   | YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 12. Ticket_Details

**Describe — CODIGO**

| Campo             | Tipo           | Null | Key | Extra          |
|-------------------|----------------|------|-----|----------------|
| id_ticket_detail  | BIGINT         | NO   | PRI | auto_increment |
| id_ticket         | BIGINT         | YES  |     |                |
| id_product_service| INTEGER        | YES  |     |                |
| quantity          | INTEGER        | YES  |     |                |
| unit_price        | DECIMAL(10,2)  | YES  |     |                |
| payed             | TINYINT        | YES  |     |                |
| ref_id_ticket_detail | BIGINT      | YES  |     |                |
| state             | INTEGER        | YES  |     |                |

**Describe — BASE REAL**

| Field                | Type           | Null | Key | Extra          |
|----------------------|----------------|------|-----|----------------|
| id_ticket_detail     | BIGINT(19,0)   | NO   | PRI | auto_increment |
| id_ticket            | BIGINT(19,0)   | YES  | MUL |                |
| id_product_service   | INT(10,0)      | YES  | MUL |                |
| nro_item             | INT(10,0)      | YES  |     |                |
| quantity             | INT(10,0)      | YES  |     |                |
| unit_price           | DECIMAL(10,2)  | YES  |     |                |
| payed                | TINYINT(3,0)   | YES  |     |                |
| ref_id_ticket_detail | BIGINT(19,0)   | YES  |     |                |
| state                | VARCHAR(20)    | YES  |     |                |

**Diff:** **MUY DISTINTAS**
- La BD tiene un campo **solo en BD**: `nro_item` (INT). No existe en el modelo.
- `state`: en código INTEGER (numérico), en BD VARCHAR(20) (texto). Tipo distinto.
- BD tiene índices MUL en id_ticket e id_product_service; código no.

`timestamps: false`

---

## 13. Tickets

**Describe — CODIGO**

| Campo        | Tipo           | Null | Key | Extra          |
|--------------|----------------|------|-----|----------------|
| id_ticket    | BIGINT         | NO   | PRI | auto_increment |
| id_visit     | BIGINT         | YES  |     |                |
| id_bracelet  | STRING(255)    | YES  |     |                |
| observations | STRING(255)    | YES  |     |                |
| ticket_date  | DATE           | YES  |     |                |
| ticket_amount| DECIMAL(10,2)  | YES  |     |                |

**Describe — BASE REAL**

| Field        | Type           | Null | Key | Extra          |
|--------------|----------------|------|-----|----------------|
| id_ticket    | BIGINT(19,0)   | NO   | PRI | auto_increment |
| id_visit     | BIGINT(19,0)   | YES  | MUL |                |
| id_bracelet  | VARCHAR(255)   | YES  |     |                |
| observations | VARCHAR(255)   | YES  |     |                |
| ticket_date  | DATETIME       | YES  |     |                |
| ticket_amount| DECIMAL(10,2)  | YES  |     |                |

**Diff:** **DISTINTAS**
- `ticket_date`: código DATE, BD DATETIME.
- BD tiene índice MUL en id_visit; código no.

`timestamps: false`

---

## 14. Users

**Describe — CODIGO**

| Campo    | Tipo         | Null | Key | Extra          |
|----------|--------------|------|-----|----------------|
| id_user  | BIGINT       | NO   | PRI | auto_increment |
| name     | STRING(30)   | YES  |     |                |
| surname  | STRING(45)   | YES  |     |                |
| username | STRING(45)   | YES  |     |                |
| password | STRING(255)  | YES  |     |                |

**Describe — BASE REAL**

| Field    | Type         | Null | Key | Extra          |
|----------|--------------|------|-----|----------------|
| id_user  | BIGINT(19,0) | NO   | PRI | auto_increment |
| name     | VARCHAR(30)  | YES  |     |                |
| surname  | VARCHAR(45)  | YES  |     |                |
| username | VARCHAR(45)  | YES  |     |                |
| password | VARCHAR(255) | YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## 15. Users_Roles

**Describe — CODIGO**

| Campo         | Tipo    | Null | Key | Extra          |
|---------------|---------|------|-----|----------------|
| id_user_role  | BIGINT  | NO   | PRI | auto_increment |
| id_user       | BIGINT  | YES  |     |                |
| id_role       | INTEGER | YES  |     |                |

**Describe — BASE REAL**

| Field        | Type         | Null | Key | Extra          |
|--------------|--------------|------|-----|----------------|
| id_user_role | BIGINT(19,0) | NO   | PRI | auto_increment |
| id_user      | BIGINT(19,0) | YES  | MUL |                |
| id_role      | INT(10,0)    | YES  | MUL |                |

**Diff:** **DISTINTAS**
- BD tiene índices MUL en id_user e id_role; código no los declara.

`timestamps: false`

---

## 16. UserDealers

**Describe — CODIGO**

| Campo           | Tipo   | Null | Key | Extra          |
|-----------------|--------|------|-----|----------------|
| id_user_dealer  | BIGINT | NO   | PRI | auto_increment |
| id_user         | BIGINT | YES  |     |                |
| id_dealer       | BIGINT | YES  |     |                |

**Describe — BASE REAL:** La tabla no existe en la base de datos del servidor.

**Diff:** **MUY DISTINTAS** — La tabla **UserDealers** solo existe en el modelo (código); no está creada en la BD del servidor.

(sin opción `timestamps` explícita en el modelo)

---

## 17. Visits

**Describe — CODIGO**

| Campo                | Tipo           | Null | Key | Extra          |
|----------------------|----------------|------|-----|----------------|
| id_visit             | BIGINT         | NO   | PRI | auto_increment |
| id_partner           | BIGINT         | YES  |     |                |
| visit_date           | DATE           | YES  |     |                |
| id_state             | INTEGER        | YES  |     |                |
| id_visit_type        | INTEGER        | YES  |     |                |
| other_visit_obs      | STRING(255)    | YES  |     |                |
| entry_visit_obs      | STRING(255)    | YES  |     |                |
| exit_visit_obs       | STRING(255)    | YES  |     |                |
| entry_amount_paid    | DECIMAL(10,2)  | YES  |     |                |
| visit_amount_consumed | DECIMAL(10,2) | YES  |     |                |
| exit_amount_payed    | DECIMAL(10,2)  | YES  |     |                |
| hour_entry           | DATE           | YES  |     |                |
| hour_exit            | DATE           | YES  |     |                |
| id_bracelet_1        | STRING(255)    | YES  |     |                |
| id_bracelet_2        | STRING(255)    | YES  |     |                |
| last_visit           | DATE           | YES  |     |                |
| id_day               | INTEGER        | YES  |     |                |
| extra_entry          | DECIMAL(10,2)  | YES  |     |                |
| extra_exit           | DECIMAL(10,2)  | YES  |     |                |
| extra_entry_obs      | STRING(100)    | YES  |     |                |
| extra_exit_obs       | STRING(100)    | YES  |     |                |
| had_to_paid          | DECIMAL(10,2)  | YES  |     |                |

**Describe — BASE REAL**

| Field                 | Type           | Null | Key | Extra          |
|----------------------|----------------|------|-----|----------------|
| id_visit             | BIGINT(19,0)   | NO   | PRI | auto_increment |
| id_partner           | BIGINT(19,0)   | YES  | MUL |                |
| visit_date           | DATE           | YES  |     |                |
| id_state             | INT(10,0)      | YES  | MUL |                |
| id_visit_type        | BIGINT(19,0)   | YES  | MUL |                |
| other_visit_obs      | VARCHAR(255)   | YES  |     |                |
| entry_visit_obs      | VARCHAR(255)   | YES  |     |                |
| exit_visit_obs       | VARCHAR(255)   | YES  |     |                |
| entry_amount_paid    | DECIMAL(10,2)  | YES  |     |                |
| visit_amount_consumed| DECIMAL(10,2)  | YES  |     |                |
| exit_amount_payed    | DECIMAL(10,2)  | YES  |     |                |
| hour_entry           | DATETIME       | YES  |     |                |
| hour_exit            | DATETIME       | YES  |     |                |
| id_bracelet_1        | VARCHAR(255)   | YES  |     |                |
| id_bracelet_2        | VARCHAR(255)   | YES  |     |                |
| last_visit           | DATETIME       | YES  |     |                |
| id_day               | INT(10,0)      | YES  | MUL |                |
| extra_entry          | DECIMAL(10,2)  | YES  |     |                |
| extra_exit           | DECIMAL(10,2)  | YES  |     |                |
| extra_entry_obs      | VARCHAR(100)   | YES  |     |                |
| extra_exit_obs       | VARCHAR(100)   | YES  |     |                |
| had_to_paid          | DECIMAL(10,2)  | YES  |     |                |

**Diff:** **DISTINTAS**
- `hour_entry`, `hour_exit`, `last_visit`: en código DATE, en BD DATETIME.
- BD tiene índices MUL en id_partner, id_state, id_visit_type, id_day; código no.

`timestamps: false`

---

## 18. Visits_Types

**Describe — CODIGO**

| Campo                     | Tipo           | Null | Key | Extra          |
|---------------------------|----------------|------|-----|----------------|
| id_visit_type             | BIGINT         | NO   | PRI | auto_increment |
| description               | STRING(255)    | YES  |     |                |
| suggest_entry_amount      | DECIMAL(10,2)  | YES  |     |                |
| suggest_membership_amount  | DECIMAL(10,2)  | YES  |     |                |

**Describe — BASE REAL**

| Field                     | Type           | Null | Key | Extra          |
|---------------------------|----------------|------|-----|----------------|
| id_visit_type             | BIGINT(19,0)   | NO   | PRI | auto_increment |
| description               | VARCHAR(255)   | YES  |     |                |
| suggest_entry_amount      | DECIMAL(10,2)  | YES  |     |                |
| suggest_membership_amount  | DECIMAL(10,2)  | YES  |     |                |

**Diff:** **IGUALES** (mismos campos y tipos equivalentes).

`timestamps: false`

---

## Resumen

- **Describe — CODIGO:** modelo Sequelize en `backend/src/database/schemas/degira/models/`.
- **Describe — BASE REAL:** estructura en MySQL del servidor (`degira_develop`).
- **Diff:** **IGUALES** = mismos campos y tipos equivalentes. **DISTINTAS** = diferencias de tipo, longitud, orden o índices. **MUY DISTINTAS** = campos distintos o tabla inexistente en BD.

| Tabla | Diff |
|-------|------|
| Actions | DISTINTAS (longitud description) |
| Days | IGUALES |
| Operations | DISTINTAS (orden, tipos fecha/decimal, índices) |
| Operations_Types | DISTINTAS (orden columnas, índices) |
| Partners | DISTINTAS (longitudes, tipos fecha/entero, índices) |
| Payment_Methods | IGUALES |
| Prices | DISTINTAS (tipo PK, orden, índices) |
| Products_Services | DISTINTAS (tipo PK, available, featured) |
| Receivable_Concepts | IGUALES |
| Roles | IGUALES |
| States | IGUALES |
| Ticket_Details | MUY DISTINTAS (campo nro_item solo en BD, state INTEGER vs VARCHAR) |
| Tickets | DISTINTAS (tipo fecha, índices) |
| Users | IGUALES |
| Users_Roles | DISTINTAS (índices) |
| UserDealers | MUY DISTINTAS (tabla no existe en BD) |
| Visits | DISTINTAS (tipos fecha, índices) |
| Visits_Types | IGUALES |

- **Total tablas en código:** 18. **En BD:** 17 (falta UserDealers).
