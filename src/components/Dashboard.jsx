import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Industry data for display
const INDUSTRIES = {
  insurance: { label: "Versicherungen", icon: "🛡️", color: "#1A5276" },
  banking: { label: "Banken", icon: "🏦", color: "#2C3E50" },
  healthcare: { label: "Gesundheitswesen", icon: "🏥", color: "#1ABC9C" },
  automotive: { label: "Automotive", icon: "🚗", color: "#E74C3C" },
  manufacturing: { label: "Manufacturing", icon: "⚙️", color: "#E67E22" },
  retail: { label: "Handel / Retail", icon: "🛒", color: "#27AE60" },
  energy: { label: "Energiewirtschaft", icon: "⚡", color: "#F39C12" },
  publicSector: { label: "Öffentliche Verwaltung", icon: "🏛️", color: "#2980B9" },
  lifeSciences: { label: "Life Sciences", icon: "💊", color: "#8E44AD" },
  lottery: { label: "Lotterie / Gaming", icon: "🎰", color: "#D4AC0D" },
  transport: { label: "Verkehr & Logistik", icon: "🚆", color: "#3498DB" },
  media: { label: "Medien", icon: "🎬", color: "#9B59B6" },
  defense: { label: "Defense", icon: "🎖️", color: "#566573" },
  foodBeverage: { label: "Food & Beverage", icon: "🍽️", color: "#E74C3C" },
  construction: { label: "Bauen & Wohnen", icon: "🏗️", color: "#DC7633" },
  tradeFairsSports: { label: "Messen & Sports", icon: "🏟️", color: "#16A085" },
  telecom: { label: "Telecom", icon: "📡", color: "#2980B9" },
  professionalServices: { label: "Professional Services", icon: "💼", color: "#7D3C98" },
  chemical: { label: "Chemie", icon: "🧪", color: "#117A65" },
};

export default function Dashboard({ onSelectAssessment, onCreateNew }) {
  const { user, profile, signOut } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ customerName: '', industry: '' });
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my', 'assigned', 'all'
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssessments();
      fetchMyAssignments();
    }
  }, [user]);

  // Clear selection when changing tabs
  useEffect(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, [activeTab]);

  const fetchAssessments = async () => {
    try {
      // Try to fetch with updated_by profile join
      let { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          profiles:created_by (full_name, email)
        `)
        .order('updated_at', { ascending: false });

      // If updated_at doesn't exist, try ordering by created_at
      if (error && error.message?.includes('updated_at')) {
        console.log('Trying without updated_at order:', error.message);
        const result = await supabase
          .from('assessments')
          .select(`
            *,
            profiles:created_by (full_name, email)
          `)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Now try to fetch updated_by profiles separately if updated_by exists
      if (data && data.length > 0 && data[0].updated_by !== undefined) {
        // Get unique updated_by user IDs
        const updatedByIds = [...new Set(data.filter(a => a.updated_by).map(a => a.updated_by))];
        
        if (updatedByIds.length > 0) {
          const { data: updatedByProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', updatedByIds);
          
          // Create a map of profiles
          const profileMap = {};
          updatedByProfiles?.forEach(p => {
            profileMap[p.id] = p;
          });
          
          // Attach updated_by_profile to each assessment
          data = data.map(a => ({
            ...a,
            updated_by_profile: a.updated_by ? profileMap[a.updated_by] : null
          }));
        }
      }

      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('section_assignments')
        .select(`
          *,
          assessments (id, customer_name, industry, status)
        `)
        .eq('assigned_to', user.id);

      if (error) throw error;
      setMyAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert([
          {
            customer_name: newAssessment.customerName,
            industry: newAssessment.industry,
            created_by: user.id,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setShowCreateModal(false);
      setNewAssessment({ customerName: '', industry: '' });
      fetchAssessments();
      
      // Navigate to the new assessment
      if (onSelectAssessment) {
        onSelectAssessment(data);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Fehler beim Erstellen: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle selection of a single assessment
  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // Select all assessments in current view
  const selectAll = () => {
    const currentList = getCurrentList();
    const allIds = currentList.map(a => a.id);
    setSelectedIds(allIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Computed values
  const myAssessmentsFiltered = assessments.filter(a => a.created_by === user?.id);

  // Get current list based on active tab
  const getCurrentList = () => {
    if (activeTab === 'my') return myAssessmentsFiltered;
    if (activeTab === 'all') return assessments;
    return [];
  };

  // Delete selected assessments
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    setDeleting(true);
    try {
      // First, delete related answers (in case CASCADE is not set up)
      const { error: answersError } = await supabase
        .from('answers')
        .delete()
        .in('assessment_id', selectedIds);
      
      if (answersError) {
        console.warn('Error deleting answers (may not exist):', answersError.message);
      }

      // Delete related section_assignments
      const { error: assignmentsError } = await supabase
        .from('section_assignments')
        .delete()
        .in('assessment_id', selectedIds);
      
      if (assignmentsError) {
        console.warn('Error deleting assignments (may not exist):', assignmentsError.message);
      }

      // Now delete the assessments
      const { error, data } = await supabase
        .from('assessments')
        .delete()
        .in('id', selectedIds)
        .select();

      console.log('Delete result:', { error, data, selectedIds });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      // Refresh the list
      await fetchAssessments();
      await fetchMyAssignments();
      
      // Clear selection
      setSelectedIds([]);
      setSelectionMode(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting assessments:', error);
      alert('Fehler beim Löschen: ' + (error.message || JSON.stringify(error)));
    } finally {
      setDeleting(false);
    }
  };

  // Delete a single assessment
  const handleDeleteSingle = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Möchten Sie dieses Assessment wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAssessments();
      await fetchMyAssignments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: '#FEF9E7', color: '#B7950B', label: 'Entwurf' },
      in_progress: { bg: '#EBF5FB', color: '#2E86C1', label: 'In Bearbeitung' },
      completed: { bg: '#EAFAF1', color: '#27AE60', label: 'Abgeschlossen' },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{ 
        background: s.bg, 
        color: s.color, 
        padding: '4px 10px', 
        borderRadius: 6, 
        fontSize: 11, 
        fontWeight: 600 
      }}>
        {s.label}
      </span>
    );
  };

  const assignedAssessmentIds = [...new Set(myAssignments.map(a => a.assessments?.id))];

  // Export selected assessments to Word
  const handleExportWord = async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    
    try {
      // Get selected assessments
      const selectedAssessments = assessments.filter(a => selectedIds.includes(a.id));
      
      // Fetch answers for each assessment
      for (const assessment of selectedAssessments) {
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('assessment_id', assessment.id);
        
        const industry = INDUSTRIES[assessment.industry];
        const html = buildExportHTML(assessment, answers || [], industry, 'word');
        
        const blob = new Blob(["\ufeff", html], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `AI_Readiness_${assessment.customer_name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().slice(0,10)}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        if (selectedAssessments.length > 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Fehler beim Export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Export selected assessments to PDF
  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return;
    setExporting(true);
    
    try {
      const selectedAssessments = assessments.filter(a => selectedIds.includes(a.id));
      
      for (const assessment of selectedAssessments) {
        const { data: answers } = await supabase
          .from('answers')
          .select('*')
          .eq('assessment_id', assessment.id);
        
        const industry = INDUSTRIES[assessment.industry];
        const html = buildExportHTML(assessment, answers || [], industry, 'pdf');
        
        const printWin = window.open("", "_blank", "width=900,height=700");
        if (printWin) {
          printWin.document.write(html);
          printWin.document.close();
          setTimeout(() => {
            printWin.focus();
            printWin.print();
          }, 600);
        }
        
        // Delay between PDFs
        if (selectedAssessments.length > 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Fehler beim Export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Build export HTML
  const buildExportHTML = (assessment, answers, industry, format) => {
    const answersObj = {};
    answers.forEach(a => {
      answersObj[`${a.section_id}_${a.question_index}`] = a.answer;
    });
    
    const wordMeta = format === "word" ? `
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="ProgId" content="Word.Document">
      <meta name="Generator" content="adesso AI Readiness Check">` : "";

    return `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>AI Readiness Check — ${assessment.customer_name}</title>${wordMeta}
<style>
  @page { size: A4; margin: 20mm 18mm; }
  body { font-family: Calibri, Arial, sans-serif; color: #1B3A5C; font-size: 11pt; line-height: 1.5; margin: 0; padding: 20px; }
  h1 { font-size: 22pt; color: #1B3A5C; border-bottom: 3px solid #2E86C1; padding-bottom: 8px; margin: 0 0 16px 0; }
  h2 { font-size: 14pt; color: #2E86C1; margin: 20px 0 8px 0; }
  .meta { color: #7F8C8D; font-size: 10pt; margin-bottom: 24px; }
  .info-box { background: #F7F9FC; border: 2px solid #E8EDF2; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .footer { margin-top: 32px; text-align: center; color: #95A5A6; font-size: 9pt; border-top: 1px solid #E8EDF2; padding-top: 16px; }
</style></head><body>

<h1>${industry?.icon || "🤖"} AI Readiness Check</h1>
<div class="meta">
  Kunde: <strong>${assessment.customer_name}</strong> &nbsp;|&nbsp;
  Branche: <strong>${industry?.label || assessment.industry}</strong> &nbsp;|&nbsp;
  Datum: <strong>${new Date().toLocaleDateString("de-DE")}</strong> &nbsp;|&nbsp;
  Status: <strong>${assessment.status === 'completed' ? 'Abgeschlossen' : assessment.status === 'in_progress' ? 'In Bearbeitung' : 'Entwurf'}</strong>
</div>

<div class="info-box">
  <h2 style="margin-top:0;">📋 Assessment Übersicht</h2>
  <p><strong>Erstellt am:</strong> ${new Date(assessment.created_at).toLocaleDateString("de-DE")}</p>
  <p><strong>Branche:</strong> ${industry?.icon || ""} ${industry?.label || assessment.industry}</p>
  <p><strong>Anzahl Antworten:</strong> ${answers.length}</p>
</div>

<h2>📝 Erfasste Antworten</h2>
${answers.length > 0 ? answers.map(a => `
  <div style="margin-bottom: 12px; padding: 8px; background: #FAFBFC; border-radius: 4px;">
    <div style="font-size: 10pt; color: #7F8C8D;">Abschnitt: ${a.section_id} | Frage ${a.question_index + 1}</div>
    <div style="font-size: 11pt; color: #1B3A5C;">${a.answer || '— nicht beantwortet —'}</div>
  </div>
`).join('') : '<p style="color: #95A5A6; font-style: italic;">Noch keine Antworten erfasst.</p>'}

<div class="footer">
  AI Readiness Check — erstellt mit adesso AI Readiness Check Tool — ${new Date().toLocaleDateString("de-DE")} — VERTRAULICH
</div>
</body></html>`;
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    .dashboard { min-height: 100vh; background: #F7F9FC; }
    .dashboard-header { background: #fff; border-bottom: 1px solid #E8EDF2; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; }
    .dashboard-content { padding: 32px; max-width: 1200px; margin: 0 auto; }
    .dashboard-card { background: #fff; border-radius: 14px; border: 2px solid #E8EDF2; padding: 20px; margin-bottom: 16px; cursor: pointer; transition: all 0.2s; position: relative; }
    .dashboard-card:hover { border-color: #2E86C1; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .dashboard-card.selected { border-color: #E74C3C; background: #FEF9F9; }
    .dashboard-btn { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s; }
    .dashboard-btn:hover { transform: translateY(-2px); }
    .dashboard-btn-primary { background: linear-gradient(135deg, #1B3A5C, #2E86C1); color: #fff; border: none; }
    .dashboard-btn-secondary { background: #fff; color: #5D6D7E; border: 2px solid #E8EDF2; }
    .dashboard-btn-danger { background: linear-gradient(135deg, #C0392B, #E74C3C); color: #fff; border: none; }
    .dashboard-btn-danger:disabled { background: #BDC3C7; cursor: not-allowed; transform: none; }
    .dashboard-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
    .dashboard-tab { padding: 10px 20px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.2s; }
    .dashboard-tab-active { background: #1B3A5C; color: #fff; }
    .dashboard-tab-inactive { background: #fff; color: #7F8C8D; border: 1px solid #E8EDF2; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 500px; }
    .modal-input { width: 100%; padding: 12px 16px; border: 2px solid #E8EDF2; border-radius: 10px; font-size: 14px; font-family: 'Outfit', sans-serif; margin-bottom: 16px; }
    .modal-input:focus { outline: none; border-color: #2E86C1; }
    .modal-select { width: 100%; padding: 12px 16px; border: 2px solid #E8EDF2; border-radius: 10px; font-size: 14px; font-family: 'Outfit', sans-serif; margin-bottom: 16px; background: #fff; }
    .checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid #D5D8DC; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
    .checkbox.checked { background: #E74C3C; border-color: #E74C3C; }
    .checkbox:hover { border-color: #E74C3C; }
    .selection-bar { background: #1B3A5C; color: #fff; padding: 12px 20px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; animation: slideDown 0.2s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  return (
    <div className="dashboard">
      <style>{styles}</style>
      
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'linear-gradient(135deg, #1B3A5C, #2E86C1)', 
            padding: '8px 16px', 
            borderRadius: 30 
          }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>AI READINESS CHECK</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1B3A5C' }}>
              {profile?.full_name || user?.email}
            </div>
            <div style={{ fontSize: 12, color: '#7F8C8D' }}>
              {profile?.role === 'admin' ? 'Administrator' : 'Berater'}
            </div>
          </div>
          <button 
            className="dashboard-btn dashboard-btn-secondary"
            onClick={signOut}
          >
            Abmelden
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>
            Willkommen, {profile?.full_name?.split(' ')[0] || 'Berater'}! 👋
          </h1>
          <p style={{ fontSize: 15, color: '#5D6D7E' }}>
            Verwalten Sie Ihre AI Readiness Assessments und arbeiten Sie mit Ihrem Team zusammen.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8EDF2' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1B3A5C' }}>{myAssessmentsFiltered.length}</div>
            <div style={{ fontSize: 13, color: '#7F8C8D' }}>Meine Assessments</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8EDF2' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#2E86C1' }}>{myAssignments.length}</div>
            <div style={{ fontSize: 13, color: '#7F8C8D' }}>Zugewiesene Abschnitte</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E8EDF2' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#27AE60' }}>
              {assessments.filter(a => a.status === 'completed').length}
            </div>
            <div style={{ fontSize: 13, color: '#7F8C8D' }}>Abgeschlossen</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div className="dashboard-tabs">
            <button 
              className={`dashboard-tab ${activeTab === 'my' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
              onClick={() => setActiveTab('my')}
            >
              Meine Assessments ({myAssessmentsFiltered.length})
            </button>
            <button 
              className={`dashboard-tab ${activeTab === 'assigned' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
              onClick={() => setActiveTab('assigned')}
            >
              Mir zugewiesen ({myAssignments.length})
            </button>
            <button 
              className={`dashboard-tab ${activeTab === 'all' ? 'dashboard-tab-active' : 'dashboard-tab-inactive'}`}
              onClick={() => setActiveTab('all')}
            >
              Alle ({assessments.length})
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {(activeTab === 'my' || activeTab === 'all') && (
              <button 
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) setSelectedIds([]);
                }}
                style={{ 
                  background: selectionMode ? '#FEF9E7' : '#fff',
                  borderColor: selectionMode ? '#F39C12' : '#E8EDF2',
                  color: selectionMode ? '#B7950B' : '#5D6D7E'
                }}
              >
                {selectionMode ? '✕ Auswahl beenden' : '☑️ Auswählen'}
              </button>
            )}
            <button 
              className="dashboard-btn dashboard-btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Neues Assessment
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        {selectionMode && selectedIds.length > 0 && (
          <div className="selection-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 600 }}>{selectedIds.length} ausgewählt</span>
              <button 
                onClick={selectAll}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: 6, 
                  color: '#fff', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Alle auswählen
              </button>
              <button 
                onClick={deselectAll}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: 'none', 
                  padding: '6px 12px', 
                  borderRadius: 6, 
                  color: '#fff', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Auswahl aufheben
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Export Buttons */}
              <button 
                onClick={handleExportWord}
                disabled={exporting}
                style={{ 
                  background: 'linear-gradient(135deg, #2471A3, #2E86C1)', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  color: '#fff', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: exporting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: exporting ? 0.7 : 1
                }}
              >
                📝 Word
              </button>
              <button 
                onClick={handleExportPDF}
                disabled={exporting}
                style={{ 
                  background: 'linear-gradient(135deg, #C0392B, #E74C3C)', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  color: '#fff', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: exporting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: exporting ? 0.7 : 1
                }}
              >
                📄 PDF
              </button>
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.3)', margin: '0 4px' }} />
              {/* Delete Button */}
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{ 
                  background: 'rgba(231, 76, 60, 0.9)', 
                  border: 'none', 
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  color: '#fff', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                🗑️ Löschen
              </button>
            </div>
          </div>
        )}

        {/* Selection Mode Quick Actions */}
        {selectionMode && selectedIds.length === 0 && (
          <div style={{ 
            background: '#EBF5FB', 
            padding: '12px 20px', 
            borderRadius: 12, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: '#2E86C1', fontSize: 13, fontWeight: 500 }}>
              Klicken Sie auf die Checkboxen, um Assessments auszuwählen
            </span>
            <button 
              onClick={selectAll}
              style={{ 
                background: '#2E86C1', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: 8, 
                color: '#fff', 
                fontSize: 12, 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}
            >
              Alle auswählen ({activeTab === 'my' ? myAssessmentsFiltered.length : assessments.length})
            </button>
          </div>
        )}

        {/* Assessment List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#7F8C8D' }}>
            ⏳ Lade Assessments...
          </div>
        ) : (
          <div>
            {activeTab === 'my' && myAssessmentsFiltered.map(assessment => (
              <AssessmentCard 
                key={assessment.id} 
                assessment={assessment} 
                onClick={() => !selectionMode && onSelectAssessment(assessment)}
                selectionMode={selectionMode}
                isSelected={selectedIds.includes(assessment.id)}
                onToggleSelect={(e) => toggleSelection(assessment.id, e)}
                onDelete={(e) => handleDeleteSingle(assessment.id, e)}
              />
            ))}
            
            {activeTab === 'assigned' && myAssignments.map(assignment => (
              <div 
                key={assignment.id}
                className="dashboard-card"
                onClick={() => onSelectAssessment(assignment.assessments)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#7F8C8D', marginBottom: 4 }}>Zugewiesener Abschnitt</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', marginBottom: 4 }}>
                      {assignment.section_title || assignment.section_id}
                    </div>
                    <div style={{ fontSize: 13, color: '#5D6D7E' }}>
                      {assignment.assessments?.customer_name} • {INDUSTRIES[assignment.assessments?.industry]?.label}
                    </div>
                  </div>
                  {getStatusBadge(assignment.status)}
                </div>
              </div>
            ))}
            
            {activeTab === 'all' && assessments.map(assessment => (
              <AssessmentCard 
                key={assessment.id} 
                assessment={assessment} 
                onClick={() => !selectionMode && onSelectAssessment(assessment)}
                showOwner
                selectionMode={selectionMode}
                isSelected={selectedIds.includes(assessment.id)}
                onToggleSelect={(e) => toggleSelection(assessment.id, e)}
                onDelete={(e) => handleDeleteSingle(assessment.id, e)}
                canDelete={true}
              />
            ))}

            {((activeTab === 'my' && myAssessmentsFiltered.length === 0) ||
              (activeTab === 'assigned' && myAssignments.length === 0) ||
              (activeTab === 'all' && assessments.length === 0)) && (
              <div style={{ textAlign: 'center', padding: 60, color: '#7F8C8D' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Keine Assessments gefunden</div>
                <div style={{ fontSize: 14 }}>Erstellen Sie ein neues Assessment, um zu beginnen.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>
              Neues Assessment erstellen
            </h2>
            <p style={{ fontSize: 14, color: '#7F8C8D', marginBottom: 24 }}>
              Geben Sie die Kundeninformationen ein, um ein neues AI Readiness Assessment zu starten.
            </p>
            
            <form onSubmit={handleCreateAssessment}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B3A5C', marginBottom: 6 }}>
                Kundenname *
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="z.B. Allianz Deutschland AG"
                value={newAssessment.customerName}
                onChange={e => setNewAssessment(p => ({ ...p, customerName: e.target.value }))}
                required
              />
              
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B3A5C', marginBottom: 6 }}>
                Branche *
              </label>
              <select
                className="modal-select"
                value={newAssessment.industry}
                onChange={e => setNewAssessment(p => ({ ...p, industry: e.target.value }))}
                required
              >
                <option value="">Branche auswählen...</option>
                {Object.entries(INDUSTRIES).map(([key, ind]) => (
                  <option key={key} value={key}>{ind.icon} {ind.label}</option>
                ))}
              </select>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button 
                  type="button"
                  className="dashboard-btn dashboard-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Abbrechen
                </button>
                <button 
                  type="submit"
                  className="dashboard-btn dashboard-btn-primary"
                  disabled={creating}
                  style={{ flex: 1 }}
                >
                  {creating ? '⏳ Erstelle...' : 'Assessment erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: '#FDEDEC', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 32,
                marginBottom: 16
              }}>
                🗑️
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B3A5C', marginBottom: 8 }}>
                {selectedIds.length} Assessment{selectedIds.length > 1 ? 's' : ''} löschen?
              </h2>
              <p style={{ fontSize: 14, color: '#7F8C8D' }}>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Antworten und Zuweisungen werden ebenfalls gelöscht.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1 }}
              >
                Abbrechen
              </button>
              <button 
                className="dashboard-btn dashboard-btn-danger"
                onClick={handleDeleteSelected}
                disabled={deleting}
                style={{ flex: 1 }}
              >
                {deleting ? '⏳ Lösche...' : `🗑️ ${selectedIds.length} löschen`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Assessment Card Component
function AssessmentCard({ assessment, onClick, showOwner, selectionMode, isSelected, onToggleSelect, onDelete, canDelete = true }) {
  const industry = INDUSTRIES[assessment.industry];
  
  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: '#FEF9E7', color: '#B7950B', label: 'Entwurf' },
      in_progress: { bg: '#EBF5FB', color: '#2E86C1', label: 'In Bearbeitung' },
      completed: { bg: '#EAFAF1', color: '#27AE60', label: 'Abgeschlossen' },
    };
    const s = styles[status] || styles.draft;
    return (
      <span style={{ 
        background: s.bg, 
        color: s.color, 
        padding: '4px 10px', 
        borderRadius: 6, 
        fontSize: 11, 
        fontWeight: 600 
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <div 
      className={`dashboard-card ${isSelected ? 'selected' : ''}`} 
      onClick={onClick}
      style={{ cursor: selectionMode ? 'default' : 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Checkbox for selection mode */}
          {selectionMode && (
            <div 
              className={`checkbox ${isSelected ? 'checked' : ''}`}
              onClick={onToggleSelect}
            >
              {isSelected && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
            </div>
          )}
          
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 12, 
            background: industry?.color || '#2E86C1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            flexShrink: 0
          }}>
            {industry?.icon || '📋'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', marginBottom: 4 }}>
              {assessment.customer_name}
            </div>
            <div style={{ fontSize: 13, color: '#5D6D7E', marginBottom: 6 }}>
              {industry?.label || assessment.industry}
            </div>
            {/* Last Update Info */}
            <div style={{ 
              fontSize: 11, 
              color: '#7F8C8D', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: '#F7F9FC',
              padding: '4px 8px',
              borderRadius: 6,
              marginBottom: 4,
              flexWrap: 'wrap'
            }}>
              <span>🕐</span>
              <span>
                {(() => {
                  const dateStr = assessment.updated_at || assessment.created_at;
                  const date = new Date(dateStr);
                  const label = assessment.updated_at ? 'Aktualisiert' : 'Erstellt';
                  const formattedDate = date.toLocaleDateString('de-DE', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric'
                  });
                  const formattedTime = date.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return `${label}: ${formattedDate}, ${formattedTime}`;
                })()}
              </span>
              {assessment.updated_by_profile && (
                <span style={{ color: '#5D6D7E', fontWeight: 600 }}>
                  • von {assessment.updated_by_profile.full_name || assessment.updated_by_profile.email?.split('@')[0]}
                </span>
              )}
            </div>
            {showOwner && assessment.profiles && (
              <div style={{ fontSize: 11, color: '#95A5A6' }}>
                Erstellt von: {assessment.profiles.full_name || assessment.profiles.email}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusBadge(assessment.status)}
        </div>
      </div>
    </div>
  );
}