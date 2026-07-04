const SUPABASE_URL = 'https://qyiwdhfoscgpvqbtugbh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXdkaGZvc2NncHZxYnR1Z2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMzYwNDUsImV4cCI6MjA5ODYxMjA0NX0.IBhhn6l3ex7ptxT98WAHHKFvBh9SoOZ6kucfpVMaakE'; // Giữ nguyên key của bạn

const { createClient } = supabase;

// Adapter để chia sẻ session giữa các trình duyệt trên cùng thiết bị
class SharedStorageAdapter {
    async getItem(key) {
        try {
            const items = JSON.parse(localStorage.getItem('shared_sessions') || '{}');
            return items[key] || null;
        } catch (e) {
            return null;
        }
    }

    async setItem(key, value) {
        try {
            const items = JSON.parse(localStorage.getItem('shared_sessions') || '{}');
            items[key] = value;
            localStorage.setItem('shared_sessions', JSON.stringify(items));
        } catch (e) {}
    }

    async removeItem(key) {
        try {
            const items = JSON.parse(localStorage.getItem('shared_sessions') || '{}');
            delete items[key];
            localStorage.setItem('shared_sessions', JSON.stringify(items));
        } catch (e) {}
    }
}

// Đặt tên biến là supabase để thống nhất toàn app
window.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        storage: new SharedStorageAdapter(),
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});



