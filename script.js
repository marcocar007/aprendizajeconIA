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
                populateBloomTable();
                setupEventListeners();
                console.log("Aplicación inicializada.");
            })
            .catch(error => {
                console.error('Error al cargar database.json:', error);
                // Opcional: mostrar un error al usuario en la UI
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
            button.addEventListener('click', () => showStep(currentStep + 1));
        });
        document.querySelectorAll('.prev-btn').forEach(button => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
        document.getElementById('generate-activity-btn').addEventListener('click', generateActivityWithAI);
        document.getElementById('finish-btn').addEventListener('click', () => showStep(12));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('ai-level-selection').classList.toggle('hidden', event.target.value !== 'si');
                if (event.target.value === 'si') populateAILevelSelect();
            });
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
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
    }

    async function generateActivityWithAI() {
        captureAllUserData();
        if (!userData.objective || !userData.subject) {
            alert("Por favor, asegúrate de haber completado el nombre de la asignatura y el objetivo de aprendizaje.");
            return;
        }

        showStep(11);
        const outputDiv = document.getElementById('final-activity-output');
        outputDiv.innerHTML = '<div class="loading-spinner"></div><p>Conectando con la IA para generar tu actividad... Esto puede tardar unos segundos.</p>';

        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Reemplazamos los saltos de línea con <br> para que se muestren en HTML
            const formattedHtml = data.activity.replace(/\n/g, '<br>');
            outputDiv.innerHTML = `<div>${formattedHtml}</div>`;

        } catch (error) {
            console.error('Error:', error);
            outputDiv.innerHTML = `<p style="color: red;">Lo sentimos, ocurrió un error: ${error.message}. Por favor, revisa la configuración e intenta de nuevo.</p>`;
        }
    }

    function populateBloomTable() {
        const container = document.getElementById('bloom-table-container');
        if (!dbData.bloomTaxonomy) return;
        let tableHTML = '<table class="rubric-table">';
        tableHTML += '<thead><tr><th>Dominio</th><th>Nivel (de simple a complejo)</th><th>Verbos Clave</th></tr></thead><tbody>';
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
        const source = document.getElementById('final-activity-output');
        if (!source) return;
    
        html2canvas(source, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'pt', 'letter');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // con margen
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
            pdf.save('actividad_generada.pdf');
        });
    }

    function populateCareers() {
        const careerSelect = document.getElementById('career-select');
        if (!dbData.careers) return;
        dbData.careers.forEach(career => {
            const option = document.createElement('option');
            option.value = career.name;
            option.textContent = career.name;
            careerSelect.appendChild(option);
        });
    }

    function populateAIFrameworks() { /* ... esta función no requiere cambios ... */ }
    function populateAILevelSelect() { /* ... esta función no requiere cambios ... */ }

    init();
});
