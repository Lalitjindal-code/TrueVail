const API_BASE = "https://truevail-ff2a.onrender.com";

// ==========================================
// 🛠️ HELPER FUNCTIONS (Safety First)
// ==========================================

// Safe string lowercasing to prevent runtime errors
function safeLower(str) {
  return str ? String(str).toLowerCase() : "";
}

// Format confidence as percentage string
function safePercent(val) {
  if (val === undefined || val === null) return "N/A";
  const num = parseFloat(val);
  return isNaN(num) ? "N/A" : `${(num * 100).toFixed(1)}%`;
}

// Centralized API Caller with robust error handling
async function apiCall(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("Invalid JSON response:", text);
      return { status: "Error", message: "Invalid JSON response from server" };
    }

  } catch (error) {
    console.error(`API Call Failed (${endpoint}):`, error);
    return {
      status: "Error",
      message: "Connection failed. Please check your internet or try again later.",
      reason: error.message
    };
  }
}

// ==========================================
// 🔐 AUTHENTICATION (Demo Mode)
// ==========================================

function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  if (email && password) {
    localStorage.setItem("truevail_login", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Please enter credentials");
  }
}

function logout() {
  localStorage.removeItem("truevail_login");
  window.location.href = "login.html";
}

// ==========================================
// 📑 NAVIGATION & UI
// ==========================================

function showTab(id) {
  // Hide all contents
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
  });

  // Show selected content
  const selectedTab = document.getElementById(id);
  if (selectedTab) selectedTab.classList.add("active");

  // Update nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  // Activate current nav link
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.getAttribute("onclick")?.includes(id)) {
      link.classList.add("active");
    }
  });

  // Feature-specific loaders
  if (id === 'history') {
    loadHistory();
  }
  if (id === 'trending-news') {
    setTimeout(loadTrendingNews, 50);
  }
}

function clearContent(inputId, resultId) {
  const input = document.getElementById(inputId);
  if (input) input.value = "";

  const result = document.getElementById(resultId);
  if (result) {
    result.innerHTML = "<p class='placeholder-text'>Results will appear here after analysis...</p>";
    result.style.display = "flex";
  }
}

// ==========================================
// 📰 NEWS ANALYSIS (Text & Link)
// ==========================================

async function analyzeNews() {
  const textInput = document.getElementById("newsInput");
  const resultDiv = document.getElementById("newsResult");

  if (!textInput || !resultDiv) return;

  const text = textInput.value.trim();
  if (!text) {
    alert("Please enter text to analyze.");
    return;
  }

  resultDiv.innerHTML = "<p>Analyzing with AI...</p>";
  resultDiv.style.display = "block";

  const data = await apiCall("/analyze", "POST", { text, type: "news" });
  renderAnalysisResult(resultDiv, data, "news");
}

async function analyzeLink() {
  const linkInput = document.getElementById("linkInput");
  const resultDiv = document.getElementById("linkResult");

  if (!linkInput || !resultDiv) return;

  const url = linkInput.value.trim();
  if (!url) {
    resultDiv.innerHTML = "<p class='placeholder-text'>Please enter a URL to analyze.</p>";
    return;
  }

  resultDiv.innerHTML = "<p>Crawling and analyzing news source... <i class='fas fa-spinner fa-spin'></i></p>";
  resultDiv.style.display = "block";

  const data = await apiCall("/analyze", "POST", { text: url, type: "news" });
  renderAnalysisResult(resultDiv, data, "link");
}

function renderAnalysisResult(container, data, type) {
  if (!data || data.status === 'Error') {
    container.innerHTML = `<p class='error-text'>${data?.message || "Analysis failed."} ${data?.reason ? `(${data.reason})` : ""}</p>`;
    return;
  }

  const statusClass = `status-${safeLower(data.status).replace(/ /g, '-')}`;
  const riskClass = `risk-${safeLower(data.privacy_risk)}`;

  container.innerHTML = `
      <div class="analysis-results">
        <div class="result-summary">
          <div class="result-item">
            <span class="label">Status:</span>
            <span class="value ${statusClass}">${data.status || "Unknown"}</span>
          </div>
          <div class="result-item">
            <span class="label">Confidence:</span>
            <span class="value">${safePercent(data.confidence)}</span>
          </div>
        </div>
        
        <div class="result-details">
          <div class="detail-item">
            <h4>Reasoning</h4>
            <p>${data.reason || "No specific reasoning provided."}</p>
          </div>
          
          ${data.correction ? `
          <div class="detail-item correction-suggestion">
            <h4>Correction Suggestion</h4>
            <p>${data.correction}</p>
          </div>
          ` : ''}
          
          <div class="detail-item">
            <h4>Privacy Risk</h4>
            <p class="${riskClass}">${data.privacy_risk || "Unknown"}</p>
            <p>${data.privacy_explanation || ""}</p>
          </div>
        </div>
        
        <div class="full-analysis">
          <h4>Full Analysis</h4>
          <pre>${data.analysis || 'Detailed analysis not available'}</pre>
        </div>
      </div>
    `;

  // Demo Mode: Log save action
  console.log(`[DEMO] Analysis result (${type}) ready to save:`, data);
}


// ==========================================
// 🕵️ DEEPFAKE ANALYSIS
// ==========================================

function previewFile() {
  const fileInput = document.getElementById('deepfakeFile');
  const fileDisplayArea = document.querySelector('.file-upload-area');

  if (fileInput?.files?.[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const isImage = file.type.match('image.*');
      const isVideo = file.type.match('video.*');
      let previewContent = '<i class="fas fa-file" style="font-size: 48px; margin-bottom: 10px; color: var(--accent-color);"></i>';

      if (isImage) {
        previewContent = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; margin-bottom: 10px; border-radius: 8px;">`;
      } else if (isVideo) {
        previewContent = `<i class="fas fa-file-video" style="font-size: 48px; margin-bottom: 10px; color: var(--accent-color);"></i>`;
      }

      const previewHtml = `
        <div id="filePreviewContainer" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          ${previewContent}
          <p style="margin-bottom: 10px; word-break: break-all;">${file.name}</p>
          <button class="browse-btn" onclick="document.getElementById('deepfakeFile').click()">Change File</button>
        </div>
      `;

      fileInput.style.display = 'none';
      fileDisplayArea.innerHTML = '';
      fileDisplayArea.appendChild(fileInput);
      fileDisplayArea.insertAdjacentHTML('beforeend', previewHtml);
    }

    if (file.type.match('image.*')) {
      reader.readAsDataURL(file);
    } else {
      reader.onload({ target: { result: null } });
    }
  }
}

function clearDeepfakeAnalysis() {
  const fileArea = document.querySelector('.file-upload-area');
  if (fileArea) {
    fileArea.innerHTML = `
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop your image/video here or click to browse</p>
          <input type="file" id="deepfakeFile" accept="image/*,video/*" onchange="previewFile()">
          <button class="browse-btn" onclick="document.getElementById('deepfakeFile').click()">Browse Files</button>
        `;
  }
  clearContent('deepfakeFile', 'deepfakeResult');
}

function analyzeDeepfake() {
  const fileInput = document.getElementById('deepfakeFile');
  const resultDiv = document.getElementById('deepfakeResult');
  const analyzeBtn = document.querySelector('#deepfake .analyze-btn');

  if (!fileInput?.files?.[0]) {
    if (resultDiv) resultDiv.innerHTML = "<p class='placeholder-text'>Please select a file to analyze.</p>";
    return;
  }

  const file = fileInput.files[0];
  if (resultDiv) {
    resultDiv.innerHTML = `<p>Processing ${file.name}... <i class='fas fa-spinner fa-spin'></i></p>`;
    resultDiv.style.display = "block";
  }

  if (analyzeBtn) analyzeBtn.disabled = true;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result.split(',')[1];

    // Call API
    const data = await apiCall("/analyze", "POST", {
      text: file.name,
      type: "deepfake",
      image_data: base64Data,
      mime_type: file.type
    });

    if (analyzeBtn) analyzeBtn.disabled = false;

    // Render
    if (!data || data.status === 'Error') {
      resultDiv.innerHTML = `<p class='error-text'>Analysis failed: ${data?.message || data?.reason || "Unknown error"}</p>`;
      return;
    }

    const technical = data.analysis_details?.technical_assessment || 'No technical details available';

    resultDiv.innerHTML = `
        <div class="analysis-results">
            <div class="result-summary">
            <div class="result-item">
                <span class="label">Status:</span>
                <span class="value status-${safeLower(data.status).replace(/ /g, '-')}">${data.status}</span>
            </div>
            <div class="result-item">
                <span class="label">Confidence:</span>
                <span class="value">${safePercent(data.confidence)}</span>
            </div>
            </div>
            
            <div class="result-details">
            <div class="detail-item">
                <h4>Reasoning</h4>
                <p>${data.reason}</p>
            </div>
            <div class="detail-item">
                <h4>Technical Assessment</h4>
                <p>${technical}</p>
            </div>
            <div class="detail-item">
                <h4>Privacy Risk</h4>
                <p class="risk-${safeLower(data.privacy_risk)}">${data.privacy_risk}</p>
            </div>
            </div>
        </div>
    `;
    console.log("[DEMO] Deepfake result ready:", data);
  };

  reader.onerror = function () {
    if (analyzeBtn) analyzeBtn.disabled = false;
    resultDiv.innerHTML = "<p>Error reading file.</p>";
  };

  reader.readAsDataURL(file);
}


// ==========================================
// 📈 TRENDING NEWS & CHARTS
// ==========================================

async function loadTrendingNews() {
  const newsList = document.getElementById('trending-news-list');
  if (!newsList) return;

  newsList.innerHTML = '<p class="placeholder-text">Loading trending news...</p>';

  const data = await apiCall("/trending-news", "GET");

  if (data.status === 'Error' || !data.trending_news) {
    newsList.innerHTML = `<p class="placeholder-text">Failed to load trending news: ${data.message || 'Server error'}</p>`;
    return;
  }

  displayTrendingNews(data);

  // Render charts if tab is active, safe check
  setTimeout(() => {
    const tab = document.getElementById('trending-news');
    if (tab && tab.classList.contains('active')) {
      renderCharts(data);
    }
  }, 100);
}

function displayTrendingNews(data) {
  const newsList = document.getElementById('trending-news-list');
  if (!newsList) return;

  if (!data.trending_news?.length) {
    newsList.innerHTML = '<p class="placeholder-text">No trending news available.</p>';
    return;
  }

  newsList.innerHTML = data.trending_news.map(article => `
    <div class="news-item">
      <h4>${article.title || 'Untitled'}</h4>
      <p>${article.description || ''}</p>
      <div class="news-source">
        <span>${article.source || 'Unknown'}</span>
        <span class="news-date">${article.published_at ? new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
      </div>
    </div>
  `).join('');
}

function renderCharts(data) {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not loaded");
    return;
  }

  window.currentTrendsData = data;

  try {
    if (data.trends?.categories) renderTopicsChart(data.trends.categories, data.trends.popularity);
    if (data.preferences?.most_read_categories) renderCategoriesChart(data.preferences.most_read_categories);
    if (data.preferences?.reading_time_distribution) renderPreferencesChart(data.preferences.reading_time_distribution);
  } catch (e) {
    console.error("Error rendering charts:", e);
  }
}

function renderTopicsChart(categories, popularity) {
  const canvas = document.getElementById('topicsChart');
  if (!canvas) return;

  if (window.topicsChart) window.topicsChart.destroy();

  try {
    window.topicsChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Popularity (%)',
          data: popularity,
          backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  } catch (e) { console.error("Topics Chart Error", e); }
}

function renderCategoriesChart(categories) {
  const canvas = document.getElementById('categoriesChart');
  if (!canvas) return;

  if (window.categoriesChart) window.categoriesChart.destroy();

  const allCats = window.currentTrendsData?.trends?.categories || [];
  const allPops = window.currentTrendsData?.trends?.popularity || [];
  const values = categories.map(c => {
    const idx = allCats.findIndex(ac => safeLower(ac) === safeLower(c));
    return idx !== -1 ? allPops[idx] : 10;
  });

  try {
    window.categoriesChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#e5e7eb' } } }
      }
    });
  } catch (e) { console.error("Categories Chart Error", e); }
}

function renderPreferencesChart(distribution) {
  const canvas = document.getElementById('preferencesChart');
  if (!canvas) return;

  if (window.preferencesChart) window.preferencesChart.destroy();

  try {
    window.preferencesChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Morning', 'Afternoon', 'Evening', 'Night', 'Late'],
        datasets: [{
          label: 'Reading Time',
          data: distribution,
          borderColor: '#6366f1',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#e5e7eb' } } }
      }
    });
  } catch (e) { console.error("Preferences Chart Error", e); }
}

// ==========================================
// 🕒 HISTORY (Demo Implementation)
// ==========================================
function loadHistory() {
  // In demo mode, show static/placeholder history
  const historyList = document.querySelector('.history-list');
  if (historyList) {
    historyList.innerHTML = '<p class="placeholder-text">History features are available in the full version.</p>';
  }
}
