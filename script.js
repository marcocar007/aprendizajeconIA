document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    const totalSteps = 13;
    let dbData = {};
    const userData = {};

    // Cargar la base de datos
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

        Object.values(dbData.bloomTaxonomy).forEach(domain => {
            const domainDiv = document.createElement('div');
            domainDiv.innerHTML = `<strong>${domain.name}:</strong> ${domain.description}`;
            bloomDomainsDiv.appendChild(domainDiv);

            const randomLevel = domain.levels[Math.floor(Math.random() * domain.levels.length)];
            const randomVerb = randomLevel.verbs[Math.floor(Math.random() * randomLevel.verbs.length)];
            const career = userData.career || 'Nutrición';
            const subject = userData.subject || 'Biología Celular';
            
            const exampleP = document.createElement('p');
            exampleP.innerHTML = `<strong>Ejemplo (${domain.name} - Nivel ${randomLevel.level}):</strong> "${randomVerb.charAt(0).toUpperCase() + randomVerb.slice(1)} [objeto de conocimiento relevante para ${subject} de ${career}] mediante [método o herramienta] para [finalidad del aprendizaje]."`;
            objectiveExamplesDiv.appendChild(exampleP);
        });
    }
    
    function setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => showStep(2));

        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (captureDataForStep(currentStep)) {
                    if (currentStep === 4) updateObjectiveExamples();
                    showStep(currentStep + 1);
                }
            });
        });

        document.querySelectorAll('.prev-btn').forEach(button => {
            button.addEventListener('click', () => showStep(currentStep - 1));
        });

        document.getElementById('generate-proposals-btn').addEventListener('click', () => {
            if (captureDataForStep(10)) {
                prepareAndShowProposals();
            }
        });
        
        document.getElementById('regenerate-proposals-btn').addEventListener('click', () => {
             generateActivityProposals();
        });

        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        document.getElementById('finish-btn').addEventListener('click', () => showStep(13));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        
        // Lógica para mostrar/ocultar el textarea de información adicional
        document.querySelectorAll('input[name="extra-info"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                document.getElementById('extra-info-details').classList.toggle('hidden', event.target.value !== 'si');
            });
        });

        // Lógica para el uso de IA
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
        switch(step) {
            case 2:
                userData.career = document.getElementById('career-select').value;
                break;
            case 3:
                userData.subject = document.getElementById('subject-input').value;
                if (!userData.subject) { alert('Por favor, ingresa el nombre de la asignatura.'); return false; }
                break;
            case 5:
                userData.objective = document.getElementById('objective-input').value;
                if (!userData.objective) { alert('Por favor, escribe tu objetivo de aprendizaje.'); return false; }
                break;
            case 6:
                userData.studentContext = document.getElementById('student-context-input').value;
                if (!userData.studentContext) { alert('Por favor, describe el contexto de los estudiantes.'); return false; }
                break;
            case 7:
                userData.modality = document.querySelector('input[name="modality"]:checked')?.value;
                if (!userData.modality) { alert('Por favor, selecciona la modalidad.'); return false; }
                break;
            case 8:
                userData.duration = document.getElementById('duration-input').value;
                 if (!userData.duration) { alert('Por favor, especifica la duración.'); return false; }
                break;
            case 9:
                 userData.restrictions = document.getElementById('restrictions-input').value;
                 break;
            case 10:
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
            document.getElementById('ai-usage-prompt').classList.remove('hidden');
            document.getElementById('activity-proposals-container').classList.add('hidden');
        } else {
            document.getElementById('ai-usage-prompt').classList.add('hidden');
            document.getElementById('activity-proposals-container').classList.remove('hidden');
             userData.useAI = 'no';
            generateActivityProposals();
        }
        showStep(11);
    }
    
    function generateActivityProposals() {
        const container = document.getElementById('activity-proposals-container');
        container.innerHTML = '<h3>Generando propuestas...</h3>';
        
        setTimeout(() => { // Simula llamada a Gemini
            container.innerHTML = '';
            document.getElementById('activity-proposals-container').classList.remove('hidden');
            document.getElementById('regenerate-proposals-btn').classList.remove('hidden');

            // Lógica de generación (simplificada para el ejemplo)
            for (let i = 1; i <= 2; i++) {
                const proposalDiv = document.createElement('div');
                proposalDiv.classList.add('proposal');
                
                const randomPedagogue = dbData.pedagogues[Math.floor(Math.random() * dbData.pedagogues.length)];
                const randomBrainFunction = dbData.brainFunctions[Math.floor(Math.random() * dbData.brainFunctions.length)];
                
                let activityDescription = `Esta actividad se basa en los principios de <strong>${randomPedagogue.name}</strong>. Se enfoca en el aprendizaje ${randomPedagogue.focus} y promueve la colaboración.`;
                let useAIDescription = ``;

                if (document.querySelector('input[name="use-ai"]:checked')?.value === 'si') {
                     const selectedFramework = dbData.aiFrameworks[document.getElementById('ai-framework-select').value];
                     const selectedLevel = selectedFramework.levels.find(l => l.level == document.getElementById('ai-level-select').value);
                     useAIDescription = `<p><strong>Uso de IA:</strong> Se utilizará la IA bajo el marco de <strong>${selectedFramework.name}</strong>, en el <strong>Nivel ${selectedLevel.level}: ${selectedLevel.name}</strong>. ${selectedLevel.description}</p>`;
                } else {
                    useAIDescription = `<p><strong>Uso de IA:</strong> Esta actividad está diseñada para ser completada sin el uso de herramientas de inteligencia artificial generativa, fomentando el pensamiento original y la interacción directa.</p>`;
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
                    const selectedProposalId = event.target.getAttribute('data-proposal-id');
                    // Simplemente usaremos el contenido de la propuesta seleccionada para generar la vista final
                    const proposalContent = event.target.parentElement.innerHTML; 
                    generateFinalActivity(proposalContent);
                });
            });

        }, 1500);
    }
    
    function generateFinalActivity(proposalContent) {
        const finalOutput = document.getElementById('final-activity-output');
        const useAI = document.querySelector('input[name="use-ai"]:checked')?.value === 'si';
        
        let rubricHtml = `
            <h4>Rúbrica de Evaluación</h4>
            <table class="rubric-table">
                <tr><th>Criterio</th><th>Descripción</th><th>Puntaje</th></tr>
                <tr><td>Comprensión del Objetivo</td><td>Demuestra una clara comprensión del objetivo de aprendizaje a través de su trabajo.</td><td>25%</td></tr>
                <tr><td>Calidad del Análisis/Ejecución</td><td>La ejecución de la actividad es rigurosa, detallada y bien fundamentada.</td><td>40%</td></tr>
                <tr><td>Colaboración / Participación</td><td>Participa activamente y contribuye de manera constructiva al trabajo en equipo (si aplica).</td><td>15%</td></tr>
        `;

        if (useAI) {
            rubricHtml += `<tr><td>Uso Ético y Crítico de la IA</td><td>Utiliza la IA de acuerdo a las pautas, citando su uso y reflexionando críticamente sobre los resultados.</td><td>20%</td></tr>`;
        } else {
            rubricHtml += `<tr><td>Originalidad y Pensamiento Crítico</td><td>Aporta ideas originales y un análisis crítico sin depender de ayudas externas.</td><td>20%</td></tr>`;
        }

        rubricHtml += `</table>`;
        
        // Extraer la información relevante de la propuesta seleccionada
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

});