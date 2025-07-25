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
        userData.restrictions = document.getElementById('restrictions-input').value;
        userData.extraInfo = document.getElementById('extra-info-details').value;
        userData.useAI = document.querySelector('input[name="use-ai"]:checked').value;
        return userData;
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
