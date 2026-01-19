export interface HistoryItem {
    id: string;
    date: string;
    type: string;
    source: string;
    score: number;
    status: "Malicious" | "Safe" | "Misleading" | "Unknown";
}

export const saveToHistory = (item: HistoryItem) => {
    try {
        const stored = localStorage.getItem("truvail_analysis_history");
        const history: HistoryItem[] = stored ? JSON.parse(stored) : [];
        const updated = [item, ...history].slice(0, 50); // Keep last 50
        localStorage.setItem("truvail_analysis_history", JSON.stringify(updated));

        // Dispatch event for real-time updates if needed
        window.dispatchEvent(new Event("historyUpdated"));
    } catch (error) {
        console.error("Failed to save history:", error);
    }
};

export const getHistory = (): HistoryItem[] => {
    try {
        const stored = localStorage.getItem("truvail_analysis_history");
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};
