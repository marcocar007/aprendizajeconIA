// Archivo: script.js
// Solo la función generateAndPopulateBloomExamples() cambia. El resto del archivo permanece igual.

async function generateAndPopulateBloomExamples() {
    const container = document.getElementById('bloom-table-container');
    const introContainer = document.getElementById('bloom-intro-text');
    
    introContainer.innerHTML = `<p>Para que un objetivo sea efectivo, debe ser claro y medible. La Taxonomía de Bloom nos ayuda a estructurarlo, organizando el aprendizaje en tres dominios: <strong>Cognitivo</strong> (el saber), <strong>Afectivo</strong> (el ser) y <strong>Psicomotor</strong> (el hacer). Dentro de cada dominio, los niveles van de acciones simples a complejas, asegurando un aprendizaje progresivo y profundo.</p><p>A continuación, se muestran todos los niveles con un ejemplo generado por IA para cada dominio, adaptado a tu selección:</p>`;
    container.innerHTML = `<div class="loading-spinner"></div><p>Generando ejemplos relevantes...</p>`;

    const career = document.getElementById('career-select').value;
    const subject = document.getElementById('subject-input').value;

    if (!career || !subject) {
        container.innerHTML = `<p style="color:red;">Por favor, regresa y asegúrate de haber seleccionado una carrera y escrito una materia.</p>`;
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/generateExamples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ career, subject })
        });
        
        const responseText = await response.text();
        if (!response.ok) {
            // Intenta extraer el mensaje de error del cuerpo de la respuesta
            let errorMessage = "Respuesta no válida del servidor.";
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                // El cuerpo de la respuesta no era JSON, no hacer nada extra.
            }
            throw new Error(errorMessage);
        }

        const examples = JSON.parse(responseText);
        
        let tableHTML = '<table class="rubric-table">';
        tableHTML += '<thead><tr><th>Dominio</th><th>Niveles (de simple a complejo)</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
        
        for (const domainKey in dbData.bloomTaxonomy) {
            const domainData = dbData.bloomTaxonomy[domainKey];
            const exampleData = examples.find(ex => ex.domain === domainData.name);
            let levelsList = '<ul>';
            domainData.levels.forEach(level => {
                levelsList += `<li>${level.name}</li>`;
            });
            levelsList += '</ul>';
            tableHTML += `<tr>
                <td><strong>${domainData.name}</strong><br><em>${domainData.description}</em></td>
                <td>${levelsList}</td>
                <td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar ejemplo.'}»</em></td>
            </tr>`;
        }
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

    } catch (error) {
        console.error("Error generando ejemplos de Bloom:", error);
        container.innerHTML = `<p style="color:red;">Lo sentimos, ocurrió un error: ${error.message}. Esto puede ser un problema temporal (arranque en frío). Por favor, intenta de nuevo en unos segundos.</p>`;
    }
}

// El resto de tu archivo script.js permanece igual
// ...
