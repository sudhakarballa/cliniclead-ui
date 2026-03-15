// Shared field/attribute options for Deal Filters and Reporting Dashboard

export const dealFieldOptions = [
  { value: "activitiesToDo", label: "Activities to do" },
  { value: "acv", label: "ACV", isNumberType: true },
  { value: "apiCallsMade", label: "API Calls Made", isNumberType: true },
  { value: "appointmentStatus", label: "Appointment Status" },
  { value: "archiveTime", label: "Archive time", isDateType: true },
  { value: "arr", label: "ARR", isNumberType: true },
  { value: "assignedBdManager", label: "Assigned BD Manager" },
  { value: "attachedProduct", label: "Attached product" },
  { value: "blandDealIdentifier", label: "Bland Deal Identifier" },
  { value: "clientNumber", label: "Client Number" },
  { value: "clinic", label: "Clinic" },
  { value: "company", label: "Company" },
  { value: "consentCheckbox", label: "Consent Checkbox" },
  { value: "consultDate", label: "Consult Date", isDateType: true },
  { value: "contactPerson", label: "Contact person" },
  { value: "cosmeticProcedure", label: "Cosmetic Procedure" },
  { value: "creator", label: "Creator" },
  { value: "currencyOfACV", label: "Currency of ACV" },
  { value: "currencyOfARR", label: "Currency of ARR" },
  { value: "currencyOfMRR", label: "Currency of MRR" },
  { value: "currencyOfRevenue", label: "Currency of Revenue" },
  { value: "currencyOfValue", label: "Currency of Value" },
  { value: "currencyOfZandaInvoiceValue", label: "Currency of Zanda Invoice Value" },
  { value: "currentPracticeLocation", label: "Current Practice Location" },
  { value: "dateOfEnteringStage", label: "Date of entering stage", isDateType: true },
  { value: "dealClosedOn", label: "Deal closed on", isDateType: true },
  { value: "dealCreated", label: "Deal created", isDateType: true },
  { value: "dealStage", label: "Deal Stage" },
  { value: "doneActivities", label: "Done activities", isNumberType: true },
  { value: "electiveBreastSurgery", label: "Elective Breast Surgery" },
  { value: "electivaEntSurgery", label: "Electiva ENT Surgery" },
  { value: "electivaGastroenterology", label: "Electiva Gastroenterology" },
  { value: "electivaGeneralSurgery", label: "Electiva General Surgery" },
  { value: "electivaGynaecologyTreatments", label: "Electiva Gynaecology Treatments" },
  { value: "electivaNote", label: "Electiva Note" },
  { value: "electivaOrthopaedicTreatments", label: "Electiva Orthopaedic Treatments" },
  { value: "electivaTreatments", label: "Electiva Treatments" },
  { value: "electivaUrologyTreatments", label: "Electiva Urology Treatments" },
  { value: "electivaVisionTreatments", label: "Electiva Vision Treatments" },
  { value: "electivaLocations", label: "Electiva Locations" },
  { value: "enquiry", label: "Enquiry" },
  { value: "emailMessagesCount", label: "Email messages count", isNumberType: true },
  { value: "expectedCloseDate", label: "Expected close date", isDateType: true },
  { value: "gmcNumber", label: "GMC Number" },
  { value: "identiteLocation", label: "Identite Location" },
  { value: "identiteProcedure", label: "Identite Procedure" },
  { value: "label", label: "Label" },
  { value: "lastActivityDate", label: "Last activity date", isDateType: true },
  { value: "lastEmailReceived", label: "Last email received", isDateType: true },
  { value: "lastEmailSent", label: "Last email sent" },
  { value: "lastStageChange", label: "Last stage change" },
  { value: "location", label: "Location (City)" },
  { value: "lostReviewReason", label: "Lost Review Reason" },
  { value: "lostReason", label: "Lost Reason" },
  { value: "lostTime", label: "Lost time", isDateType: true },
  { value: "marketingContent", label: "Marketing Content" },
  { value: "marketingFBClid", label: "Marketing_FBClid" },
  { value: "marketingGClid", label: "Marketing_GCLID" },
  { value: "marketingMedium", label: "Marketing Medium" },
  { value: "marketingSource", label: "Marketing Source" },
  { value: "marketingTerm", label: "Marketing Term" },
  { value: "marketingConsent", label: "Marketing Consent" },
  { value: "medicalForm", label: "Medical_Form" },
  { value: "mrr", label: "MRR", isNumberType: true },
  { value: "nextActivityDate", label: "Next activity date", isDateType: true },
  { value: "nextSteps", label: "Next Steps" },
  { value: "operationDate", label: "Operation Date", isDateType: true },
  { value: "organization", label: "Organization" },
  { value: "owner", label: "Owner" },
  { value: "pipeline", label: "Pipeline" },
  { value: "pipelineType", label: "Pipeline Type" },
  { value: "probability", label: "Probability", isNumberType: true },
  { value: "referTelephoneNumber", label: "Does The Refer Telephone Number exists" },
  { value: "revenue", label: "Revenue", isNumberType: true },
  { value: "score", label: "Score", isNumberType: true },
  { value: "source", label: "Source" },
  { value: "sourceChannel", label: "Source channel" },
  { value: "stage", label: "Stage" },
  { value: "status", label: "Status" },
  { value: "submissionId", label: "Submission Id" },
  { value: "tcConsent", label: "TC Consent" },
  { value: "title", label: "Title" },
  { value: "totalActivities", label: "Total activities", isNumberType: true },
  { value: "treatment", label: "Treatment" },
  { value: "updateTime", label: "Update time", isDateType: true },
  { value: "value", label: "Value", isNumberType: true },
  { value: "wonTime", label: "Won time", isDateType: true },
  { value: "zandaInvoiceValue", label: "Zanda Invoice Value", isNumberType: true }
];

export const personFieldOptions = [
  { value: "p1", label: "Name" },
  { value: "p2", label: "Email" },
  { value: "p3", label: "Phone" },
  { value: "p4", label: "Organization" },
  { value: "p5", label: "Owner" },
  { value: "p6", label: "Label" },
  { value: "p7", label: "Created", isDateType: true },
  { value: "p8", label: "Updated", isDateType: true }
];

export const activityFieldOptions = [
  { value: "a1", label: "Subject" },
  { value: "a2", label: "Type" },
  { value: "a3", label: "Due date", isDateType: true },
  { value: "a4", label: "Done" },
  { value: "a5", label: "Assigned to" },
  { value: "a6", label: "Deal" },
  { value: "a7", label: "Person" },
  { value: "a8", label: "Organization" }
];

// For ReportView - different field names for Contact/Activity
export const contactFieldOptions = [
  { value: "name", label: "Name", isNumberType: false },
  { value: "email", label: "Email", isNumberType: false },
  { value: "phone", label: "Phone", isNumberType: false },
  { value: "owner", label: "Owner", isNumberType: false },
  { value: "created", label: "Created Date", isDateType: true, isNumberType: false },
  { value: "updated", label: "Updated Date", isDateType: true, isNumberType: false }
];

export const reportActivityFieldOptions = [
  { value: "type", label: "Activity Type", isNumberType: false },
  { value: "subject", label: "Subject", isNumberType: false },
  { value: "dueDate", label: "Due Date", isDateType: true, isNumberType: false },
  { value: "done", label: "Done", isNumberType: false },
  { value: "owner", label: "Owner", isNumberType: false },
  { value: "created", label: "Created Date", isDateType: true, isNumberType: false }
];

// Shared operator options
export const operators1 = [
  { value: "=", label: "= is" },
  { value: "!=", label: "≠ is not" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" },
  { value: "<=", label: "≤ is less or equal to" },
  { value: "<", label: "< is less than" },
  { value: ">=", label: "≥ is more or equal to" },
  { value: ">", label: "> is more than" }
];

export const operators2 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "containsAny", label: "contains any of" },
  { value: "containsAll", label: "contains" },
  { value: "notContains", label: "does not contain" }
];

export const operators3 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "notStartsWith", label: "does not start with" }
];

export const operators4 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "onOrBefore", label: "is exactly on or before" },
  { value: "before", label: "is before" },
  { value: "onOrAfter", label: "is exactly on or after" },
  { value: "after", label: "is after" }
];

export const operators5 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" }
];

export const operators6 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "belongsToTeam", label: "belongs to team" },
  { value: "restrictedFromPipeline", label: "is restricted from pipeline" }
];

export const operators7 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isAnyOf", label: "is any of" },
  { value: "isNotAnyOf", label: "is not any of" }
];

export const operators8 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "isFirstInPipeline", label: "is first in pipeline" },
  { value: "hasBeen", label: "has been" }
];

export const operatorsForNumberType = [
  { label: "Greater than", value: ">" },
  { label: "Less than", value: "<" },
  { label: "Greater than or equal to", value: ">=" },
  { label: "Less than or equal to", value: "<=" }
];
