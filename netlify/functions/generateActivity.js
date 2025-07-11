// Archivo: netlify/functions/generateActivity.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Trae la API Key de las variables de entorno seguras de Netlify
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  // Solo permite peticiones POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Parsea los datos enviados desde el frontend
    const userData = JSON.parse(event.body);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- Creación del Prompt Optimizado para Gemini ---
    const prompt = `
      Actúa como un diseñador instruccional experto y creativo, especializado en educación superior.
      Tu tarea es generar UNA propuesta de actividad de aprendizaje detallada, basada en los siguientes datos proporcionados por un docente:

      - Carrera: ${userData.career}
      - Asignatura: ${userData.subject}
      - Objetivo de Aprendizaje del Docente: "${userData.objective}"
      - Contexto de los Estudiantes: ${userData.studentContext}
      - Modalidad: ${userData.modality}
      - Duración de la Actividad: ${userData.duration}
      - Tipo de trabajo: ${userData.workType}
      - Restricciones o especificaciones: ${userData.restrictions || "Ninguna."}
      - Uso de IA por parte de los estudiantes: ${userData.useAI === "si" ? `Sí, usando el marco ${userData.aiFramework}, nivel ${userData.aiLevel}.` : "No, la actividad no debe usar IA."}

      Basado en los datos anteriores y aprovechando tu conocimiento sobre pedagogía, genera la actividad con el siguiente formato EXACTO, usando markdown:

      ### **NOMBRE CREATIVO DE LA ACTIVIDAD**
      *Aquí un nombre atractivo y relevante para la actividad.*

      ### **Descripción General**
      *Aquí una descripción concisa de la actividad en uno o dos párrafos.*

      ### **Pasos a Seguir**
      *Aquí una lista numerada y detallada de los pasos que el docente y los estudiantes deben seguir. Sé claro y práctico.*
      
      ### **Sustento Pedagógico**
      *Aquí explica brevemente el sustento pedagógico (puedes inspirarte en teóricos como Piaget, Vygotsky, Dewey, etc.) y especifica si la actividad está centrada en el estudiante o en el objeto de estudio, explicando por qué.*

      ### **Función Cerebral Aprovechada**
      *Aquí describe qué funciones cerebrales clave (memoria de trabajo, pensamiento crítico, creatividad, etc.) se activan con esta actividad.*
      
      ### **Rúbrica de Evaluación Sugerida**
      *Aquí una tabla simple en markdown con 3 o 4 criterios de evaluación y su descripción. Si se usa IA, incluye un criterio sobre el uso ético de la misma.*
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ activity: text }),
    };

  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Hubo un error al generar la actividad." }),
    };
  }
};
