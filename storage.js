const Storage = {
    save(userId, data) {
        const key = `invitations_${userId}`;
        const list = JSON.parse(localStorage.getItem(key)) || [];

        if (!data.id) {
            data.id = self.crypto.randomUUID();
            data.responses = data.responses || { yes: 0, no: 0 };
            data.responders = data.responders || {};
            list.push(data);
        } else {
            const index = list.findIndex(item => item.id === data.id);
            if (index >= 0) {
                const current = list[index];
                data.responses = data.responses || current.responses || { yes: 0, no: 0 };
                data.responders = data.responders || current.responders || {};
                list[index] = data;
            } else {
                data.responses = data.responses || { yes: 0, no: 0 };
                data.responders = data.responders || {};
                list.push(data);
            }
        }

        localStorage.setItem(key, JSON.stringify(list));
        return data;
    },

    getAll(userId) {
        const raw = localStorage.getItem(`invitations_${userId}`) || '[]';
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    },

    getById(id) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('invitations_')) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            let list;
            try {
                list = JSON.parse(raw);
            } catch (e) {
                continue;
            }
            const found = list.find(item => item.id === id);
            if (found) return found;
        }
        return null;
    },

    updateRsvp(id, answer, userId) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('invitations_')) continue;
            const list = JSON.parse(localStorage.getItem(key)) || [];
            const index = list.findIndex(item => item.id === id);
            if (index < 0) continue;

            const item = list[index];
            const responses = item.responses || { yes: 0, no: 0 };
            const responders = item.responders || {};
            const prevAnswer = responders[userId];

            if (prevAnswer && prevAnswer !== answer) {
                responses[prevAnswer === 'yes' ? 'yes' : 'no'] = Math.max(0, (responses[prevAnswer === 'yes' ? 'yes' : 'no'] || 0) - 1);
            }

            if (!prevAnswer || prevAnswer !== answer) {
                responses[answer === 'yes' ? 'yes' : 'no'] = (responses[answer === 'yes' ? 'yes' : 'no'] || 0) + 1;
            }

            responders[userId] = answer;
            item.responses = responses;
            item.responders = responders;
            list[index] = item;
            localStorage.setItem(key, JSON.stringify(list));
            return item;
        }

        return null;
    },

    delete(userId, id) {
        const key = `invitations_${userId}`;
        const list = JSON.parse(localStorage.getItem(key)) || [];
        const updated = list.filter(item => item.id !== id);
        localStorage.setItem(key, JSON.stringify(updated));
    }
};