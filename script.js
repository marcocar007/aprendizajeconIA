// Archivo: script.js

document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};

    function init() {
        fetch('database.json')
            .then(response => response.json())
            .then(data => {
                dbData = data;
                populateCareers();
                populateBloomTable(); // Nueva función para la tabla
                setupEventListeners();
            });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            if (stepNumber === 10) {
                populateAIFrameworks();
            }
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        }
    }

    function setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => showStep(2));

        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (captureDataForStep(currentStep)) {
                    showStep(currentStep + 1);
                }
            });
        });

        document.querySelectorAll('.prev-btn').forEach(button => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
        
        // --- Listener para el botón principal de generación ---
        document.getElementById('generate-activity-btn').addEventListener('click', generateActivityWithAI);

        document.getElementById('restart-btn')?.addEventListener('click', () => location.reload());
        document.getElementById('finish-btn').addEventListener('click', () => showStep(12));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());

        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('ai-level-selection').classList.toggle('hidden', event.target.value !== 'si');
                if (event.target.value === 'si') populateAILevelSelect();
            });
        });

        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        
        // --- Listener para el nuevo botón de descarga ---
        document.getElementById('download-pdf-btn').addEventListener('click', downloadActivityAsPDF);
    }
    
    function captureAllUserData() {
        userData.career = document.getElementById('career-select').value;
        userData.subject = document.getElementById('subject-input').value;
        userData.objective = document.getElementById('objective-input').value;
        userData.studentContext = document.getElementById('student-context-input').value;
        userData.modality = document.querySelector('input[name="modality"]:checked').value;
        userData.duration = document.getElementById('duration-input').value;
        userData.restrictions = document.getElementById('restrictions-input').value;
        userData.workType = document.querySelector('input[name="work-type"]:checked').value;
        userData.extraInfo = document.getElementById('extra-info-details').value;
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if(userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
        // Basic validation
        if (!userData.objective || !userData.subject) {
            alert("Por favor, asegúrate de haber completado el nombre de la asignatura y el objetivo de aprendizaje.");
            return false;
        }
        return true;
    }

    async function generateActivityWithAI() {
        if (!captureAllUserData()) return;

        showStep(11); // Mover a la pantalla de carga/resultado
        const outputDiv = document.getElementById('final-activity-output');
        outputDiv.innerHTML = '<div class="loading-spinner"></div><p>Generando actividad... Esto puede tardar unos segundos.</p>';

        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Aquí necesitaríamos una librería para convertir Markdown a HTML
            // Por simplicidad, lo mostraremos como texto preformateado
            // En una versión más avanzada, usaríamos "marked.js" o similar
            outputDiv.innerHTML = `<pre>${data.activity}</pre>`;

        } catch (error) {
            console.error('Error:', error);
            outputDiv.innerHTML = `<p style="color: red;">Lo sentimos, ocurrió un error al generar la actividad. Por favor, intenta de nuevo.</p>`;
        }
    }

    function populateBloomTable() {
        const container = document.getElementById('bloom-table-container');
        let tableHTML = '<table class="rubric-table">';
        tableHTML += '<thead><tr><th>Dominio</th><th>Nivel (de simple a complejo)</th><th>Descripción</th></tr></thead><tbody>';

        for (const domainKey in dbData.bloomTaxonomy) {
            const domain = dbData.bloomTaxonomy[domainKey];
            domain.levels.forEach((level, index) => {
                tableHTML += `<tr>`;
                if (index === 0) {
                    tableHTML += `<td rowspan="${domain.levels.length}"><strong>${domain.name}</strong><br><em>${domain.description}</em></td>`;
                }
                tableHTML += `<td>${level.name}</td><td>${level.verbs.join(', ')}</td>`;
                tableHTML += `</tr>`;
            });
        }

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }
    
    function downloadActivityAsPDF() {
        const { jsPDF } = window.jspdf;
        const quality = 2; // Mayor calidad para la captura de pantalla
        const pdf = new jsPDF('p', 'pt', 'letter');
        
        const source = document.getElementById('final-activity-output');
        if (!source) {
            console.error("Elemento para PDF no encontrado");
            return;
        }
    
        html2canvas(source, {
            scale: quality,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('actividad_generada.pdf');
        });
    }

    // Funciones de población que ya teníamos (sin cambios mayores)
    function populateCareers() { /* ... sin cambios ... */ }
    function populateAIFrameworks() { /* ... sin cambios ... */ }
    function populateAILevelSelect() { /* ... sin cambios ... */ }

    // Inicializar la aplicación
    init();
});
