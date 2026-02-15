// 1. Import HANYA Firestore (Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 3. Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. LOGIKA ID PERANGKAT (Pengganti Login)
// Cek apakah browser ini sudah punya ID? Kalau belum, buat baru.
let userId = localStorage.getItem('budget_user_id');
if (!userId) {
    userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('budget_user_id', userId);
}
document.getElementById('device-id-display').innerText = `ID Perangkat: ${userId}`;

// 5. Referensi Elemen HTML
const listTransaksi = document.getElementById('transaction-list');
const elSaldo = document.getElementById('total-balance');
const btnSave = document.getElementById('btn-save');

// 6. Fungsi Load Data (Otomatis jalan saat web dibuka)
function loadTransactions() {
    // Ambil data dari koleksi 'transactions' dimana uid == userId kita
    const q = query(
        collection(db, "transactions"), 
        where("uid", "==", userId), // Filter punya kita saja
        orderBy("createdAt", "desc") // Urutkan dari yang terbaru
    );

    // Listener Realtime
    onSnapshot(q, (snapshot) => {
        listTransaksi.innerHTML = "";
        let totalSaldo = 0;

        if (snapshot.empty) {
            listTransaksi.innerHTML = "<li style='text-align:center; color:#888;'>Belum ada transaksi</li>";
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Hitung Saldo
            if (data.type === 'pemasukan') {
                totalSaldo += data.amount;
            } else {
                totalSaldo -= data.amount;
            }

            // Render List HTML
            const li = document.createElement('li');
            li.className = 'transaction-item';
            // Tombol Hapus (X) ditambahkan
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span>${data.desc}</span>
                    <span class="${data.type === 'pemasukan' ? 'income' : 'expense'}">
                        ${data.type === 'pemasukan' ? '+' : '-'} Rp ${data.amount.toLocaleString('id-ID')}
                    </span>
                </div>
                <button class="btn-delete" data-id="${doc.id}" style="background:red; width:30px; margin-left:10px;">X</button>
            `;
            listTransaksi.appendChild(li);
        });

        // Update Saldo Total
        elSaldo.innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;

        // Tambah event listener buat tombol hapus
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm("Hapus data ini?")) {
                    await deleteDoc(doc(db, "transactions", id));
                }
            });
        });
    });
}

// 7. Fungsi Simpan Data
btnSave.addEventListener('click', async () => {
    const desc = document.getElementById('input-desc').value;
    const amount = parseInt(document.getElementById('input-amount').value);
    const type = document.getElementById('input-type').value;

    if (desc && amount) {
        btnSave.innerText = "Menyimpan...";
        btnSave.disabled = true;

        try {
            await addDoc(collection(db, "transactions"), {
                uid: userId, // Kunci: Simpan dengan ID perangkat ini
                desc: desc,
                amount: amount,
                type: type,
                createdAt: serverTimestamp()
            });
            
            // Reset Form
            document.getElementById('input-desc').value = '';
            document.getElementById('input-amount').value = '';
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btnSave.innerText = "Simpan Transaksi";
            btnSave.disabled = false;
        }
    } else {
        alert("Isi semua data dulu!");
    }
});

// Jalankan fungsi load pertama kali
loadTransactions();
                         
