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
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        safeAddListener('start-btn', 'click', () => showStep(2));
        
        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    showStep(currentStep + 1);
                }
            });
        });
        
        document.querySelectorAll('.prev-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (currentStep > 1) {
                    showStep(currentStep - 1);
                }
            });
        });
        
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
        const fileText = document.getElementById('file-upload').dataset.fileText || '';
        const manualText = document.getElementById('extra-info-details').value;
        userData.extraInfo = [manualText, fileText].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }
    
    async function handleFileUpload(event) {
        // ... (resto del código sin cambios)
    }

    async function generateAndPopulateBloomExamples() {
        // ... (resto del código sin cambios)
    }
    
    async function generateProposalsWithAI() {
        // ... (resto del código sin cambios)
    }

    function displayProposals() {
        // ... (resto del código sin cambios)
    }

    function displayFinalActivity(index) {
        // ... (resto del código sin cambios)
    }
    
    function downloadActivityAsPDF() {
        // ... (resto del código sin cambios)
    }
    
    function downloadActivityAsWord() {
        // ... (resto del código sin cambios)
    }

    function populateCareers() {
        // ... (resto del código sin cambios)
    }

    function populateAIFrameworks() {
        // ... (resto del código sin cambios)
    }
    
    function populateAILevelSelect() {
        // ... (resto del código sin cambios)
    }

    init();
});
