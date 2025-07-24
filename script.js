document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    function init() {
        console.log("Initializing application...");
        fetch('database.json')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log("Database loaded successfully.");
                dbData = data;
                populateCareers();
                setupEventListeners();
            })
            .catch(error => {
                console.error('Error Crítico: No se pudo cargar o parsear database.json.', error);
                const appContainer = document.getElementById('app-container');
                if(appContainer) appContainer.innerHTML = `<p style="color:red; text-align:center;"><b>Error fatal:</b> No se pudo cargar la base de datos de la aplicación (database.json).<br>Por favor, revisa que el archivo exista en el repositorio y no tenga errores de sintaxis.</p>`;
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
        console.log("Setting up event listeners...");

        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, handler);
        };

        const safeAddListenerToAll = (selector, event, handler) => {
            document.querySelectorAll(selector).forEach(el => el.addEventListener(event, handler));
        };

        safeAddListener('start-btn', 'click', () => showStep(2));

        safeAddListenerToAll('.next-btn', 'click', () => {
            if (validateCurrentStep()) {
                showStep(currentStep + 1);
            }
        });
        
        // --- LÍNEA DE CÓDIGO CORREGIDA Y RESTAURADA ---
        safeAddListenerToAll('.prev-btn', 'click', () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
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

        console.log("Event listeners set up successfully.");
    }
    
    function validateCurrentStep() {
        // ... (resto del código sin cambios)
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
        // ... (resto del código sin cambios)
        userData.career = document.getElementById('career-select').value;
        userData.subject = document.getElementById('subject-input').value;
        userData.objective = document.getElementById('objective-input').value;
        userData.studentContext = document.getElementById('student-context-input').value;
        userData.modality = document.querySelector('input[name="modality"]:checked').value;
        userData.duration = document.getElementById('duration-input').value;
        userData.restrictions = document.getElementById('restrictions-input').value;
        userData.workType = document.querySelector('input[name="work-type"]:checked').value;
        userData.extraInfo = [
            document.getElementById('extra-info-details').value,
            document.getElementById('file-upload').dataset.fileText || ''
        ].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }

    async function generateAndPopulateBloomExamples() {
        // ... (resto del código sin cambios)
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        introContainer.innerHTML = `<p>Para que un objetivo sea efectivo... (texto introductorio)</p>`;
        const loadingContainer = container.querySelector('.loading-spinner').parentElement;
        loadingContainer.classList.remove('hidden');
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
            tableHTML += '<thead><tr><th>Domin
