document.addEventListener('DOMContentLoaded', () => {
    let dbData = {};
    let generatedProposals = [];

    function init() {
        fetch('database.json').then(res => res.json()).then(data => {
            dbData = data;
            populateCareers();
            populateAIFrameworks();
            setupEventListeners();
        });
    }

    function setupEventListeners() {
        document.getElementById('generate-activity-btn').addEventListener('click', generateProposalsWithAI);
        document.getElementById('regenerate-proposals-btn').addEventListener('click', generateProposalsWithAI);
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('subject-input').addEventListener('blur', triggerBloomGeneration);
        document.getElementById('file-upload').addEventListener('change', handleFileUpload);
        document.querySelector('input[name="use-ai"][value="si"]').addEventListener('change', () => {
            document.getElementById('ai-level-selection').classList.remove('hidden');
            populateAILevelSelect();
        });
        document.querySelector('input[name="use-ai"][value="no"]').addEventListener('change', () => {
            document.getElementById('ai-level-selection').classList.add('hidden');
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        document.getElementById('back-to-proposals-btn').addEventListener('click', () => {
            document.getElementById('final-activity-output').classList.add('hidden');
            document.getElementById('proposals-container').classList.remove('hidden');
            document.getElementById('regenerate-proposals-btn').classList.remove('hidden');
            document.getElementById('back-to-proposals-btn').classList.add('hidden');
        });
    }
    
    function validateForm() {
        const required = document.querySelectorAll('#form-container [required]');
        for (const input of required) {
            if (!input.value.trim()) {
                const label = document.querySelector(`label[for="${input.id}"]`);
                alert(`Por favor, completa el campo: "${label.textContent}"`);
                input.focus();
                return false;
            }
        }
        return true;
    }

    function captureAllUserData() {
        const userData = {};
        const fields = ["career-select", "subject-input", "objective-input", "student-context-input", "restrictions-input", "extra-info-details"];
        fields.forEach(id => userData[id.split('-')[0]] = document.getElementById(id).value);
        userData.modality = document.querySelector('input[name="modality"]:checked').value;
        userData.workType = document.querySelector('input[name="work-type"]:checked').value;
        userData.extraInfo += document.getElementById('file-upload').dataset.fileText || '';
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        if (userData.useAI === 'si') {
            userData.aiFramework = document.getElementById('ai-framework-select').value;
            userData.aiLevel = document.getElementById('ai-level-select').value;
        }
        return userData;
    }

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        const statusEl = document.getElementById('file-upload-status');
        const fileInput = document.getElementById('file-upload');
        if (!file) { statusEl.textContent = ''; fileInput.dataset.fileText = ''; return; }
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
                const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
                text = result.value;
            } else if (file.type === 'text/plain') {
                text = await file.text();
            } else { throw new Error('Formato no soportado (PDF, DOCX, TXT).'); }
            statusEl.textContent = `✔️ "${file.name}" cargado.`;
            fileInput.dataset.fileText = text;
        } catch (error) {
            statusEl.textContent = `❌ ${error.message}`;
            fileInput.dataset.fileText = '';
        }
    }

    function triggerBloomGeneration() {
        if (document.getElementById('career-select').value && document.getElementById('subject-input').value) {
            generateAndPopulateBloomExamples();
        }
    }

    async function generateAndPopulateBloomExamples() {
        const container = document.getElementById('bloom-table-container');
        document.getElementById('bloom-intro-text').innerHTML = `<div class="bloom-intro"><div class="loading-spinner"></div><p>Espera un momento por favor. Estamos generando ejemplos de objetivos de aprendizaje...</p></div>`;
        container.innerHTML = '';
        try {
            const response = await fetch('/.netlify/functions/generateExamples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ career: document.getElementById('career-select').value, subject: document.getElementById('subject-input').value })
            });
            const examples = await response.json();
            if (!response.ok) throw new Error(examples.error);
            document.getElementById('bloom-intro-text').innerHTML = `<p>Un objetivo debe tener: <strong>Verbo + Contenido + Propósito</strong>. La Taxonomía de Bloom organiza el aprendizaje en 3 dominios con niveles progresivos. Abajo hay ejemplos generados por IA adaptados a tu selección:</p>`;
            let tableHTML = '<table class="rubric-table">';
            tableHTML += '<thead><tr><th>Dominio</th><th>Niveles</th><th>Ejemplo de Objetivo</th></tr></thead><tbody>';
            for (const domainKey in dbData.bloomTaxonomy) {
                const domain = dbData.bloomTaxonomy[domainKey];
                const exampleData = examples.find(ex => ex.domain === domain.name);
                let levelsList = '<ul>' + domain.levels.map(l => `<li>${l.name}</li>`).join('') + '</ul>';
                tableHTML += `<tr><td><strong>${domain.name}</strong></td><td>${levelsList}</td><td><strong>Ejemplo (Nivel: ${exampleData?.level || 'N/A'}):</strong><br><em>«${exampleData?.example || 'No se pudo generar.'}»</em></td></tr>`;
            }
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } catch (error) {
            document.getElementById('bloom-intro-text').innerHTML = '';
            container.innerHTML = `<p style="color:red;"><b>Error al generar ejemplos.</b><br><small>${error.message}</small></p>`;
        }
    }

    async function generateProposalsWithAI() {
        if (!validateForm()) return;
        const userData = captureAllUserData();
        document.getElementById('form-container').classList.add('hidden');
        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.remove('hidden');
        const proposalsContainer = document.getElementById('proposals-container');
        const loadingContainer = document.getElementById('loading-container');
        proposalsContainer.innerHTML = '';
        loadingContainer.classList.remove('hidden');
        document.getElementById('result-actions').classList.add('hidden');
        try {
            const response = await fetch('/.netlify/functions/generateActivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color:red;"><b>Error al generar propuestas.</b><br><small>${error.message}</small></p>`;
        } finally {
            loadingContainer.classList.add('hidden');
            document.getElementById('result-actions').classList.remove('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.classList.remove('hidden');
        document.getElementById('final-activity-output').classList.add('hidden');
        document.getElementById('back-to-proposals-btn').classList.add('hidden');
        document.getElementById('regenerate-proposals-btn').classList.remove('hidden');
        container.innerHTML = `<h2>Elige una Propuesta</h2>`;
        if (!generatedProposals || generatedProposals.length < 2) {
            container.innerHTML += `<p style="color:red;">La IA no devolvió dos propuestas. Intenta de nuevo.</p>`;
            return;
        }
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            const descriptionMatch = proposal.match(/^\*([\s\S]*?)---/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "Una propuesta.";
            const proposalDiv = document.createElement('div');
            proposalDiv.className = 'proposal';
            proposalDiv.innerHTML = `<h4>${title}</h4><p>${description}</p>`;
            proposalDiv.addEventListener('click', () => displayFinalActivity(index));
            container.appendChild(proposalDiv);
});
    }

    function displayFinalActivity(index) {
        const finalActivityHTML = window.marked.parse(generatedProposals[index]);
        document.getElementById('proposals-container').classList.add('hidden');
        const finalOutput = document.getElementById('final-activity-output');
        finalOutput.innerHTML = finalActivityHTML;
        finalOutput.classList.remove('hidden');
        document.getElementById('regenerate-proposals-btn').classList.add('hidden');
        document.getElementById('back-to-proposals-btn').classList.remove('hidden');
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
        const frameworkSelect = document.getElementById('ai-framework-select');
        Object.keys(dbData.aiFrameworks).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = dbData.aiFrameworks[key].name;
            frameworkSelect.appendChild(option);
        });
        populateAILevelSelect();
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
