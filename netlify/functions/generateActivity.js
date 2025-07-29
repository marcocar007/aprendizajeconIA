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
      Actúa como un diseñador instruccional experto y creativo. Tu tarea es generar DOS propuestas de actividad de aprendizaje distintas y completas, basadas en los siguientes datos del docente. Usa dos enfoques pedagógicos diferentes (ej. uno constructivista y otro basado en proyectos).

      **Datos del Docente:**
      - Carrera: ${userData.career}
      - Asignatura: ${userData.subject}
      - Objetivo de Aprendizaje Principal: "${userData.objective}"
      - Contexto: ${userData.studentContext}
      - Modalidad: ${userData.modality}
      - Duración Sugerida: ${userData.duration}
      - Formato de Trabajo: ${userData.workType}
      - Restricciones: ${userData.restrictions || "Ninguna especificada."}
      - Información Adicional: ${userData.extraInfo || "Ninguna."}
      - Uso de IA por Estudiantes: ${userData.useAI === "si" ? `Sí, permitido bajo el marco ${userData.aiFramework}, nivel "${userData.aiLevel}".` : "No, esta actividad debe realizarse sin asistencia de IA generativa."}

      **Instrucciones de Formato Obligatorio:**
      Genera la primera propuesta completa. Luego, en una nueva línea, escribe única y exclusivamente la palabra "---PROPUESTA_DIVISOR---". Finalmente, genera la segunda propuesta completa.
      
      Para CADA una de las dos propuestas, sigue esta estructura de Markdown EXACTA:

      # TÍTULO CREATIVO Y CONCISO DE LA PROPUESTA
      *Un resumen de 2 a 3 líneas que describa de forma general la actividad y lo que los estudiantes harán.*
      ---
      ### Objetivo de Aprendizaje
      *Reformula o adapta el objetivo del docente para que se alinee con esta actividad específica.*

      ### Sustento Pedagógico
      *Explica el enfoque pedagógico y por qué está centrado en el estudiante o en el objeto de estudio.*
      
      ### Tipo de Uso de la IA
      *${userData.useAI === "si" 
        ? `Nivel de uso de IA: ${userData.aiLevel}. Se aprovechará la IA para tareas como: [Menciona aquí 1 o 2 aspectos específicos, ej: 'brainstorming de ideas iniciales', 'creación de imágenes', etc.].`
        : "Esta actividad está diseñada para realizarse sin el uso de herramientas de IA generativa."
      }*

      ### Función Cerebral Aprovechada
      *Describe 1 o 2 funciones cerebrales clave que se activan.*

      ### Descripción General
      *Un párrafo que explica en qué consiste la actividad y el producto final esperado.*

      ### Pasos a Seguir
      *Proporciona una lista numerada con los pasos claros y prácticos.*
      1.  **Paso 1:** ...
      2.  **Paso 2:** ...

      ### Rúbrica de Evaluación Sugerida
      | Criterio | Descripción Breve | Ponderación |
      | :--- | :--- | :--- |
      | Comprensión del Tema | El trabajo demuestra un entendimiento profundo. | 40% |
      | Aplicación Práctica | Los conceptos se aplican de manera efectiva. | 30% |
      | Calidad y Presentación | El resultado final es claro y organizado. | 15% |
      | ${userData.workType === 'En equipo' ? 'Colaboración' : 'Originalidad'} | ${userData.workType === 'En equipo' ? 'Contribuye y trabaja eficazmente.' : 'Muestra un pensamiento propio.'} | 15% |
      ${userData.useAI === "si" ? "| Uso Ético de la IA | Cita y utiliza la IA de acuerdo a las pautas. | (Transversal) |\n" : ""}
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
