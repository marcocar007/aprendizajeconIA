document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = []; // Almacenará las propuestas de la IA

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
            if (stepNumber === 4) populateBloomExamples();
            if (stepNumber === 10) populateAIFrameworks();
            nextStepElement.classList.add('active');
            currentStep = stepNumber;
        }
    }

    function setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => showStep(2));
        document.querySelectorAll('.next-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    showStep(currentStep + 1);
                }
            });
        });
        document.querySelectorAll('.prev-btn').forEach(button => {
            if (currentStep > 1) showStep(currentStep - 1);
        });
        document.getElementById('generate-proposals-btn').addEventListener('click', generateProposalsWithAI);
        document.getElementById('finish-btn').addEventListener('click', () => showStep(13));
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('back-to-proposals-btn').addEventListener('click', () => showStep(11));
        document.querySelectorAll('input[name="use-ai"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const isAISelected = event.target.value === 'si';
                document.getElementById('ai-level-selection').classList.toggle('hidden', !isAISelected);
                if (isAISelected) populateAILevelSelect();
            });
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        document.getElementById('download-pdf-btn').addEventListener('click', downloadActivityAsPDF);
        document.getElementById('download-word-btn').addEventListener('click', downloadActivityAsWord);
    }
    
    function validateCurrentStep() {
        const currentStepDiv = document.getElementById(`step-${currentStep}`);
        const inputs = currentStepDiv.querySelectorAll('input[required], textarea[required]');
        for (const input of inputs) {
            if (!input.value.trim()) {
                alert('Por favor, completa todos los campos obligatorios para continuar.');
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
        if(userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
    }

    async function generateProposalsWithAI() {
        captureAllUserData();
        showStep(11);
        document.getElementById('proposals-container').classList.add('hidden');
        document.getElementById('proposals-loading').classList.remove('hidden');

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
            document.getElementById('proposals-container').innerHTML = `<p style="color: red;">Lo sentimos, ocurrió un error: ${error.message}. Por favor, revisa la configuración e intenta de nuevo.</p>`;
        } finally {
            document.getElementById('proposals-container').classList.remove('hidden');
            document.getElementById('proposals-loading').classList.add('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/# (.*)/)?.[1] || `Propuesta ${index + 1}`;
            const description = proposal.match(/\* (.*)/)?.[1] || "Una propuesta de actividad creativa.";
            
            const proposalDiv = document.createElement('div');
            proposalDiv.className = 'proposal';
            proposalDiv.innerHTML = `
                <h4>${title}</h4>
                <p>${description}</p>
                <button class="select-proposal-btn" data-index="${index}">Elegir esta actividad</button>
            `;
            container.appendChild(proposalDiv);
        });
        
        document.querySelectorAll('.select-proposal-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedIndex = e.target.dataset.index;
                displayFinalActivity(selectedIndex);
            });
        });
    }

    function displayFinalActivity(index) {
        const finalActivityHTML = window.marked.parse(generatedProposals[index]);
        document.getElementById('final-activity-output').innerHTML = finalActivityHTML;
        showStep(12);
    }

    function populateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        if (!dbData.bloomTaxonomy || container.innerHTML.trim() !== '') return;

        introContainer.innerHTML = `<p>Para que un objetivo sea efectivo, debe ser claro y medible. La Taxonomía de Bloom nos ayuda a estructurarlo, organizando el aprendizaje en tres dominios: <strong>Cognitivo</strong> (el saber), <strong>Afectivo</strong> (el ser) y <strong>Psicomotor</strong> (el hacer). Dentro de cada dominio, los niveles van de acciones simples a complejas, asegurando un aprendizaje progresivo y profundo.</p>`;
        
        let tableHTML = '<table class="rubric-table">';
        tableHTML += '<thead><tr><th>Dominio</th><th>Niveles (de simple a complejo)</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
        
        for (const domainKey in dbData.bloomTaxonomy) {
            const domain = dbData.bloomTaxonomy[domainKey];
            const randomLevel = domain.levels[Math.floor(Math.random() * domain.levels.length)];
            const randomExample = randomLevel.examples[Math.floor(Math.random() * randomLevel.examples.length)];
            
            let levelsList = '<ul>';
            domain.levels.forEach(level => {
                levelsList += `<li>${level.name}</li>`;
            });
            levelsList += '</ul>';

            tableHTML += `<tr>
                <td><strong>${domain.name}</strong></td>
                <td>${levelsList}</td>
                <td><strong>Ejemplo (Nivel: ${randomLevel.name}):</strong><br><em>«${randomExample}»</em></td>
            </tr>`;
        }
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    }
    
    function downloadActivityAsPDF() {
        const { jsPDF } = window.jspdf;
        const source = document.getElementById('final-activity-output');
        if (!source) return;
        
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
        
        // Usamos el método html de jsPDF que funciona mejor con html2canvas
        pdf.html(source, {
            callback: function(doc) {
                doc.save('actividad_generada.pdf');
            },
            x: 15,
            y: 15,
            width: 565, // Ancho para una página tamaño carta con márgenes
            windowWidth: source.scrollWidth
        });
    }
    
    function downloadActivityAsWord() {
        const sourceHTML = document.getElementById('final-activity-output').innerHTML;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Actividad</title></head><body>";
        const footer = "</body></html>";
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + sourceHTML + footer);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'actividad_generada.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
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
        
        Object.values(dbData.aiFrameworks).forEach(framework => {
            let levelsHtml = '<ul>';
            framework.levels.forEach(level => {
                levelsHtml += `<li><strong>${level.name}:</strong> ${level.description}</li>`;
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
