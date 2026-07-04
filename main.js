// Cập nhật Live Preview cho Editor
const inputs = ['eventType', 'mainTitle', 'subMessage', 'eventDate', 'location', 'themeSelect'];
function adjustInputsForTheme(theme) {
    const main = document.getElementById('mainTitle');
    const sub = document.getElementById('subMessage');
    const viewCard = document.getElementById('previewCard');
    if (!main || !sub || !viewCard) return;

    // Defaults
    main.placeholder = 'Tiêu đề thiệp';
    sub.placeholder = 'Thông điệp';
    viewCard.style.textAlign = '';

    switch (theme) {
        case 'theme-modern':
        case 'theme-professional':
            main.placeholder = 'Tiêu đề / Tên sự kiện';
            sub.placeholder = 'Thông tin ngắn gọn (thời gian, dresscode...)';
            viewCard.style.textAlign = 'left';
            break;
        case 'theme-vibrant':
            main.placeholder = 'Tiêu đề nổi bật';
            sub.placeholder = 'Thông điệp ngắn, bắt mắt';
            viewCard.style.textAlign = 'center';
            break;
        case 'theme-floral':
        case 'theme-elegant':
        case 'theme-classic':
        case 'theme-gold':
        case 'theme-minimal':
        case 'theme-boho':
        default:
            main.placeholder = 'Tên chủ tiệc / Tiêu đề';
            sub.placeholder = 'Trân trọng kính mời...';
            viewCard.style.textAlign = 'center';
            break;
    }
}

// Try to find an image file in `assets/` that matches the theme.
function findThemeAsset(theme) {
    // Hard-coded mapping for uploaded assets (populated from assets/ folder)
    const THEME_ASSETS = {
        'theme-boho': 'assets/Boho.png',
        'theme-classic': 'assets/Classic.jpg',
        'theme-elegant': 'assets/Elegant.jpg',
        'theme-floral': 'assets/Floral.avif',
        'theme-modern': 'assets/Modern.jpg',
        'theme-professional': 'assets/Professional.jpg',
        'theme-gold': 'assets/Vàng sang trọng.jpg',
        'theme-vang-sang-trong': 'assets/Vàng sang trọng.jpg'
    };

    // If there's a direct mapping, prefer that file first
    if (THEME_ASSETS[theme]) {
        return new Promise(resolve => {
            const img = new Image();
            const url = THEME_ASSETS[theme];
            img.onload = () => resolve({ img, url });
            img.onerror = () => resolve(null);
            img.src = url + '?_=' + Date.now();
        });
    }
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    const candidates = exts.map(e => `assets/${theme}.${e}`);
    // also try variants with hyphen/underscore differences
    const alt = theme.replace(/_/g, '-');
    if (alt !== theme) candidates.push(...exts.map(e => `assets/${alt}.${e}`));

    return new Promise(resolve => {
        let i = 0;
        function tryNext() {
            if (i >= candidates.length) return resolve(null);
            const url = candidates[i++];
            const img = new Image();
            img.onload = () => resolve({ img, url });
            img.onerror = tryNext;
            img.src = url + '?_=' + Date.now();
        }
        tryNext();
    });
}

function analyzeImage(img) {
    const w = Math.min(200, img.width);
    const h = Math.min(200, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    try {
        const data = ctx.getImageData(0, 0, w, h).data;
        let r=0,g=0,b=0,count=0;
        for (let i=0;i<data.length;i+=40) { // sample for speed
            r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        r = r/count; g = g/count; b = b/count;
        const luminance = 0.2126*r + 0.7152*g + 0.0722*b;
        const aspect = img.width / img.height;
        return { luminance, aspect };
    } catch (e) {
        return { luminance: 240, aspect: img.width / img.height };
    }
}

// Apply a found theme image to the preview card and adjust colors/placeholders
function applyThemeImage(theme) {
    const viewCard = document.getElementById('previewCard');
    if (!viewCard) return;
    findThemeAsset(theme).then(found => {
        if (!found) {
            // remove any inline background if previously set
            viewCard.style.backgroundImage = '';
            viewCard.style.color = '';
            return;
        }
        const { img, url } = found;
        const info = analyzeImage(img);
        // set background image inline so it overrides CSS theme bg
        viewCard.style.backgroundImage = `url('${url}')`;
        viewCard.style.backgroundSize = 'cover';
        viewCard.style.backgroundPosition = 'center';

        // choose text color based on luminance
        if (info.luminance < 120) {
            viewCard.style.color = '#fff';
        } else {
            viewCard.style.color = '';
        }

        // adjust placeholders based on aspect
        const main = document.getElementById('mainTitle');
        const sub = document.getElementById('subMessage');
        if (info.aspect < 0.8) {
            // portrait -> shorter title recommended
            if (main) main.placeholder = 'Tiêu đề ngắn gọn';
            if (sub) sub.placeholder = 'Thông điệp ngắn';
            viewCard.style.textAlign = 'center';
        } else if (info.aspect > 1.3) {
            // wide -> can use longer title/left align
            if (main) main.placeholder = 'Tiêu đề dài hơn được khuyến khích';
            if (sub) sub.placeholder = 'Thông tin chi tiết (địa điểm, thời gian)';
            viewCard.style.textAlign = 'left';
        } else {
            // square-ish
            if (main) main.placeholder = 'Tên chủ tiệc / Tiêu đề';
            if (sub) sub.placeholder = 'Trân trọng kính mời...';
            viewCard.style.textAlign = 'center';
        }
        // Place content centered inside the card (disable auto-placement)
        try {
            viewCard.style.display = 'flex';
            viewCard.style.flexDirection = 'column';
            viewCard.style.justifyContent = 'center';
            viewCard.style.alignItems = 'center';
            viewCard.style.textAlign = 'center';

            // reset placeholders for centered layout
            if (main) main.placeholder = 'Tên chủ tiệc / Tiêu đề';
            if (sub) sub.placeholder = 'Trân trọng kính mời...';
        } catch (e) {
            // ignore
        }
    });
}

// Locate the least-busy grid cell in the image by sampling edge energy.
function locateSafeZone(img, gridSize = 5) {
    const w = Math.min(300, img.width);
    const h = Math.min(300, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // compute simple gradient magnitude per pixel
    const gray = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = data[i], g = data[i+1], b = data[i+2];
            gray[y*w + x] = (0.299*r + 0.587*g + 0.114*b);
        }
    }

    const cellW = Math.floor(w / gridSize);
    const cellH = Math.floor(h / gridSize);
    let best = {row: Math.floor(gridSize/2), col: Math.floor(gridSize/2), energy: Infinity};

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            let ex = 0;
            const sx = col * cellW;
            const sy = row * cellH;
            const exW = Math.min(cellW, w - sx);
            const exH = Math.min(cellH, h - sy);
            for (let yy = sy; yy < sy + exH; yy+=2) {
                for (let xx = sx; xx < sx + exW; xx+=2) {
                    const idx = yy*w + xx;
                    const g1 = gray[idx];
                    const g2 = gray[Math.min(h-1, yy+1)*w + xx];
                    const g3 = gray[yy*w + Math.min(w-1, xx+1)];
                    ex += Math.abs(g1 - g2) + Math.abs(g1 - g3);
                }
            }
            if (ex < best.energy) best = {row, col, energy: ex};
        }
    }
    return {row: best.row, col: best.col};
}

inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        const val = el.value;
        if (id === 'eventType') document.getElementById('viewType').innerText = val;
        if (id === 'mainTitle') document.getElementById('viewTitle').innerText = val || 'Tiêu đề thiệp';
        if (id === 'subMessage') document.getElementById('viewMessage').innerText = val;
        if (id === 'eventDate') document.getElementById('viewDate').innerText = val;
        if (id === 'location') document.getElementById('viewLocation').innerText = val;
        if (id === 'themeSelect') {
            const card = document.getElementById('previewCard');
            if (card) {
                card.className = val;
            }
            adjustInputsForTheme(val);
            applyThemeImage(val);
        }
    });
});

// Initialize placeholders based on currently selected theme
window.addEventListener('load', () => {
    const themeEl = document.getElementById('themeSelect');
    if (themeEl) adjustInputsForTheme(themeEl.value || 'theme-elegant');
    if (themeEl) applyThemeImage(themeEl.value || 'theme-elegant');
});

// Nút Lưu
const btnSave = document.getElementById('btnSave');
if (btnSave) {
    btnSave.onclick = async () => {
        const user = await checkAuth();
        const data = {
            type: document.getElementById('eventType').value,
            title: document.getElementById('mainTitle').value,
            msg: document.getElementById('subMessage').value,
            date: document.getElementById('eventDate').value,
            loc: document.getElementById('location').value,
            theme: document.getElementById('themeSelect').value
        };
        if (!data.title) return alert("Vui lòng nhập tiêu đề!");
        Storage.save(user.id, data);
        window.location.href = 'dashboard.html';
    };
}

function base64UrlEncode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (_, p) => String.fromCharCode('0x' + p)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeInvitationData(item) {
    return base64UrlEncode(JSON.stringify(item));
}

function createShareLink(item) {
    const url = new URL('view.html', window.location.href);
    
    // Đóng gói tất cả thông tin vào 1 đối tượng
    const sharedObj = {
        title: item.title,
        type: item.type,
        msg: item.msg,
        date: item.date,
        loc: item.loc,
        theme: item.theme
    };

    // Chuyển đối tượng này thành chuỗi mã hóa và gắn vào link
    const encodedData = base64UrlEncode(JSON.stringify(sharedObj));
    url.searchParams.set('data', encodedData);
    
    return url.href;
}

// Cập nhật lại nút chia sẻ trong hàm renderDashboard
// Đảm bảo nút chia sẻ gọi hàm createShareLink chính xác

function shareCard(id) {
    checkAuth().then(user => {
        if (!user) return;
        const item = Storage.getAll(user.id).find(card => card.id === id);
        if (!item) return alert('Không tìm thấy thiệp để chia sẻ.');
        const shareUrl = createShareLink(item);
        window.prompt('Sao chép liên kết chia sẻ:', shareUrl);
    });
}

// Render Dashboard
async function renderDashboard() {
    const container = document.getElementById('invitationList');
    if (!container) return;

    const user = await checkAuth();
    if (!user) return;

    const list = Storage.getAll(user.id);
    if (list.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-sub)">Bạn chưa có thiệp nào. Hãy tạo mới!</p>`;
        return;
    }

    container.innerHTML = list.map(item => {
        const shareUrl = createShareLink(item);
        return `
        <div class="card">
            <div style="font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px">${item.type}</div>
            <h2>${item.title}</h2>
            <p>📅 Ngày: ${item.date || 'Chưa chọn'}</p>
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
                <button class="btn-primary" style="width: 100%" onclick="window.open('${shareUrl}')">Xem</button>
                <button class="btn-secondary" style="width: 100%" onclick="shareCard('${item.id}')">Chia sẻ</button>
                <button class="btn-danger" style="width: 100%" onclick="deleteCard('${item.id}')">Xóa</button>
            </div>
        </div>
    `;
    }).join('');
}

function deleteCard(id) {
    if (!confirm('Xóa thiệp này?')) return;
    checkAuth().then(user => {
        Storage.delete(user.id, id);
        renderDashboard();
    });
}

// Khởi chạy render
renderDashboard();