// Archivo: netlify/functions/generateActivity.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  // ... (El resto de la función no cambia, solo el prompt)
  const prompt = `
      Actúa como un diseñador instruccional experto y creativo. Tu tarea es generar DOS propuestas de actividad de aprendizaje distintas y completas, basadas en los siguientes datos del docente.

      **Datos del Docente:**
      // ... (Datos del usuario) ...
      
      **Instrucciones de Formato Obligatorio:**
      // ... (Instrucciones de formato) ...
      
      Para CADA una de las dos propuestas, sigue esta estructura de Markdown EXACTA:

      # TÍTULO CREATIVO Y CONCISO DE LA PROPUESTA
      *Un resumen de 2 a 3 líneas que describa de forma general la actividad, el enfoque pedagógico y lo que los estudiantes harán.*
      ---
      // ... (Resto de la estructura del prompt) ...
    `;
  // ... (El resto de la función no cambia)
};
