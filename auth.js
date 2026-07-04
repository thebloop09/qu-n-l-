// auth.js - Utilities for cookie-based session
const SessionManager = {
    setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    },

    getCookie(name) {
        const nameEQ = name + '=';
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }
        return null;
    },

    removeCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },

    async saveSession(user) {
        if (!user) return;
        const sessionData = {
            id: user.id,
            email: user.email,
            timestamp: new Date().getTime()
        };
        this.setCookie('user_session', JSON.stringify(sessionData), 30);
        localStorage.setItem('last_auth_email', user.email);
    },

    getStoredSession() {
        const cookie = this.getCookie('user_session');
        if (cookie) {
            try {
                return JSON.parse(cookie);
            } catch (e) {}
        }
        return null;
    },

    clearSession() {
        this.removeCookie('user_session');
        localStorage.removeItem('last_auth_email');
    }
};

function getReturnUrl() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    return returnTo ? decodeURIComponent(returnTo) : 'dashboard.html';
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) return alert('Vui lòng nhập đầy đủ!');

    // Đăng ký tài khoản
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert('Lỗi đăng ký: ' + error.message);

    // Thử đăng nhập ngay để tạo session và khởi tạo dữ liệu mặc định
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
        // Nếu không thể đăng nhập tự động, yêu cầu người dùng đăng nhập thủ công
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        return;
    }

    const user = signInData.user || (data && data.user);
    if (user) {
        await SessionManager.saveSession(user);

        // Tạo mẫu thiệp mời mẫu cho người dùng mới
        try {
            const samples = [
                { type: 'LỄ CƯỚI', title: 'Mẫu Elegant', msg: 'Trân trọng kính mời quý khách tới dự lễ thành hôn của chúng tôi.', date: '', loc: '', theme: 'theme-elegant' },
                { type: 'SINH NHẬT', title: 'Mẫu Modern', msg: 'Chung vui bên nhau trong ngày sinh nhật.', date: '', loc: '', theme: 'theme-modern' },
                { type: 'TIỆC TỐI', title: 'Mẫu Floral', msg: 'Hân hạnh đón tiếp quý vị trong buổi tiệc.', date: '', loc: '', theme: 'theme-floral' },
                { type: 'LỄ CƯỚI', title: 'Mẫu Minimal', msg: 'Một thiết kế tối giản, tinh tế cho buổi lễ của bạn.', date: '', loc: '', theme: 'theme-minimal' },
                { type: 'KHAI TRƯƠNG', title: 'Mẫu Classic', msg: 'Kính mời quý khách đến dự buổi khai trương trọng thể.', date: '', loc: '', theme: 'theme-classic' },
                { type: 'SINH NHẬT', title: 'Mẫu Boho', msg: 'Một buổi tiệc ấm cúng với phong cách boho.', date: '', loc: '', theme: 'theme-boho' },
                { type: 'TIỆC TỐI', title: 'Mẫu Gold', msg: 'Thư mời sang trọng với hoạ tiết vàng kim.', date: '', loc: '', theme: 'theme-gold' },
                { type: 'SỰ KIỆN', title: 'Mẫu Vibrant', msg: 'Sôi động và bắt mắt — phù hợp cho sự kiện hiện đại.', date: '', loc: '', theme: 'theme-vibrant' },
                { type: 'HỘI NGHỊ', title: 'Mẫu Professional', msg: 'Thiết kế chuyên nghiệp cho hội nghị và sự kiện doanh nghiệp.', date: '', loc: '', theme: 'theme-professional' }
            ];

            samples.forEach(s => Storage.save(user.id, s));
        } catch (e) {
            console.warn('Không thể tạo mẫu mặc định:', e);
        }

        // Chuyển hướng tới dashboard
        window.location.href = getReturnUrl();
    } else {
        alert('Đăng ký thành công. Vui lòng kiểm tra email để xác nhận nếu cần và đăng nhập.');
    }
}

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Lỗi: ' + error.message);
    else {
        if (data.user) {
            await SessionManager.saveSession(data.user);
        }
        window.location.href = getReturnUrl();
    }
}

async function logout() {
    await supabase.auth.signOut();
    SessionManager.clearSession();
    window.location.href = 'index.html';
}

async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        // Thử lấy session từ cookie (cho các trình duyệt khác)
        const storedSession = SessionManager.getStoredSession();
        if (storedSession) {
            return storedSession;
        }
        return null;
    }
    // Lưu session vào cookie
    await SessionManager.saveSession(user);
    return user;
}

async function checkAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    const emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.innerText = user.email;
    return user;
}

document.getElementById('btnSignUp')?.addEventListener('click', handleSignUp);
document.getElementById('btnSignIn')?.addEventListener('click', handleSignIn);