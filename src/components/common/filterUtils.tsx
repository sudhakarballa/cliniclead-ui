// Shared filter utilities for DealFiltersAddEdit and ReportView
import {
  procedureOptions,
  entProcedureOptions,
  gastroenterologyOptions,
  generalSurgeryOptions,
  gynaecologyTreatmentOptions,
  orthopaedicTreatmentOptions,
  electivaTreatmentsOptions,
  treatmentOptions,
  apiCallOptions,
  currencyOptions
} from '../reporting/reportConstants';

export const getValueOptionsForField = (field: string, dataSource: any[] = []) => {
  if (field === 'statusid' || field === 'status') {
    return [
      { value: "1", label: "Open" },
      { value: "2", label: "Won" },
      { value: "3", label: "Lost" },
      { value: "4", label: "Closed" },
      { value: "5", label: "Deleted" },
    ];
  }
  
  if (field === 'electiveBreastSurgery') return procedureOptions;
  if (field === 'electivaEntSurgery') return entProcedureOptions;
  if (field === 'electivaGastroenterology') return gastroenterologyOptions;
  if (field === 'electivaGeneralSurgery') return generalSurgeryOptions;
  if (field === 'electivaGynaecologyTreatments') return gynaecologyTreatmentOptions;
  if (field === 'electivaOrthopaedicTreatments') return orthopaedicTreatmentOptions;
  if (field === 'electivaTreatments') return electivaTreatmentsOptions;
  if (field === 'treatment') return treatmentOptions;
  if (field === 'apiCallsMade') return apiCallOptions;
  
  if (field.startsWith('currencyOf')) return currencyOptions;
  
  if (field === 'consentCheckbox' || field === 'tcConsent') {
    return [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' }
    ];
  }
  
  if (field === 'creator' || field === 'owner') {
    const usersData = JSON.parse(localStorage.getItem('USERS_DATA') || '[]');
    const activeUsers = usersData.filter((user: any) => user.isActive !== false);
    const inactiveUsers = usersData.filter((user: any) => user.isActive === false);
    
    return [
      ...activeUsers.map((user: any) => ({
        value: String(user.userId || user.id),
        label: user.userName || user.name,
        isActive: true
      })),
      ...inactiveUsers.map((user: any) => ({
        value: String(user.userId || user.id),
        label: `${user.userName || user.name} (Inactive)`,
        isActive: false
      })),
      { value: 'anyInactiveUser', label: 'Any inactive user', isActive: false }
    ];
  }
  
  if (field === 'stageid' || field === 'stage') {
    const stageMap = new Map<string, string>();
    dataSource.forEach((deal: any) => {
      const stageId = deal.stageID || deal.stageid;
      const stageName = deal.stageName;
      if (stageId && stageName) {
        stageMap.set(String(stageId), stageName);
      }
    });
    return Array.from(stageMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ value: id, label: name }));
  }
  
  if (field === '8' || field === 'pipeline') {
    const pipelineMap = new Map<string, string>();
    dataSource.forEach((deal: any) => {
      const pipelineId = deal.pipelineID;
      const pipelineName = deal.pipelineName || deal.pipeline;
      if (pipelineId && pipelineName) {
        pipelineMap.set(String(pipelineId), pipelineName);
      }
    });
    return Array.from(pipelineMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ value: id, label: name }));
  }
  
  if (field === 'clinic') {
    const clinicMap = new Map<string, string>();
    dataSource.forEach((deal: any) => {
      const clinicId = deal.clinicID;
      const clinicName = deal.clinicName;
      if (clinicId && clinicName) {
        clinicMap.set(String(clinicId), clinicName);
      }
    });
    return Array.from(clinicMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ value: id, label: name }));
  }
  
  if (field === 'contactPerson') {
    const personMap = new Map<string, string>();
    dataSource.forEach((deal: any) => {
      const personId = deal.personID;
      const personName = deal.personName;
      if (personId && personName) {
        personMap.set(String(personId), personName);
      }
    });
    return Array.from(personMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({ value: id, label: name }));
  }
  
  return [];
};
