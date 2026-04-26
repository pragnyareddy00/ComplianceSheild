import { supabase } from './supabase';

export const fetchUserHistory = async (userId) => {
    if (!userId) return { data: null, error: 'No user ID provided' };

    const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
};

export const fetchUserDashboardMetrics = async (userId) => {
    if (!userId) return { data: null, error: 'No user ID provided' };

    const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId);

    if (error) return { data: null, error };

    // Calculate metrics
    const totalAnalyzed = data.length;

    const complianceIssuesFound = data.reduce((sum, analysis) => {
        return sum + (analysis.issues_found || 0);
    }, 0);

    // Determine overall risk level by counting occurrences
    const riskCounts = { 'Low': 0, 'Medium': 0, 'High': 0 };
    data.forEach((analysis) => {
        if (analysis.risk_level && riskCounts[analysis.risk_level] !== undefined) {
            riskCounts[analysis.risk_level]++;
        }
    });

    let overallRiskLevel = 'Low';
    if (totalAnalyzed > 0) {
        if (riskCounts['High'] > 0) {
            overallRiskLevel = 'High';
        } else if (riskCounts['Medium'] > 0) {
            overallRiskLevel = 'Medium';
        }
    } else {
        overallRiskLevel = 'N/A';
    }

    return {
        data: {
            totalAnalyzed,
            complianceIssuesFound,
            overallRiskLevel
        },
        error: null
    };
};

export const saveAnalysis = async (data) => {
    const { data: insertedData, error } = await supabase
        .from('analyses')
        .insert([data])
        .select()
        .single();
        
    if (error) {
        console.error("Supabase Save Error:", error);
    }
    return { data: insertedData, error };
};

export const updateAnalysis = async (id, updates) => {
    const { data, error } = await supabase
        .from('analyses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Supabase Update Error:", error);
    }
    return { data, error };
};

export const fetchAnalysisById = async (id) => {
    if (!id) return { data: null, error: 'No ID provided' };

    const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();
    
    return { data, error };
};
