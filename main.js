// Cập nhật Live Preview cho Editor
const inputs = ['eventType', 'mainTitle', 'subMessage', 'eventDate', 'location', 'themeSelect'];
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
        if (id === 'themeSelect') document.getElementById('previewCard').className = val;
    });
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