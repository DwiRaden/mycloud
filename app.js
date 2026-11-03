
/* =====================================
   PERSONAL TEXT VAULT
   FINAL APP.JS
===================================== */

// 1. SUPABASE CONFIG

const SUPABASE_URL = "https://diaxpruzbfqevafrukqw.supabase.co";

const SUPABASE_KEY = "sb_publishable_Rc3xIYwy-9m7nODh9JyFyQ_y1Y4vOR1";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// 2. ELEMENTS

const loginPage = document.getElementById("login-page");
const dashboardPage = document.getElementById("dashboard-page");

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");

const notesContainer = document.getElementById("notes-container");
const notesCount = document.getElementById("notes-count");
const emptyState = document.getElementById("empty-state");

const searchInput = document.getElementById("search-input");

const noteModal = document.getElementById("note-modal");
const noteForm = document.getElementById("note-form");

const addNoteButton = document.getElementById("add-note-button");
const closeModalButton = document.getElementById("close-modal-button");

const noteId = document.getElementById("note-id");
const noteTitle = document.getElementById("note-title");
const noteDescription = document.getElementById("note-description");
const noteContent = document.getElementById("note-content");

const modalTitle = document.getElementById("modal-title");
const saveNoteButton = document.getElementById("save-note-button");


// 3. STATE

let currentUser = null;
let allNotes = [];


// 4. HTML SECURITY

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// 5. NAVIGATION

function showLogin() {
    loginPage.classList.remove("hidden");
    dashboardPage.classList.add("hidden");
}

function showDashboard() {
    loginPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");
}


// 6. LOGIN

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const { error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

    } catch (error) {
        loginError.textContent = error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});


// 7. LOGOUT

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
        const { error } = await db.auth.signOut();

        if (error) throw error;

    } catch (error) {
        alert("Gagal logout: " + error.message);
    } finally {
        logoutButton.disabled = false;
    }
});


// 8. LOAD NOTES

async function loadNotes() {
    if (!currentUser) return;

    notesContainer.innerHTML = "<p>Memuat catatan...</p>";

    const { data, error } = await db
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        notesContainer.innerHTML = "";
        alert("Gagal mengambil catatan: " + error.message);
        return;
    }

    allNotes = data || [];

    renderNotes(allNotes);
}


// 9. RENDER NOTES

function renderNotes(notes) {
    notesCount.textContent = `${notes.length} Notes`;

    emptyState.classList.toggle("hidden", notes.length !== 0);

    if (!notes.length) {
        notesContainer.innerHTML = "";
        return;
    }

    notesContainer.innerHTML = notes.map(note => `
        <article class="note-card">

            <h3>${escapeHTML(note.title)}</h3>

            <p>${escapeHTML(note.description || "Tanpa deskripsi")}</p>

            <div class="note-date">
                ${new Date(note.created_at).toLocaleDateString("id-ID")}
            </div>

            <div class="note-actions">

                <button type="button"
                    onclick="editNote('${note.id}')">
                    Edit
                </button>

                <button type="button"
                    class="delete-button"
                    onclick="deleteNote('${note.id}')">
                    Hapus
                </button>

            </div>

        </article>
    `).join("");
}


// 10. OPEN NEW NOTE

addNoteButton.addEventListener("click", () => {
    noteForm.reset();

    noteId.value = "";
    modalTitle.textContent = "New Note";
    saveNoteButton.textContent = "Simpan Catatan";

    noteModal.classList.remove("hidden");
});


// 11. CLOSE MODAL

closeModalButton.addEventListener("click", () => {
    noteModal.classList.add("hidden");
});


// 12. SAVE AND UPDATE

noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) return;

    const id = noteId.value;

    const noteData = {
        title: noteTitle.value.trim(),
        description: noteDescription.value.trim(),
        content: noteContent.value.trim()
    };

    if (!noteData.title || !noteData.content) {
        alert("Judul dan isi catatan wajib diisi.");
        return;
    }

    saveNoteButton.disabled = true;
    saveNoteButton.textContent = "Menyimpan...";

    try {
        let result;

        if (id) {
            result = await db
                .from("notes")
                .update({
                    ...noteData,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id)
                .select();
        } else {
            result = await db
                .from("notes")
                .insert({
                    ...noteData,
                    user_id: currentUser.id
                })
                .select();
        }

        if (result.error) throw result.error;

        noteModal.classList.add("hidden");
        noteForm.reset();

        await loadNotes();

    } catch (error) {
        alert("Gagal menyimpan: " + error.message);
    } finally {
        saveNoteButton.disabled = false;
        saveNoteButton.textContent = "Simpan Catatan";
    }
});


// 13. EDIT NOTE

window.editNote = function(id) {
    const note = allNotes.find(item => item.id === id);

    if (!note) return;

    noteId.value = note.id;
    noteTitle.value = note.title;
    noteDescription.value = note.description || "";
    noteContent.value = note.content;

    modalTitle.textContent = "Edit Note";
    saveNoteButton.textContent = "Update Catatan";

    noteModal.classList.remove("hidden");
};


// 14. DELETE NOTE

window.deleteNote = async function(id) {
    if (!currentUser) return;

    const confirmed = confirm(
        "Yakin ingin menghapus catatan ini?"
    );

    if (!confirmed) return;

    const { error } = await db
        .from("notes")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Gagal menghapus: " + error.message);
        return;
    }

    await loadNotes();
};


// 15. SEARCH

searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    const filteredNotes = allNotes.filter(note =>
        note.title.toLowerCase().includes(keyword) ||
        (note.description || "").toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword)
    );

    renderNotes(filteredNotes);
});


// 16. AUTH STATE

db.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
        currentUser = session.user;
        showDashboard();

        if (event !== "INITIAL_SESSION") {
            setTimeout(loadNotes, 0);
        }
    } else {
        currentUser = null;
        allNotes = [];

        showLogin();

        notesContainer.innerHTML = "";
        searchInput.value = "";
        loginForm.reset();
        noteForm.reset();
        noteModal.classList.add("hidden");
    }
});


// 17. INITIALIZE

async function initializeApp() {
    const { data, error } = await db.auth.getSession();

    if (error) {
        console.error(error.message);
        showLogin();
        return;
    }

    if (data.session?.user) {
        currentUser = data.session.user;
        showDashboard();
        await loadNotes();
    } else {
        showLogin();
    }
}

initializeApp();
