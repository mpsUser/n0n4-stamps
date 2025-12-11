'use server';

import { currentUser } from '@clerk/nextjs/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAIL = 'marcpedrero@gmail.com';

// --- TYPES ---

export interface ProtectedFile {
    name: string;
    url: string;
    timestamp: string;
}

export interface ActivityLog {
    id?: string;
    timestamp: string;
    action: string;
    details: string;
    user: string;
}

export interface UploadRecord {
    id: number;
    name: string;
    serverPath: string;
    level: number;
    style: string;
    lang: string;
    date: string;
    email: string;
    isImage: boolean;
}

export interface UserProfile {
    email: string;
    credits: number;
    discount: number; // 0-100
}

export interface AppConfig {
    protectionCost: number;
    verificationCost: number;
}

// --- INITIALIZATION ---
// ensureDataDir removed - not needed for Cloud Storage

// --- CORE: CONFIG ---

export async function getConfig(): Promise<AppConfig> {
    const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'pricing')
        .single();

    if (error || !data) {
        return { protectionCost: 1, verificationCost: 1 };
    }
    return data.value;
}

export async function updateConfig(newConfig: AppConfig) {
    const user = await currentUser();
    if (user?.primaryEmailAddress?.emailAddress !== ADMIN_EMAIL) throw new Error("Unauthorized");

    await supabase
        .from('app_config')
        .upsert({ key: 'pricing', value: newConfig });

    await logActivity('ADMIN_UPDATE_CONFIG', `Set prices: Protect ${newConfig.protectionCost}, Verify ${newConfig.verificationCost}`, ADMIN_EMAIL);
    return { success: true };
}

// --- CORE: USERS & CREDITS ---

/**
 * Gets or creates a user profile from the DB.
 */
async function getUserDB(email: string): Promise<UserProfile> {
    // Try to get user
    let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !profile) {
        // Create new user if not found
        const newProfile = { email, credits: 10, discount: 0 };
        const { data, error: insertError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

        if (insertError) {
            console.error("Error creating user:", insertError);
            return { email, credits: 0, discount: 0 }; // Fallback
        }
        profile = data;
    }

    return profile;
}

export async function getUserProfile() {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress) return null;
    const email = user.primaryEmailAddress.emailAddress;

    const profile = await getUserDB(email);
    return profile;
}

/**
 * Admin action to fetch all users
 */
export async function adminGetAllUsers() {
    const user = await currentUser();
    if (user?.primaryEmailAddress?.emailAddress !== ADMIN_EMAIL) return [];

    const { data: allUsers } = await supabase.from('users').select('*');
    return allUsers || [];
}

/**
 * Admin action to update a specific user
 */
export async function adminUpdateUser(targetEmail: string, updates: Partial<UserProfile>) {
    const admin = await currentUser();
    if (admin?.primaryEmailAddress?.emailAddress !== ADMIN_EMAIL) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', targetEmail);

    if (error) throw new Error("Update failed");

    await logActivity('ADMIN_UPDATE_USER', `Updated ${targetEmail}: Credits ${updates.credits}, Discount ${updates.discount}`, ADMIN_EMAIL);
    return { success: true };
}

/**
 * Charges the current user for an action. Throws error if insufficient.
 */
export async function chargeUser(action: 'PROTECT' | 'VERIFY') {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress) throw new Error("Please sign in");
    const email = user.primaryEmailAddress.emailAddress;

    const config = await getConfig();
    const cost = action === 'PROTECT' ? config.protectionCost : config.verificationCost;

    const profile = await getUserDB(email);

    if (profile.credits < cost) {
        throw new Error(`Insufficient credits. Need ${cost}, have ${profile.credits}`);
    }

    // Deduct
    const newBalance = profile.credits - cost;
    const { error } = await supabase
        .from('users')
        .update({ credits: newBalance })
        .eq('email', email);

    if (error) throw new Error("Transaction failed");

    return { success: true, remaining: newBalance, cost };
}

export async function simulateBuyCredits(amount: number, price: number) {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress) return { success: false, message: "User not authenticated" };
    const email = user.primaryEmailAddress.emailAddress;

    const profile = await getUserDB(email);
    const newBalance = profile.credits + amount;

    // 1. Update Credits
    const { error } = await supabase
        .from('users')
        .update({ credits: newBalance })
        .eq('email', email);

    if (error) return { success: false, message: "Purchase failed" };

    // 2. Record Transaction
    await supabase.from('transactions').insert({
        user_email: email,
        amount_credits: amount,
        amount_paid: price,
        currency: 'USD'
    });

    await logActivity('BUY_CREDITS', `User purchased ${amount} credits for $${price}. New balance: ${newBalance}`, email);
    return { success: true, newBalance };
}

// --- FILE OPERATIONS ---

export async function saveProtectedFile(formData: FormData) {
    // 1. Charge User First
    try {
        await chargeUser('PROTECT');
    } catch (e: any) {
        return { success: false, error: e.message || 'Insufficient credits' };
    }

    const file = formData.get('file') as File;
    const newName = formData.get('newName') as string;

    if (!file) throw new Error('No file uploaded');

    const buffer = await file.arrayBuffer(); // Get ArrayBuffer
    const filename = newName || file.name;

    // 2. Upload to Supabase Storage (Using Admin to bypass RLS)
    // IMPORTANT: Ensure SUPABASE_SERVICE_ROLE_KEY is in .env
    const { data, error } = await supabaseAdmin
        .storage
        .from('uploads')
        .upload(filename, buffer, {
            contentType: file.type,
            upsert: true
        });

    if (error) {
        console.error("Storage upload failed - DETAILS:", JSON.stringify(error, null, 2));
        return { success: false, error: `Storage upload failed: ${error.message}` };
    }

    // 3. Get Public URL (Normal client is fine for Public URL)
    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('uploads')
        .getPublicUrl(filename);

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'anonymous';

    await logActivity('PROTECT_FILE', `Saved file: ${filename} to Storage`, userEmail);

    return { success: true, path: publicUrl };
}

// Keep Mock for raw file listing
// Deprecated: Local file listing removed. 
export async function getProtectedFiles(): Promise<ProtectedFile[]> {
    return [];
}


export async function getUserUploads() {
    const user = await currentUser();
    if (!user) return [];

    const email = user.primaryEmailAddress?.emailAddress;
    const isAdmin = email === ADMIN_EMAIL;

    let query = supabase.from('uploads').select('*').order('created_at', { ascending: false });

    if (!isAdmin) {
        query = query.eq('user_email', email);
    }

    const { data } = await query;

    if (!data) return [];

    // Map DB snake_case to Frontend camelCase & infer isImage
    return data.map((item: any) => ({
        id: item.id,
        name: item.filename,
        serverPath: item.file_path,
        level: item.level,
        style: item.style,
        lang: item.lang,
        date: item.created_at,
        isImage: item.filename.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? true : false
    }));
}

export async function saveUploadRecord(record: Omit<UploadRecord, 'email'>) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || 'anonymous';

    // Map legacy UploadRecord fields to DB columns if needed, 
    // or assume we adjusted schema to match. Schema: filename, file_path, level, style, lang
    // DB columns: user_email, filename, file_path, level, style, lang

    const { error } = await supabase.from('uploads').insert({
        user_email: email,
        filename: record.name,
        file_path: record.serverPath,
        level: record.level,
        style: record.style,
        lang: record.lang,
        // ignoring id, let DB auto-gen UUID
    });

    return { success: !error };
}

// --- LOGGING SYSTEM ---

export async function logActivity(action: string, details: string, userEmail: string) {
    // Supabase Log
    await supabase.from('activity_logs').insert({
        action,
        details,
        user_email: userEmail
    });

    // Removed local file logging for Cloud Compatibility
}

export async function getLogs() {
    const user = await currentUser();
    if (!user) return [];

    const email = user.primaryEmailAddress?.emailAddress;
    const isAdmin = email === ADMIN_EMAIL;

    let query = supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });

    if (!isAdmin) {
        query = query.eq('user_email', email);
    }

    const { data } = await query;
    // Map DB columns to ActivityLog interface
    return (data || []).map(row => ({
        timestamp: row.timestamp,
        action: row.action,
        details: row.details,
        user: row.user_email
    })) as ActivityLog[];
}

export async function getFinancialStats() {
    const user = await currentUser();
    if (!user) return { revenue: 0 };

    // In a real app, only Admin should see total revenue. 
    // For now, we show the USER'S total spend if not admin, or ALL revenue if admin.
    const email = user.primaryEmailAddress?.emailAddress;
    const isAdmin = email === ADMIN_EMAIL;

    let query = supabase.from('transactions').select('amount_paid');

    if (!isAdmin) {
        query = query.eq('user_email', email);
    }

    const { data, error } = await query;
    if (error || !data) return { revenue: 0 };

    const totalRevenue = data.reduce((acc, curr) => acc + (parseFloat(curr.amount_paid) || 0), 0);
    return { revenue: totalRevenue };
}
