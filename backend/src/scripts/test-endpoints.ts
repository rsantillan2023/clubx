import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { URL } from "url";

const BASE_URL = "http://localhost:3000";

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

interface TestResult {
  name: string;
  method: string;
  url: string;
  status?: number;
  success: boolean;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

// Función para hacer login y obtener token
async function login(username: string, password: string): Promise<string | null> {
  const result = await testEndpoint("Login", "POST", "/v1/users/login", {
    username,
    password,
  });

  if (result.success && result.status === 200) {
    // Necesitamos obtener el token de la respuesta
    // Haremos una petición adicional para obtener el token
    return await getTokenFromLogin(username, password);
  }
  return null;
}

// Función auxiliar para obtener el token del login
async function getTokenFromLogin(username: string, password: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(`${BASE_URL}/v1/users/login`);
      const postData = JSON.stringify({ username, password });

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 3000,
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 5000,
      };

      const req = http.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.data && parsed.data.token) {
              resolve(parsed.data.token);
            } else if (parsed.token) {
              resolve(parsed.token);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on("error", () => {
        resolve(null);
      });

      req.write(postData);
      req.end();
    } catch {
      resolve(null);
    }
  });
}

// Función para hacer una petición y medir el tiempo
async function testEndpoint(
  name: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: any,
  headers?: any
): Promise<TestResult> {
  const startTime = Date.now();
  const fullUrl = `${BASE_URL}${url}`;

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(fullUrl);
      const postData = data ? JSON.stringify(data) : undefined;

      const options: any = {
        hostname: urlObj.hostname,
        port: urlObj.port || 3000,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          ...(data ? { "Content-Type": "application/json" } : {}),
          ...(headers || {}),
        },
        timeout: 5000,
      };

      if (postData) {
        options.headers["Content-Length"] = Buffer.byteLength(postData);
      }

      const req = http.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          const responseTime = Date.now() - startTime;
          let errorMessage: string | undefined;

          try {
            const parsed = JSON.parse(responseData);
            if (parsed.message) {
              errorMessage = parsed.message;
            }
          } catch {
            // No es JSON, usar el texto completo si hay error
            if (res.statusCode && res.statusCode >= 400) {
              errorMessage = responseData.substring(0, 100);
            }
          }

          resolve({
            name,
            method,
            url,
            status: res.statusCode,
            success: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
            error: errorMessage,
            responseTime,
          });
        });
      });

      req.on("error", (error: any) => {
        const responseTime = Date.now() - startTime;
        resolve({
          name,
          method,
          url,
          success: false,
          error: error.message || "Error de conexión",
          responseTime,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          name,
          method,
          url,
          success: false,
          error: "Timeout (5s)",
          responseTime,
        });
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      resolve({
        name,
        method,
        url,
        success: false,
        error: error.message || "Error desconocido",
        responseTime,
      });
    }
  });
}

// Función para imprimir resultados
function printResult(result: TestResult) {
  const statusColor = result.success ? colors.green : colors.red;
  const statusText = result.success ? "✓" : "✗";
  const statusCode = result.status ? ` [${result.status}]` : "";
  const time = result.responseTime ? ` (${result.responseTime}ms)` : "";

  console.log(
    `${statusColor}${statusText}${colors.reset} ${result.method.padEnd(6)} ${result.url.padEnd(50)} ${statusCode}${time}`
  );

  if (!result.success && result.error) {
    console.log(`  ${colors.yellow}→ Error: ${result.error}${colors.reset}`);
  }
}

// Función para imprimir resumen
function printSummary() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 RESUMEN");
  console.log("=".repeat(70));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`✅ Exitosos: ${colors.green}${successful}${colors.reset}`);
  console.log(`❌ Fallidos: ${colors.red}${failed}${colors.reset}`);
  console.log(`📋 Total: ${total}`);

  if (failed > 0) {
    console.log("\n" + colors.yellow + "Endpoints fallidos:" + colors.reset);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ${colors.red}✗${colors.reset} ${r.method} ${r.url} - ${r.error || "Sin respuesta"}`);
      });
  }

  console.log("=".repeat(70) + "\n");
}

// Función principal
async function testEndpoints() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 PRUEBA DE ENDPOINTS - LOCALHOST");
  console.log("=".repeat(70));
  console.log(`Base URL: ${colors.cyan}${BASE_URL}${colors.reset}\n`);

  // 1. Verificar que el servidor está corriendo
  console.log(colors.blue + "1. Verificación del servidor" + colors.reset);
  console.log("-".repeat(70));
  results.push(await testEndpoint("Health Check", "GET", "/v1/"));

  // 2. Login con credenciales reales
  console.log("\n" + colors.blue + "2. Login con credenciales" + colors.reset);
  console.log("-".repeat(70));
  const loginResult = await testEndpoint("Login (rsantillan)", "POST", "/v1/users/login", {
    username: "rsantillan",
    password: "123456",
  });
  results.push(loginResult);

  // Obtener token del login
  let authToken: string | null = null;
  if (loginResult.success) {
    console.log(colors.green + "  → Login exitoso, obteniendo token..." + colors.reset);
    authToken = await getTokenFromLogin("rsantillan", "123456");
    if (authToken) {
      console.log(colors.green + `  → Token obtenido: ${authToken.substring(0, 20)}...` + colors.reset);
    } else {
      console.log(colors.yellow + "  → No se pudo obtener el token de la respuesta" + colors.reset);
    }
  } else {
    console.log(colors.red + "  → Login falló, los endpoints autenticados fallarán" + colors.reset);
  }

  // 3. Endpoints que requieren autenticación (con token si está disponible)
  console.log("\n" + colors.blue + "3. Endpoints que requieren autenticación" + colors.reset);
  console.log("-".repeat(70));
  const authHeaders = authToken ? { authorization: authToken } : {};
  
  results.push(await testEndpoint("Partners - Lista", "GET", "/v1/partners", undefined, authHeaders));
  results.push(await testEndpoint("Partners - Búsqueda", "GET", "/v1/partners/search?search=test", undefined, authHeaders));
  results.push(await testEndpoint("Operations Types", "GET", "/v1/operations_types/get", undefined, authHeaders));
  results.push(await testEndpoint("Visits", "GET", "/v1/visits/", undefined, authHeaders));
  results.push(await testEndpoint("Consumptions", "GET", "/v1/consumptions", undefined, authHeaders));
  results.push(await testEndpoint("CRUD - Tablas", "GET", "/v1/crud/tables", undefined, authHeaders));

  // 4. Endpoints de CRUD
  console.log("\n" + colors.blue + "4. Endpoints de CRUD" + colors.reset);
  console.log("-".repeat(70));
  results.push(await testEndpoint("CRUD - Estructura tabla", "GET", "/v1/crud/tables/users/structure", undefined, authHeaders));
  results.push(await testEndpoint("CRUD - Registros", "GET", "/v1/crud/tables/users/records", undefined, authHeaders));

  // 5. Rutas que no deberían existir (para verificar 404)
  console.log("\n" + colors.blue + "5. Rutas inexistentes (deberían dar 404)" + colors.reset);
  console.log("-".repeat(70));
  results.push(await testEndpoint("Ruta inexistente", "GET", "/v1/ruta-que-no-existe"));

  // Imprimir todos los resultados
  console.log("\n" + "=".repeat(70));
  console.log("📋 RESULTADOS DETALLADOS");
  console.log("=".repeat(70) + "\n");

  results.forEach(printResult);

  // Imprimir resumen
  printSummary();

  // Información adicional
  console.log(colors.cyan + "💡 Notas:" + colors.reset);
  console.log("  - Los endpoints que requieren autenticación fallarán sin token JWT válido");
  console.log("  - Esto es normal y esperado");
  console.log("  - Si un endpoint da 401/403, significa que la ruta existe pero requiere autenticación");
  console.log("  - Si da 404, la ruta no está registrada o la URL es incorrecta");
  console.log("  - Si da 500, hay un error en el servidor\n");
}

// Ejecutar las pruebas
testEndpoints()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(colors.red + "❌ Error inesperado:" + colors.reset, error);
    process.exit(1);
  });

