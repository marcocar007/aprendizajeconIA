document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    function init() {
        fetch('database.json').then(res => res.json()).then(data => {
            dbData = data;
            populateCareers();
            populateAIFrameworks();
            setupEventListeners();
        });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            currentStep = stepNumber;
            if (stepNumber === 4) generateAndPopulateBloomExamples();
            nextStepElement.classList.add('active');
        }
    }

    function setupEventListeners() {
        const safeAddListener = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        };
        safeAddListener('start-btn', 'click', () => showStep(2));
        document.querySelectorAll('.next-btn').forEach(btn => btn.addEventListener('click', () => {
            if (validateCurrentStep()) showStep(currentStep + 1);
        }));
        document.querySelectorAll('.prev-btn').forEach(btn => btn.addEventListener('click', () => {
            if (currentStep > 1) showStep(currentStep - 1);
        }));
        safeAddListener('generate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('regenerate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('back-to-proposals-btn', 'click', () => showStep(11));
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => radio.addEventListener('change', (e) => {
            const isAISelected = e.target.value === 'si';
            document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
            if (isAISelected) populateAILevelSelect();
        }));
        safeAddListener('ai-framework-select', 'change', populateAILevelSelect);
        safeAddListener('file-upload', 'change', handleFileUpload);
    }
    
    function validateCurrentStep() { /* ... código sin cambios ... */ }
    function captureAllUserData() { /* ... código sin cambios ... */ }
    async function handleFileUpload(event) { /* ... código de la versión anterior ... */ }
    async function generateAndPopulateBloomExamples() { /* ... código de la versión anterior ... */ }
    async function generateProposalsWithAI() { /* ... código de la versión anterior ... */ }
    function displayProposals() { /* ... código de la versión anterior ... */ }
    function displayFinalActivity(index) { /* ... código de la versión anterior ... */ }
    function populateCareers() { /* ... código sin cambios ... */ }
    function populateAIFrameworks() {
        const frameworksInfoDiv = document.getElementById('ai-frameworks-info');
        if (!dbData.aiFrameworks || frameworksInfoDiv.innerHTML.trim() !== '') return;
        Object.values(dbData.aiFrameworks).forEach(framework => {
            let levelsHtml = '<ul>' + framework.levels.map(level => `<li><strong>${level.name}:</strong> ${level.description || ''}</li>`).join('') + '</ul>';
            frameworksInfoDiv.innerHTML += `<h4>${framework.name}</h4><p>${framework.description}</p>${levelsHtml}`;
        });
    }
    function populateAILevelSelect() { /* ... código sin cambios ... */ }

    init();
});
