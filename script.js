document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};

    function init() {
        console.log("Iniciando aplicación...");
        fetch('database.json')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log("Base de datos cargada.");
                dbData = data;
                populateCareers();
                setupEventListeners();
            })
            .catch(error => {
                console.error('Error Crítico al cargar database.json:', error);
                const appContainer = document.getElementById('app-container');
                if(appContainer) appContainer.innerHTML = `<p style="color:red; text-align:center;"><b>Error fatal:</b> No se pudo cargar la base de datos (database.json).</p>`;
            });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            currentStep = stepNumber;
            nextStepElement.classList.add('active');
            // Aquí irían las llamadas a funciones específicas de cada paso si fueran necesarias
        }
    }

    function setupEventListeners() {
        console.log("Configurando listeners...");
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => showStep(2));
        }
        
        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                showStep(currentStep + 1);
            });
        });
        
        document.querySelectorAll('.prev-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (currentStep > 1) {
                    showStep(currentStep - 1);
                }
            });
        });

        console.log("Listeners configurados.");
    }
    
    function populateCareers() {
        console.log("Poblando carreras...");
        const careerSelect = document.getElementById('career-select');
        if (dbData.careers && careerSelect) {
            dbData.careers.forEach(career => {
                const option = document.createElement('option');
                option.value = career.name;
                option.textContent = career.name;
                careerSelect.appendChild(option);
            });
        }
    }

    init();
});
