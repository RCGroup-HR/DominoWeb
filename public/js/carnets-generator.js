// ==========================================
// GENERADOR DE CARNETS - SCOREDOMINO
// ==========================================

// Verificar autenticación
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) {
    alert('Debes iniciar sesión para solicitar un carnet');
    window.location.href = '/login.html';
}

const countries = {
    'US': '🇺🇸',
    'DO': '🇩🇴',
    'MX': '🇲🇽',
    'PR': '🇵🇷',
    'CO': '🇨🇴',
    'VE': '🇻🇪',
    'CU': '🇨🇺',
    'ES': '🇪🇸',
    'AR': '🇦🇷',
    'PE': '🇵🇪',
    'OTHER': '🌍'
};

const genders = {
    'M': { icon: '♂️', label: 'Masculino' },
    'F': { icon: '♀️', label: 'Femenino' },
    'O': { icon: '⚪', label: 'Otro' }
};

// Elementos del DOM
const form = document.getElementById('carnetForm');
const inputNombre = document.getElementById('nombre');
const selectPais = document.getElementById('pais');
const selectGenero = document.getElementById('genero');
const inputCedula = document.getElementById('cedula');
const inputFoto = document.getElementById('foto');
const photoPreview = document.getElementById('photoPreview');
const successMessage = document.getElementById('successMessage');
const warningMessage = document.getElementById('warningMessage');
const statusContainer = document.getElementById('statusContainer');
const statusInfo = document.getElementById('statusInfo');
const btnGenerar = document.getElementById('btnGenerar');
const btnReset = document.getElementById('btnReset');

const carnetName = document.getElementById('carnetName');
const carnetFlag = document.getElementById('carnetFlag');
const carnetPais = document.getElementById('carnetPais');
const carnetGenero = document.getElementById('carnetGenero');
const generoIcon = document.getElementById('generoIcon');
const carnetPhoto = document.getElementById('carnetPhoto');
const carnetNumber = document.getElementById('carnetNumber');

// ==========================================
// ACTUALIZAR PREVIEW EN TIEMPO REAL
// ==========================================

inputNombre.addEventListener('input', () => {
    carnetName.textContent = inputNombre.value || 'Nombre';
});

selectPais.addEventListener('change', () => {
    const countryCode = selectPais.value;
    const countryName = selectPais.options[selectPais.selectedIndex].text;
    carnetFlag.textContent = countries[countryCode] || '🌍';
    carnetPais.textContent = countryName || 'País';
});

selectGenero.addEventListener('change', () => {
    const generoCode = selectGenero.value;
    if (generoCode && genders[generoCode]) {
        generoIcon.textContent = genders[generoCode].icon;
        carnetGenero.textContent = genders[generoCode].label;
    } else {
        generoIcon.textContent = '👤';
        carnetGenero.textContent = 'Género';
    }
});

inputFoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            carnetPhoto.src = event.target.result;
            photoPreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Click en label de foto
document.querySelector('label[for="foto"]').addEventListener('click', (e) => {
    inputFoto.click();
});

// ==========================================
// VALIDACIÓN DE FORMULARIO
// ==========================================

function validateForm() {
    const fields = [
        { element: inputNombre, message: 'El nombre es requerido' },
        { element: selectPais, message: 'Selecciona un país' },
        { element: selectGenero, message: 'Selecciona un género' },
        { element: inputCedula, message: 'La cédula es requerida' },
        { element: inputFoto, message: 'La foto es requerida' }
    ];

    let isValid = true;
    fields.forEach(field => {
        const errorDiv = field.element.parentElement.querySelector('.error-message');
        if (!field.element.value) {
            if (errorDiv) {
                errorDiv.textContent = field.message;
                errorDiv.style.display = 'block';
            }
            isValid = false;
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    });

    return isValid;
}

// ==========================================
// ENVÍO DEL FORMULARIO
// ==========================================

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Mostrar loading
    btnGenerar.disabled = true;
    btnGenerar.innerHTML = '<span class="loading"></span> Enviando...';

    try {
        // Convertir foto a base64
        const fotoBase64 = photoPreview.querySelector('img').src;

        const datos = {
            nombre: inputNombre.value,
            pais: selectPais.value,
            genero: selectGenero.value,
            cedula: inputCedula.value,
            fotoBase64: fotoBase64
        };

        // Enviar solicitud al servidor
        const response = await fetch(`${API_CONFIG.BASE_URL}/carnets/solicitudes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (!resultado.success) {
            const errorDiv = document.querySelector('.form-section .error-message');
            if (errorDiv) {
                errorDiv.textContent = resultado.message || resultado.error || 'Error desconocido';
                errorDiv.style.display = 'block';
            }
            throw new Error(resultado.message || resultado.error);
        }

        // Mostrar mensaje de éxito
        successMessage.style.display = 'block';
        warningMessage.style.display = 'block';
        statusContainer.classList.add('show');

        statusInfo.innerHTML = `
            <strong>Solicitud Registrada</strong><br>
            ID de Solicitud: <strong>#${resultado.solicitudId || resultado.data?.id || 'N/A'}</strong><br>
            Estado: <strong>Pendiente de aprobación</strong><br>
            <br>
            <small>Tu solicitud ha sido registrada correctamente. Un administrador revisará tus datos pronto y te notificará del resultado.</small>
        `;

        // Deshabilitar formulario
        form.style.opacity = '0.6';
        Array.from(form.elements).forEach(el => el.disabled = true);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar solicitud: ' + error.message);
    } finally {
        btnGenerar.disabled = false;
        btnGenerar.innerHTML = 'Enviar Solicitud';
    }
});

// ==========================================
// RESET DEL FORMULARIO
// ==========================================

btnReset.addEventListener('click', () => {
    form.reset();
    photoPreview.innerHTML = '';
    carnetPhoto.src = '';
    carnetName.textContent = 'Nombre';
    carnetFlag.textContent = '🌍';
    carnetPais.textContent = 'País';
    generoIcon.textContent = '👤';
    carnetGenero.textContent = 'Género';
    successMessage.style.display = 'none';
    warningMessage.style.display = 'none';
    statusContainer.classList.remove('show');
    form.style.opacity = '1';
    Array.from(form.elements).forEach(el => el.disabled = false);
    carnetNumber.textContent = 'PENDIENTE DE APROBACIÓN';
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.style.display = 'none';
    });
});
