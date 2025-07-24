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
        document.getElementById('finish-btn').addEventListener('click', () => showStep(13));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('back-to-proposals-btn').addEventListener('click', () => showStep(11));
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
                if (isAISelected) populateAILevelSelect();
            });
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        document.getElementById('download-pdf-btn').addEventListener('click', downloadActivityAsPDF);
        document.getElementById('download-word-btn').addEventListener('click', downloadActivityAsWord);
        document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    }
    
    // ... (El resto de las funciones como validateCurrentStep, captureAllUserData, etc. no cambian)

    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        
        introContainer.innerHTML = `<p>Para que un objetivo sea efectivo... (texto introductorio)</p>`;
        container.innerHTML = `<div class="loading-spinner"></div><p>Generando ejemplos...</p>`;

        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;

        if (!career || !subject) {
            container.innerHTML = `<p style="color:red;">Por favor, regresa y selecciona una carrera y materia.</p>`;
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            if (!response.ok) throw new Error('Respuesta no válida del servidor.');

            const examples = await response.json();
            
            let tableHTML = '<table class="rubric-table">';
            // ... (código para construir la tabla)
            container.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error generando ejemplos de Bloom:", error);
            container.innerHTML = `<p style="color:red;">No se pudieron generar los ejemplos dinámicos.</p>`;
        }
    }

    init();
});
