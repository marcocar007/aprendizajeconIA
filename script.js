// Archivo: script.js
document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    function init() {
        fetch('database.json')
            .then(response => response.json())
            .then(data => {
                dbData = data;
                populateCareers();
                setupEventListeners();
            });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            currentStep = stepNumber;
            if (stepNumber === 4) generateAndPopulateBloomExamples();
            if (stepNumber === 10) populateAIFrameworks();
            nextStepElement.classList.add('active');
        }
    }

    function setupEventListeners() {
        // --- FUNCIÓN DE AYUDA PARA AÑADIR LISTENERS DE FORMA SEGURA ---
        const safeAddListener = (selector, event, handler) => {
            const element = document.getElementById(selector);
            if (element) element.addEventListener(event, handler);
        };
        const safeAddListenerToAll = (selector, event, handler) => {
            document.querySelectorAll(selector).forEach(el => el.addEventListener(event, handler));
        };

        safeAddListener('start-btn', 'click', () => showStep(2));
        safeAddListenerToAll('.next-btn', 'click', () => {
            if (validateCurrentStep()) showStep(currentStep + 1);
        });
        safeAddListenerToAll('.prev-btn', 'click', () => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
        safeAddListener('generate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('finish-btn', 'click', () => showStep(13));
        safeAddListener('start-over-btn', 'click', () => location.reload());
        safeAddListener('back-to-proposals-btn', 'click', () => showStep(11));
        safeAddListenerToAll('input[name="use-ai"]', 'change', (event) => {
            const isAISelected = event.target.value === 'si';
            document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
            if (isAISelected) populateAILevelSelect();
        });
        safeAddListener('ai-framework-select', 'change', populateAILevelSelect);
        safeAddListener('download-pdf-btn', 'click', downloadActivityAsPDF);
        safeAddListener('download-word-btn', 'click', downloadActivityAsWord);
    }
    
    function validateCurrentStep() {
        const currentStepDiv = document.getElementById(`step-${currentStep}`);
        const inputs = currentStepDiv.querySelectorAll('input[required], textarea[required], select[required]');
        for (const input of inputs) {
            if (!input.value.trim()) {
                alert('Por favor, completa todos los campos para continuar.');
                input.focus();
                return false;
            }
        }
        return true;
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
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }

    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        introContainer.innerHTML = `<p>Para que un objetivo sea efectivo... (texto introductorio)</p>`;
        container.innerHTML = `<div class="loading-spinner"></div><p>Generando ejemplos relevantes...</p>`;
        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;
        if (!career || !subject) {
            container.innerHTML = `<p style="color:red;">Por favor, regresa y selecciona una carrera y materia.</p>`;
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Respuesta no válida del servidor.');
            const examples = JSON.parse(responseText);
            let tableHTML = '<table class="rubric-table">';
            tableHTML += '<thead><tr><th>Dominio</th><th>Niveles</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
            for (const domainKey in dbData.bloomTaxonomy) {
                const domainData = dbData.bloomTaxonomy[domainKey];
                const exampleData = examples.find(ex => ex.domain === domainData.name);
                let levelsList = '<ul>' + domainData.levels.map(level => `<li>${level.name}</li>`).join('') + '</ul>';
                tableHTML += `<tr>
                    <td><strong>${domainData.name}</strong><br><em>${domainData.description}</em></td>
                    <td>${levelsList}</td>
                    <td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar.'}»</em></td>
                </tr>`;
            }
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } catch (error) {
            console.error("Error en Bloom:", error);
            // --- MENSAJE DE ERROR MEJORADO ---
            container.innerHTML = `<p style="color:red;"><b>No se pudieron generar los ejemplos.</b><br>Causa probable: Límite de uso de la API (espera un minuto e intenta de nuevo) o una API Key no válida.<br><small>Error: ${error.message}</small></p>`;
        }
    }

    async function generateProposalsWithAI() {
        captureAllUserData();
        showStep(11);
        const proposalsContainer = document.getElementById('proposals-container');
        const loadingDiv = document.getElementById('proposals-loading');
        proposalsContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'El servidor respondió con un error.');
            const data = JSON.parse(responseText);
            if (data.error) throw new Error(data.error);
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            // --- MENSAJE DE ERROR MEJORADO ---
            proposalsContainer.innerHTML = `<p style="color: red;"><b>Lo sentimos, ocurrió un error al generar las propuestas.</b><br>Causa probable: Límite de uso de la API (espera un minuto e intenta de nuevo) o una API Key no válida.<br><small>Error: ${error.message}</small></p>`;
        } finally {
            proposalsContainer.classList.remove('hidden');
            loadingDiv.classList.add('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        if (!generatedProposals || generatedProposals.length < 2) {
            container.innerHTML = `<p style="color: red;">La IA no devolvió las dos propuestas esperadas. Intenta de nuevo.</p>`;
            return;
        }
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            const description = proposal.match(/^\* (.*)/m)?.[1] || "Una propuesta de actividad creativa.";
            const proposalDiv = document.createElement('div');
            proposalDiv.className = 'proposal';
            proposalDiv.innerHTML = `<h4>${title}</h4><p>${description}</p><button class="select-proposal-btn" data-index="${index}">Elegir y ver detalles</button>`;
            container.appendChild(proposalDiv);
        });
        document.querySelectorAll('.select-proposal-btn').forEach(button => {
            button.addEventListener('click', (e) => displayFinalActivity(e.target.dataset.index));
        });
    }

    function displayFinalActivity(index) {
        const finalActivityHTML = window.marked.parse(generatedProposals[index]);
        document.getElementById('final-activity-output').innerHTML = finalActivityHTML;
        showStep(12);
    }
    
    function downloadActivityAsPDF() { /* ... sin cambios ... */ }
    function downloadActivityAsWord() { /* ... sin cambios ... */ }
    function populateCareers() { /* ... sin cambios ... */ }
    function populateAIFrameworks() { /* ... sin cambios ... */ }
    function populateAILevelSelect() { /* ... sin cambios ... */ }
    
    init();
});
