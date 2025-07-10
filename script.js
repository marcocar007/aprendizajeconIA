document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 13;
    let dbData = {};
    const userData = {};

    function init() {
        fetch('database.json')
            .then(response => response.json())
            .then(data => {
                dbData = data;
                populateCareers();
                setupEventListeners();
                console.log("Aplicación inicializada correctamente.");
            })
            .catch(error => console.error('Error fatal durante la inicialización:', error));
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            if (stepNumber === 4) {
                updateObjectiveExamples();
            }
            // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
            // Si el paso que vamos a mostrar es el 10, cargamos la información de los marcos de IA.
            if (stepNumber === 10) {
                populateAIFrameworks();
            }
            // --- FIN DE LA CORRECCIÓN ---
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        } else {
            console.error(`Error: El paso ${stepNumber} no se encontró en el HTML.`);
        }
    }

    function setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            showStep(2);
        });

        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (captureDataForStep(currentStep)) {
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
        
        document.getElementById('generate-proposals-btn').addEventListener('click', () => {
            captureDataForStep(10);
            generateActivityProposals();
            showStep(11); // Avanza a la siguiente pantalla
        });
        
        document.getElementById('regenerate-proposals-btn').addEventListener('click', generateActivityProposals);
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('finish-btn').addEventListener('click', () => showStep(13));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        
        document.querySelectorAll('input[name="extra-info"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('extra-info-details').classList.toggle('hidden', event.target.value !== 'si');
            });
        });

        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const levelSelectionDiv = document.getElementById('ai-level-selection');
                const isAISelected = event.target.value === 'si';
                levelSelectionDiv.classList.toggle('hidden', !isAISelected);
                if (isAISelected) {
                    populateAILevelSelect();
                }
            });
        });
        
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
    }

    function captureDataForStep(step) {
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
            case 10:
                userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
                if(userData.useAI === 'si') {
                    userData.aiFramework = document.getElementById('ai-framework-select').value;
                    userData.aiLevel = document.getElementById('ai-level-select').value;
                }
                break;
        }
        return true;
    }

    function populateCareers() { /* ... sin cambios ... */ 
        const careerSelect = document.getElementById('career-select');
        dbData.careers.forEach(career => {
            const option = document.createElement('option');
            option.value = career.name;
            option.textContent = career.name;
            careerSelect.appendChild(option);
        });
    }

    function updateObjectiveExamples() { /* ... sin cambios ... */ 
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
        // Evita recargar si ya tiene contenido, para no causar un parpadeo
        if (frameworksInfoDiv.innerHTML.trim() !== '') {
            return;
        }
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
    
    function populateAILevelSelect() {
        const frameworkKey = document.getElementById('ai-framework-select').value;
        const levelSelect = document.getElementById('ai-level-select');
        levelSelect.innerHTML = '';
        const framework = dbData.aiFrameworks[frameworkKey];
        if (!framework) return;
        
        framework.levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.level;
            option.textContent = `${frameworkKey === 'go8' ? '' : 'Nivel ' + level.level + ': '}${level.name}`;
            levelSelect.appendChild(option);
        });
    }

    function generateActivityProposals() {
        const container = document.getElementById('activity-proposals-container');
        container.innerHTML = '<h3>Generando propuestas...</h3>';
        
        setTimeout(() => { 
            container.innerHTML = '';
            document.getElementById('regenerate-proposals-btn').classList.remove('hidden');

            for (let i = 1; i <= 2; i++) {
                const proposalDiv = document.createElement('div');
                proposalDiv.classList.add('proposal');
                
                const randomPedagogue = dbData.pedagogues[Math.floor(Math.random() * dbData.pedagogues.length)];
                const randomBrainFunction = dbData.brainFunctions[Math.floor(Math.random() * dbData.brainFunctions.length)];
                
                let activityDescription = `Esta actividad se basa en los principios de <strong>${randomPedagogue.name}</strong>. Se enfoca en el aprendizaje ${randomPedagogue.focus}.`;
                let useAIDescription = ``;

                if (userData.useAI === 'si') {
                     const selectedFramework = dbData.aiFrameworks[userData.aiFramework];
                     const selectedLevel = selectedFramework.levels.find(l => l.level == userData.aiLevel);
                     useAIDescription = `<p><strong>Uso de IA:</strong> Se utilizará la IA bajo el marco de <strong>${selectedFramework.name}</strong>, en el nivel "<strong>${selectedLevel.name}</strong>". ${selectedLevel.description}</p>`;
                } else {
                    useAIDescription = `<p><strong>Uso de IA:</strong> Esta actividad está diseñada para ser completada sin el uso de herramientas de inteligencia artificial generativa.</p>`;
                }
                
                proposalDiv.innerHTML = `
                    <h4>Propuesta ${i}: Actividad de ${randomPedagogue.focus}</h4>
                    <p><strong>Descripción:</strong> ${activityDescription}</p>
                    <p><strong>Sustento Pedagógico:</strong> ${randomPedagogue.principles}</p>
                    <p><strong>Función Cerebral Aprovechada:</strong> ${randomBrainFunction.description}</p>
                    ${useAIDescription}
                    <button class="select-proposal-btn" data-proposal-id="${i}">Seleccionar esta actividad</button>
                `;
                container.appendChild(proposalDiv);
            }
            
            document.querySelectorAll('.select-proposal-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const proposalContent = event.target.parentElement.innerHTML; 
                    generateFinalActivity(proposalContent);
                });
            });

        }, 1500);
    }
    
    function generateFinalActivity(proposalContent) {
        const finalOutput = document.getElementById('final-activity-output');
        
        let rubricHtml = `
            <h4>Rúbrica de Evaluación</h4>
            <table class="rubric-table">
                <tr><th>Criterio</th><th>Descripción</th><th>Puntaje</th></tr>
                <tr><td>Comprensión del Objetivo</td><td>Demuestra una clara comprensión del objetivo de aprendizaje.</td><td>25%</td></tr>
                <tr><td>Calidad del Análisis/Ejecución</td><td>La ejecución de la actividad es rigurosa y bien fundamentada.</td><td>40%</td></tr>
                <tr><td>Colaboración / Participación</td><td>Participa activamente y contribuye de manera constructiva (si aplica).</td><td>15%</td></tr>
        `;

        if (userData.useAI === 'si') {
            rubricHtml += `<tr><td>Uso Ético y Crítico de la IA</td><td>Utiliza la IA de acuerdo a las pautas, citando su uso y reflexionando sobre los resultados.</td><td>20%</td></tr>`;
        } else {
            rubricHtml += `<tr><td>Originalidad y Pensamiento Crítico</td><td>Aporta ideas originales y un análisis crítico sin ayudas externas.</td><td>20%</td></tr>`;
        }

        rubricHtml += `</table>`;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = proposalContent;
        const title = tempDiv.querySelector('h4').innerText;
        const descriptions = Array.from(tempDiv.querySelectorAll('p')).map(p => `<p>${p.innerHTML}</p>`).join('');

        finalOutput.innerHTML = `
            <h3>${title}</h3>
            <p><strong>Objetivo de Aprendizaje:</strong> ${userData.objective}</p>
            ${descriptions}
            ${rubricHtml}
        `;
        showStep(12);
    }

    init();
});
