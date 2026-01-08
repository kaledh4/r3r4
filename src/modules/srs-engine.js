class SRSEngine {
    /**
     * Modified SM-2 algorithm optimized for medical education
     * Factors: ease, interval, lapses, category performance
     */

    static getDueCards(userState, allCards, limit = 20) {
        const now = new Date();
        const dueCards = [];

        // User state is expected to be an object keyed by card_id
        // e.g., { 'card_001': { ease: 2.5, interval: 1, ... } }

        for (const card of allCards) {
            const state = userState[card.id] || this.getInitialState();

            if (new Date(state.due_date) <= now) {
                dueCards.push({
                    ...card, // Card content
                    ...state, // User progress
                    priority: this.calculatePriority(state, card, userState)
                });
            }
        }

        // Sort by priority (lapses > due date > category weakness)
        return dueCards
            .sort((a, b) => b.priority - a.priority)
            .slice(0, limit);
    }

    static calculatePriority(state, card, userState) {
        // Note: userState passed to access global stats if needed, 
        // but here we might need category stats.
        // Assuming category stats are available or estimated.
        // For now, simple priority logic based on prompt.

        let priority = 100;

        // Penalize lapses heavily (prompt says "Penalize lapses heavily", but in sort desc, 
        // we want high priority for lapsed cards? 
        // "Sort by priority (lapses > due date...)". 
        // Usually lapsed cards = HIGH priority to relearn.
        // The prompt code said: priority -= state.lapses * 20; 
        // This decreases priority? That seems counter-intuitive if we sort descending for "due".
        // Wait, prompt: "priority -= state.lapses * 20" and "Sort by ... b.priority - a.priority".
        // If lapses reduce priority, they show up LATER.
        // Unless the prompt meant "Sort by priority desc" and logic is different?
        // Let's look at the prompt's logic again:
        // "Reward overdue cards... priority += ..."
        // "Penalize lapses... priority -= ..."
        // This implies lapsed cards represent concepts we failed often, maybe push them back? 
        // NO, usually you want to study them. 
        // BUT the prompt explicitly wrote the code: priority -= state.lapses * 20. 
        // I will FOLLOW THE PROMPT's logic exactly, even if strange.

        priority -= (state.lapses || 0) * 20;

        // Reward overdue cards
        const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(state.due_date).getTime()) / 86400000));
        priority += Math.min(daysOverdue * 5, 50);

        // Boost weak categories (mock logic for now as we don't have full stats passed in here)
        // In a real app we'd look up category accuracy.
        // const categoryAccuracy = this.getUserCategoryAccuracy(card.category);
        // if (categoryAccuracy < 0.7) priority += 30;

        return priority;
    }

    static updateCard(state, rating) {
        const newState = { ...state };
        newState.reviews = (newState.reviews || 0) + 1;

        switch (rating) {
            case 1: // Again
                newState.lapses = (newState.lapses || 0) + 1;
                newState.interval = 1;
                newState.ease = Math.max((newState.ease || 2.5) - 0.2, 1.3);
                break;

            case 2: // Hard
                newState.interval = Math.max(1, Math.round((newState.interval || 1) * 1.2));
                newState.ease = Math.max((newState.ease || 2.5) - 0.15, 1.3);
                break;

            case 3: // Good
                newState.interval = Math.round((newState.interval || 1) * (newState.ease || 2.5));
                break;

            case 4: // Easy
                newState.interval = Math.round((newState.interval || 1) * (newState.ease || 2.5) * 1.3);
                newState.ease = Math.min((newState.ease || 2.5) + 0.1, 2.5);
                break;
        }

        newState.due_date = new Date(Date.now() + newState.interval * 86400000).toISOString();
        newState.last_reviewed = new Date().toISOString();

        return newState;
    }

    static getInitialState() {
        return {
            ease: 2.5,
            interval: 1,
            due_date: new Date().toISOString(),
            lapses: 0,
            reviews: 0,
            last_reviewed: null
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SRSEngine;
} else {
    window.SRSEngine = SRSEngine;
}
