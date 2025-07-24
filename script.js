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
        document.querySelector('input[name="use-ai"][value="si"]').addEventListener('change', () => {
            document.getElementById('ai-level-selection').classList.remove('hidden');
            populateAILevelSelect();
        });
        document.querySelector('input[name="use-ai"][value="no"]').addEventListener('change', () => {
            document.getElementById('ai-level-selection').classList.add('hidden');
        });
        document.getElementById('ai-framework-select').addEventListener('change', populateAILevelSelect);
        document.getElementById('file-upload').addEventListener('change', handleFileUpload);
        document.getElementById('download-pdf-btn').addEventListener('click', downloadActivityAsPDF);
        document.getElementById('download-word-btn').addEventListener('click', downloadActivityAsWord);
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('back-to-proposals-btn').addEventListener('click', () => {
            document.getElementById('final-activity-output').classList.add('hidden');
            document.getElementById('proposals-container').classList.remove('hidden');
            document.getElementById('back-to-proposals-btn').classList.add('hidden');
        });
    }
    
    function validateForm() {
        const requiredInputs = document.querySelectorAll('#form-container [required]');
        for (const input of requiredInputs) {
            if (!input.value.trim()) {
                alert(`Por favor, completa el campo: "${input.labels[0].textContent}"`);
                input.focus();
                return false;
            }
        }
        return true;
    }

    function captureAllUserData() {
        const userData = {};
        userData.career = document.getElementById('career-select').value;
        userData.subject = document.getElementById('subject-input').value;
        userData.objective = document.getElementById('objective-input').value;
        userData.studentContext = document.getElementById('student-context-input').value;
        userData.modality = document.querySelector('input[name="modality"]:checked').value;
        userData.duration = document.getElementById('duration-input').value;
        userData.restrictions = document.getElementById('restrictions-input').value;
        userData.workType = document.querySelector('input[name="work-type"]:checked').value;
        const fileText = document.getElementById('file-upload').dataset.fileText || '';
        const manualText = document.getElementById('extra-info-details').value;
        userData.extraInfo = [manualText, fileText].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
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
            if (!response.ok || data.error) throw new Error(data.error || 'El servidor respondió con un error.');
            
            generatedProposals = data.proposals;
            displayProposals();
        } catch (error) {
            proposalsContainer.innerHTML = `<p style="color: red;"><b>Lo sentimos, ocurrió un error.</b><br>${error.message}</p>`;
        } finally {
            loadingContainer.classList.add('hidden');
            document.getElementById('result-actions').classList.remove('hidden');
        }
    }

    function displayProposals() {
        const container = document.getElementById('proposals-container');
        container.innerHTML = '';
        if (!generatedProposals || generatedProposals.length < 2) {
            container.innerHTML = `<p style="color: red;">La IA no devolvió las dos propuestas esperadas. Intenta de nuevo.</p>`;
            return;
        }
        container.innerHTML = `<h2>Elige una Propuesta</h2><p>He generado dos propuestas de actividad. Elige la que mejor se adapte a tu objetivo.</p>`;
        generatedProposals.forEach((proposal, index) => {
            const title = proposal.match(/^# (.*)/m)?.[1] || `Propuesta ${index + 1}`;
            const descriptionMatch = proposal.match(/^\*([\s\S]*?)---/m);
            const description = descriptionMatch ? descriptionMatch[1].trim() : "Una propuesta de actividad.";
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
        document.getElementById('back-to-proposals-btn').classList.remove('hidden');
    }
    
    function downloadActivityAsPDF() {
        const source = document.getElementById('final-activity-output');
        if (!source || !source.innerHTML.trim()) return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
        pdf.html(source, {
            callback: (doc) => doc.save('actividad_generada.pdf'),
            margin: [40, 40, 40, 40], autoPaging: 'text',
            width: 522, windowWidth: source.scrollWidth
        });
    }
    
    function downloadActivityAsWord() {
        const sourceHTML = document.getElementById('final-activity-output').innerHTML;
        if (!sourceHTML.trim()) return;
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
        const frameworkSelect = document.getElementById('ai-framework-select');
        if (!frameworkSelect.options.length && dbData.aiFrameworks) {
            Object.keys(dbData.aiFrameworks).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = dbData.aiFrameworks[key].name;
                frameworkSelect.appendChild(option);
            });
        }
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
