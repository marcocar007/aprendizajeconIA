// Archivo: netlify/functions/generateExamples.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { career, subject } = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- PROMPT FINAL Y MÁS ROBUSTO ---
    const prompt = `
      Actúa como un pedagogo experto. Genera 3 ejemplos de objetivos de aprendizaje para la asignatura "${subject}" de la carrera de "${career}".
      Crea un ejemplo para cada dominio de la Taxonomía de Bloom (uno Cognitivo, uno Afectivo, y uno Psicomotor), seleccionando un nivel aleatorio para cada uno.
      Devuelve la respuesta únicamente como un array de objetos JSON válido, sin texto introductorio, sin comentarios y sin usar bloques de código markdown (\`\`\`). La estructura debe ser exactamente:
      [
        {"domain": "Cognitivo (Saber)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."},
        {"domain": "Afectivo (Ser)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."},
        {"domain": "Psicomotor (Hacer)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."}
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // --- LÓGICA DE LIMPIEZA Y VALIDACIÓN (LA MEJORA CLAVE) ---
    // Elimina los ```json y ``` que la IA a veces añade por error.
    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    // Se asegura de que el texto es un JSON válido antes de enviarlo.
    JSON.parse(cleanText);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: cleanText, // Envía el texto ya limpio y validado.
    };

  } catch (error) {
    console.error("Error en generateExamples:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudieron generar los ejemplos. La IA devolvió un formato inesperado." }),
    };
  }
};
