document.addEventListener('DOMContentLoaded', () => {
    let currentStep = 1;
    let dbData = {};
    const userData = {};
    let generatedProposals = [];

    function init() {
        fetch('database.json').then(res => res.json()).then(data => {
            dbData = data;
            populateCareers();
            setupEventListeners();
        }).catch(err => {
            console.error("Error fatal al cargar database.json:", err);
            document.getElementById('app-container').innerHTML = `<p style="color:red;text-align:center;"><b>Error fatal:</b> No se pudo cargar la base de datos.</p>`;
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
    
    function validateCurrentStep() {
        const stepDiv = document.getElementById(`step-${currentStep}`);
        const inputs = stepDiv.querySelectorAll('input[required], textarea[required], select[required]');
        for (const input of inputs) {
            if (!input.value.trim()) {
                alert('Por favor, completa todos los campos para continuar.');
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
        const file = event.target.files[0];
        const statusEl = document.getElementById('file-upload-status');
        const fileInput = document.getElementById('file-upload');
        if (!file) {
            statusEl.textContent = '';
            fileInput.dataset.fileText = '';
            return;
        }
        statusEl.textContent = `Cargando "${file.name}"...`;
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;
                const doc = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ');
                }
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (file.type === 'text/plain') {
                text = await file.text();
            } else {
                throw new Error('Formato no soportado (PDF, DOCX, TXT).');
            }
            statusEl.textContent = `✔️ "${file.name}" cargado.`;
            fileInput.dataset.fileText = text;
        } catch (error) {
            statusEl.textContent = `❌ ${error.message}`;
            fileInput.dataset.fileText = '';
        }
    }

    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        const introContainer = document.getElementById('bloom-intro-text');
        introContainer.innerHTML = `<p>Un objetivo debe tener: <strong>Verbo + Contenido + Propósito</strong>. La Taxonomía de Bloom organiza el aprendizaje en 3 dominios (Saber, Ser, Hacer) con niveles progresivos. Abajo hay ejemplos generados por IA adaptados a tu selección:</p>`;
        container.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div><p>Generando ejemplos...</p></div>`;
        const career = document.getElementById('career-select').value;
        const subject = document.getElementById('subject-input').value;
        if (!career || !subject) {
            container.innerHTML = `<p style="color:red;">Por favor, regresa y selecciona una carrera y materia.</p>`;
            return;
        }
        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career, subject })
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Respuesta no válida del servidor.');
            const examples = JSON.parse(responseText);
            let tableHTML = '<table class="rubric-table">';
            tableHTML += '<thead><tr><th>Dominio</th><th>Niveles</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
            for (const domainKey in dbData.bloomTaxonomy) {
                const domainData = dbData.bloomTaxonomy[domainKey];
                const exampleData = examples.find(ex => ex.domain === domainData.name);
                let levelsList = '<ul>' + domainData.levels.map(level => `<li>${level.name}</li>`).join('') + '</ul>';
                tableHTML += `<tr><td><strong>${domainData.name}</strong></td><td>${levelsList}</td><td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar.'}»</em></td></tr>`;
            }
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } catch (error) {
            container.innerHTML = `<p style="color:red;"><b>Error al generar ejemplos.</b><br><small>${error.message}</small></p>`;
        }
    }

    async function generateProposalsWithAI() {
        captureAllUserData();
        showStep(11);
        const proposalsContainer = document.getElementById('proposals-container');
        const loadingDiv = document.getElementById('proposals-loading');
        proposalsContainer.innerHTML = '';
        loadingDiv.classList.remove('hidden');
        document.getElementById('regenerate-proposals-btn').classList.add('hidden');
        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(JSON.parse(responseText).error || 'Error del servidor.');
            const data = JSON.parse(responseText);
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color:red;"><b>Error al generar propuestas.</b><br><small>${error.message}</small></p>`;
        } finally {
            loadingDiv.classList.add('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        if (!generatedProposals || generatedProposals.length < 2) {
            container.innerHTML = `<p style="color:red;">La IA no devolvió las dos propuestas esperadas. Intenta de nuevo.</p>`;
            return;
        }
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            const descriptionMatch = proposal.match(/^\*([\s\S]*?)---/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "Una propuesta de actividad.";
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
    
    function populateCareers() {
        const careerSelect = document.getElementById('career-select');
        if (dbData.careers) {
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
        if (!frameworksInfoDiv || frameworksInfoDiv.innerHTML.trim() !== '') return;
        Object.values(dbData.aiFrameworks).forEach(framework => {
            let levelsHtml = '<ul>' + framework.levels.map(level => `<li><strong>${level.name}:</strong> ${level.description || ''}</li>`).join('') + '</ul>';
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
