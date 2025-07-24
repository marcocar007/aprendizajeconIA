// Archivo: netlify/functions/generateActivity.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const userData = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- PROMPT CON INSTRUCCIÓN DE RESUMEN MEJORADO ---
    const prompt = `
      Actúa como un diseñador instruccional experto y creativo. Tu tarea es generar DOS propuestas de actividad de aprendizaje distintas y completas, basadas en los siguientes datos del docente.

      **Datos del Docente:**
      - Carrera: ${userData.career}
      - Asignatura: ${userData.subject}
      - Objetivo de Aprendizaje Principal: "${userData.objective}"
      // ... (resto de los datos del usuario)

      **Instrucciones de Formato Obligatorio:**
      Genera la primera propuesta completa. Luego, en una nueva línea, escribe única y exclusivamente la palabra "---PROPUESTA_DIVISOR---". Finalmente, genera la segunda propuesta completa.
      
      Para CADA una de las dos propuestas, sigue esta estructura de Markdown EXACTA:

      # TÍTULO CREATIVO Y CONCISO DE LA PROPUESTA
      *Un resumen de 2 a 3 líneas que describa de forma general la actividad, el enfoque pedagógico y lo que los estudiantes harán.*
      ---
      // ... (Resto de la estructura del prompt sin cambios)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ proposals: text.split('---PROPUESTA_DIVISOR---') }),
    };

  } catch (error) {
    console.error("Error en la función de Netlify (generateActivity):", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudieron generar las propuestas. Esto puede ser un problema temporal de la API. Por favor, intenta de nuevo en un momento." }),
    };
  }
};
