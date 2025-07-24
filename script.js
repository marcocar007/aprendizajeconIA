document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    function init() {
        fetch('database.json')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
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
            if (stepNumber === 4) generateAndPopulateBloomExamples();
            if (stepNumber === 10) populateAIFrameworks();
            nextStepElement.classList.add('active');
        }
    }

    function setupEventListeners() {
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener(event, handler);
        };

        safeAddListener('start-btn', 'click', () => showStep(2));
        
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
        const fileText = document.getElementById('file-upload')?.dataset.fileText || '';
        const manualText = document.getElementById('extra-info-details').value;
        userData.extraInfo = [manualText, fileText].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }

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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Respuesta no válida.');
            const examples = JSON.parse(responseText);
            let tableHTML = '<table class="rubric-table">';
            tableHTML += '<thead><tr><th>Dominio</th><th>Niveles</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
            for (const domainKey in dbData.bloomTaxonomy) {
                const domainData = dbData.bloomTaxonomy[domainKey];
                const exampleData = examples.find(ex => ex.domain === domainData.name);
                let levelsList = '<ul>' + domainData.levels.map(level => `<li>${level.name}</li>`).join('') + '</ul>';
                tableHTML += `<tr>
                    <td><strong>${domainData.name}</strong><br><em>${domainData.description}</em></td>
                    <td>${levelsList}</td>
                    <td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar.'}»</em></td>
                </tr>`;
            }
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } catch (error) {
            console.error("Error en Bloom:", error);
            container.innerHTML = `<p style="color:red;"><b>Error al generar ejemplos.</b><br><small>${error.message}</small></p>`;
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Error del servidor.');
            const data = JSON.parse(responseText);
            if (data.error) throw new Error(data.error);
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color: red;"><b>Error al generar propuestas.</b><br><small>${error.message}</small></p>`;
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
        document.getElementById('regenerate-proposals-btn').classList.remove('hidden');
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
        const blob = new Blob(['\ufeff', header + sourceHTML + footer], { type: 'application/msword' });
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
        if (dbData.careers && careerSelect) {
            dbData.careers.forEach(career => {
                const option = document.createElement('option');
                option.value = career.name;
                option.textContent = career.name;
                careerSelect.appendChild(option);
            });
        }
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
