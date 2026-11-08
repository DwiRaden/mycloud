
/* =====================================
   PERSONAL TEXT VAULT
   APPLICATION JAVASCRIPT
===================================== */


/* =====================================
   SUPABASE CONFIGURATION
===================================== */

const SUPABASE_URL = "https://diaxpruzbfqevafrukqw.supabase.co";

const SUPABASE_KEY = "sb_publishable_Rc3xIYwy-9m7nODh9JyFyQ_y1Y4vOR1";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =====================================
   HTML ELEMENTS
===================================== */

// Login
const loginPage = document.getElementById("login-page");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");

// Public Library
const publicPage = document.getElementById("public-page");
const explorePublicButton = document.getElementById("explore-public-button");
const publicLoginButton = document.getElementById("public-login-button");
const publicSearchInput = document.getElementById("public-search-input");
const publicNotesContainer = document.getElementById("public-notes-container");
const publicNotesCount = document.getElementById("public-notes-count");
const publicEmptyState = document.getElementById("public-empty-state");

// Public Detail
const publicDetailPage = document.getElementById("public-detail-page");
const detailBackButton = document.getElementById("detail-back-button");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");
const detailDate = document.getElementById("detail-date");
const detailContent = document.getElementById("detail-content");

// Dashboard
const dashboardPage = document.getElementById("dashboard-page");
const logoutButton = document.getElementById("logout-button");
const addNoteButton = document.getElementById("add-note-button");
const searchInput = document.getElementById("search-input");
const notesContainer = document.getElementById("notes-container");
const notesCount = document.getElementById("notes-count");
const emptyState = document.getElementById("empty-state");

// Admin Filters
const filterButtons = document.querySelectorAll(".filter-button");

// Modal
const noteModal = document.getElementById("note-modal");
const noteForm = document.getElementById("note-form");
const closeModalButton = document.getElementById("close-modal-button");
const noteId = document.getElementById("note-id");
const noteTitle = document.getElementById("note-title");
const noteDescription = document.getElementById("note-description");
const noteContent = document.getElementById("note-content");
const noteVisibility = document.getElementById("note-visibility");
const modalTitle = document.getElementById("modal-title");
const saveNoteButton = document.getElementById("save-note-button");


/* =====================================
   APPLICATION STATE
===================================== */

let currentUser = null;

let allNotes = [];
let publicNotes = [];

let activeFilter = "all";


/* =====================================
   HELPER FUNCTIONS
===================================== */

// Escape HTML agar isi catatan tidak dianggap sebagai kode HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// Format tanggal.
function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// Tampilkan satu halaman dan sembunyikan halaman lainnya.
function showPage(page) {
    const pages = [
        loginPage,
        publicPage,
        publicDetailPage,
        dashboardPage
    ];

    pages.forEach(element => {
        element.classList.add("hidden");
    });

    page.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// Tampilkan halaman login.
function showLogin() {
    showPage(loginPage);
}


// Tampilkan dashboard admin.
function showDashboard() {
    showPage(dashboardPage);
}


/* =====================================
   LOGIN SYSTEM
===================================== */

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    loginError.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        currentUser = data.user;

        await loadNotes();

        activeFilter = "all";
        updateFilterButtons();

        showDashboard();

    } catch (error) {
        console.error("Login error:", error);

        loginError.textContent =
            "Login gagal. Periksa email dan password.";

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});


/* =====================================
   LOGOUT SYSTEM
===================================== */

logoutButton.addEventListener("click", async function() {
    const { error } = await db.auth.signOut();

    if (error) {
        alert("Logout gagal: " + error.message);
        return;
    }

    currentUser = null;
    allNotes = [];

    showLogin();
});


/* =====================================
   AUTHENTICATION STATE
===================================== */

db.auth.onAuthStateChange((event, session) => {

    currentUser = session?.user || null;

    if (currentUser) {
        setTimeout(async () => {
            await loadNotes();
            showDashboard();
        }, 0);

    } else {
        allNotes = [];
        showLogin();
    }

});


/* =====================================
   ADMIN LOAD NOTES
===================================== */

async function loadNotes() {

    if (!currentUser) return;

    notesContainer.innerHTML = "<p>Loading notes...</p>";

    try {
        const { data, error } = await db
            .from("notes")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        allNotes = data || [];

        renderNotes();

    } catch (error) {
        console.error("Load notes error:", error);

        notesContainer.innerHTML =
            "<p>Gagal memuat catatan. Periksa koneksi database.</p>";
    }
}


/* =====================================
   RENDER ADMIN NOTES
===================================== */

function renderNotes() {

    const keyword = searchInput.value.toLowerCase().trim();

    let filteredNotes = allNotes.filter(note => {

        const matchesSearch =
            (note.title || "").toLowerCase().includes(keyword) ||
            (note.description || "").toLowerCase().includes(keyword) ||
            (note.content || "").toLowerCase().includes(keyword);

        const matchesFilter =
            activeFilter === "all" ||
            note.visibility === activeFilter;

        return matchesSearch && matchesFilter;
    });

    notesCount.textContent = `${filteredNotes.length} Notes`;

    emptyState.classList.toggle(
        "hidden",
        filteredNotes.length !== 0
    );

    notesContainer.innerHTML = filteredNotes.map(note => {

        const visibility = note.visibility || "private";

        const visibilityLabel =
            visibility === "public"
                ? "🌐 PUBLIC"
                : "🔒 PRIVATE";

        return `
            <article class="note-card">

                <span class="note-visibility ${visibility}">
                    ${visibilityLabel}
                </span>

                <h3>${escapeHTML(note.title)}</h3>

                <p>${escapeHTML(note.description || "Tidak ada deskripsi.")}</p>

                <span class="note-date">
                    ${formatDate(note.created_at)}
                </span>

                <div class="note-actions">

                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${escapeHTML(note.id)}">

                        Edit

                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        data-action="delete"
                        data-id="${escapeHTML(note.id)}">

                        Delete

                    </button>

                </div>

            </article>
        `;

    }).join("");
}


/* =====================================
   ADMIN FILTER
===================================== */

function updateFilterButtons() {

    filterButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === activeFilter
        );

    });

}


filterButtons.forEach(button => {

    button.addEventListener("click", function() {

        activeFilter = this.dataset.filter;

        updateFilterButtons();

        renderNotes();

    });

});


/* =====================================
   ADMIN SEARCH
===================================== */

searchInput.addEventListener("input", function() {
    renderNotes();
});


/* =====================================
   OPEN NEW NOTE MODAL
===================================== */

addNoteButton.addEventListener("click", function() {

    noteForm.reset();

    noteId.value = "";

    noteVisibility.value = "private";

    modalTitle.textContent = "New Note";

    saveNoteButton.textContent = "Simpan Catatan";

    noteModal.classList.remove("hidden");

});


/* =====================================
   CLOSE MODAL
===================================== */

closeModalButton.addEventListener("click", function() {
    closeModal();
});


function closeModal() {

    noteModal.classList.add("hidden");

    noteForm.reset();

    noteId.value = "";

}


/* =====================================
   SAVE / UPDATE NOTE
===================================== */

noteForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!currentUser) {
        alert("Silakan login terlebih dahulu.");
        return;
    }

    const id = noteId.value;

    const payload = {

        title: noteTitle.value.trim(),

        description: noteDescription.value.trim(),

        content: noteContent.value.trim(),

        visibility: noteVisibility.value,

        user_id: currentUser.id

    };

    if (!payload.title || !payload.content) {
        alert("Judul dan isi catatan wajib diisi.");
        return;
    }

    saveNoteButton.disabled = true;
    saveNoteButton.textContent = "Menyimpan...";

    try {

        let result;

        if (id) {

            // UPDATE NOTE

            result = await db
                .from("notes")
                .update({
                    title: payload.title,
                    description: payload.description,
                    content: payload.content,
                    visibility: payload.visibility,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id)
                .eq("user_id", currentUser.id);

        } else {

            // INSERT NOTE

            result = await db
                .from("notes")
                .insert(payload);

        }

        if (result.error) {
            throw result.error;
        }

        closeModal();

        await loadNotes();

        alert(
            payload.visibility === "public"
                ? "Catatan berhasil disimpan sebagai Public."
                : "Catatan berhasil disimpan sebagai Private."
        );

    } catch (error) {

        console.error("Save note error:", error);

        alert("Gagal menyimpan catatan: " + error.message);

    } finally {

        saveNoteButton.disabled = false;
        saveNoteButton.textContent = "Simpan Catatan";

    }

});


/* =====================================
   EDIT NOTE
===================================== */

async function editNote(id) {

    const note = allNotes.find(item => item.id === id);

    if (!note) {
        alert("Catatan tidak ditemukan.");
        return;
    }

    noteId.value = note.id;

    noteTitle.value = note.title || "";

    noteDescription.value = note.description || "";

    noteContent.value = note.content || "";

    noteVisibility.value = note.visibility || "private";

    modalTitle.textContent = "Edit Note";

    saveNoteButton.textContent = "Update Catatan";

    noteModal.classList.remove("hidden");

}


/* =====================================
   DELETE NOTE
===================================== */

async function deleteNote(id) {

    const confirmed = confirm(
        "Yakin ingin menghapus catatan ini?"
    );

    if (!confirmed) return;

    try {

        const { error } = await db
            .from("notes")
            .delete()
            .eq("id", id)
            .eq("user_id", currentUser.id);

        if (error) {
            throw error;
        }

        await loadNotes();

        alert("Catatan berhasil dihapus.");

    } catch (error) {

        console.error("Delete note error:", error);

        alert("Gagal menghapus catatan: " + error.message);

    }

}


/* =====================================
   ADMIN NOTE ACTION HANDLER
===================================== */

notesContainer.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const action = button.dataset.action;

    if (action === "edit") {
        editNote(id);
    }

    if (action === "delete") {
        deleteNote(id);
    }

});


/* =====================================
   PUBLIC LIBRARY NAVIGATION
===================================== */

explorePublicButton.addEventListener("click", async function() {

    showPage(publicPage);

    publicSearchInput.value = "";

    await loadPublicNotes();

});


publicLoginButton.addEventListener("click", function() {

    if (currentUser) {
        showDashboard();
    } else {
        showLogin();
    }

});


/* =====================================
   LOAD PUBLIC NOTES
===================================== */

async function loadPublicNotes() {

    publicNotesContainer.innerHTML = "<p>Loading public notes...</p>";

    try {

        const { data, error } = await db
            .from("notes")
            .select("id, title, description, created_at, visibility")
            .eq("visibility", "public")
            .order("created_at", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        publicNotes = data || [];

        renderPublicNotes();

    } catch (error) {

        console.error("Public notes error:", error);

        publicNotesContainer.innerHTML =
            "<p>Gagal memuat Public Library. Coba lagi nanti.</p>";

        publicNotesCount.textContent = "Error";

    }

}


/* =====================================
   RENDER PUBLIC NOTES
===================================== */

function renderPublicNotes() {

    const keyword = publicSearchInput.value.toLowerCase().trim();

    const filteredNotes = publicNotes.filter(note => {

        return (
            (note.title || "").toLowerCase().includes(keyword) ||
            (note.description || "").toLowerCase().includes(keyword)
        );

    });

    publicNotesCount.textContent =
        `${filteredNotes.length} Notes`;

    publicEmptyState.classList.toggle(
        "hidden",
        filteredNotes.length !== 0
    );

    publicNotesContainer.innerHTML = filteredNotes.map(note => {

        return `
            <article class="note-card">

                <span class="note-visibility public">
                    🌐 PUBLIC
                </span>

                <h3>${escapeHTML(note.title)}</h3>

                <p>
                    ${escapeHTML(note.description || "Tidak ada deskripsi.")}
                </p>

                <span class="note-date">
                    ${formatDate(note.created_at)}
                </span>

                <div class="note-actions">

                    <button
                        type="button"
                        class="read-button"
                        data-public-id="${escapeHTML(note.id)}">

                        Read Full Note →

                    </button>

                </div>

            </article>
        `;

    }).join("");

}


/* =====================================
   PUBLIC SEARCH
===================================== */

publicSearchInput.addEventListener("input", function() {
    renderPublicNotes();
});


/* =====================================
   OPEN PUBLIC NOTE DETAIL
===================================== */

publicNotesContainer.addEventListener("click", async function(event) {

    const button = event.target.closest("button[data-public-id]");

    if (!button) return;

    const id = button.dataset.publicId;

    await openPublicDetail(id);

});


async function openPublicDetail(id) {

    showPage(publicDetailPage);

    detailTitle.textContent = "Loading...";

    detailDescription.textContent = "";

    detailDate.textContent = "";

    detailContent.textContent = "Memuat isi catatan...";

    try {

        const { data, error } = await db
            .from("notes")
            .select("id, title, description, content, created_at, visibility")
            .eq("id", id)
            .eq("visibility", "public")
            .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("Catatan tidak ditemukan.");
        }

        detailTitle.textContent = data.title || "";

        detailDescription.textContent =
            data.description || "";

        detailDate.textContent =
            formatDate(data.created_at);

        detailContent.textContent =
            data.content || "";

    } catch (error) {

        console.error("Public detail error:", error);

        detailTitle.textContent = "Catatan tidak tersedia";

        detailDescription.textContent = "";

        detailDate.textContent = "";

        detailContent.textContent =
            "Catatan mungkin sudah dihapus atau tidak lagi tersedia untuk publik.";

    }

}


/* =====================================
   BACK TO PUBLIC LIBRARY
===================================== */

detailBackButton.addEventListener("click", function() {
    showPage(publicPage);
});


/* =====================================
   INITIALIZE APPLICATION
===================================== */

async function initializeApp() {

    try {

        const { data, error } = await db.auth.getSession();

        if (error) {
            throw error;
        }

        currentUser = data.session?.user || null;

        if (currentUser) {

            await loadNotes();

            showDashboard();

        } else {

            showLogin();

        }

    } catch (error) {

        console.error("Initialization error:", error);

        currentUser = null;

        showLogin();

    }

}


initializeApp();
