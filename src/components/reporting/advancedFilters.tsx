import React, { useState, useEffect } from "react";
import Select from "react-select";
import Picker from "react-datepicker";
import { DateRangePicker } from "../../elements/dateRangePicker";
import SelectDropdown from "../../elements/SelectDropdown";
import { StageService } from "../../services/stageService";
import { ClinicService } from "../../services/clinicService";
import { personService } from "../../services/personService";
import { UserService } from "../../services/UserService";
import { PipeLineTypeService } from "../../services/pipeLineTypeService";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

// Import exact operators from dealFilterAddEditDialog
const operators2 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "containsAny", label: "contains any of" },
  { value: "containsAll", label: "contains" },
  { value: "notContains", label: "does not contain" }
];

const operators3 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "notStartsWith", label: "does not start with" }
];

const operators4 = [
  { value: "equals", label: "is" },
  { value: "notEquals", label: "is not" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
  { value: "onOrBefore", label: "is exactly on or before" },
  { value: "before", label: "is before" },
  { value: "onOrAfter", label: "is exactly on or after" },
  { value: "after", label: "is after" }
];

const operators1 = [
  { value: "=", label: "= is" },
  { value: "!=", label: "≠ is not" },
  { value: "empty", label: "is empty" },
  { value: "not_empty", label: "is not empty" },
  { value: "<=", label: "≤ is less or equal to" },
  { value: "<", label: "< is less than" },
  { value: ">=", label: "≥ is more or equal to" },
  { value: ">", label: "> is more than" },
];

// Import exact field options from dealFilterAddEditDialog
const fieldOptions = [
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
  { value: "zandaInvoiceValue", label: "Zanda Invoice Value", isNumberType: true },
];

const getOperatorsByField = (fieldValue: string) => {
  const fieldOperatorMap: { [key: string]: any[] } = {
    activitiesToDo: operators1,
    acv: operators1,
    apiCallsMade: operators2,
    appointmentStatus: operators3,
    archiveTime: operators4,
    arr: operators1,
    assignedBdManager: operators3,
    attachedProduct: operators2,
    blandDealIdentifier: operators3,
    clientNumber: operators1,
    clinic: operators2,
    company: operators3,
    consentCheckbox: operators2,
    consultDate: operators4,
    contactPerson: operators2,
    cosmeticProcedure: operators3,
    creator: operators2,
    currencyOfValue: operators2,
    currentPracticeLocation: operators3,
    dateOfEnteringStage: operators4,
    dealClosedOn: operators4,
    dealCreated: operators4,
    dealStage: operators3,
    doneActivities: operators1,
    electiveBreastSurgery: operators2,
    electivaEntSurgery: operators2,
    electivaGastroenterology: operators2,
    electivaGeneralSurgery: operators2,
    electivaGynaecologyTreatments: operators2,
    electivaNote: operators2,
    electivaOrthopaedicTreatments: operators2,
    electivaTreatments: operators2,
    electivaUrologyTreatments: operators2,
    electivaVisionTreatments: operators2,
    electivaLocations: operators2,
    emailMessagesCount: operators1,
    expectedCloseDate: operators4,
    gmcNumber: operators3,
    label: operators2,
    lastActivityDate: operators4,
    lastEmailReceived: operators4,
    lastEmailSent: operators4,
    lastStageChange: operators4,
    location: operators2,
    lostReviewReason: operators2,
    lostReason: operators2,
    lostTime: operators4,
    marketingContent: operators2,
    marketingFBClid: operators2,
    marketingGClid: operators2,
    marketingMedium: operators2,
    marketingSource: operators2,
    marketingTerm: operators2,
    mrr: operators1,
    nextActivityDate: operators2,
    nextSteps: operators2,
    operationDate: operators4,
    probability: operators1,
    referTelephoneNumber: operators3,
    revenue: operators1,
    score: operators1,
    stage: operators2,
    status: operators2,
    submissionId: operators3,
    tcConsent: operators2,
    title: operators3,
    totalActivities: operators1,
    treatment: operators2,
    updateTime: operators4,
    value: operators1,
    wonTime: operators4,
    zandaInvoiceValue: operators1,
  };
  return fieldOperatorMap[fieldValue] || operators2;
};

type AdvancedFiltersProps = {
  selectedStartDate: any;
  setSelectedStartDate: any;
  selectedEndDate: any;
  setSelectedEndDate: any;
  selectedFrequency: any;
  setSelectedFrequency: any;
  onApplyFilters: (filters: any) => void;
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  selectedStartDate,
  setSelectedStartDate,
  selectedEndDate,
  setSelectedEndDate,
  selectedFrequency,
  setSelectedFrequency,
  onApplyFilters,
}) => {
  const [conditions, setConditions] = useState([
    { field: "", operator: "", value: "" },
  ]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pipelineTypes, setPipelineTypes] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  
  const frequencyList = ["Daily", "Weekly", "Monthly", "Yearly"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const clinicService = new ClinicService(null);
        const personSvc = new personService(null);
        const userService = new UserService(null);
        const pipelineTypeService = new PipeLineTypeService(null);
        
        const [clinicsRes, personsRes, usersRes, pipelineTypesRes] = await Promise.all([
          clinicService.getClinics(),
          personSvc.getPersons(),
          userService.getUsers(),
          pipelineTypeService.getPipelineTypes()
        ]);
        
        setClinics(clinicsRes || []);
        setPersons(personsRes || []);
        setUsers(usersRes || []);
        setPipelineTypes(pipelineTypesRes || []);
        
        // Load pipelines and stages from localStorage
        const pipelinesData = localStorage.getItem("allPipeLines");
        if (pipelinesData) {
          setPipelines(JSON.parse(pipelinesData));
        }
        
        const stagesData = localStorage.getItem("getAllPipeLinesAndStages");
        if (stagesData) {
          setStages(JSON.parse(stagesData));
        }
      } catch (error) {
        console.error("Error loading filter data:", error);
      }
    };
    loadData();
  }, []);

  const getFrequencyList = () => {
    return frequencyList.map((item: any) => ({ name: item, value: item })) ?? [];
  };

  const onDatePeriodSelection = (dates: Array<Date>) => {
    if (dates.length > 0) {
      setSelectedStartDate(dates[0]);
      setSelectedEndDate(dates[1]);
    }
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { field: "", operator: "", value: "" }]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const handleConditionChange = (index: number, key: string, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    if (key === "field") {
      updated[index].operator = "";
      updated[index].value = "";
    }
    setConditions(updated);
  };

  const handleApply = () => {
    onApplyFilters({
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      frequency: selectedFrequency,
      conditions: conditions.filter((c) => c.field && c.operator),
    });
  };

  const renderValueInput = (condition: any, index: number) => {
    const { field, operator } = condition;
    
    if (operator === "isEmpty" || operator === "isNotEmpty" || operator === "empty" || operator === "not_empty") {
      return null;
    }
    
    // Date fields with exact date option
    const dateFields = [
      "archiveTime", "consultDate", "dateOfEnteringStage", "dealClosedOn", "dealCreated",
      "expectedCloseDate", "lastActivityDate", "lastEmailReceived", "lastEmailSent",
      "lastStageChange", "nextActivityDate", "operationDate", "updateTime", "wonTime", "lostTime"
    ];
    
    if (dateFields.includes(field)) {
      const isExactDate = condition.value instanceof Date;
      
      return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
          <div style={{ flex: 1 }}>
            {!isExactDate ? (
              <select
                className="form-control form-control-sm"
                value={condition.value instanceof Date ? "" : (condition.value || "")}
                onChange={(e) => handleConditionChange(index, "value", e.target.value)}
                style={{ height: "32px" }}
              >
                <option value="">Select</option>
                <optgroup label="Relative Date Intervals">
                  <option value="lastQuarter">last quarter</option>
                  <option value="nextQuarter">next quarter</option>
                  <option value="thisQuarter">this quarter</option>
                  <option value="lastMonth">last month</option>
                  <option value="nextMonth">next month</option>
                  <option value="thisMonth">this month</option>
                  <option value="lastWeek">last week</option>
                  <option value="nextWeek">next week</option>
                  <option value="thisWeek">this week</option>
                  <option value="lastYear">last year</option>
                  <option value="nextYear">next year</option>
                  <option value="thisYear">this year</option>
                </optgroup>
                <optgroup label="Relative Dates">
                  <option value="sixMonthsAgo">6 months ago</option>
                  <option value="fiveMonthsAgo">5 months ago</option>
                  <option value="fourMonthsAgo">4 months ago</option>
                  <option value="threeMonthsAgo">3 months ago</option>
                  <option value="twoMonthsAgo">2 months ago</option>
                  <option value="oneMonthAgo">1 month ago</option>
                  <option value="yesterday">yesterday</option>
                  <option value="today">today</option>
                  <option value="tomorrow">tomorrow</option>
                  <option value="inOneWeek">in 1 week</option>
                  <option value="inOneMonth">in 1 month</option>
                </optgroup>
              </select>
            ) : (
              <Picker
                placeholderText="MM/DD/YYYY"
                showIcon
                dateFormat={"MM/d/yyyy h:mm aa"}
                selected={condition.value instanceof Date ? condition.value : null}
                className="form-control form-control-sm"
                onChange={(date: any) => handleConditionChange(index, "value", date)}
                wrapperClassName="w-100"
              />
            )}
          </div>
          <div className="form-check" style={{ marginBottom: 0, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`useExactDate-${index}`}
              checked={isExactDate}
              onChange={(e) => {
                if (e.target.checked) {
                  handleConditionChange(index, "value", new Date());
                } else {
                  handleConditionChange(index, "value", "");
                }
              }}
              style={{ margin: "0 4px 0 0", cursor: "pointer" }}
            />
            <label className="form-check-label" htmlFor={`useExactDate-${index}`} style={{ fontSize: "11px", cursor: "pointer", margin: 0 }}>
              Exact
            </label>
          </div>
        </div>
      );
    }
    
    switch (field) {
      case "clinic":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
          >
            <option value="">Select Clinic</option>
            {clinics.map((clinic: any) => (
              <option key={clinic.clinicID} value={clinic.clinicID}>
                {clinic.clinicName}
              </option>
            ))}
          </select>
        );
      case "contactPerson":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
          >
            <option value="">Select Person</option>
            {persons.map((person: any) => (
              <option key={person.personID} value={person.personID}>
                {person.personName}
              </option>
            ))}
          </select>
        );
      case "owner":
      case "creator":
        const activeUsers = users.filter((user: any) => user.isActive !== false);
        const inactiveUsers = users.filter((user: any) => user.isActive === false);
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            <optgroup label="Active users">
              {activeUsers.map((user: any) => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  👤 {user.userName || user.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Inactive users">
              {inactiveUsers.map((user: any) => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  👤 {user.userName || user.name}
                </option>
              ))}
              <option value="anyInactiveUser">👤 Any inactive user</option>
            </optgroup>
          </select>
        );
      case "consentCheckbox":
      case "tcConsent":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      case "pipeline":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
          >
            <option value="">Select Pipeline</option>
            {pipelines.map((pipeline: any) => (
              <option key={pipeline.pipelineID} value={pipeline.pipelineID}>
                {pipeline.pipelineName}
              </option>
            ))}
          </select>
        );
      case "pipelineType":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
          >
            <option value="">Select Type</option>
            {pipelineTypes.map((type: any) => (
              <option key={type.pipelineTypeID} value={type.pipelineTypeID}>
                {type.pipelineTypeName}
              </option>
            ))}
          </select>
        );
      case "stage":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {stages.map((item, idx) => (
              <React.Fragment key={idx}>
                <option disabled className="non-selectable-option" style={{ fontWeight: "bold", textAlign: "left" }}>
                  {item.pipeLine}
                </option>
                {item.stages?.map((stage: any) => (
                  <option className="pl-4" key={stage.stageID} value={stage.stageID}>
                    &nbsp; &nbsp; {stage.stageName}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        );
      case "status":
        return (
          <select
            className="form-control form-control-sm"
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="1">Open</option>
            <option value="2">Won</option>
            <option value="3">Lost</option>
            <option value="4">Closed</option>
            <option value="5">Deleted</option>
          </select>
        );
      default:
        const fieldOption = fieldOptions.find(f => f.value === field);
        return (
          <input
            type={fieldOption?.isNumberType ? "number" : "text"}
            className="form-control form-control-sm"
            placeholder={fieldOption?.isNumberType ? "Enter a number" : "Value"}
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
            style={{ height: "32px" }}
          />
        );
    }
  };

  return (
    <div
      style={{
        background: "#faf5eb",
        border: "1px solid #e4cb9a",
        padding: "20px",
        borderRadius: "4px",
        marginBottom: "20px",
      }}
    >
      {/* Date and Frequency Row */}
      <div className="row" style={{ alignItems: "center", marginBottom: "16px" }}>
        <div className="col-sm-5">
          <div className="row" style={{ alignItems: "center" }}>
            <div className="col-sm-4">
              <label
                style={{
                  color: "#3f3f3f",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0",
                }}
              >
                Time Period:
              </label>
            </div>
            <div className="col-sm-8">
              <DateRangePicker
                startDate={selectedStartDate}
                endDate={selectedEndDate}
                onDatePeriodSelection={onDatePeriodSelection}
              />
            </div>
          </div>
        </div>
        <div className="col-sm-5">
          <div className="row" style={{ alignItems: "center" }}>
            <div className="col-sm-4">
              <label
                style={{
                  color: "#3f3f3f",
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "0",
                }}
              >
                Frequency:
              </label>
            </div>
            <div className="col-sm-8">
              <SelectDropdown
                value={selectedFrequency}
                isValidationOptional={true}
                list={getFrequencyList()}
                onItemChange={setSelectedFrequency}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Conditions */}
      <div style={{ marginTop: "20px" }}>
        <h6 style={{ marginBottom: "12px", fontWeight: "600" }}>
          Advanced Filters:
        </h6>
        {conditions.map((condition, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "180px 140px 1fr auto",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "center",
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #e0e0e0",
            }}
          >
            <select
              className="form-control form-control-sm"
              value={condition.field}
              onChange={(e) =>
                handleConditionChange(index, "field", e.target.value)
              }
              style={{ height: "32px" }}
            >
              <option value="">Select Field</option>
              {fieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="form-control form-control-sm"
              value={condition.operator}
              onChange={(e) =>
                handleConditionChange(index, "operator", e.target.value)
              }
              disabled={!condition.field}
              style={{ height: "32px" }}
            >
              <option value="">Operator</option>
              {getOperatorsByField(condition.field).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {renderValueInput(condition, index)}

            <button
              onClick={() => handleRemoveCondition(index)}
              disabled={conditions.length === 1}
              style={{
                background: "none",
                border: "none",
                cursor: conditions.length === 1 ? "not-allowed" : "pointer",
                padding: "4px",
                color: conditions.length === 1 ? "#ccc" : "#dc3545",
                opacity: conditions.length === 1 ? 0.5 : 1,
              }}
              title={
                conditions.length === 1
                  ? "At least one condition is required"
                  : "Remove condition"
              }
            >
              <RemoveCircleIcon style={{ fontSize: "20px" }} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleAddCondition}
          >
            + Add Condition
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
