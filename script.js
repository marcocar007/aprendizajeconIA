document.addEventListener('DOMContentLoaded', () => {
    let dbData = {};

    function init() {
        fetch('database.json').then(res => res.json()).then(data => {
            dbData = data;
            populateCareers();
            setupEventListeners();
        });
    }

    function setupEventListeners() {
        document.getElementById('generate-activity-btn').addEventListener('click', generateActivityWithAI);
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        
        // --- INICIO DE LA MODIFICACIÓN ---
        const careerSelect = document.getElementById('career-select');
        const subjectInput = document.getElementById('subject-input');

        // Se activa cuando el usuario cambia la carrera o termina de escribir la materia
        careerSelect.addEventListener('change', triggerBloomGeneration);
        subjectInput.addEventListener('blur', triggerBloomGeneration); // 'blur' es cuando se sale del campo
        // --- FIN DE LA MODIFICACIÓN ---
    }
    
    // --- NUEVA FUNCIÓN DISPARADORA ---
    function triggerBloomGeneration() {
        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;
        // Solo genera los ejemplos si ambos campos tienen valor
        if (career && subject) {
            generateAndPopulateBloomExamples();
        }
    }

    // --- NUEVA FUNCIÓN PARA GENERAR EJEMPLOS DE BLOOM ---
    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-container');
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Espera un momento por favor. Estamos generando ejemplos de objetivos de aprendizaje...</p>
            </div>`;

        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;

        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Respuesta no válida del servidor.');
            
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
            container.innerHTML = `<p style="color:red;"><b>No se pudieron generar los ejemplos.</b><br><small>${error.message}</small></p>`;
        }
    }

    // ... (El resto de las funciones de tu script.js no necesitan cambios)

    init();
});
