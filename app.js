// 1. Import Firebase dari CDN (Langsung dari Internet)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 3. Inisialisasi Aplikasi
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 4. Referensi Elemen HTML (DOM)
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const btnLogin = document.getElementById('btn-login-google');
const btnLogout = document.getElementById('btn-logout');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const listTransaksi = document.getElementById('transaction-list');
const elSaldo = document.getElementById('total-balance');

// 5. Fitur LOGIN & LOGOUT
btnLogin.addEventListener('click', () => signInWithPopup(auth, provider));
btnLogout.addEventListener('click', () => signOut(auth));

// 6. Cek Status Login (Realtime Auth Listener)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User Login -> Tampilkan Dashboard
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userPhoto.src = user.photoURL;
        userName.innerText = user.displayName;
        
        // Panggil fungsi untuk load data transaksi user ini
        loadTransactions(user.uid);
    } else {
        // User Logout -> Tampilkan Login
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// 7. Fungsi Tambah Transaksi
document.getElementById('btn-save').addEventListener('click', async () => {
    const desc = document.getElementById('input-desc').value;
    const amount = parseInt(document.getElementById('input-amount').value);
    const type = document.getElementById('input-type').value; // 'pemasukan' atau 'pengeluaran'
    const user = auth.currentUser;

    if (desc && amount && user) {
        try {
            // Simpan ke Firestore
            await addDoc(collection(db, "transactions"), {
                uid: user.uid, // Penting: Tandai data ini punya siapa
                desc: desc,
                amount: amount,
                type: type,
                createdAt: serverTimestamp()
            });
            
            // Reset Form
            document.getElementById('input-desc').value = '';
            document.getElementById('input-amount').value = '';
            alert('Berhasil disimpan!');
        } catch (e) {
            console.error("Error: ", e);
        }
    } else {
        alert("Mohon isi semua data!");
    }
});

// 8. Fungsi Baca Data Realtime (onSnapshot)
function loadTransactions(uid) {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

    // Listener Realtime: Jalan setiap ada data berubah di database
    onSnapshot(q, (snapshot) => {
        listTransaksi.innerHTML = ""; // Bersihkan list lama
        let totalSaldo = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter: Hanya ambil data milik user yang sedang login
            if (data.uid === uid) {
                // Hitung Saldo
                if (data.type === 'pemasukan') {
                    totalSaldo += data.amount;
                } else {
                    totalSaldo -= data.amount;
                }

                // Buat Elemen HTML List
                const li = document.createElement('li');
                li.className = 'transaction-item';
                li.innerHTML = `
                    <span>${data.desc}</span>
                    <span class="${data.type === 'pemasukan' ? 'income' : 'expense'}">
                        ${data.type === 'pemasukan' ? '+' : '-'} Rp ${data.amount}
                    </span>
                `;
                listTransaksi.appendChild(li);
            }
        });

        // Update Tampilan Saldo
        elSaldo.innerText = `Rp ${totalSaldo}`;
    });
}

