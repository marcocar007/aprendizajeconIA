// Archivo: script.js
// Solo la función generateAndPopulateBloomExamples() cambia para mostrar la animación.

async function generateAndPopulateBloomExamples() {
    const container = document.getElementById('bloom-table-container');
    const introContainer = document.getElementById('bloom-intro-text');
    
    introContainer.innerHTML = `<p>Para que un objetivo sea efectivo... (texto introductorio)</p>`;
    
    // --- INICIO DE LA CORRECCIÓN ---
    // Asegura que el contenedor esté vacío antes de mostrar la animación
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Generando ejemplos relevantes...</p>
        </div>
    `;
    // --- FIN DE LA CORRECCIÓN ---

    const career = document.getElementById('career-select').value;
    const subject = document.getElementById('subject-input').value;

    if (!career || !subject) {
        container.innerHTML = `<p style="color:red;">Por favor, regresa y asegúrate de haber seleccionado una carrera y escrito una materia.</p>`;
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/generateExamples', {
            // ... (resto de la llamada fetch)
        });
        // ... (resto de la función)
    } catch (error) {
        // ... (resto del bloque catch)
    }
}
// ... El resto del script.js no necesita cambios
