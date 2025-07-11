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

    // --- PROMPT FINAL MEJORADO ---
    const prompt = `
      Actúa como un diseñador instruccional experto, creativo y práctico. Tu tarea es generar DOS propuestas de actividad de aprendizaje distintas y completas, basadas en los siguientes datos proporcionados por un docente. Usa dos enfoques pedagógicos diferentes (ej. uno constructivista, basado en problemas, y otro basado en proyectos o juego de roles).

      **Datos del Docente:**
      - Carrera: ${userData.career}
      - Asignatura: ${userData.subject}
      - Objetivo de Aprendizaje Principal: "${userData.objective}"
      - Contexto de los Estudiantes: ${userData.studentContext}
      - Modalidad: ${userData.modality}
      - Duración Sugerida: ${userData.duration}
      - Formato de Trabajo: ${userData.workType}
      - Restricciones Materiales o de Conectividad: ${userData.restrictions || "Ninguna especificada."}
      - Información Adicional a Considerar: ${userData.extraInfo || "Ninguna."}
      - Uso de IA por Estudiantes: ${userData.useAI === "si" ? `Sí, permitido bajo el marco ${userData.aiFramework}, nivel "${userData.aiLevel}".` : "No, esta actividad debe realizarse sin asistencia de IA generativa."}

      **Instrucciones de Formato Obligatorio:**
      Genera la primera propuesta completa. Luego, en una nueva línea, escribe única y exclusivamente la palabra "---PROPUESTA_DIVISOR---". Finalmente, genera la segunda propuesta completa.
      
      Para CADA una de las dos propuestas, sigue esta estructura de Markdown EXACTA:

      # TÍTULO CREATIVO Y CONCISO DE LA PROPUESTA
      *Una descripción muy breve de una línea sobre el enfoque de la actividad.*
      ---
      ### Objetivo de Aprendizaje
      *Reformula o adapta el objetivo del docente para que se alinee con esta actividad específica.*

      ### Sustento Pedagógico
      *Explica el enfoque pedagógico (ej. 'Aprendizaje Basado en Problemas') y por qué está centrado en el estudiante o en el objeto de estudio, explicando brevemente las implicaciones de dicha elección.*
      
      ### Tipo de Uso de la IA
      *${userData.useAI === "si" 
        ? `Nivel de uso de IA: ${userData.aiLevel}. Se aprovechará la IA para tareas como: [Menciona aquí 1 o 2 aspectos específicos, ej: 'brainstorming de ideas iniciales con un LLM', 'creación de imágenes para una presentación', 'análisis de un set de datos con herramientas de machine learning', etc.].`
        : "Esta actividad está diseñada para realizarse sin el uso de herramientas de IA generativa, fomentando el pensamiento original y la resolución de problemas sin asistencia tecnológica directa."
      }*

      ### Función Cerebral Aprovechada
      *Describe 1 o 2 funciones cerebrales clave (ej. memoria de trabajo, pensamiento crítico, creatividad) que se activan con esta actividad y por qué.*

      ### Descripción General
      *Un párrafo que explica en qué consiste la actividad y cuál es el producto final esperado.*

      ### Pasos a Seguir
      *Proporciona una lista numerada con los pasos claros y prácticos que los estudiantes deben seguir de principio a fin.*
      1.  **Paso 1:** ...
      2.  **Paso 2:** ...
      3.  **etc.** ...

      ### Rúbrica de Evaluación Sugerida
      | Criterio | Descripción Breve | Ponderación |
      | :--- | :--- | :--- |
      | Comprensión del Tema | El trabajo demuestra un entendimiento profundo del objetivo. | 40% |
      | Aplicación Práctica | Los conceptos se aplican de manera efectiva y correcta. | 30% |
      | Calidad y Presentación | El resultado final es claro, organizado y profesional. | 15% |
      | ${userData.workType === 'En equipo' ? 'Colaboración y Trabajo en Equipo' : 'Originalidad y Pensamiento Crítico'} | ${userData.workType === 'En equipo' ? 'Contribuye y trabaja eficazmente con sus compañeros.' : 'El trabajo muestra un pensamiento propio y creativo.'} | 15% |
      ${userData.useAI === "si" ? "| Uso Ético de la IA | Cita y utiliza la IA de acuerdo a las pautas establecidas. | (Transversal) |\n" : ""}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ proposals: text.split('---PROPUESTA_DIVISOR---') }),
    };

  } catch (error) {
    console.error("Error en la función de Netlify:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Hubo un error al contactar la IA. Esto puede deberse a un problema con la API Key o una sobrecarga temporal del servicio. Por favor, intenta de nuevo en unos momentos." }),
    };
  }
};
