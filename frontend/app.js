// ==================== State Management ====================
let selectedFiles = [];
let extractedData = null;
let totalDocumentsProcessed = 0;

// ==================== DOM Elements ====================
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const newUploadBtn = document.getElementById('newUploadBtn');
const loadingStatus = document.getElementById('loadingStatus');
const progressFill = document.getElementById('progressFill');
const totalDocsElement = document.getElementById('totalDocs');

// ==================== File Upload Handling ====================
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length === 0) return;

    selectedFiles = Array.from(files);
    uploadBtn.disabled = false;

    // Update upload zone to show selected files
    const uploadZoneContent = uploadZone.querySelector('.upload-zone-content');
    uploadZoneContent.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/>
            <path d="M16 24L22 30L32 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p><strong>${selectedFiles.length}</strong> file${selectedFiles.length > 1 ? 's' : ''} selected</p>
        <p style="font-size: 0.875rem; opacity: 0.7; margin-top: 0.5rem;">
            ${selectedFiles.map(f => f.name).join(', ')}
        </p>
    `;
}

// ==================== Upload & Extract ====================
uploadBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    // Show loading
    uploadSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const formData = new FormData();

        // If single file, use /api/upload, otherwise use /api/upload-multiple
        if (selectedFiles.length === 1) {
            formData.append('file', selectedFiles[0]);
            await uploadSingleFile(formData);
        } else {
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });
            await uploadMultipleFiles(formData);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message);
    }
});

async function uploadSingleFile(formData) {
    updateLoadingStatus('Uploading file...');

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
    }

    updateLoadingStatus('Extracting data...');
    const data = await response.json();

    updateLoadingStatus('Processing complete!');
    setTimeout(() => displayResults(data), 500);
}

async function uploadMultipleFiles(formData) {
    updateLoadingStatus('Uploading files...');

    const response = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
    }

    updateLoadingStatus('Extracting data...');
    const data = await response.json();

    updateLoadingStatus('Processing complete!');
    setTimeout(() => displayResults(data), 500);
}

function updateLoadingStatus(message) {
    loadingStatus.textContent = message;
}

function showError(message) {
    loadingSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');

    alert(`Error: ${message}`);

    // Reset
    selectedFiles = [];
    fileInput.value = '';
    uploadBtn.disabled = true;
    const uploadZoneContent = uploadZone.querySelector('.upload-zone-content');
    uploadZoneContent.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 12V32M24 12L16 20M24 12L32 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 32V36C12 38.2091 13.7909 40 16 40H32C34.2091 40 36 38.2091 36 36V32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <p>Drop files here or <span class="browse-link">browse</span></p>
    `;
}

// ==================== Display Results ====================
function displayResults(data) {
    extractedData = data;

    // Update stats
    totalDocumentsProcessed += data.total_documents || 0;
    totalDocsElement.textContent = totalDocumentsProcessed;

    // Hide loading, show results
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Render documents
    if (data.documents && data.documents.length > 0) {
        data.documents.forEach((doc, index) => {
            const docCard = createDocumentCard(doc, index);
            resultsContainer.appendChild(docCard);
        });
    } else {
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No data extracted</p>';
    }
}

function createDocumentCard(doc, index) {
    const card = document.createElement('div');
    card.className = 'document-card';

    // Determine badge type
    const badgeClass = `badge-${doc.pdf_type || 'digital'}`;
    const badgeText = doc.pdf_type || 'document';

    card.innerHTML = `
        <div class="document-header">
            <h3 class="document-title">${doc.file_name || `Document ${index + 1}`}</h3>
            <span class="document-badge ${badgeClass}">${badgeText}</span>
        </div>
        ${doc.error ? `
            <div style="padding: 1rem; background: rgba(245, 87, 108, 0.1); border-radius: 8px; color: #f5576c;">
                <strong>Error:</strong> ${doc.error}
            </div>
        ` : `
            <div class="pages-container">
                ${renderPages(doc.pages || [])}
            </div>
        `}
    `;

    return card;
}

function renderPages(pages) {
    if (!pages || pages.length === 0) {
        return '<p style="color: var(--text-secondary);">No pages found</p>';
    }

    return pages.map((page, index) => `
        <div class="page-card">
            <div class="page-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
                    <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="5" y1="11" x2="9" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Page ${page.page_no || index + 1}
            </div>
            
            ${page.text ? `
                <div class="page-text">${escapeHtml(page.text.substring(0, 500))}${page.text.length > 500 ? '...' : ''}</div>
            ` : ''}
            
            ${page.tables && page.tables.length > 0 ? `
                <div class="tables-container">
                    ${renderTables(page.tables)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderTables(tables) {
    return tables.map((table, index) => `
        <div class="table-wrapper">
            <table class="data-table">
                ${renderTableRows(table)}
            </table>
        </div>
    `).join('');
}

function renderTableRows(table) {
    if (!table || table.length === 0) return '';

    let html = '<thead><tr>';

    // First row as header
    const headers = table[0];
    headers.forEach(cell => {
        html += `<th>${escapeHtml(String(cell || ''))}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Remaining rows as data
    for (let i = 1; i < table.length; i++) {
        html += '<tr>';
        table[i].forEach(cell => {
            html += `<td>${escapeHtml(String(cell || ''))}</td>`;
        });
        html += '</tr>';
    }

    html += '</tbody>';
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== New Upload ====================
newUploadBtn.addEventListener('click', () => {
    // Reset state
    selectedFiles = [];
    fileInput.value = '';
    uploadBtn.disabled = true;

    // Reset upload zone
    const uploadZoneContent = uploadZone.querySelector('.upload-zone-content');
    uploadZoneContent.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 12V32M24 12L16 20M24 12L32 20" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 32V36C12 38.2091 13.7909 40 16 40H32C34.2091 40 36 38.2091 36 36V32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <p>Drop files here or <span class="browse-link">browse</span></p>
    `;

    // Show upload section
    resultsSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
});

// ==================== Initialize ====================
console.log('SmartAudit TDS Document Extraction - Ready');
