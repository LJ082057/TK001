/* TK电商生图工作台 - 前端交互逻辑 v2.0 强制上传+并发生图 */

const API_BASE = '';
let currentSession = null;
let uploadedFile = null;
let uploadedImagePath = null;
let apiKeyVisible = false;
let currentMode = null;

// ============================================================
// 页面初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    checkSettings();
    initUpload();
});

async function checkSettings() {
    try {
        const resp = await fetch(`${API_BASE}/api/settings`);
        const data = await resp.json();
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');

        if (data.api_key_set) {
            dot.className = 'status-dot connected';
            const burl = data.base_url || '官方';
            text.textContent = `已连接 (${burl})`;
            text.style.color = 'var(--accent-success)';
        } else {
            dot.className = 'status-dot disconnected';
            text.textContent = '未配置API Key';
            text.style.color = 'var(--accent-warning)';
        }
    } catch (e) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        dot.className = 'status-dot error';
        text.textContent = '连接失败';
    }
}

// ============================================================
// 上传处理
// ============================================================

function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault(); uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFileUpload(file);
        else showToast('请上传图片文件', 'error');
    });

    fileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) handleFileUpload(file); });
}

async function handleFileUpload(file) {
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('manualPreviewImage').src = e.target.result;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'flex';
        document.getElementById('uploadedFileName').textContent = file.name;
    };
    reader.readAsDataURL(file);

    // 同时上传到后端保存
    try {
        const formData = new FormData();
        formData.append('file', file);
        const resp = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
        const data = await resp.json();
        if (resp.ok) {
            uploadedImagePath = data.image_path;
            showToast('图片已上传', 'success');
        }
    } catch (e) {
        console.warn('后端上传失败:', e);
    }

    // 显示下一步
    document.getElementById('step2Mode').style.display = 'block';
    document.getElementById('step2Mode').scrollIntoView({ behavior: 'smooth' });
}

function resetUpload() {
    uploadedFile = null;
    uploadedImagePath = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('step2Mode').style.display = 'none';
    document.getElementById('step3AI').style.display = 'none';
    document.getElementById('step3Manual').style.display = 'none';
    document.getElementById('step4Analysis').style.display = 'none';
    document.getElementById('step5Prompts').style.display = 'none';
    document.getElementById('step6Results').style.display = 'none';
    currentMode = null;
}

// ============================================================
// 模式选择
// ============================================================

function selectMode(mode) {
    currentMode = mode;
    document.getElementById('aiModeBtn').classList.toggle('active', mode === 'ai');
    document.getElementById('manualModeBtn').classList.toggle('active', mode === 'manual');

    if (mode === 'ai') {
        document.getElementById('step3AI').style.display = 'block';
        document.getElementById('step3Manual').style.display = 'none';
        document.getElementById('step3AI').scrollIntoView({ behavior: 'smooth' });
    } else {
        document.getElementById('step3AI').style.display = 'none';
        document.getElementById('step3Manual').style.display = 'block';
        document.getElementById('step3Manual').scrollIntoView({ behavior: 'smooth' });
    }

    document.getElementById('step4Analysis').style.display = 'none';
    document.getElementById('step5Prompts').style.display = 'none';
    document.getElementById('step6Results').style.display = 'none';
}

// ============================================================
// 设置面板
// ============================================================

function openSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    loadSettingsToForm();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('testResult').style.display = 'none';
}

async function loadSettingsToForm() {
    try {
        const resp = await fetch(`${API_BASE}/api/settings`);
        const data = await resp.json();
        document.getElementById('apiKeyInput').value = '';
        if (data.api_key_masked) {
            document.getElementById('apiKeyInput').placeholder = `当前: ${data.api_key_masked}（留空则保持不变）`;
        } else {
            document.getElementById('apiKeyInput').placeholder = 'sk-... 输入你的API Key';
        }
        document.getElementById('baseUrlInput').value = data.base_url || '';
        document.getElementById('visionModelInput').value = data.vision_model || 'gpt-4o';
        document.getElementById('imageModelSelect').value = data.image_model || 'gpt-image-2';
        document.getElementById('imageSizeSelect').value = data.image_size || '1024x1024';
        document.getElementById('targetMarketSelect').value = data.target_market || 'southeast_asia';
    } catch (e) {
        console.error('加载设置失败:', e);
    }
}

function toggleKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    apiKeyVisible = !apiKeyVisible;
    input.type = apiKeyVisible ? 'text' : 'password';
}

async function saveSettingsFromUI() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const baseUrl = document.getElementById('baseUrlInput').value.trim();
    const visionModel = document.getElementById('visionModelInput').value.trim();
    const imageModel = document.getElementById('imageModelSelect').value;
    const imageSize = document.getElementById('imageSizeSelect').value;
    const targetMarket = document.getElementById('targetMarketSelect').value;

    const settingsData = {
        base_url: baseUrl,
        vision_model: visionModel || 'gpt-4o',
        image_model: imageModel,
        image_size: imageSize,
        target_market: targetMarket,
    };

    if (apiKey) settingsData.api_key = apiKey;

    try {
        const resp = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData),
        });
        const data = await resp.json();
        if (!resp.ok) { showToast(data.detail || '保存失败', 'error'); return; }
        showToast('设置已保存', 'success');
        closeSettings();
        checkSettings();
    } catch (e) {
        showToast(`保存失败：${e.message}`, 'error');
    }
}

async function testConnection() {
    const resultEl = document.getElementById('testResult');
    resultEl.style.display = 'block';
    resultEl.className = 'test-result';
    resultEl.textContent = '正在测试连接...';
    await saveSettingsFromUI();

    try {
        const resp = await fetch(`${API_BASE}/api/test-connection`, { method: 'POST' });
        const data = await resp.json();
        if (data.status === 'success') {
            let msg = '✅ ' + data.message;
            if (data.details && data.details.length > 0) msg += '\n\n' + data.details.join('\n');
            resultEl.className = 'test-result success';
            resultEl.textContent = msg;
        } else {
            resultEl.className = 'test-result error';
            resultEl.textContent = '❌ ' + data.message;
        }
    } catch (e) {
        resultEl.className = 'test-result error';
        resultEl.textContent = '❌ 测试请求失败';
    }
}

// ============================================================
// 手动模式：提交产品信息
// ============================================================

async function submitManualInfo() {
    const productName = document.getElementById('manualProductName').value.trim();
    if (!productName) { showToast('请填写产品名称', 'error'); return; }

    const settingsResp = await fetch(`${API_BASE}/api/settings`);
    const settingsData = await settingsResp.json();
    if (!settingsData.api_key_set) { showToast('请先在设置中配置API Key', 'error'); openSettings(); return; }

    const productInfo = {
        product_name: productName,
        product_name_zh: productName,
        product_name_en: document.getElementById('manualProductEn').value.trim() || productName,
        product_type: document.getElementById('manualProductType').value,
        material: document.getElementById('manualMaterial').value.trim(),
        color: document.getElementById('manualColor').value.trim(),
        style: document.getElementById('manualStyle').value.trim(),
        key_features: document.getElementById('manualFeatures').value.trim(),
        detail_features: document.getElementById('manualDetail').value.trim(),
    };

    if (uploadedImagePath) {
        productInfo.image_path = uploadedImagePath;
    }

    showLoading('正在生成提示词...');

    try {
        const resp = await fetch(`${API_BASE}/api/manual-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productInfo),
        });
        const data = await resp.json();

        if (!resp.ok) { hideLoading(); showToast(data.detail || '生成失败', 'error'); return; }

        currentSession = data;
        displayAnalysis(data.analysis);
        displayPrompts(data.prompts);
        document.getElementById('productBadge').textContent = data.product_name;
        document.getElementById('step4Analysis').style.display = 'block';
        document.getElementById('step5Prompts').style.display = 'block';
        hideLoading();
        showToast(`提示词生成完成：${data.product_name}`, 'success');
        document.getElementById('step4Analysis').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        hideLoading();
        showToast(`生成失败：${error.message}`, 'error');
    }
}

// ============================================================
// AI模式：识图
// ============================================================

async function analyzeImage() {
    if (!uploadedFile) { showToast('请先上传产品图片', 'error'); return; }
    const settingsResp = await fetch(`${API_BASE}/api/settings`);
    const settingsData = await settingsResp.json();
    if (!settingsData.api_key_set) { showToast('请先配置API Key', 'error'); openSettings(); return; }

    const productName = document.getElementById('productNameInputAI').value.trim();
    showLoading('正在分析产品图片...');

    try {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        if (productName) formData.append('product_name', productName);

        const response = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok) {
            hideLoading();
            if (response.status === 503) {
                showToast('识图服务不可用，请切换到手动模式', 'error');
                selectMode('manual');
                return;
            }
            if (response.status === 401) { showToast('API Key无效', 'error'); openSettings(); return; }
            throw new Error(data.detail || '识图失败');
        }

        currentSession = data;
        displayAnalysis(data.analysis);
        displayPrompts(data.prompts);
        document.getElementById('productBadge').textContent = data.product_name;
        document.getElementById('step4Analysis').style.display = 'block';
        document.getElementById('step5Prompts').style.display = 'block';
        hideLoading();
        showToast(`识图完成：${data.product_name}`, 'success');
        document.getElementById('step4Analysis').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        hideLoading();
        showToast(`识图失败：${error.message}`, 'error');
    }
}

// ============================================================
// 分析结果展示
// ============================================================

function displayAnalysis(analysis) {
    const grid = document.getElementById('analysisGrid');
    const keyLabels = {
        'product_name_zh': '产品名称', 'product_name_en': '英文名',
        'product_type': '产品类型', 'material': '材质',
        'color': '颜色', 'style': '风格',
        'target_audience': '目标人群', 'price_positioning': '价格定位',
    };
    let html = '';
    for (const [key, label] of Object.entries(keyLabels)) {
        if (analysis[key]) html += `<div class="analysis-item"><div class="label">${label}</div><div class="value">${analysis[key]}</div></div>`;
    }
    if (analysis.key_features && analysis.key_features.length > 0) {
        html += `<div class="analysis-item"><div class="label">关键特征</div><div class="value">${analysis.key_features.join('、')}</div></div>`;
    }
    if (analysis.detail_features && analysis.detail_features !== '未知') {
        html += `<div class="analysis-item"><div class="label">细节</div><div class="value">${analysis.detail_features}</div></div>`;
    }
    grid.innerHTML = html;
}

// ============================================================
// 提示词编辑
// ============================================================

function displayPrompts(prompts) {
    const container = document.getElementById('promptsContainer');
    let html = '';
    for (const [category, info] of Object.entries(prompts)) {
        html += `
            <div class="prompt-card" id="promptCard_${category}">
                <div class="prompt-card-header">
                    <span class="prompt-category">${category}</span>
                    <span class="prompt-desc">${info.description_zh}</span>
                </div>
                <textarea class="prompt-textarea" id="prompt_${category}"
                    oninput="updateCharCount('${category}')">${info.prompt}</textarea>
                <div class="prompt-card-footer">
                    <span class="char-count" id="charCount_${category}">${info.prompt.length} 字符</span>
                    <button class="single-gen-btn" onclick="generateSingle('${category}')">⚡ 单独生成</button>
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

function updateCharCount(category) {
    const textarea = document.getElementById(`prompt_${category}`);
    const countEl = document.getElementById(`charCount_${category}`);
    countEl.textContent = `${textarea.value.length} 字符`;
}

async function savePrompts() {
    if (!currentSession) return;
    const promptsData = {};
    for (const [category] of Object.entries(currentSession.prompts)) {
        const textarea = document.getElementById(`prompt_${category}`);
        if (textarea) promptsData[category] = { prompt: textarea.value };
    }
    try {
        const response = await fetch(`${API_BASE}/api/prompts/${currentSession.session_id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptsData),
        });
        const data = await response.json();
        currentSession.prompts = data.prompts;
        showToast('提示词已保存', 'success');
    } catch (error) {
        showToast(`保存失败：${error.message}`, 'error');
    }
}

// ============================================================
// 图片生成（并发+进度推送）
// ============================================================

async function generateAll() {
    if (!currentSession) return;
    const settingsResp = await fetch(`${API_BASE}/api/settings`);
    const settingsData = await settingsResp.json();
    if (!settingsData.api_key_set) { showToast('请先配置API Key', 'error'); openSettings(); return; }

    await savePrompts();
    showLoading('正在并发生成6张电商图片...', true);
    updateProgress(0, 6);

    // 使用 EventSource 接收实时进度
    const progressSource = new EventSource(`${API_BASE}/api/generate-progress/${currentSession.session_id}`);
    progressSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.completed !== undefined) {
            updateProgress(data.completed, 6);
        }
        if (data.done) {
            progressSource.close();
        }
    };
    progressSource.onerror = () => {
        progressSource.close();
    };

    try {
        const response = await fetch(`${API_BASE}/api/generate/${currentSession.session_id}`, { method: 'POST' });
        const data = await response.json();

        progressSource.close();
        updateProgress(6, 6);
        hideLoading();

        if (!response.ok) throw new Error(data.detail || '生图失败');

        currentSession.generated_images = data.results;
        displayResults(data.results, data.errors);
        document.getElementById('step6Results').style.display = 'block';
        document.getElementById('step6Results').scrollIntoView({ behavior: 'smooth' });

        if (data.errors && data.errors.length > 0) showToast(`完成，${data.errors.length}张失败`, 'error');
        else showToast('6张图片全部生成完成！', 'success');
    } catch (error) {
        progressSource.close();
        hideLoading();
        showToast(`生图失败：${error.message}`, 'error');
    }
}

async function generateSingle(category) {
    if (!currentSession) return;
    const textarea = document.getElementById(`prompt_${category}`);
    if (textarea) {
        await fetch(`${API_BASE}/api/prompts/${currentSession.session_id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [category]: { prompt: textarea.value } }),
        });
    }
    showLoading(`正在生成 ${category}...`);

    try {
        const response = await fetch(`${API_BASE}/api/generate-single/${currentSession.session_id}/${category}`, { method: 'POST' });
        const data = await response.json();
        hideLoading();
        if (data.status === 'success') {
            if (!currentSession.generated_images) currentSession.generated_images = {};
            currentSession.generated_images[category] = data;
            displayResults(currentSession.generated_images, []);
            document.getElementById('step6Results').style.display = 'block';
            showToast(`${category} 生成完成`, 'success');
        } else {
            showToast(`${category} 生成失败：${data.error}`, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast(`生成失败：${error.message}`, 'error');
    }
}

async function regenerateAll() { if (currentSession) await generateAll(); }

// ============================================================
// 结果展示
// ============================================================

function displayResults(results, errors) {
    const grid = document.getElementById('resultsGrid');
    const categories = ['主图', '场景图', '细节图', '参数图', '对比图', '模特图'];
    const successCount = Object.keys(results).length;
    document.getElementById('resultCount').textContent = `${successCount}/6 张已生成`;

    let html = '';
    for (const category of categories) {
        if (results[category]) {
            const info = results[category];
            const promptPreview = info.prompt ? info.prompt.substring(0, 50) + '...' : '';
            html += `
                <div class="result-card">
                    <img src="${info.url}" alt="${category}" loading="lazy"
                         onerror="this.parentElement.innerHTML='<div class=result-empty><div class=result-empty-icon>⚠️</div><p>${category} 加载失败</p></div>'">
                    <div class="result-card-info">
                        <div class="result-card-name">${category}</div>
                        <div class="result-card-prompt-preview">${promptPreview}</div>
                        <div class="result-card-actions">
                            <button class="result-download-btn" onclick="window.open('${info.url}', '_blank')">👁 查看</button>
                            <button class="result-download-btn" onclick="downloadSingle('${info.url}', '${category}.png')">⬇ 下载</button>
                        </div>
                    </div>
                </div>`;
        } else {
            html += `
                <div class="result-card">
                    <div class="result-empty">
                        <div class="result-empty-icon">⏳</div>
                        <p style="font-weight:500">${category}</p>
                        <p style="font-size:12px">未生成</p>
                    </div>
                </div>`;
        }
    }
    if (errors && errors.length > 0) {
        html += `<div style="grid-column:1/-1;color:var(--accent-primary);font-size:13px;">⚠️ 错误：${errors.join(' | ')}</div>`;
    }
    grid.innerHTML = html;
    document.getElementById('resultsActions').style.display = successCount > 0 ? 'flex' : 'none';
}

// ============================================================
// 下载
// ============================================================

function downloadSingle(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
}

async function downloadAll() {
    if (!currentSession) return;
    try {
        const resp = await fetch(`${API_BASE}/api/download/${encodeURIComponent(currentSession.product_name)}`);
        if (!resp.ok) { showToast('下载失败', 'error'); return; }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSession.product_name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('开始下载ZIP', 'success');
    } catch (e) {
        showToast(`下载失败：${e.message}`, 'error');
    }
}

// ============================================================
// Loading & Toast
// ============================================================

function showLoading(text, showProgress = false) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.getElementById('loadingProgress').style.display = showProgress ? 'block' : 'none';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function updateProgress(current, total) {
    const pct = (current / total) * 100;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = `${current} / ${total} 张已生成`;
}

function showToast(text, type = 'info') {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    toastText.textContent = text;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
