// 1. Import fungsi Firebase yang dibutuhkan dari CDN Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLdKv5WETvhHiN3AyzPc9KUO_UuhLNQiE",
  authDomain: "uang-2cb43.firebaseapp.com",
  projectId: "uang-2cb43",
  storageBucket: "uang-2cb43.firebasestorage.app",
  messagingSenderId: "70884768858",
  appId: "1:70884768858:web:ef83aac6cfa4845582ec63",
  measurementId: "G-5TTXB1SYVK"
};

// 3. Inisialisasi Aplikasi Firebase & Database Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Tangkap elemen HTML
const form = document.getElementById('transactionForm');
const statusMessage = document.getElementById('statusMessage');

// 5. Eksekusi saat tombol "Simpan" ditekan
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis
    statusMessage.innerText = "Menyimpan ke database...";

    // Ambil nilai dari inputan form
    const type = document.getElementById('type').value;
    const amount = Number(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const note = document.getElementById('note').value;

    try {
        // Kirim dokumen baru ke koleksi 'transactions'
        const docRef = await addDoc(collection(db, "transactions"), {
            userId: "user_sementara_123", // Karena belum ada fitur Login, kita pakai ID statis dulu
            type: type,
            amount: amount,
            category: category,
            note: note,
            date: serverTimestamp() // Catat waktu secara otomatis dari server Firebase
        });

        statusMessage.innerText = `Berhasil! Data tersimpan dengan ID: ${docRef.id}`;
        form.reset(); // Kosongkan form setelah sukses
    } catch (error) {
        console.error("Error menambah dokumen: ", error);
        statusMessage.innerText = "Gagal menyimpan transaksi. Cek console browser.";
        statusMessage.style.color = "red";
    }
});
