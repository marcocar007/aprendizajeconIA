document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 12;
    let dbData = {};
    const userData = {};

    fetch('database.json')
        .then(response => response.json())
        .then(data => {
            dbData = data;
            populateCareers();
            setupEventListeners();
        })
        .catch(error => console.error('Error al cargar la base de datos:', error));

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            if (stepNumber === 4) {
                updateObjectiveExamples();
            }
            if (stepNumber === 10) {
                if (document.querySelector('input[name="use-ai"]:checked')?.value === 'si') {
                    populateAIFrameworks();
                }
            }
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        } else {
            console.error(`El paso ${stepNumber} no se encontró.`);
        }
    }

    function populateCareers() {
        const careerSelect = document.getElementById('career-select');
        dbData.careers.forEach(career => {
            const option = document.createElement('option');
            option.value = career.name;
            option.textContent = career.name;
            careerSelect.appendChild(option);
        });
    }

    function updateObjectiveExamples() {
        const objectiveExamplesDiv = document.getElementById('objective-examples');
        const bloomDomainsDiv = document.getElementById('bloom-domains');
        objectiveExamplesDiv.innerHTML = '';
        bloomDomainsDiv.innerHTML = '';
        userData.career = document.getElementById('career-select').value;
        userData.subject = document.getElementById('subject-input').value;

        Object.values(dbData.bloomTaxonomy).forEach(domain => {
            const domainDiv = document.createElement('div');
            domainDiv.innerHTML = `<strong>${domain.name}:</strong> ${domain.description}`;
            bloomDomainsDiv.appendChild(domainDiv);

            const randomLevel = domain.levels[Math.floor(Math.random() * domain.levels.length)];
            const randomVerb = randomLevel.verbs[Math.floor(Math.random() * randomLevel.verbs.length)];
            const career = userData.career || 'la carrera seleccionada';
            const subject = userData.subject || 'la asignatura';
            
            const exampleP = document.createElement('p');
            exampleP.innerHTML = `<strong>Ejemplo (${domain.name} - Nivel ${randomLevel.level}):</strong> "${randomVerb.charAt(0).toUpperCase() + randomVerb.slice(1)} [objeto de conocimiento relevante para ${subject} de ${career}] mediante [método o herramienta] para [finalidad del aprendizaje]."`;
            objectiveExamplesDiv.appendChild(exampleP);
        });
    }

    function populateAIFrameworks() {
        const frameworksInfoDiv = document.getElementById('ai-frameworks-info');
        frameworksInfoDiv.innerHTML = '';
        Object.values(dbData.aiFrameworks).forEach(framework => {
            const frameworkDiv = document.createElement('div');
            let levelsHtml = '<ul>';
            framework.levels.forEach(level => {
                levelsHtml += `<li><strong>${level.name}:</strong> ${level.description}</li>`;
            });
            levelsHtml += '</ul>';

            frameworkDiv.innerHTML = `
                <h4>${framework.name}</h4>
                <p>${framework.description}</p>
                ${levelsHtml}
            `;
            frameworksInfoDiv.appendChild(frameworkDiv);
        });
    }
    
    // --- FUNCIÓN CORREGIDA ---
    function setupEventListeners() {
        // Se elimina el listener específico para 'start-btn'.
        // Este bloque ahora maneja TODOS los botones 'next-btn', incluido el primero.
        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (captureDataForStep(currentStep)) {
                    showStep(currentStep + 1);
                }
            });
        });

        document.querySelectorAll('.prev-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Prevenir ir antes del paso 2
                if (currentStep > 1) {
                    showStep(currentStep - 1);
                }
            });
        });

        document.getElementById('generate-proposals-btn').addEventListener('click', () => {
            if (captureDataForStep(9)) {
                prepareAndShowProposals();
            }
        });
        
        document.getElementById('regenerate-proposals-btn').addEventListener('click', () => {
             generateActivityProposals();
        });

        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('finish-btn').addEventListener('click', () => showStep(12));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        
        document.querySelectorAll('input[name="extra-info"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('extra-info-details').classList.toggle('hidden', event.target.value !== 'si');
            });
        });

        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const levelSelectionDiv = document.getElementById('ai-level-selection');
                levelSelectionDiv.classList.toggle('hidden', event.target.value !== 'si');
                if (event.target.value === 'si') {
                    populateAILevelSelect();
                }
                generateActivityProposals();
            });
        });
        
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
    }

    function populateAILevelSelect() {
        const frameworkSelect = document.getElementById('ai-framework-select').value;
        const levelSelect = document.getElementById('ai-level-select');
        levelSelect.innerHTML = '';
        const framework = dbData.aiFrameworks[frameworkSelect];
        framework.levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.level;
            option.textContent = `Nivel ${level.level}: ${level.name}`;
            levelSelect.appendChild(option);
        });
    }

    function captureDataForStep(step) {
        // No hay 'case 1' porque no se captura ningún dato en la pantalla de bienvenida.
        switch(step) {
            case 2:
                userData.career = document.getElementById('career-select').value;
                break;
            case 3:
                userData.subject = document.getElementById('subject-input').value;
                if (!userData.subject) { alert('Por favor, ingresa el nombre de la asignatura.'); return false; }
                break;
            case 4:
                userData.objective = document.getElementById('objective-input').value;
                if (!userData.objective) { alert('Por favor, escribe tu objetivo de aprendizaje.'); return false; }
                break;
            case 5:
                userData.studentContext = document.getElementById('student-context-input').value;
                if (!userData.studentContext) { alert('Por favor, describe el contexto de los estudiantes.'); return false; }
                break;
            case 6:
                userData.modality = document.querySelector('input[name="modality"]:checked')?.value;
                if (!userData.modality) { alert('Por favor, selecciona la modalidad.'); return false; }
                break;
            case 7:
                userData.duration = document.getElementById('duration-input').value;
                 if (!userData.duration) { alert('Por favor, especifica la duración.'); return false; }
                break;
            case 8:
                 userData.restrictions = document.getElementById('restrictions-input').value;
                 break;
            case 9:
                userData.extraInfo = document.querySelector('input[name="extra-info"]:checked').value;
                if (userData.extraInfo === 'si') {
                    userData.extraInfoDetails = document.getElementById('extra-info-details').value;
                }
                break;
        }
        return true;
    }

    function prepareAndShowProposals() {
        const useAI = confirm("¿Deseas que los estudiantes utilicen IA en la actividad?");
        if (useAI) {
