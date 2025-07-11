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

    const prompt = `
      Actúa como un pedagogo experto. Genera 3 ejemplos de objetivos de aprendizaje para la asignatura "${subject}" de la carrera de "${career}".
      Crea un ejemplo para cada dominio de la Taxonomía de Bloom (uno Cognitivo, uno Afectivo, y uno Psicomotor), seleccionando un nivel aleatorio para cada uno.
      Devuelve la respuesta únicamente como un array de objetos JSON válido, sin ningún otro texto o formato. La estructura debe ser:
      [
        {"domain": "Cognitivo (Saber)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."},
        {"domain": "Afectivo (Ser)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."},
        {"domain": "Psicomotor (Hacer)", "level": "nombre del nivel", "example": "Ejemplo de objetivo completo..."}
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: text, // Devolvemos el texto directamente, ya que es un JSON
    };

  } catch (error) {
    console.error("Error en generateExamples:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudieron generar los ejemplos." }),
    };
  }
};
