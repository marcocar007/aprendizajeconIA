document.addEventListener('DOMContentLoaded', () => {
    let dbData = {};

    function init() {
        fetch('database.json').then(res => res.json()).then(data => {
            dbData = data;
            populateCareers();
            setupEventListeners();
        });
    }

    function setupEventListeners() {
        document.getElementById('generate-activity-btn').addEventListener('click', generateActivityWithAI);
        document.getElementById('start-over-btn').addEventListener('click', () => location.reload());
        document.getElementById('file-upload').addEventListener('change', handleFileUpload);
    }
    
    function validateForm() {
        const requiredInputs = document.querySelectorAll('#form-container [required]');
        for (const input of requiredInputs) {
            if (!input.value.trim()) {
                // Usamos el texto de la etiqueta 'label' asociada para el mensaje de error.
                const label = document.querySelector(`label[for="${input.id}"]`);
                const fieldName = label ? label.textContent : 'un campo';
                alert(`Por favor, completa el campo obligatorio: ${fieldName}`);
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
        userData.restrictions = document.getElementById('restrictions-input').value;
        const fileText = document.getElementById('file-upload').dataset.fileText || '';
        const manualText = document.getElementById('extra-info-details').value;
        userData.extraInfo = [manualText, fileText].filter(Boolean).join('\n\n--- Contenido del archivo ---\n\n');
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
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

    async function generateActivityWithAI() {
        if (!validateForm()) return;
        
        const userData = captureAllUserData();
        document.getElementById('form-container').classList.add('hidden');
        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.remove('hidden');
        
        const finalOutput = document.getElementById('final-activity-output');
        const loadingContainer = document.getElementById('loading-container');
        finalOutput.innerHTML = '';
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
            
            // Usamos la librería 'marked' para convertir la respuesta de Markdown a HTML
            const finalActivityHTML = window.marked.parse(data.activity);
            finalOutput.innerHTML = finalActivityHTML;

        } catch (error) {
            finalOutput.innerHTML = `<p style="color: red;"><b>Lo sentimos, ocurrió un error.</b><br>${error.message}</p>`;
        } finally {
            loadingContainer.classList.add('hidden');
            document.getElementById('result-actions').classList.remove('hidden');
        }
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

    init();
});
