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

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('Lỗi: ' + error.message);
    else alert('Đăng ký thành công! Hãy đăng nhập.');
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