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
            })
            .catch(error => {
                console.error('Error Crítico: No se pudo cargar database.json. La aplicación no puede funcionar.', error);
                const appContainer = document.getElementById('app-container');
                if(appContainer) appContainer.innerHTML = `<p style="color:red; text-align:center;">Error fatal: No se pudo cargar la base de datos de la aplicación. Por favor, revisa que el archivo 'database.json' exista en el repositorio.</p>`;
            });
    }

    function showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        const nextStepElement = document.getElementById(`step-${stepNumber}`);
        if (nextStepElement) {
            currentStep = stepNumber; // Actualizar el paso actual PRIMERO
            if (stepNumber === 4) generateAndPopulateBloomExamples();
            if (stepNumber === 10) populateAIFrameworks();
            nextStepElement.classList.add('active');
        }
    }

    // --- FUNCIÓN DE EVENTOS "BLINDADA" ---
    function setupEventListeners() {
        // Se añade un listener a cada elemento solo si se encuentra en el DOM
        const safeAddListener = (selector, event, handler) => {
            const element = document.getElementById(selector);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Elemento no encontrado: #${selector}`);
            }
        };

        const safeAddListenerToAll = (selector, event, handler) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(element => element.addEventListener(event, handler));
            }
        };

        safeAddListener('start-btn', 'click', () => showStep(2));

        safeAddListenerToAll('.next-btn', 'click', () => {
            if (validateCurrentStep()) {
                showStep(currentStep + 1);
            }
        });
        
        safeAddListenerToAll('.prev-btn', 'click', () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
        
        safeAddListener('generate-proposals-btn', 'click', generateProposalsWithAI);
        safeAddListener('finish-btn', 'click', () => showStep(13));
        safeAddListener('start-over-btn', 'click', () => location.reload());
        safeAddListener('back-to-proposals-btn', 'click', () => showStep(11));
        
        safeAddListenerToAll('input[name="use-ai"]', 'change', (event) => {
            const isAISelected = event.target.value === 'si';
            document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
            if (isAISelected) populateAILevelSelect();
        });

        safeAddListener('ai-framework-select', 'change', populateAILevelSelect);
        safeAddListener('download-pdf-btn', 'click', downloadActivityAsPDF);
        safeAddListener('download-word-btn', 'click', downloadActivityAsWord);
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
        userData.extraInfo = document.getElementById('extra-info-details').value;
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }

    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        introContainer.innerHTML = `<p>Para que un objetivo sea efectivo, debe ser claro y medible. La Taxonomía de Bloom nos ayuda a estructurarlo, organizando el aprendizaje en tres dominios: <strong>Cognitivo</strong> (el saber), <strong>Afectivo</strong> (el ser) y <strong>Psicomotor</strong> (el hacer). Dentro de cada dominio, los niveles van de acciones simples a complejas, asegurando un aprendizaje progresivo y profundo.</p><p>A continuación, se muestran todos los niveles con un ejemplo generado por IA para cada dominio, adaptado a tu selección:</p>`;
        container.innerHTML = `<div class="loading-spinner"></div><p>Generando ejemplos relevantes...</p>`;

        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;

        if (!career || !subject) {
            container.innerHTML = `<p style="color:red;">Por favor, regresa y asegúrate de haber seleccionado una carrera y escrito una materia.</p>`;
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMessage = "Respuesta no válida del servidor.";
                try {
                    errorMessage = JSON.parse(responseText).error || errorMessage;
                } catch (e) {}
                throw new Error(errorMessage);
            }
            const examples = JSON.parse(responseText);
            let tableHTML = '<table class="rubric-table">';
            tableHTML += '<thead><tr><th>Dominio</th><th>Niveles (de simple a complejo)</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
            for (const domainKey in dbData.bloomTaxonomy) {
                const domainData = dbData.bloomTaxonomy[domainKey];
                const exampleData = examples.find(ex => ex.domain === domainData.name);
                let levelsList = '<ul>';
                domainData.levels.forEach(level => {
                    levelsList += `<li>${level.name}</li>`;
                });
                levelsList += '</ul>';
                tableHTML += `<tr>
                    <td><strong>${domainData.name}</strong><br><em>${domainData.description}</em></td>
                    <td>${levelsList}</td>
                    <td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar ejemplo.'}»</em></td>
                </tr>`;
            }
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } catch (error) {
            console.error("Error generando ejemplos de Bloom:", error);
            container.innerHTML = `<p style="color:red;">Lo sentimos, ocurrió un error: ${error.message}. Esto puede ser un problema temporal (arranque en frío). Por favor, intenta de nuevo en unos segundos.</p>`;
        }
    }

    async function generateProposalsWithAI() {
        captureAllUserData();
        showStep(11);
        const proposalsContainer = document.getElementById('proposals-container');
        const loadingDiv = document.getElementById('proposals-loading');
        proposalsContainer.classList.add('hidden');
        loadingDiv.classList.remove('hidden');

        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error(`El servidor respondió con un error.`);
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color: red;">Lo sentimos, ocurrió un error: ${error.message}. Por favor, regresa y prueba de nuevo.</p>`;
        } finally {
            proposalsContainer.classList.remove('hidden');
            loadingDiv.classList.add('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        if (!generatedProposals || generatedProposals.length < 2) {
            container.innerHTML = `<p style="color: red;">La IA no devolvió las dos propuestas esperadas. Intenta de nuevo.</p>`;
            return;
        }
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            const description = proposal.match(/^\* (.*)/m)?.[1] || "Una propuesta de actividad creativa.";
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
    
    function downloadActivityAsPDF() {
        const source = document.getElementById('final-activity-output');
        if (!source || !source.innerHTML.trim()) { alert("No hay contenido para descargar."); return; }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
        pdf.html(source, {
            callback: function(doc) { doc.save('actividad_generada.pdf'); },
            margin: [40, 40, 40, 40], autoPaging: 'text', x: 0, y: 0,
            width: 522, windowWidth: source.scrollWidth
        });
    }
    
    function downloadActivityAsWord() {
        const source = document.getElementById('final-activity-output');
        if (!source || !source.innerHTML.trim()) { alert("No hay contenido para descargar."); return; }
        const sourceHTML = source.innerHTML;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Actividad</title></head><body>";
        const footer = "</body></html>";
        const fullHTML = header + sourceHTML + footer;
        const blob = new Blob(['\ufeff', fullHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = 'actividad_de_aprendizaje.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function populateCareers() {
        const careerSelect = document.getElementById('career-select');
        if (!dbData.careers) return;
        dbData.careers.forEach(career => {
            const option = document.createElement('option');
            option.value = career.name;
            option.textContent = career.name;
            careerSelect.appendChild(option);
        });
    }

    function populateAIFrameworks() {
        const frameworksInfoDiv = document.getElementById('ai-frameworks-info');
        if (!dbData.aiFrameworks || frameworksInfoDiv.innerHTML.trim() !== '') return;
        frameworksInfoDiv.innerHTML = '';
        Object.values(dbData.aiFrameworks).forEach(framework => {
            let levelsHtml = '<ul>';
            framework.levels.forEach(level => {
                levelsHtml += `<li><strong>${level.name}:</strong> ${level.description || ''}</li>`;
            });
            levelsHtml += '</ul>';
            frameworksInfoDiv.innerHTML += `<h4>${framework.name}</h4><p>${framework.description}</p>${levelsHtml}`;
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
            option.value = level.name;
            option.textContent = `${frameworkKey === 'go8' ? '' : 'Nivel ' + (level.level || '') + ': '}${level.name}`;
            levelSelect.appendChild(option);
        });
    }

    init();
});
