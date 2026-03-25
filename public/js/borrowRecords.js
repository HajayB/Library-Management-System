import {start}  from './universalFunctions.js'
start();

import {returnHeader}  from './universalFunctions.js'

const headers = returnHeader();
const errorBox = document.querySelector(".error-message");
const successBox = document.querySelector(".success-message");

  // === 🌍 UNIVERSAL FUNCTIONS =====================================
  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = message ? "block" : "none";

      if (message) {
      setTimeout(() => {
        errorBox.style.display = "none";
      }, 3000);
    }
    } else if (message) {
      console.error(message);
    }
  }

  function showSuccess(message) {
    if (successBox) {
      successBox.textContent = message;
      successBox.style.display = message ? "block" : "none";

      if (message) {
      setTimeout(() => {
        successBox.style.display = "none";
      }, 3000);
    }
    } else if (message) {
      alert(message);
    }
  }
//==============DISPLAY CARDS FOR TOP DISPLAY ==========================
const totalRecords = document.querySelector("span[name='records']"); 
const totalBorrowed = document.querySelector("span[name='borrowed']"); 
const totalReturned = document.querySelector("span[name='returned']"); 
const totalOverdue = document.querySelector("span[name='overdue']"); 
let totalFines = document.querySelector("span[name='totalfines']"); 
const tableBody = document.querySelector(".borrowRecordsTable tbody");
const toggleBtn = document.getElementById("toggleRecords");


let allRecords = []; // empty array to keep books for later 
let filteredRecords = [];
let showingAll = false; // toggle state


//================DATA FOR THE CARDS========================
async function updatecards(){
  try{
    const res = await fetch ("/api/borrowed", {headers})
    if(!res.ok){showError(error)}
    
    const cards = await res.json();

    totalRecords.textContent = cards.length;
    totalReturned.textContent = cards.filter(record => record.status === "returned").length;
    totalBorrowed.textContent = cards.filter(record => record.status === "borrowed" ).length;
    totalOverdue.textContent = cards.filter(record => record.status === "overdue" ).length;

    const totalFinesAmount= cards.reduce((sum, record) => sum + (Number(record.fineAmount) || 0), 0);

    // Format with commas and add ₦
    totalFines.textContent = `₦${totalFinesAmount.toLocaleString()}`;


}catch(error){
    showError(error || "Error loading cards.")
}
}
setInterval(updatecards,1000);

async function fetchRecords(){
  try{
    const res = await fetch("/api/borrowed", { headers });
    if(!res.ok) throw new Error("Error fetching records");

    const records = await res.json();
    allRecords = records;
    filteredRecords = [...allRecords]; // SPREADS ALL RECORDS INTO FILTEREDRECORDS 

    renderTable(filteredRecords);

  }catch(error){
    showError(error || "Error loading borrow records.");
  }
}

//==============DISPLAY TABLE==========================
function renderTable(records){
  tableBody.innerHTML = "";

  // determine records to display
  const displayRecords = showingAll ? records : records.slice(0, 5);

  displayRecords.forEach(record => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${record.user.name}</td>
      <td>${record.book.title}</td>
      <td>${new Date(record.borrowDate).toLocaleDateString()}</td>
      <td>${new Date(record.dueDate).toLocaleDateString()}</td>
      <td>${record.returnDate ? new Date(record.returnDate).toLocaleDateString() : 'N/A'}</td>
      <td>${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</td>
      <td>₦${(record.fineAmount || 0).toLocaleString()}</td>
      <td><button class="edit" data-id="${record._id}">✏️</button></td>
    `;
    tableBody.appendChild(tr);
  });

  // toggle button visibility
  toggleBtn.style.display = records.length > 5 ? "inline-block" : "none";
  toggleBtn.textContent = showingAll ? "Show Less" : "Show More";
}

// =================== SEARCH FILTER ===================
searchInput.addEventListener("input", (e)=>{
  const query = e.target.value.trim().toLowerCase();
  filteredRecords = allRecords.filter(r => r.user.name.toLowerCase().includes(query));
  showingAll = false; // reset toggle
  renderTable(filteredRecords);
});

// =================== TOGGLE SHOW MORE/LESS ===================
toggleBtn.addEventListener("click", ()=>{
  showingAll = !showingAll;
  renderTable(filteredRecords);
});

// =================== INITIAL FETCH ===================
fetchRecords();


// === ✏️ UPDATE TRANSACTION (MODAL) =============================
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeBtn = editModal.querySelector(".close");

// === OPEN MODAL ===
tableBody.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("edit")) return;

    editModal.style.display = "block";  
    const id = e.target.dataset.id;
    const row = e.target.closest("tr");

    try {
      const res = await fetch(`/api/borrowed/${id}`, { headers });
      if (!res.ok) throw new Error("Unable to fetch record data.");

      const record = await res.json();

      // Fill modal fields
      editForm.id.value = record._id;
      editForm.member.value = record.user.name || "";
      editForm.book.value = record.book.title || "";
      editForm.bDate.value = new Date(record.borrowDate).toLocaleDateString();
      editForm.dDate.value = new Date(record.dueDate).toLocaleDateString();
      editForm.rDate.value = record.returnDate
        ? new Date(record.returnDate).toLocaleDateString()
        : "—";
      editForm.status.value = record.status;  
      editForm.fineAmount.value = record.fineAmount || 0;

      // Attach current row reference (so I can update it later)
      editForm.dataset.rowIndex = row.rowIndex;

      editModal.style.display = "block";
    } catch (error) {
      console.error(error);
      showError(error.message);
    }
});

// === CLOSE MODAL ===
closeBtn.onclick = () => (editModal.style.display = "none");
window.onclick = (e) => {
  if (e.target === editModal) editModal.style.display = "none";
};

// === SUBMIT EDITS ===
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = editForm.id.value;
  const updatedRecord = {
    dueDate: editForm.dDate.value,
    fineAmount: Number(editForm.fineAmount.value),
  };

  try {
    const res = await fetch(`/api/borrowed/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updatedRecord),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed.");

    //=== Function to Update table row instantly (no reload)
    const updateTableRow = (recordId, updatedData) => {

    const rowIndex = Number(editForm.dataset.rowIndex);
    const editedRow = tableBody.rows[rowIndex - 1]; // adjust if table has a header row


    const cells = editedRow.querySelectorAll("td");

    // Keep position, just update visible fields
    cells[3].textContent = updatedRecord.dueDate; // Due Date
    cells[6].textContent = "₦" + updatedRecord.fineAmount; // Fine Amount
    }
    updateTableRow(id, updatedRecord);
    editModal.style.display = "none";
    showSuccess("Record updated successfully!");
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
});
