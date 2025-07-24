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
        document.getElementById('start-btn').addEventListener('click', () => showStep(2));
        
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
        
        document.getElementById('generate-proposals-btn').addEventListener('click', generateProposalsWithAI);
        document.getElementById('regenerate-proposals-btn').addEventListener('click', generateProposalsWithAI);
        document.getElementById('finish-btn').addEventListener('click', () => showStep(13));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('back-to-proposals-btn').addEventListener('click', () => showStep(11));
        
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
        document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    }
    
    // ... (El resto de las funciones como validateCurrentStep, captureAllUserData, etc., no cambian)

    // --- NUEVA FUNCIÓN PARA MANEJAR LA SUBIDA DE ARCHIVOS ---
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
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (file.type === 'text/plain') {
                text = await file.text();
            } else {
                throw new Error('Formato no soportado (solo PDF, DOCX, TXT).');
            }
            statusElement.textContent = `✔️ "${file.name}" cargado con éxito.`;
            fileInputField.dataset.fileText = text; // Almacena el texto extraído
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            statusElement.textContent = `❌ ${error.message}`;
            fileInputField.dataset.fileText = '';
        }
    }

    init();
});
