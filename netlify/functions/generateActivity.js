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

    // --- PROMPT MEJORADO PARA GENERAR DOS PROPUESTAS ---
    const prompt = `
      Actúa como un diseñador instruccional experto y creativo. Tu tarea es generar DOS propuestas de actividad de aprendizaje distintas y completas, basadas en los siguientes datos del docente. Utiliza dos enfoques pedagógicos diferentes (ej. uno constructivista y otro basado en proyectos).

      **Datos del Docente:**
      - Carrera: ${userData.career}
      - Asignatura: ${userData.subject}
      - Objetivo de Aprendizaje: "${userData.objective}"
      - Contexto: ${userData.studentContext}
      - Modalidad: ${userData.modality}
      - Duración: ${userData.duration}
      - Tipo de trabajo: ${userData.workType}
      - Restricciones: ${userData.restrictions || "Ninguna."}
      - Uso de IA por Estudiantes: ${userData.useAI === "si" ? `Sí, usando el marco ${userData.aiFramework}, nivel "${userData.aiLevel}".` : "No, la actividad no debe usar IA."}
      - Información Adicional: ${userData.extraInfo || "Ninguna."}

      **Formato de Salida Obligatorio:**
      Genera la primera propuesta. Luego, escribe una línea que contenga únicamente "---PROPUESTA_DIVISOR---". Finalmente, genera la segunda propuesta.
      
      Para CADA una de las dos propuestas, sigue esta estructura de Markdown EXACTA:

      # TÍTULO CREATIVO DE LA PROPUESTA
      *Una descripción muy breve de una línea sobre el enfoque de la actividad.*
      ---
      ### Objetivo de Aprendizaje
      *Reformula el objetivo del docente para que se alinee con esta actividad específica.*

      ### Sustento Pedagógico
      *Explica el enfoque pedagógico (ej. 'Aprendizaje Basado en Problemas') y por qué está centrado en el estudiante o en el objeto de estudio.*
      
      ### Tipo de Uso de la IA
      *${userData.useAI === "si" 
        ? `Describe cómo se usará la IA según el nivel "${userData.aiLevel}". Menciona qué aspecto se aprovechará (ej. 'Generación de texto para brainstorming', 'Análisis de datos con machine learning', etc.).`
        : "Esta actividad está diseñada para realizarse sin el uso de herramientas de IA generativa, fomentando el pensamiento original y la resolución de problemas sin asistencia."
      }*

      ### Función Cerebral Aprovechada
      *Describe qué funciones cerebrales clave (ej. memoria de trabajo, pensamiento crítico) se activan.*

      ### Descripción General
      *Un párrafo que explica en qué consiste la actividad.*

      ### Pasos a Seguir
      1.  **Paso 1:** Detalle claro y conciso.
      2.  **Paso 2:** Detalle claro y conciso.
      3.  **Paso 3:** Y así sucesivamente.

      ### Rúbrica de Evaluación
      | Criterio | Descripción | Ponderación |
      | :--- | :--- | :--- |
      | Comprensión del Tema | Demuestra un entendimiento profundo del objetivo. | 40% |
      | Aplicación Práctica | Aplica los conceptos de manera efectiva en la tarea. | 30% |
      | Calidad de la Presentación | El resultado final es claro, organizado y profesional. | 15% |
      | ${userData.workType === 'En equipo' ? 'Colaboración' : 'Originalidad'} | ${userData.workType === 'En equipo' ? 'Trabaja eficazmente con sus compañeros.' : 'El trabajo muestra un pensamiento propio y creativo.'} | 15% |
      ${userData.useAI === "si" ? "| Uso Ético de la IA | Cita y utiliza la IA de acuerdo a las pautas. | (Se evalúa dentro de otros criterios) |\n" : ""}
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
      body: JSON.stringify({ error: "Hubo un error al contactar la IA. Por favor, revisa la API Key y la configuración." }),
    };
  }
};
