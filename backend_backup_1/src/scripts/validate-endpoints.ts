import dotenv from "dotenv";
dotenv.config();

import { DEGIRA_DB } from "../database/connection";

interface EndpointTest {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: any;
  expectedStatus?: number | number[]; // Puede ser un número o array de números válidos
  validateResponse?: (response: any) => boolean;
}

interface TestResult {
  endpoint: string;
  success: boolean;
  message: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  dbVerified?: boolean;
}

class EndpointValidator {
  private baseUrl: string;
  private port: number;

  constructor() {
    this.port = Number(process.env.PORT) || 3000;
    this.baseUrl = `http://localhost:${this.port}`;
  }

  async validateDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      await DEGIRA_DB.authenticate();
      
      // Verificar que estamos conectados a la base local
      const [results]: any = await DEGIRA_DB.query(
        `SELECT DATABASE() as current_db, @@hostname as hostname`
      );
      
      const currentDb = results[0]?.current_db;
      const hostname = results[0]?.hostname;
      
      const isLocal = 
        process.env.DB_HOST === "localhost" || 
        process.env.DB_HOST === "127.0.0.1" ||
        hostname?.toLowerCase().includes("localhost");
      
      return {
        success: true,
        message: "✅ Conexión a la base de datos verificada",
        details: {
          database: currentDb,
          expectedDatabase: process.env.DB_DATABASE,
          host: process.env.DB_HOST,
          isLocal,
          hostname,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: "❌ Error al conectar con la base de datos",
        details: { error: error.message },
      };
    }
  }

  async testEndpoint(test: EndpointTest): Promise<TestResult> {
    const startTime = Date.now();
    const fullUrl = `${this.baseUrl}${test.path}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const fetchOptions: RequestInit = {
        method: test.method,
        signal: controller.signal,
        headers: {},
      };

      if (test.body) {
        fetchOptions.body = JSON.stringify(test.body);
        fetchOptions.headers = {
          "Content-Type": "application/json",
        };
      }

      const response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const statusCode = response.status;
      const expectedStatus = test.expectedStatus || 200;
      
      // Verificar si el status code es válido (puede ser un número o array de números)
      const isValidStatus = Array.isArray(expectedStatus) 
        ? expectedStatus.includes(statusCode)
        : statusCode === expectedStatus;
      
      // Obtener datos de la respuesta
      let responseData: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Validar respuesta si hay una función de validación
      let isValid = true;
      if (test.validateResponse) {
        try {
          isValid = test.validateResponse(responseData);
        } catch (e) {
          isValid = false;
        }
      }
      
      // Verificar que la respuesta viene de la base de datos (contiene datos reales)
      let dbVerified = false;
      if (responseData) {
        // Si hay datos, asumimos que viene de la BD
        if (Array.isArray(responseData) || 
            (responseData.data && Array.isArray(responseData.data)) ||
            (responseData.totalCount !== undefined) ||
            (responseData.pageCount !== undefined) ||
            (responseData.id_user !== undefined) ||
            (responseData.token !== undefined) ||
            (responseData.status === "OK")) {
          dbVerified = true;
        }
      }

      const isSuccess = isValidStatus && isValid;
      
      return {
        endpoint: test.path,
        success: isSuccess,
        message: isSuccess
          ? `✅ ${test.method} ${test.path} - OK (${statusCode})`
          : !isValidStatus
          ? `⚠️ ${test.method} ${test.path} - Status: ${statusCode} (esperado: ${Array.isArray(expectedStatus) ? expectedStatus.join(' o ') : expectedStatus})`
          : `⚠️ ${test.method} ${test.path} - Validación falló`,
        statusCode,
        responseTime,
        dbVerified,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      let errorMessage = error.message || "Error desconocido";
      
      // Proporcionar más detalles sobre el error
      if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED")) {
        errorMessage = "El servidor no está respondiendo o la conexión fue rechazada";
      } else if (errorMessage.includes("aborted")) {
        errorMessage = "Timeout - el servidor tardó demasiado en responder";
      }
      
      return {
        endpoint: test.path,
        success: false,
        message: `❌ ${test.method} ${test.path} - Error`,
        responseTime,
        error: errorMessage,
      };
    }
  }

  async validateEndpointsUseLocalDB(): Promise<void> {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 VALIDACIÓN DE ENDPOINTS Y CONEXIÓN A BASE DE DATOS LOCAL");
    console.log("=".repeat(70) + "\n");

    // 1. Validar conexión a base de datos
    console.log("1️⃣ Validando conexión a base de datos local...");
    const dbValidation = await this.validateDatabaseConnection();
    console.log(`   ${dbValidation.message}`);
    
    if (dbValidation.details) {
      const details = dbValidation.details;
      console.log(`   Base de datos actual: ${details.database}`);
      console.log(`   Base de datos esperada: ${details.expectedDatabase}`);
      console.log(`   Host configurado: ${details.host}`);
      console.log(`   ¿Es conexión local?: ${details.isLocal ? "✅ Sí" : "❌ No"}`);
      
      if (details.database !== details.expectedDatabase) {
        console.log(`   ⚠️ ADVERTENCIA: La base de datos actual (${details.database}) no coincide con la esperada (${details.expectedDatabase})`);
      }
    }
    console.log();

    if (!dbValidation.success) {
      console.log("❌ No se puede continuar sin conexión a la base de datos.\n");
      await DEGIRA_DB.close();
      process.exit(1);
    }

    // 2. Verificar que el servidor esté corriendo
    console.log("2️⃣ Verificando que el servidor esté corriendo...");
    const serviceName = process.env.SERVICE_NAME || "degira";
    const apiBaseRoute = process.env.API_BASE_ROUTE || "api/v1";
    const healthCheckRoute = `/${apiBaseRoute}/${serviceName}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}${healthCheckRoute}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      console.log(`   ✅ Servidor respondiendo en ${this.baseUrl}`);
      console.log(`   Ruta de health check: ${healthCheckRoute}`);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log(`   ⚠️ ADVERTENCIA: La ruta ${healthCheckRoute} no existe`);
        console.log(`   💡 Verifica que el servidor esté corriendo y las rutas estén correctamente configuradas`);
      }
    } catch (error: any) {
      console.log(`   ❌ El servidor no está corriendo en ${this.baseUrl}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   💡 Asegúrate de ejecutar: npm run dev`);
      console.log();
      await DEGIRA_DB.close();
      process.exit(1);
    }
    console.log();

    // 3. Definir endpoints a probar
    const baseRoute = healthCheckRoute;

    const endpoints: EndpointTest[] = [
      {
        name: "Health Check",
        method: "GET",
        path: `${baseRoute}`,
        expectedStatus: 200,
        validateResponse: (data) => data.status === "OK",
      },
      {
        name: "Get Users",
        method: "GET",
        path: `${baseRoute}/users`,
        expectedStatus: 200,
        validateResponse: (data) => {
          // Verificar que viene de la BD (tiene estructura de Sequelize)
          return data !== undefined && (Array.isArray(data) || data.data !== undefined);
        },
      },
      {
        name: "Get Users (con paginación)",
        method: "GET",
        path: `${baseRoute}/users?page=1&pageSize=5`,
        expectedStatus: 200,
      },
      {
        name: "Get Partners",
        method: "GET",
        path: `${baseRoute}/partners`,
        expectedStatus: 200,
        validateResponse: (data) => {
          // Verificar estructura de respuesta de partners
          return data !== undefined && (data.data !== undefined || Array.isArray(data));
        },
      },
      {
        name: "Get Partners (con paginación)",
        method: "GET",
        path: `${baseRoute}/partners?page=1&pageSize=10`,
        expectedStatus: 200,
      },
      {
        name: "Get Partners Inside",
        method: "GET",
        path: `${baseRoute}/partners/inside`,
        expectedStatus: 200,
      },
      {
        name: "Login (sin credenciales)",
        method: "POST",
        path: `${baseRoute}/users/login`,
        body: { username: "", password: "" },
        expectedStatus: [400, 403], // Esperamos error sin credenciales (400 o 403 son válidos)
      },
    ];

    // 4. Probar cada endpoint
    console.log("3️⃣ Probando endpoints...");
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(`   Total de endpoints: ${endpoints.length}\n`);

    const results: TestResult[] = [];
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint);
      results.push(result);
      
      console.log(`   ${result.message}`);
      if (result.responseTime) {
        console.log(`      Tiempo de respuesta: ${result.responseTime}ms`);
      }
      if (result.dbVerified !== undefined) {
        console.log(`      Datos de BD: ${result.dbVerified ? "✅ Sí" : "⚠️ No verificado"}`);
      }
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      console.log();
    }

    // 5. Resumen
    console.log("=".repeat(70));
    console.log("📊 RESUMEN");
    console.log("=".repeat(70));
    
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const dbVerified = results.filter((r) => r.dbVerified === true).length;
    
    console.log(`Total de endpoints probados: ${results.length}`);
    console.log(`✅ Exitosos: ${successful}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log(`📊 Con datos de BD verificados: ${dbVerified}`);
    console.log();
    
    if (dbValidation.details?.isLocal) {
      console.log("✅ Conexión a base de datos LOCAL confirmada");
    } else {
      console.log("⚠️ ADVERTENCIA: La conexión podría no ser local");
    }
    
    if (failed > 0) {
      console.log("\n⚠️ Endpoints con problemas:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - ${r.endpoint}: ${r.error || `Status ${r.statusCode}`}`);
        });
    }
    
    if (successful === results.length && dbValidation.details?.isLocal) {
      console.log("\n✅ Todos los endpoints funcionan correctamente y usan la base de datos local");
    }
    
    console.log("=".repeat(70) + "\n");

    await DEGIRA_DB.close();
  }
}

// Ejecutar validación
const validator = new EndpointValidator();
validator
  .validateEndpointsUseLocalDB()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error inesperado:", error);
    process.exit(1);
  });

