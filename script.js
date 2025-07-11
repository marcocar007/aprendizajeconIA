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
                setupEventListeners();
            })
            .catch(error => console.error('Error al cargar database.json:', error));
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            if (stepNumber === 4) populateBloomExamples();
            if (stepNumber === 10) populateAIFrameworks();
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        }
    }

    function setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => showStep(2));
        document.querySelectorAll('.next-btn').forEach(button => button.addEventListener('click', () => showStep(currentStep + 1)));
        document.querySelectorAll('.prev-btn').forEach(button => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
        document.getElementById('generate-activity-btn').addEventListener('click', generateActivityWithAI);
        document.getElementById('finish-btn').addEventListener('click', () => showStep(12));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const isAISelected = event.target.value === 'si';
                document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
                if (isAISelected) populateAILevelSelect();
            });
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        document.getElementById('download-pdf-btn').addEventListener('click', downloadActivityAsPDF);
        document.getElementById('download-word-btn').addEventListener('click', downloadActivityAsWord);
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
            if (!response.ok) throw new Error(`El servidor respondió con un error: ${response.statusText}`);
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Usamos una librería (marcada en el HTML) o una función para convertir Markdown a HTML
            // Como no tenemos una, hacemos un reemplazo simple para la demo.
            const formattedHtml = data.activity
                .replace(/### \*\*(.*?)\*\*/g, '<h3>$1</h3>') // ### **TITLE** -> <h3>TITLE</h3>
                .replace(/### (.*?)/g, '<h3>$1</h3>')       // ### TITLE -> <h3>TITLE</h3>
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** -> <strong>bold</strong>
                .replace(/\*(.*?)\*/g, '<em>$1</em>')         // *italic* -> <em>italic</em>
                .replace(/^\* (.*$)/gm, '<li>$1</li>')       // * list item -> <li>list item</li>
                .replace(/\n/g, '<br>');

            outputDiv.innerHTML = `<div>${formattedHtml}</div>`;

        } catch (error) {
            console.error('Error:', error);
            outputDiv.innerHTML = `<p style="color: red;">Lo sentimos, ocurrió un error: ${error.message}. Por favor, revisa la configuración e intenta de nuevo.</p>`;
        }
    }

    function populateBloomExamples() {
        const container = document.getElementById('bloom-examples-container');
        if (!dbData.bloomTaxonomy) return;
        let tableHTML = '<table class="rubric-table">';
        tableHTML += '<thead><tr><th>Dominio</th><th>Nivel de Ejemplo</th><th>Verbos Clave</th><th>Ejemplo de Objetivo (Verbo+Contenido+Propósito)</th></tr></thead><tbody>';
        
        for (const domainKey in dbData.bloomTaxonomy) {
            const domain = dbData.bloomTaxonomy[domainKey];
            const randomLevelIndex = Math.floor(Math.random() * domain.levels.length);
            const level = domain.levels[randomLevelIndex];
            const randomExample = level.examples[Math.floor(Math.random() * level.examples.length)];

            tableHTML += `<tr>
                <td><strong>${domain.name}</strong></td>
                <td>${level.name}</td>
                <td><em>${level.verbs.join(', ')}</em></td>
                <td>«${randomExample}»</td>
            </tr>`;
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
            const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth, pdfHeight);
            pdf.save('actividad_generada.pdf');
        });
    }
    
    function downloadActivityAsWord() {
        const sourceHTML = document.getElementById('final-activity-output').innerHTML;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Actividad de Aprendizaje</title></head><body>";
        const footer = "</body></html>";
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + sourceHTML + footer);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'actividad_de_aprendizaje.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
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

    function populateAIFrameworks() {
        const frameworksInfoDiv = document.getElementById('ai-frameworks-info');
        if (!dbData.aiFrameworks || frameworksInfoDiv.innerHTML.trim() !== '') return;
        
        Object.values(dbData.aiFrameworks).forEach(framework => {
            let levelsHtml = '<ul>';
            framework.levels.forEach(level => {
                levelsHtml += `<li><strong>${level.name}:</strong> ${level.description}</li>`;
            });
            levelsHtml += '</ul>';
            frameworksInfoDiv.innerHTML += `<h4>${framework.name}</h4><p>${framework.description}</p>${levelsHtml}`;
        });
    }
    
    function populateAILevelSelect() {
        const frameworkKey = document.getElementById('ai-framework-select').value;
        const levelSelect = document.getElementById('ai-level-select');
        levelSelect.innerHTML = '';
        const framework = dbData.aiFrameworks[frameworkKey];
        if (!framework) return;
        
        framework.levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.name; // Usar el nombre para el prompt
            option.textContent = `${frameworkKey === 'go8' ? '' : 'Nivel ' + level.level + ': '}${level.name}`;
            levelSelect.appendChild(option);
        });
    }

    init();
});
