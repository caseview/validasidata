// --- 1. DEKLARASI VARIABEL & ELEMEN ---
const myForm = document.getElementById('myForm');
const noPendaftaranInput = document.getElementById('noPendaftaran');
const nisnInput = document.getElementById('nisn');
const noKKInput = document.getElementById('noKK');
const nikSiswaInput = document.getElementById('nikSiswa');
const asalSekolahInput = document.getElementById('asalSekolah');
const namaIbuInput = document.getElementById('namaIbu');
const namaInput = document.getElementById('nama');
const jenisKelaminContainer = document.getElementById('jenisKelaminContainer');
const declarationCheckbox = document.getElementById('declarationCheckbox');
const startCameraButton = document.getElementById('startCameraButton');
const cameraContainer = document.getElementById('cameraContainer');
const videoElement = document.getElementById('videoElement');
const captureButton = document.getElementById('captureButton');
const canvasElement = document.getElementById('canvasElement');
const previewContainer = document.getElementById('previewContainer');
const photoPreview = document.getElementById('photoPreview');
const recaptureButton = document.getElementById('recaptureButton');
const submitButton = document.getElementById('submitButton');
const spinner = document.getElementById('spinner');
const statusMessage = document.getElementById('statusMessage');
const noPendaftaranError = document.getElementById('noPendaftaranError');
const nisnError = document.getElementById('nisnError');
const noKKError = document.getElementById('noKKError');
const nikSiswaError = document.getElementById('nikSiswaError');
const asalSekolahError = document.getElementById('asalSekolahError');
const namaIbuError = document.getElementById('namaIbuError');
const namaError = document.getElementById('namaError');
const jenisKelaminError = document.getElementById('jenisKelaminError');
const photoError = document.getElementById('photoError');
const gpsError = document.getElementById('gpsError');
const declarationError = document.getElementById('declarationError');
const scriptUrl = 'https://script.google.com/macros/s/AKfycbw_OJT7TctYrJBwYGBtQUsRQlXj7PL_6OtJsEsHEXmeZpbawiSIbauX9t8MqZsQV_Gg/exec';

// Variabel state
let stream;
let capturedImageData = null;
let locationData = { latitude: null, longitude: null };

// --- FUNGSI VALIDASI SAAT SUBMIT ---
function validateForm() {
    clearMessages();
    let isValid = true;

    // 1. Validasi Input Teks
    if (!/^\d{3}$/.test(noPendaftaranInput.value.trim())) {
        noPendaftaranError.textContent = 'No Pendaftaran wajib diisi dan harus 3 digit angka.';
        isValid = false;
    }
    if (!/^\d{10}$/.test(nisnInput.value.trim())) {
        nisnError.textContent = 'NISN wajib diisi dan harus 10 digit angka.';
        isValid = false;
    }
    if (!/^\d{16}$/.test(noKKInput.value.trim())) {
        noKKError.textContent = 'No Kartu Keluarga wajib diisi dan harus 16 digit angka.';
        isValid = false;
    }
    if (!/^\d{16}$/.test(nikSiswaInput.value.trim())) {
        nikSiswaError.textContent = 'NIK Siswa wajib diisi dan harus 16 digit angka.';
        isValid = false;
    }
    if (asalSekolahInput.value.trim() === '') {
        asalSekolahError.textContent = 'Asal Sekolah wajib diisi.';
        isValid = false;
    }
    if (namaIbuInput.value.trim() === '') {
        namaIbuError.textContent = 'Nama Ibu Kandung wajib diisi.';
        isValid = false;
    }
    if (namaInput.value.trim() === '') {
        namaError.textContent = 'Nama Lengkap Siswa wajib diisi.';
        isValid = false;
    }

    // 2. Validasi Radio Button Jenis Kelamin
    const jenisKelaminChecked = document.querySelector('input[name="jenisKelamin"]:checked');
    if (!jenisKelaminChecked) {
        jenisKelaminError.textContent = 'Jenis Kelamin wajib dipilih.';
        isValid = false;
    }

    // 3. Validasi Foto
    if (!capturedImageData) {
        photoError.textContent = 'Foto wajib diambil.';
        isValid = false;
    }

    // 4. Validasi Checkbox Pernyataan (KODE DIPINDAHKAN KE POSISI YANG BENAR)
    if (!declarationCheckbox.checked) {
        declarationError.textContent = 'Anda harus menyetujui pernyataan ini untuk melanjutkan.';
        isValid = false;
    }
    
    // HANYA ADA SATU RETURN DI AKHIR FUNGSI
    return isValid;
}

// --- LOGIKA VALIDASI REAL-TIME --- (SEMUA DIJADIKAN SATU DI SINI)
noPendaftaranInput.addEventListener('input', () => {
    if (/^\d{3}$/.test(noPendaftaranInput.value.trim())) {
        noPendaftaranError.textContent = '';
    }
});
nisnInput.addEventListener('input', () => {
    if (/^\d{10}$/.test(nisnInput.value.trim())) {
        nisnError.textContent = '';
    }
});
noKKInput.addEventListener('input', () => {
    if (/^\d{16}$/.test(noKKInput.value.trim())) {
        noKKError.textContent = '';
    }
});
nikSiswaInput.addEventListener('input', () => {
    if (/^\d{16}$/.test(nikSiswaInput.value.trim())) {
        nikSiswaError.textContent = '';
    }
});
asalSekolahInput.addEventListener('input', () => {
    if (asalSekolahInput.value.trim() !== '') {
        asalSekolahError.textContent = '';
    }
});
namaIbuInput.addEventListener('input', () => {
    if (namaIbuInput.value.trim() !== '') {
        namaIbuError.textContent = '';
    }
});
namaInput.addEventListener('input', () => {
    if (namaInput.value.trim() !== '') {
        namaError.textContent = '';
    }
});
jenisKelaminContainer.addEventListener('change', () => {
    jenisKelaminError.textContent = '';
});
declarationCheckbox.addEventListener('change', () => {
    if (declarationCheckbox.checked) {
        declarationError.textContent = '';
    }
});

// --- FUNGSI PENGIRIMAN DATA ---
submitButton.addEventListener('click', () => {
    if (!validateForm()) {
        statusMessage.textContent = 'Harap perbaiki semua error sebelum mengirim.';
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        return;
    }

    spinner.style.display = 'block';
    submitButton.disabled = true;
    
    const noPendaftaran = noPendaftaranInput.value.trim();
    const namaSiswa = namaInput.value.trim().replace(/\s+/g, '_');
    const fileName = `${noPendaftaran}_${namaSiswa}.jpg`;
    
    const formDataPayload = {
        noPendaftaran: noPendaftaran,
        nisn: nisnInput.value.trim(),
        noKK: noKKInput.value.trim(),
        nikSiswa: nikSiswaInput.value.trim(),
        asalSekolah: asalSekolahInput.value.trim(),
        namaIbu: namaIbuInput.value.trim(),
        nama: namaInput.value.trim(),
        jenisKelamin: document.querySelector('input[name="jenisKelamin"]:checked').value
    };
    
    google.script.run
        .withSuccessHandler(response => {
            spinner.style.display = 'none';
            submitButton.disabled = false;
            if (response.success) {
                statusMessage.textContent = response.message;
                statusMessage.className = 'success';
                myForm.reset();
                capturedImageData = null;
                photoPreview.src = "#";
                previewContainer.style.display = 'none';
                startCameraButton.style.display = 'inline-block';
                startCameraButton.disabled = false;
                startCameraButton.textContent = "Aktifkan Kamera & GPS";
                locationData = { latitude: null, longitude: null };
                stopCameraStream();
            } else {
                statusMessage.textContent = "Error dari Server: " + response.message;
                statusMessage.className = 'error';
            }
            statusMessage.style.display = 'block';
        })
        .withFailureHandler(error => {
            spinner.style.display = 'none';
            submitButton.disabled = false;
            statusMessage.textContent = "Error Eksekusi Script: " + error.message;
            statusMessage.className = 'error';
            statusMessage.style.display = 'block';
            console.error("Apps Script execution error:", error);
        })
        .saveData(
            formDataPayload,
            capturedImageData,
            fileName,
            locationData
        );
});

// --- FUNGSI UTILITAS & EVENT LISTENER LAINNYA ---
function clearMessages() {
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    if(statusMessage) {
      statusMessage.style.display = 'none';
      statusMessage.textContent = '';
      statusMessage.className = '';
    }
}

function enforceNumericInput(inputElement) {
    inputElement.addEventListener('input', function() { this.value = this.value.replace(/[^\d]/g, ''); });
}
enforceNumericInput(noPendaftaranInput);
enforceNumericInput(nisnInput);
enforceNumericInput(noKKInput);
enforceNumericInput(nikSiswaInput);

asalSekolahInput.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
namaInput.addEventListener('input', function() { this.value = this.value.replace(/[^a-zA-Z\s.-]/g, '').toUpperCase(); });
namaIbuInput.addEventListener('input', function() { this.value = this.value.replace(/[^a-zA-Z\s.-]/g, '').toUpperCase(); });

startCameraButton.addEventListener('click', async () => {
    clearMessages();
    startCameraButton.disabled = true;
    startCameraButton.textContent = "Memproses GPS...";
    try {
        locationData = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error("Geolocation tidak didukung browser ini.")); return; }
            navigator.geolocation.getCurrentPosition(
                (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
        if (locationData.latitude && locationData.longitude) {
            statusMessage.textContent = `GPS Aktif. Mengaktifkan kamera...`;
            statusMessage.className = 'success';
            statusMessage.style.display = 'block';
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            videoElement.srcObject = stream;
            cameraContainer.style.display = 'block';
            captureButton.style.display = 'inline-block';
            startCameraButton.style.display = 'none';
            previewContainer.style.display = 'none';
        }
    } catch (error) {
        console.error("Error accessing GPS/Camera: ", error);
        let errMsg = "Gagal membuka kamera. Pastikan GPS aktif dan izin lokasi/kamera diberikan.";
        if (error && error.code) {
            if (error.code === 1) errMsg = "Izin akses lokasi/kamera ditolak oleh pengguna.";
            if (error.code === 2) errMsg = "Posisi tidak tersedia (GPS mati atau tidak ada sinyal).";
            if (error.code === 3) errMsg = "Waktu tunggu permintaan lokasi habis.";
        }
        gpsError.textContent = errMsg;
        startCameraButton.disabled = false;
        startCameraButton.textContent = "Aktifkan Kamera & GPS";
        locationData = { latitude: null, longitude: null };
    }
});

captureButton.addEventListener('click', () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    const context = canvasElement.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    let quality = 0.9;
    let dataUrl = canvasElement.toDataURL('image/jpeg', quality);
    const MAX_LENGTH = 2500000;
    while (dataUrl.length > MAX_LENGTH && quality > 0.15) {
        quality -= 0.1;
        dataUrl = canvasElement.toDataURL('image/jpeg', quality);
    }
    capturedImageData = dataUrl;
    photoPreview.src = dataUrl;
    cameraContainer.style.display = 'none';
    previewContainer.style.display = 'block';
    photoError.textContent = ''; // Hapus error foto setelah berhasil
    stopCameraStream();
});

recaptureButton.addEventListener('click', () => {
    capturedImageData = null;
    photoPreview.src = "#";
    previewContainer.style.display = 'none';
    startCameraButton.style.display = 'inline-block';
    startCameraButton.disabled = false;
    startCameraButton.textContent = "Aktifkan Kamera & GPS";
    videoElement.srcObject = null;
    stopCameraStream();
});

function stopCameraStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}
