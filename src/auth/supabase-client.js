
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../api-config.js';

if (SUPABASE_URL === "YOUR_SUPABASE_URL_HERE") {
    console.warn("Supabase keys not configured in src/api-config.js");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/src/pages/dashboard.html' // Adjust redirect as needed
        }
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '/index.html';
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}
