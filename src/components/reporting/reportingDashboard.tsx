import { faChartBar, faChevronDown, faChevronRight, faFolder, faSearch, faTachometerAlt, faTrash, faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";
import { Form, Button, Button as BootstrapButton } from "react-bootstrap";
import { toast } from 'react-toastify';
import { AddEditDialog } from '../../common/addEditDialog';
import { DeleteDialog } from '../../common/deleteDialog';
import { ReportDefinition } from "../../models/reportModels";
import AddReportModal from "./AddReportModal";
import CreateButton from "./CreateButton";
import DashboardView from "./DashboardView";
import './reportingStyles.css';
import ReportView from "./ReportView";
import { ReportService } from '../../services/reportService';
import { DashboardFolderService } from '../../services/dashboardFolderService';
import { ReportDashboardService } from '../../services/reportDashboardService';
import { StageService } from '../../services/stageService';
import Util from '../../others/util';

const ReportingDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("Deal Conversion");
  const supportedChartsList = ["Deal Conversion", "Sales Performance", "Treatment Analysis", "User Performance", "Lead Source", "Pipeline Health"];
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [selectedFrequencey, setSelectedFrequencey] = useState("");
  
  // New state for report creation and management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dashboardNameError, setDashboardNameError] = useState('');
  const [folderNameError, setFolderNameError] = useState('');
  const [createdReports, setCreatedReports] = useState<any[]>([]);
  const [createdDashboards, setCreatedDashboards] = useState<any[]>([]);
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [dashboardFolders, setDashboardFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeNavItem, setActiveNavItem] = useState("My Dashboard");
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [createType, setCreateType] = useState(""); // "Report" or "Dashboard"
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'report'>('home');
  const [currentReport, setCurrentReport] = useState<{entity: string, reportType: string, reportDefinition?: ReportDefinition} | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<any>(null);
  const [showFolderWarningModal, setShowFolderWarningModal] = useState(false);
  const [folderWithReports, setFolderWithReports] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [allDealsData, setAllDealsData] = useState<any[]>([]);
  
  const reportTypes = ["Performance", "Conversion", "Duration", "Progress", "Products"];

  // Load reports and folders from API
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      try {
        const reportService = new ReportService(null);
        const folderService = new DashboardFolderService(null);
        const dashboardService = new ReportDashboardService(null);
        const stageService = new StageService(null);
        
        setLoadingFolders(true);
        setLoadingDashboards(true);
        
        const [reports, folders, dashboards, dealsResponse] = await Promise.all([
          reportService.getReports(),
          folderService.getAllFolders(),
          dashboardService.getAllDashboards(),
          stageService.getAllDealsByPipelines(1, 10000)
        ]);
        
        setCreatedReports(reports || []);
        setDashboardFolders(folders || []);
        setCreatedDashboards(dashboards || []);
        setAllDealsData(dealsResponse?.dealsDtos?.deals || []);
        
        console.log('Loaded deals data:', dealsResponse?.dealsDtos?.deals?.length || 0, 'deals');
        
        // Auto-select first dashboard or report
        if (dashboards && dashboards.length > 0) {
          const firstDashboard = dashboards[0];
          const newExpanded = new Set(expandedFolders);
          newExpanded.add(firstDashboard.folderId.toString());
          setExpandedFolders(newExpanded);
          handleDashboardClick(firstDashboard);
        } else if (reports && reports.length > 0) {
          handleReportClick(reports[0]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setCreatedReports([]);
        setDashboardFolders([]);
        setAllDealsData([]);
      } finally {
        setLoadingFolders(false);
        setLoadingDashboards(false);
        setIsInitialLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Refresh reports when needed
  const refreshReports = async () => {
    try {
      const reportService = new ReportService(null);
      const reports = await reportService.getReports();
      setCreatedReports(reports || []);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  };

  const handleCreateSelect = (type: string) => {
    setCreateType(type);
    if (type === "report") {
      setShowAddReportModal(true);
    } else {
      // Use same dashboard creation dialog as ReportView
      setShowCreateModal(true);
      setReportName('');
      setSelectedFolder('');
      setDashboardNameError('');
    }
  };



  const handleReportSubmit = (entity: string, reportType: string) => {
    // Navigate to report view without saving yet
    setCurrentReport({ entity, reportType });
    setCurrentView('report');
  };

  const handleSaveReport = (reportData: any) => {
    // Refresh reports from API after save
    refreshReports();
    
    // Extract the report ID from the response (handle both direct and nested ID)
    const reportId = reportData.id || reportData.result?.id;
    
    // Keep the current report view active - don't reset it
    setActiveNavItem(reportData.name);
    setActiveReportId(reportId);
    
    // Update currentReport to reflect the saved state without resetting the view
    if (currentReport) {
      setCurrentReport({
        entity: reportData.entity || currentReport.entity,
        reportType: reportData.type || currentReport.reportType,
        reportDefinition: {
          id: reportId,
          name: reportData.name,
          chartType: reportData.chartType || currentReport.reportDefinition?.chartType || 'bar',
          frequency: reportData.frequency || currentReport.reportDefinition?.frequency || 'daily',
          isPreview: false,
          isActive: true,
          isPublic: true,
          createdDate: reportData.createdDate || new Date().toISOString(),
          createdBy: 0,
          modifiedBy: 0,
          modifiedDate: reportData.modifiedDate || new Date().toISOString(),
          reportConditions: reportData.reportConditions || currentReport.reportDefinition?.reportConditions || []
        }
      });
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('home');
    setCurrentReport(null);
  };

  const handleBackFromDashboard = () => {
    setCurrentView('home');
    setCurrentDashboard(null);
  };

  const handleDashboardClick = async (dashboard: any) => {
    try {
      // Fetch full dashboard details including reports
      const dashboardService = new ReportDashboardService(null);
      const fullDashboard = await dashboardService.getDashboardById(dashboard.id);
      
      if (fullDashboard) {
        setCurrentDashboard(fullDashboard);
        setCurrentView('dashboard');
        setActiveNavItem(dashboard.name);
        // Clear any selected report when selecting dashboard
        setActiveReportId(null);
      } else {
        toast.error('Failed to load dashboard details');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    }
  };

  const handleDashboardReportClick = (report: any) => {
    const reportDefinition: ReportDefinition = {
      id: report.id,
      name: report.name,
      chartType: report.chartType || 'bar',
      frequency: report.frequency || 'daily',
      isPreview: false,
      isActive: true,
      isPublic: true,
      createdDate: report.createdDate || new Date().toISOString(),
      createdBy: 0,
      modifiedBy: 0,
      modifiedDate: report.modifiedDate || new Date().toISOString(),
      reportConditions: report.reportConditions || []
    };
    
    setCurrentReport({ 
      entity: report.entity, 
      reportType: report.type,
      reportDefinition: reportDefinition
    });
    setCurrentView('report');
    setActiveNavItem(report.name);
    setActiveReportId(report.id);
    setCurrentDashboard(null);
  };

  const handleDeleteReport = async (reportId: number) => {
    // Refresh reports from API after delete
    const reportService = new ReportService(null);
    const updatedReports = await reportService.getReports();
    setCreatedReports(updatedReports || []);
    
    // After refresh, show first available report or go back to home
    if (updatedReports && updatedReports.length > 0) {
      // Show the first available report
      handleReportClick(updatedReports[0]);
    } else {
      // No reports left, go back to home view
      setCurrentView('home');
      setCurrentReport(null);
    }
  };

  const handleReportClick = (report: any) => {
    // Convert saved report to ReportDefinition format
    const reportDefinition: ReportDefinition = {
      id: report.id,
      name: report.name,
      chartType: report.chartType || 'bar',
      frequency: report.frequency || 'daily',
      isPreview: false,
      isActive: true,
      isPublic: true,
      createdDate: report.createdDate || new Date().toISOString(),
      createdBy: 0,
      modifiedBy: 0,
      modifiedDate: report.modifiedDate || new Date().toISOString(),
      reportConditions: report.reportConditions || []
    };
    
    setCurrentReport({ 
      entity: report.entity, 
      reportType: report.type,
      reportDefinition: reportDefinition
    });
    setCurrentView('report');
    setActiveNavItem(report.name);
    setActiveReportId(report.id);
    // Clear dashboard selection when selecting a report
    setCurrentDashboard(null);
  };

  const filteredReports = createdReports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {isInitialLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          flexDirection: 'column'
        }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3 text-primary fw-bold">Loading reporting dashboard...</div>
        </div>
      )}
      {/* Navigation Sidebar */}
      <div style={{ 
        width: sidebarCollapsed ? '60px' : '250px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRight: '1px solid var(--border-color)',
        padding: sidebarCollapsed ? '10px' : '20px',
        overflowX: 'visible',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          {!sidebarCollapsed && <h5 style={{ marginBottom: '0', color: 'var(--text-primary)' }}>Navigation</h5>}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ padding: '4px 8px' }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FontAwesomeIcon icon={faBars} />
          </Button>
        </div>
        
        {/* Create Button */}
        {!sidebarCollapsed && <CreateButton onSelect={handleCreateSelect} />}
        
        {/* Search Bar */}
        {!sidebarCollapsed && <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon 
              icon={faSearch} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }} 
            />
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px', fontSize: '14px' }}
              size="sm"
            />
          </div>
        </div>}
        
        {/* Scrollable Menu Container */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'visible',
          marginTop: '10px',
          paddingBottom: '20px'
        }}>
        {/* Dashboards Section */}
        <div style={{ marginBottom: '20px' }}>
          {sidebarCollapsed ? (
            <div 
              style={{ 
                textAlign: 'center', 
                marginBottom: '10px',
                position: 'relative'
              }}
              className="collapsed-menu-item"
            >
              <div 
                style={{ 
                  padding: '12px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: currentView === 'dashboard' ? 'var(--hover-bg)' : 'transparent'
                }}
                className="collapsed-menu-trigger"
              >
                <FontAwesomeIcon icon={faTachometerAlt} style={{ fontSize: '18px', color: 'var(--text-primary)' }} />
              </div>
              
              {/* Hover Dropdown */}
              <div 
                className="collapsed-menu-dropdown"
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '0',
                  backgroundColor: 'var(--modal-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  maxWidth: '300px',
                  zIndex: 9999,
                  display: 'none'
                }}
              >
                <div style={{ padding: '8px 0' }}>
                  <div style={{ padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Dashboards</div>
                  {createdDashboards.map(dashboard => (
                    <div 
                      key={dashboard.id}
                      style={{ 
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: activeNavItem === dashboard.name ? 'var(--hover-bg)' : 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onClick={() => handleDashboardClick(dashboard)}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = activeNavItem === dashboard.name ? 'var(--hover-bg)' : 'transparent'}
                    >
                      {dashboard.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '8px' }} />
            Dashboards {loadingDashboards && <span className="spinner-border spinner-border-sm ms-2" />}
          </div>
          )}
          
          
          {/* Folders with Dashboards */}
          {!sidebarCollapsed && dashboardFolders.map(folder => {
            const folderDashboards = createdDashboards.filter(d => d.folderId === folder.id);
            const isExpanded = expandedFolders.has(folder.id.toString());
            
            return (
              <div key={folder.id} style={{ marginBottom: '5px' }}>
                {/* Folder Header */}
                <div 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: 'transparent',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}
                    onClick={() => {
                      const newExpanded = new Set(expandedFolders);
                      if (isExpanded) {
                        newExpanded.delete(folder.id.toString());
                      } else {
                        newExpanded.add(folder.id.toString());
                      }
                      setExpandedFolders(newExpanded);
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={isExpanded ? faChevronDown : faChevronRight} 
                      style={{ marginRight: '8px', fontSize: '12px' }} 
                    />
                    {folder.name} ({folderDashboards.length})
                  </div>
                  <FontAwesomeIcon 
                    icon={faTrash} 
                    style={{ 
                      fontSize: '12px', 
                      color: '#dc3545', 
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (folderDashboards.length > 0) {
                        const dashboardsWithReports = folderDashboards.filter(d => d.reports && d.reports.length > 0);
                        if (dashboardsWithReports.length > 0) {
                          setFolderWithReports({ folder, dashboardsWithReports });
                          setShowFolderWarningModal(true);
                          return;
                        }
                      }
                      setFolderToDelete(folder);
                      setShowDeleteFolderModal(true);
                    }}
                    title="Delete folder"
                  />
                </div>
                
                {/* Dashboards in Folder */}
                {isExpanded && folderDashboards.map(dashboard => (
                  <div 
                    key={dashboard.id}
                    style={{ 
                      padding: '6px 16px 6px 40px', 
                      cursor: 'pointer',
                      backgroundColor: activeNavItem === dashboard.name ? 'var(--hover-bg)' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: '2px',
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}
                    onClick={() => handleDashboardClick(dashboard)}
                  >
                    <FontAwesomeIcon icon={faTachometerAlt} style={{ marginRight: '8px', fontSize: '11px' }} />
                    {dashboard.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Reports Section */}
        <div style={{ marginBottom: '20px' }}>
          {sidebarCollapsed ? (
            <div 
              style={{ 
                textAlign: 'center', 
                marginBottom: '10px',
                position: 'relative'
              }}
              className="collapsed-menu-item"
            >
              <div 
                style={{ 
                  padding: '12px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  backgroundColor: currentView === 'report' ? 'var(--hover-bg)' : 'transparent'
                }}
                className="collapsed-menu-trigger"
              >
                <FontAwesomeIcon icon={faChartBar} style={{ fontSize: '18px', color: 'var(--text-primary)' }} />
              </div>
              
              {/* Hover Dropdown */}
              <div 
                className="collapsed-menu-dropdown"
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: '0',
                  backgroundColor: 'var(--modal-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '200px',
                  maxWidth: '300px',
                  zIndex: 9999,
                  display: 'none'
                }}
              >
                <div style={{ padding: '8px 0' }}>
                  <div style={{ padding: '8px 16px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Reports</div>
                  {createdReports.map(report => (
                    <div 
                      key={report.id}
                      style={{ 
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        backgroundColor: activeReportId === report.id ? 'var(--hover-bg)' : 'transparent',
                        color: 'var(--text-primary)'
                      }}
                      onClick={() => handleReportClick(report)}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = activeReportId === report.id ? 'var(--hover-bg)' : 'transparent'}
                    >
                      {report.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px',
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            <FontAwesomeIcon icon={faChartBar} style={{ marginRight: '8px' }} />
            Reports
          </div>
          )}
          {!sidebarCollapsed && (
            createdReports.length === 0 ? (
              <div style={{ padding: '8px 16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                No saved reports
              </div>
            ) : (
              createdReports.map(report => (
                <div 
                  key={report.id}
                  style={{ 
                    padding: '8px 16px', 
                    cursor: 'pointer',
                    backgroundColor: activeReportId === report.id ? 'var(--hover-bg)' : 'transparent',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleReportClick(report)}
                >
                  <div style={{ fontWeight: 'bold' }}>{report.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {report.entity} {report.type}
                  </div>
                </div>
              ))
            )
          )}
        </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: currentView === 'report' ? '0' : '20px', overflowY: 'auto', height: '100vh' }}>
        {allDealsData.length === 0 && !isInitialLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <div>
              <FontAwesomeIcon icon={faChartBar} size="3x" className="mb-3" style={{ color: '#dc3545' }} />
              <h5 className="text-danger">No Deals Available</h5>
              <p>Reports require deal data to function properly. Please create some deals first to use the reporting features.</p>
            </div>
          </div>
        ) : currentView === 'report' && currentReport ? (
          <ReportView 
            key={currentReport.reportDefinition?.id || 'new'}
            entity={currentReport.entity}
            reportType={currentReport.reportType}
            reportDefinition={currentReport.reportDefinition}
            allDealsData={allDealsData}
            existingReports={createdReports}
            onBack={handleBackToDashboard}
            onSave={handleSaveReport}
            onDelete={handleDeleteReport}
            onDashboardUpdate={(updatedDashboards) => {
              setCreatedDashboards(updatedDashboards);
              if (currentDashboard) {
                const updatedCurrentDashboard = updatedDashboards.find(d => d.id === currentDashboard.id);
                if (updatedCurrentDashboard) {
                  setCurrentDashboard(updatedCurrentDashboard);
                }
              }
            }}
          />
        ) : currentView === 'dashboard' && currentDashboard ? (
          <DashboardView 
            dashboard={currentDashboard}
            onBack={handleBackFromDashboard}
            onReportClick={handleDashboardReportClick}
            onDashboardUpdate={(updatedDashboard) => {
              // Update the current dashboard state
              setCurrentDashboard(updatedDashboard);
              // Update the dashboards list
              const updatedDashboards = createdDashboards.map(d => 
                d.id === updatedDashboard.id ? updatedDashboard : d
              );
              setCreatedDashboards(updatedDashboards);
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <div>
              <FontAwesomeIcon icon={faChartBar} size="3x" className="mb-3" />
              <h5>Welcome to Reporting Dashboard</h5>
              <p>Create a new report or select an existing one from the sidebar to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Dashboard Dialog - Same as ReportView */}
      <AddEditDialog
        dialogIsOpen={showCreateModal}
        header="Create New Dashboard"
        dialogSize="lg"
        onSave={async () => {
          if (!reportName.trim()) {
            setDashboardNameError('Dashboard name is required');
            return;
          }
          
          if (!selectedFolder) {
            toast.warning('Please select a folder for the dashboard');
            return;
          }
          
          const isDuplicate = createdDashboards.some(dashboard => 
            dashboard.name.toLowerCase() === reportName.trim().toLowerCase()
          );
          
          if (isDuplicate) {
            setDashboardNameError('Dashboard name already exists');
            return;
          }
          
          const selectedFolderObj = dashboardFolders.find(f => f.id.toString() === selectedFolder);
          
          try {
            const dashboardService = new ReportDashboardService(null);
            const dashboardData = {
              name: reportName.trim(),
              folderId: parseInt(selectedFolder),
              reports: '',
              createdDate: new Date(),
              createdBy: Util.UserProfile()?.userId || 0,
              modifiedBy: Util.UserProfile()?.userId || 0,
              modifiedDate: new Date(),
              updatedBy: Util.UserProfile()?.userId || 0,
              updatedDate: new Date(),
              userId: Util.UserProfile()?.userId || 0,
              id: 0
            };
            
            const newDashboard = await dashboardService.createDashboard(dashboardData);
            
            if (newDashboard) {
              const updatedDashboards = [...createdDashboards, newDashboard];
              setCreatedDashboards(updatedDashboards);
              
              setShowCreateModal(false);
              setShowCreateFolder(false);
              setReportName('');
              setSelectedFolder('');
              setNewFolderName('');
              setDashboardNameError('');
              setFolderNameError('');
              
              toast.success(`Dashboard "${newDashboard.name}" created successfully in "${selectedFolderObj?.name}" folder!`);
            } else {
              toast.error('Failed to create dashboard');
            }
          } catch (error) {
            console.error('Error creating dashboard:', error);
            toast.error('Failed to create dashboard');
          }
        }}
        closeDialog={() => {
          setShowCreateModal(false);
          setShowCreateFolder(false);
          setReportName('');
          setSelectedFolder('');
          setNewFolderName('');
          setDashboardNameError('');
          setFolderNameError('');
        }}
        customSaveChangesButtonName="Create Dashboard"
      >
        <div className="mb-3">
          <Form.Label className="fw-bold">Dashboard Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter dashboard name"
            value={reportName}
            onChange={(e) => {
              setReportName(e.target.value);
              setDashboardNameError('');
            }}
            isInvalid={!!dashboardNameError}
          />
          {dashboardNameError && (
            <Form.Control.Feedback type="invalid">
              {dashboardNameError}
            </Form.Control.Feedback>
          )}
        </div>

        <div className="mb-3">
          <Form.Label className="fw-bold">Select Folder</Form.Label>
          <div className="d-flex gap-2">
            <Form.Select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="flex-grow-1"
            >
              <option value="">Choose a folder...</option>
              {dashboardFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </Form.Select>
            <BootstrapButton
              variant="outline-primary"
              onClick={() => {
                setShowCreateFolder(true);
                setNewFolderName('');
                setFolderNameError('');
              }}
              title="Create New Folder"
            >
              <FontAwesomeIcon icon={faFolder} className="me-1" />
              New Folder
            </BootstrapButton>
          </div>
        </div>

        {showCreateFolder && (
          <div className="mb-3 p-3 border rounded bg-light">
            <Form.Label className="fw-bold small">New Folder Name</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  setFolderNameError('');
                }}
                isInvalid={!!folderNameError}
                size="sm"
              />
              <BootstrapButton
                variant="success"
                size="sm"
                disabled={loadingFolders}
onClick={async () => {
                  if (!newFolderName.trim()) {
                    setFolderNameError('Folder name is required');
                    return;
                  }
                  
                  const isDuplicate = dashboardFolders.some(folder => 
                    folder.name.toLowerCase() === newFolderName.trim().toLowerCase()
                  );
                  
                  if (isDuplicate) {
                    setFolderNameError('Folder name already exists');
                    return;
                  }
                  
                  try {
                    setLoadingFolders(true);
                    const folderService = new DashboardFolderService(null);
                    const newFolder = await folderService.createFolder(newFolderName.trim());
                    
                    if (newFolder && newFolder.id) {
                      const updatedFolders = [...dashboardFolders, newFolder];
                      setDashboardFolders(updatedFolders);
                      setSelectedFolder(newFolder.id.toString());
                      setNewFolderName('');
                      setShowCreateFolder(false);
                      toast.success('Folder created successfully!');
                    } else {
                      toast.error('Failed to create folder');
                    }
                  } catch (error) {
                    console.error('Error creating folder:', error);
                    toast.error('Failed to create folder');
                  } finally {
                    setLoadingFolders(false);
                  }
                }}
              >
                {loadingFolders ? 'Creating...' : 'Create'}
              </BootstrapButton>
              <BootstrapButton
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setFolderNameError('');
                }}
              >
                Cancel
              </BootstrapButton>
            </div>
            {folderNameError && (
              <div className="text-danger small mt-1">{folderNameError}</div>
            )}
          </div>
        )}
      </AddEditDialog>

      {/* Add Report Modal */}
      <AddReportModal
        dialogIsOpen={showAddReportModal}
        closeDialog={() => setShowAddReportModal(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Delete Folder Modal */}
      {showDeleteFolderModal && folderToDelete && (
        <DeleteDialog
          itemType="Folder"
          itemName={folderToDelete.name}
          dialogIsOpen={showDeleteFolderModal}
          closeDialog={() => {
            setShowDeleteFolderModal(false);
            setFolderToDelete(null);
          }}
          onConfirm={async () => {
            try {
              const folderService = new DashboardFolderService(null);
              await folderService.deleteFolder(folderToDelete.id);
              setDashboardFolders(dashboardFolders.filter(f => f.id !== folderToDelete.id));
              toast.success('Folder deleted successfully!');
            } catch (error) {
              console.error('Error deleting folder:', error);
              toast.error('Failed to delete folder');
            }
            setShowDeleteFolderModal(false);
            setFolderToDelete(null);
          }}
          customDeleteMessage={
            <div>
              Are you sure you want to delete the folder <strong>{folderToDelete.name}</strong>?
              {(() => {
                const folderDashboards = createdDashboards.filter(d => d.folderId === folderToDelete.id);
                if (folderDashboards.length > 0) {
                  return (
                    <div className="mt-2 text-warning">
                      <small>
                        <strong>Warning:</strong> This will also delete {folderDashboards.length} dashboard(s) in this folder.
                      </small>
                    </div>
                  );
                }
                return null;
              })()
            }
            </div>
          }
          isPromptOnly={false}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          actionType="Delete"
        />
      )}

      {/* Folder Warning Modal */}
      {showFolderWarningModal && folderWithReports && (
        <DeleteDialog
          itemType="Folder"
          itemName={folderWithReports.folder.name}
          dialogIsOpen={showFolderWarningModal}
          closeDialog={() => {
            setShowFolderWarningModal(false);
            setFolderWithReports(null);
          }}
          onConfirm={() => {
            setShowFolderWarningModal(false);
            setFolderWithReports(null);
          }}
          customDeleteMessage={
            <div>
              <div className="text-danger mb-3">
                <strong>Cannot delete folder "{folderWithReports.folder.name}"</strong>
              </div>
              <div className="mb-2">
                This folder contains {folderWithReports.dashboardsWithReports.length} dashboard(s) with reports:
              </div>
              <ul className="mb-3">
                {folderWithReports.dashboardsWithReports.map((dashboard: any) => (
                  <li key={dashboard.id}>{dashboard.name}</li>
                ))}
              </ul>
              <div className="text-muted">
                Please remove reports from these dashboards first, then try deleting the folder again.
              </div>
            </div>
          }
          isPromptOnly={true}
          confirmLabel="OK"
          cancelLabel=""
          actionType="Warning"
        />
      )}
    </div>
  );
};

export default ReportingDashboard;
