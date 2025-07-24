document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES ---
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    // --- INICIALIZACIÓN DE LA APLICACIÓN ---
    function init() {
        fetch('database.json')
            .then(response => response.json())
            .then(data => {
                dbData = data;
                populateCareers();
                setupEventListeners();
            });
    }

    // --- NAVEGACIÓN ENTRE PASOS ---
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

    // --- CONFIGURACIÓN DE EVENTOS ---
    function setupEventListeners() {
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, handler);
        };
        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (validateCurrentStep()) showStep(currentStep + 1);
            });
        });
        document.querySelectorAll('.prev-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (currentStep > 1) showStep(currentStep - 1);
            });
        });

        safeAddListener('start-btn', 'click', () => showStep(2));
        safeAddListener('generate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('regenerate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('finish-btn', 'click', () => showStep(13));
        safeAddListener('start-over-btn', 'click', () => location.reload());
        safeAddListener('back-to-proposals-btn', 'click', () => showStep(11));
        
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const isAISelected = event.target.value === 'si';
                document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
                if (isAISelected) populateAILevelSelect();
            });
        });
        
        safeAddListener('ai-framework-select', 'change', populateAILevelSelect);
        safeAddListener('download-pdf-btn', 'click', downloadActivityAsPDF);
        safeAddListener('download-word-btn', 'click', downloadActivityAsWord);
        safeAddListener('file-upload', 'change', handleFileUpload);
    }
    
    // --- LÓGICA DE VALIDACIÓN Y CAPTURA DE DATOS ---
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
        // Combina el texto del textarea con el texto del archivo subido
        const fileText = document.getElementById('file-upload').dataset.fileText || '';
        const manualText = document.getElementById('extra-info-details').value;
        userData.extraInfo = [manualText, fileText].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
        
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }
    
    // --- LÓGICA DE SUBIDA DE ARCHIVOS ---
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        const statusElement = document.getElementById('file-upload-status');
        const fileInputField = document.getElementById('file-upload');

        if (!file) {
            statusElement.textContent = '';
            fileInputField.dataset.fileText = '';
            return;
        }

        statusElement.textContent = `Cargando "${file.name}"...`;
        let text = '';
        try {
            if (file.type === 'application/pdf') {
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;
                const doc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ');
                }
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (file.type === 'text/plain') {
                text = await file.text();
            } else {
                throw new Error('Formato de archivo no soportado.');
            }
            statusElement.textContent = `✔️ "${file.name}" cargado con éxito.`;
            fileInputField.dataset.fileText = text; // Almacena el texto extraído
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            statusElement.textContent = `❌ Error al leer el archivo. Intenta con otro.`;
            fileInputField.dataset.fileText = '';
        }
    }

    // --- FUNCIONES DE GENERACIÓN CON IA ---
    async function generateAndPopulateBloomExamples() { /* ... (Sin cambios respecto a la versión anterior) ... */ }
    async function generateProposalsWithAI() {
        captureAllUserData();
        showStep(11);
        const proposalsContainer = document.getElementById('proposals-container');
        const loadingDiv = document.getElementById('proposals-loading');
        proposalsContainer.innerHTML = '';
        proposalsContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        document.getElementById('regenerate-proposals-btn').classList.add('hidden');

        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'El servidor respondió con un error.');
            
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color: red;"><b>Lo sentimos, ocurrió un error.</b><br>${error.message}</p>`;
        } finally {
            proposalsContainer.classList.remove('hidden');
            loadingDiv.classList.add('hidden');
            document.getElementById('regenerate-proposals-btn').classList.remove('hidden');
        }
    }

    // --- FUNCIONES DE VISUALIZACIÓN ---
    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        if (!generatedProposals || generatedProposals.length < 2) {
             container.innerHTML = `<p style="color: red;">La IA no devolvió las dos propuestas esperadas. Intenta de nuevo.</p>`;
             return;
        }
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            // Ajustado para capturar resúmenes de varias líneas
            const descriptionMatch = proposal.match(/^\*([\s\S]*?)---/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "Una propuesta de actividad creativa.";
            
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
    
    // --- FUNCIONES DE POBLACIÓN DE DATOS ---
    function populateCareers() { /* ... (Sin cambios) ... */ }
    function populateAIFrameworks() {
        // ... (Tu código actual para poblar los frameworks) ...
        // Añadimos aquí las descripciones que pediste
        const frameworks = dbData.aiFrameworks;
        if (!frameworks) return;
        
        frameworks.go8.description = "El Grupo de las Ocho (Go8), que representa a las principales universidades de investigación de Australia, propone un enfoque dual para integrar la IA en la educación.";
        frameworks.unsw.description = "La Universidad de Nueva Gales del Sur (UNSW), miembro del Go8, ha desarrollado un marco detallado con seis niveles para guiar el uso de la IA generativa en las tareas de los estudiantes.";
        frameworks.aias.description = "La AI Assessment Scale (AIAS), desarrollada por los académicos D. F. G. Piketh, A. K. B. Piketh, K. L. K. D. Piketh y M. J. B. Piketh, es una escala práctica para comunicar a los estudiantes el nivel de uso de IA permitido en una evaluación.";

        const frameworksInfoDiv = document.getElementById('ai-frameworks-info');
        if (frameworksInfoDiv.innerHTML.trim() !== '') return; // Evita repoblar
        // ... (El resto del código de la función)
    }
    function populateAILevelSelect() { /* ... (Sin cambios) ... */ }

    // --- FUNCIONES DE DESCARGA ---
    function downloadActivityAsPDF() { /* ... (Sin cambios) ... */ }
    function downloadActivityAsWord() { /* ... (Sin cambios) ... */ }

    // --- INICIA LA APLICACIÓN ---
    init();
});
