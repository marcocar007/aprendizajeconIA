document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};

    function init() {
        fetch('database.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                dbData = data;
                populateCareers();
                setupEventListeners();
            })
            .catch(error => {
                console.error('Error al cargar la base de datos:', error);
                document.getElementById('app-container').innerHTML = `<p style="color:red; text-align:center;"><b>Error fatal:</b> No se pudo cargar la base de datos.</p>`;
            });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        }
    }

    function setupEventListeners() {
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
    }
    
    function populateCareers() {
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
