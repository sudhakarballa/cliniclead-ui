import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import Picker from "react-datepicker";
import { DateRangePicker } from "../../elements/dateRangePicker";
import SelectDropdown from "../../elements/SelectDropdown";
import { StageService } from "../../services/stageService";
import { ClinicService } from "../../services/clinicService";
import { personService } from "../../services/personService";
import { UserService } from "../../services/UserService";
import { PipeLineTypeService } from "../../services/pipeLineTypeService";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import {
  dealFieldOptions as fieldOptions,
  operators1,
  operators2,
  operators3,
  operators4,
} from "../common/fieldConstants";
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
  currencyOptions,
  urologyTreatmentOptions,
  visionTreatmentOptions,
  electivaLocationOptions,
  enquiryOptions,
  identiteLocationOptions,
  identiteProcedureOptions,
  labelOptions,
  lostReasonOptions,
  yesNoOptions,
} from "./reportConstants";

const CompactMultiValue = (props: any) => {
  const { index, getValue } = props;
  const selected = getValue();
  if (index === 0) {
    return (
      <components.MultiValue {...props}>
        {props.data.label}{selected.length > 1 ? `, +${selected.length - 1}` : ""}
      </components.MultiValue>
    );
  }
  return null;
};

const compactMultiSelectStyles = {
  control: (base: any) => ({ ...base, minHeight: "32px", height: "auto" }),
  valueContainer: (base: any) => ({ ...base, padding: "0 6px", flexWrap: "nowrap" as const }),
  input: (base: any) => ({ ...base, margin: "0px" }),
  indicatorsContainer: (base: any) => ({ ...base, height: "32px" }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

const dealStatusList = [
  { value: "1", label: "Open" },
  { value: "2", label: "Won" },
  { value: "3", label: "Lost" },
  { value: "4", label: "Closed" },
  { value: "5", label: "Deleted" },
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

// Map of field -> static options for multi-select
const staticOptionsMap: { [key: string]: any[] } = {
  electiveBreastSurgery: procedureOptions,
  electivaEntSurgery: entProcedureOptions,
  electivaGastroenterology: gastroenterologyOptions,
  electivaGeneralSurgery: generalSurgeryOptions,
  electivaGynaecologyTreatments: gynaecologyTreatmentOptions,
  electivaOrthopaedicTreatments: orthopaedicTreatmentOptions,
  electivaTreatments: electivaTreatmentsOptions,
  electivaLocations: electivaLocationOptions,
  electivaUrologyTreatments: urologyTreatmentOptions,
  electivaVisionTreatments: visionTreatmentOptions,
  enquiry: enquiryOptions,
  identiteLocation: identiteLocationOptions,
  identiteProcedure: identiteProcedureOptions,
  label: labelOptions,
  lostReason: lostReasonOptions,
  marketingConsent: yesNoOptions,
  medicalForm: yesNoOptions,
  consentCheckbox: yesNoOptions,
  tcConsent: yesNoOptions,
  apiCallsMade: apiCallOptions,
  treatment: treatmentOptions,
  status: dealStatusList,
  currencyOfACV: currencyOptions,
  currencyOfARR: currencyOptions,
  currencyOfMRR: currencyOptions,
  currencyOfRevenue: currencyOptions,
  currencyOfValue: currencyOptions,
  currencyOfZandaInvoiceValue: currencyOptions,
};

const dateFields = [
  "archiveTime", "consultDate", "dateOfEnteringStage", "dealClosedOn", "dealCreated",
  "expectedCloseDate", "lastActivityDate", "lastEmailReceived", "lastEmailSent",
  "lastStageChange", "nextActivityDate", "operationDate", "updateTime", "wonTime", "lostTime"
];

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
    if (key === "operator") {
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

  const renderMultiSelect = (opts: any[], condition: any, index: number, placeholder: string) => {
    const selectedArray = condition.value ? condition.value.split(',').map((v: string) => v.trim()) : [];
    return (
      <Select
        isMulti
        options={opts}
        value={opts.filter((opt: any) => selectedArray.includes(String(opt.value)))}
        onChange={(selected: any) => {
          const values = selected ? selected.map((item: any) => item.value).join(',') : '';
          handleConditionChange(index, "value", values);
        }}
        isDisabled={!condition.operator}
        placeholder={placeholder}
        menuPortalTarget={document.body}
        components={{ MultiValue: CompactMultiValue }}
        styles={compactMultiSelectStyles}
      />
    );
  };

  const renderValueInput = (condition: any, index: number) => {
    const { field, operator } = condition;
    
    if (operator === "isEmpty" || operator === "isNotEmpty" || operator === "empty" || operator === "not_empty") {
      return null;
    }

    const isDisabled = !operator;
    
    // Date fields
    if (dateFields.includes(field)) {
      const isExactDate = condition.value instanceof Date;
      return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
          <div style={{ flex: 1 }}>
            {!isExactDate ? (
              <select
                className="form-control form-control-sm"
                disabled={isDisabled}
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
              disabled={isDisabled}
              onChange={(e) => {
                handleConditionChange(index, "value", e.target.checked ? new Date() : "");
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

    // Static options multi-select (electiva, label, lostReason, consent, status, currency, etc.)
    if (staticOptionsMap[field]) {
      return renderMultiSelect(staticOptionsMap[field], condition, index, "Select...");
    }
    
    // Dynamic data multi-selects
    switch (field) {
      case "clinic": {
        const clinicOpts = clinics.map((c: any) => ({ value: String(c.clinicID || c.id), label: c.clinicName || c.name }));
        return renderMultiSelect(clinicOpts, condition, index, "Select clinic...");
      }
      case "contactPerson": {
        const personOpts = persons.map((p: any) => ({ value: String(p.personID || p.id), label: `👤 ${p.personName || p.name}` }));
        return renderMultiSelect(personOpts, condition, index, "Select persons...");
      }
      case "owner":
      case "creator": {
        const userOpts = users.map((u: any) => ({
          value: String(u.userId || u.id),
          label: `👤 ${u.userName || u.name}`,
          isActive: u.isActive !== false,
        }));
        const groupedUserOpts = [
          { label: "Active users", options: userOpts.filter((u: any) => u.isActive) },
          { label: "Inactive users", options: [...userOpts.filter((u: any) => !u.isActive), { value: "anyInactiveUser", label: "👤 Any inactive user", isActive: false }] },
        ];
        const selectedArray = condition.value ? condition.value.split(',').map((v: string) => v.trim()) : [];
        return (
          <Select
            isMulti
            options={groupedUserOpts}
            value={userOpts.filter((opt: any) => selectedArray.includes(opt.value))}
            onChange={(selected: any) => {
              const values = selected ? selected.map((item: any) => item.value).join(',') : '';
              handleConditionChange(index, "value", values);
            }}
            isDisabled={isDisabled}
            placeholder="Select users..."
            menuPortalTarget={document.body}
            components={{ MultiValue: CompactMultiValue }}
            styles={compactMultiSelectStyles}
          />
        );
      }
      case "pipeline": {
        const pipelineOpts = pipelines.map((p: any) => ({ value: String(p.pipelineID), label: p.pipelineName }));
        return renderMultiSelect(pipelineOpts, condition, index, "Select pipeline...");
      }
      case "pipelineType": {
        const ptOpts = pipelineTypes.map((pt: any) => ({ value: String(pt.pipelineTypeID || pt.id), label: pt.pipelineTypeName || pt.name }));
        return renderMultiSelect(ptOpts, condition, index, "Select pipeline type...");
      }
      case "stage": {
        const stageGroupedOpts = stages.map((item: any) => ({
          label: item.pipelineName || item.pipeLine,
          options: (item.pipelineStages || item.stages || []).map((s: any) => ({ value: String(s.stageID), label: s.stageName })),
        }));
        const allStageOpts = stages.flatMap((item: any) => (item.pipelineStages || item.stages || []).map((s: any) => ({ value: String(s.stageID), label: s.stageName })));
        const selectedArray = condition.value ? condition.value.split(',').map((v: string) => v.trim()) : [];
        return (
          <Select
            isMulti
            options={stageGroupedOpts}
            value={allStageOpts.filter((opt: any) => selectedArray.includes(opt.value))}
            onChange={(selected: any) => {
              const values = selected ? selected.map((item: any) => item.value).join(',') : '';
              handleConditionChange(index, "value", values);
            }}
            isDisabled={isDisabled}
            placeholder="Select stage..."
            menuPortalTarget={document.body}
            components={{ MultiValue: CompactMultiValue }}
            styles={compactMultiSelectStyles}
          />
        );
      }
      default: {
        const fieldOption = fieldOptions.find(f => f.value === field);
        return (
          <input
            type={fieldOption?.isNumberType ? "number" : "text"}
            className="form-control form-control-sm"
            placeholder={fieldOption?.isNumberType ? "Enter a number" : "Value"}
            disabled={isDisabled}
            value={condition.value}
            onChange={(e) => handleConditionChange(index, "value", e.target.value)}
            style={{ height: "32px" }}
          />
        );
      }
    }
  };

  const isConditionComplete = (cond: any): boolean => {
    if (!cond.field || !cond.operator) return false;
    const skipValue = ["isEmpty", "isNotEmpty", "empty", "not_empty"].includes(cond.operator);
    if (!skipValue && (!cond.value || (typeof cond.value === "string" && cond.value.trim() === ""))) return false;
    return true;
  };

  const allComplete = conditions.every(isConditionComplete);

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
            disabled={!allComplete}
            style={{ opacity: !allComplete ? 0.5 : 1, cursor: !allComplete ? "not-allowed" : "pointer" }}
            title={!allComplete ? "Please complete all existing conditions first" : ""}
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
