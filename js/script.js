// --- 1. DEKLARASI VARIABEL & ELEMEN ---
const myForm = document.getElementById('myForm');
const noPendaftaranInput = document.getElementById('noPendaftaran');
const nisnInput = document.getElementById('nisn');
const noKKInput = document.getElementById('noKK');
const nikSiswaInput = document.getElementById('nikSiswa');
const namaInput = document.getElementById('nama');
const tglLahirInput = document.getElementById('tgl_lahir');
const usiaInput = document.getElementById('usia_input');
const asalSekolahInput = document.getElementById('asalSekolah');
const namaIbuInput = document.getElementById('namaIbu');
const pekerjaanIbuInput = document.getElementById('pekerjaanIbu');
const namaAyahInput = document.getElementById('namaAyah');
const pekerjaanAyahInput = document.getElementById('pekerjaanAyah');
const jenisKelaminContainer = document.getElementById('jenisKelaminContainer');
const declarationCheckbox = document.getElementById('declarationCheckbox');

// Elemen Kamera
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

// URL APPS SCRIPT ANDA
const scriptUrl = 'https://script.google.com/macros/s/AKfycbw_OJT7TctYrJBwYGBtQUsRQlXj7PL_6OtJsEsHEXmeZpbawiSIbauX9t8MqZsQV_Gg/exec';

let stream;
let capturedImageData = null;
let locationData = { latitude: null, longitude: null };

// --- 2. FUNGSI HITUNG USIA OTOMATIS ---
function hitungUsiaOtomatis() {
    const tglLahirStr = tglLahirInput.value;
    if (!tglLahirStr) return;
    const tglLahir = new Date(tglLahirStr);
    const hariIni = new Date();
    let tahun = hariIni.getFullYear() - tglLahir.getFullYear();
    let bulan = hariIni.getMonth() - tglLahir.getMonth();
    if (bulan < 0 || (bulan === 0 && hariIni.getDate() < tglLahir.getDate())) {
        tahun--;
        bulan += 12;
    }
    usiaInput.value = `${tahun} Tahun, ${bulan} Bulan`;
}

// --- 3. KEAMANAN INPUT (HANYA ANGKA / HANYA HURUF) ---
// Paksa input hanya angka
function enforceNumericInput(inputElement) {
    inputElement.addEventListener('input', function() { this.value = this.value.replace(/[^\d]/g, ''); });
}
enforceNumericInput(noPendaftaranInput);
enforceNumericInput(nisnInput);
enforceNumericInput(noKKInput);
enforceNumericInput(nikSiswaInput);

// Paksa input nama HANYA huruf dan spasi (TIDAK BISA ANGKA)
function enforceTextOnly(inputElement) {
    inputElement.addEventListener('input', function() { 
        this.value = this.value.replace(/[^a-zA-Z\s.'-]/g, '').toUpperCase(); 
    });
}
enforceTextOnly(namaInput);
enforceTextOnly(namaIbuInput);
enforceTextOnly(namaAyahInput);

// Asal sekolah bisa ada angka (SDN 4), jadi hanya jadikan huruf besar
asalSekolahInput.addEventListener('input', function() { this.value = this.value.toUpperCase(); });

// --- 4. VALIDASI WAJIB ISI SEBELUM SUBMIT ---
function clearMessages() {
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    statusMessage.style.display = 'none';
}

function validateForm() {
    clearMessages();
    let isValid = true;

    if (!/^\d{3}$/.test(noPendaftaranInput.value.trim())) { document.getElementById('noPendaftaranError').textContent = 'Wajib 3 digit angka.'; isValid = false; }
    if (!/^\d{10}$/.test(nisnInput.value.trim())) { document.getElementById('nisnError').textContent = 'Wajib 10 digit angka.'; isValid = false; }
    if (!/^\d{16}$/.test(noKKInput.value.trim())) { document.getElementById('noKKError').textContent = 'Wajib 16 digit angka.'; isValid = false; }
    if (!/^\d{16}$/.test(nikSiswaInput.value.trim())) { document.getElementById('nikSiswaError').textContent = 'Wajib 16 digit angka.'; isValid = false; }
    if (namaInput.value.trim() === '') { document.getElementById('namaError').textContent = 'Wajib diisi.'; isValid = false; }
    if (tglLahirInput.value === '') { document.getElementById('tglLahirError').textContent = 'Pilih tanggal lahir.'; isValid = false; }
    if (asalSekolahInput.value.trim() === '') { document.getElementById('asalSekolahError').textContent = 'Wajib diisi.'; isValid = false; }
    
    // Data Orang Tua
    if (namaIbuInput.value.trim() === '') { document.getElementById('namaIbuError').textContent = 'Wajib diisi.'; isValid = false; }
    if (pekerjaanIbuInput.value === '') { document.getElementById('pekerjaanIbuError').textContent = 'Pilih salah satu.'; isValid = false; }
    if (namaAyahInput.value.trim() === '') { document.getElementById('namaAyahError').textContent = 'Wajib diisi.'; isValid = false; }
    if (pekerjaanAyahInput.value === '') { document.getElementById('pekerjaanAyahError').textContent = 'Pilih salah satu.'; isValid = false; }

    const jenisKelaminChecked = document.querySelector('input[name="jenisKelamin"]:checked');
    if (!jenisKelaminChecked) { document.getElementById('jenisKelaminError').textContent = 'Pilih jenis kelamin.'; isValid = false; }
    if (!capturedImageData) { document.getElementById('photoError').textContent = 'Foto wajah & lokasi wajib diambil.'; isValid = false; }
    if (!declarationCheckbox.checked) { document.getElementById('declarationError').textContent = 'Wajib dicentang untuk melanjutkan.'; isValid = false; }
    
    return isValid;
}

// --- 5. FUNGSI PENGIRIMAN DATA (FETCH) ---
submitButton.addEventListener('click', () => {
    if (!validateForm()) {
        statusMessage.textContent = 'Gagal mengirim. Silakan lengkapi kolom yang berwarna merah.';
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        return; // Menghentikan pengiriman jika ada yang kosong
    }

    spinner.style.display = 'block';
    submitButton.disabled = true;
    statusMessage.style.display = 'none';
    
    const namaSiswa = namaInput.value.trim().replace(/\s+/g, '_');
    const fileName = `${noPendaftaranInput.value.trim()}_${namaSiswa}.jpg`;
    
const formDataPayload = {
        noPendaftaran: noPendaftaranInput.value.trim(),
        nisn: nisnInput.value.trim(),
        noKK: noKKInput.value.trim(),
        nikSiswa: nikSiswaInput.value.trim(),
        nama: namaInput.value.trim(),
        jenisKelamin: document.querySelector('input[name="jenisKelamin"]:checked').value,
        tglLahir: tglLahirInput.value,
        usia: usiaInput.value, // <--- INI TAMBAHAN BARUNYA
        asalSekolah: asalSekolahInput.value.trim(),
        namaIbu: namaIbuInput.value.trim(),
        pekerjaanIbu: pekerjaanIbuInput.value,
        namaAyah: namaAyahInput.value.trim(),
        pekerjaanAyah: pekerjaanAyahInput.value
    };
    
    const payloadData = {
        formData: formDataPayload,
        imageDataUrlString: capturedImageData,
        clientFileName: fileName,
        locationData: locationData
    };

    fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payloadData) 
    })
    .then(response => response.json())
    .then(response => {
        spinner.style.display = 'none';
        submitButton.disabled = false;
        if (response.success) {
            statusMessage.textContent = response.message;
            statusMessage.className = 'success';
            myForm.reset();
            usiaInput.value = '';
            capturedImageData = null;
            photoPreview.src = "#";
            previewContainer.style.display = 'none';
            startCameraButton.style.display = 'inline-block';
            startCameraButton.textContent = "Aktifkan Kamera & GPS";
            locationData = { latitude: null, longitude: null };
            stopCameraStream();
        } else {
            statusMessage.textContent = "Error Server: " + response.message;
            statusMessage.className = 'error';
        }
        statusMessage.style.display = 'block';
    })
    .catch(error => {
        spinner.style.display = 'none';
        submitButton.disabled = false;
        statusMessage.textContent = "Error Jaringan. Periksa koneksi internet Anda.";
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
    });
});

// --- 6. LOGIKA KAMERA & LOKASI ---
startCameraButton.addEventListener('click', async () => {
    clearMessages();
    startCameraButton.disabled = true;
    startCameraButton.textContent = "Memproses GPS...";
    try {
        locationData = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error("Browser tidak mendukung GPS.")); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => reject(err), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
        if (locationData.latitude) {
            startCameraButton.style.display = 'none';
            cameraContainer.style.display = 'block';
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            videoElement.srcObject = stream;
        }
    } catch (error) {
        document.getElementById('gpsError').textContent = "Gagal membuka kamera. Pastikan GPS & izin Kamera aktif.";
        startCameraButton.disabled = false;
        startCameraButton.textContent = "Aktifkan Kamera & GPS";
    }
});

captureButton.addEventListener('click', () => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasElement.getContext('2d').drawImage(videoElement, 0, 0);
    capturedImageData = canvasElement.toDataURL('image/jpeg', 0.8);
    photoPreview.src = capturedImageData;
    cameraContainer.style.display = 'none';
    previewContainer.style.display = 'block';
    document.getElementById('photoError').textContent = '';
    stopCameraStream();
});

recaptureButton.addEventListener('click', () => {
    capturedImageData = null;
    previewContainer.style.display = 'none';
    cameraContainer.style.display = 'block';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => { stream = s; videoElement.srcObject = stream; });
});

function stopCameraStream() {
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
}
