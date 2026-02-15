import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. SETUP DATA KATEGORI ---
const categories = {
    pemasukan: ["Gaji Bulanan", "Bonus/THR", "Investasi (Dividen)", "Hadiah", "Lainnya"],
    pengeluaran: ["Makan & Minum", "Transportasi", "Kebutuhan Rumah", "Tagihan (Listrik/Air)", "Hiburan", "Kesehatan", "Belanja"]
};

// --- 3. LOGIKA CHART.JS (GRAFIK) ---
let myPieChart = null; // Variabel global untuk chart

function initChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    myPieChart = new Chart(ctx, {
        type: 'doughnut', // Tipe grafik donat
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#c9cbcf'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateChartData(transactions) {
    // Kita hanya buat grafik untuk PENGELUARAN
    const expenseData = {};
    
    transactions.forEach(t => {
        if (t.type === 'pengeluaran') {
            if (expenseData[t.category]) {
                expenseData[t.category] += t.amount;
            } else {
                expenseData[t.category] = t.amount;
            }
        }
    });

    // Update Data Chart
    myPieChart.data.labels = Object.keys(expenseData);
    myPieChart.data.datasets[0].data = Object.values(expenseData);
    myPieChart.update();
}

// --- 4. LOGIKA UI & FIREBASE ---
let userId = localStorage.getItem('budget_user_id');
if (!userId) {
    userId = 'user_' + Date.now();
    localStorage.setItem('budget_user_id', userId);
}
document.getElementById('device-id-display').innerText = `ID: ${userId}`;

// Set Default Tanggal ke Hari Ini
document.getElementById('input-date').valueAsDate = new Date();

// Logic Dropdown Kategori Berubah Dinamis
const typeSelect = document.getElementById('input-type');
const catSelect = document.getElementById('input-category');

function populateCategories() {
    const type = typeSelect.value; // 'pemasukan' atau 'pengeluaran'
    catSelect.innerHTML = ""; // Bersihkan opsi lama
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.text = cat;
        catSelect.appendChild(option);
    });
}

// Jalan saat pertama load & saat tipe diganti
typeSelect.addEventListener('change', populateCategories);
populateCategories(); 

// --- 5. FUNGSI UTAMA (LOAD DATA) ---
function loadTransactions() {
    initChart(); // Siapkan kanvas grafik

    const q = query(collection(db, "transactions"), where("uid", "==", userId), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        const listEl = document.getElementById('transaction-list');
        listEl.innerHTML = "";
        
        let totalSaldo = 0;
        let allTransactions = []; // Penampung untuk data grafik

        snapshot.forEach((doc) => {
            const data = doc.data();
            allTransactions.push(data); // Simpan ke array untuk grafik

            // Hitung Saldo
            if (data.type === 'pemasukan') totalSaldo += data.amount;
            else totalSaldo -= data.amount;

            // Render List HTML
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.innerHTML = `
                <div style="flex-grow:1;">
                    <span class="date-label">${data.date}</span>
                    <div>
                        <span class="category-badge">${data.category}</span>
                        <span>${data.desc || '-'}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span class="${data.type === 'pemasukan' ? 'income' : 'expense'}">
                        ${data.type === 'pemasukan' ? '+' : '-'} Rp ${data.amount.toLocaleString('id-ID')}
                    </span>
                    <button class="btn-delete" data-id="${doc.id}" style="background:none; color:#ccc; padding:0; margin-left:5px;">✕</button>
                </div>
            `;
            listEl.appendChild(li);
        });

        // Update Total & Grafik
        document.getElementById('total-balance').innerText = `Rp ${totalSaldo.toLocaleString('id-ID')}`;
        updateChartData(allTransactions);

        // Event Listener Hapus
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Hapus?")) await deleteDoc(doc(db, "transactions", e.target.dataset.id));
            });
        });
    });
}

// --- 6. SIMPAN TRANSAKSI ---
document.getElementById('btn-save').addEventListener('click', async () => {
    const date = document.getElementById('input-date').value;
    const type = document.getElementById('input-type').value;
    const category = document.getElementById('input-category').value;
    const desc = document.getElementById('input-desc').value;
    const amount = parseInt(document.getElementById('input-amount').value);

    if (amount && date) {
        try {
            await addDoc(collection(db, "transactions"), {
                uid: userId,
                date: date,
                type: type,
                category: category,
                desc: desc,
                amount: amount,
                createdAt: new Date() // Untuk sorting internal
            });
            
            // Reset Input (Kecuali tanggal)
            document.getElementById('input-amount').value = '';
            document.getElementById('input-desc').value = '';
        } catch (e) {
            alert("Gagal simpan: " + e.message);
        }
    } else {
        alert("Nominal dan Tanggal wajib diisi!");
    }
});

// Jalankan aplikasi
loadTransactions();
