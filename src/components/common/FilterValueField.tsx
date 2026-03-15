import React from "react";
import Select, { components } from "react-select";
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
} from "../reporting/reportConstants";

export const CompactMultiValue = (props: any) => {
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

export const compactMultiSelectStyles = {
  control: (base: any) => ({ ...base, minHeight: "32px", height: "auto" }),
  valueContainer: (base: any) => ({ ...base, padding: "0 6px", flexWrap: "nowrap" as const }),
  input: (base: any) => ({ ...base, margin: "0px" }),
  indicatorsContainer: (base: any) => ({ ...base, height: "32px" }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};

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
  status: [
    { value: "1", label: "Open" },
    { value: "2", label: "Won" },
    { value: "3", label: "Lost" },
    { value: "4", label: "Closed" },
    { value: "5", label: "Deleted" },
  ],
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

export interface FilterValueFieldProps {
  fieldName: string;
  operator?: string;
  currentValue: string;
  onChange: (val: string) => void;
  isDisabled?: boolean;
  clinics?: any[];
  persons?: any[];
  users?: any[];
  pipelineTypes?: any[];
  pipelines?: any[];
  stages?: any[];
  fallbackOptions?: any[];
  isNumberField?: boolean;
  errorStyle?: React.CSSProperties;
}

const renderMultiSelect = (
  opts: any[],
  currentValue: string,
  onChange: (val: string) => void,
  placeholder: string,
  isDisabled?: boolean,
  isGrouped: boolean = false
) => {
  const selectedArray = currentValue ? currentValue.split(",").map((v: string) => v.trim()) : [];
  const flatOpts = isGrouped ? opts.flatMap((g: any) => g.options || []) : opts;
  return (
    <Select
      isMulti
      options={opts}
      value={flatOpts.filter((opt: any) => selectedArray.includes(String(opt.value)))}
      onChange={(selected: any) => {
        const values = selected ? selected.map((item: any) => item.value).join(",") : "";
        onChange(values);
      }}
      isDisabled={isDisabled}
      placeholder={placeholder}
      menuPortalTarget={document.body}
      components={{ MultiValue: CompactMultiValue }}
      styles={compactMultiSelectStyles}
    />
  );
};

/**
 * Shared value field renderer used by both dealFilterAddEditDialog and ReportView.
 * Returns the appropriate input (multi-select, text, number, or null for date/hidden fields).
 * Date fields return null — caller handles date rendering separately.
 */
const FilterValueField: React.FC<FilterValueFieldProps> = ({
  fieldName,
  operator,
  currentValue,
  onChange,
  isDisabled = false,
  clinics = [],
  persons = [],
  users = [],
  pipelineTypes = [],
  pipelines = [],
  stages = [],
  fallbackOptions = [],
  isNumberField = false,
  errorStyle,
}) => {
  // Date fields — caller handles these
  if (dateFields.includes(fieldName)) return null;

  // Creator special operators
  if (fieldName === "creator") {
    if (operator === "belongsToTeam") {
      return (
        <input
          className="form-control form-control-sm"
          type="text"
          disabled={isDisabled}
          value={currentValue ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter team name"
          style={{ height: "32px", ...errorStyle }}
        />
      );
    }
    if (operator === "restrictedFromPipeline") return null;
  }

  // Static options (electiva, currency, consent, status, treatment, etc.)
  if (staticOptionsMap[fieldName]) {
    return renderMultiSelect(staticOptionsMap[fieldName], currentValue, onChange, "Select...", isDisabled);
  }

  // Clinic — from API
  if (fieldName === "clinic") {
    const clinicOpts = clinics.map((c: any) => ({ value: String(c.clinicID || c.id), label: c.clinicName || c.name }));
    return renderMultiSelect(clinicOpts, currentValue, onChange, "Select clinic...", isDisabled);
  }

  // Contact person — from API
  if (fieldName === "contactPerson") {
    const personOpts = persons.map((p: any) => ({ value: String(p.personID || p.id), label: `👤 ${p.personName || p.name}` }));
    return renderMultiSelect(personOpts, currentValue, onChange, "Select persons...", isDisabled);
  }

  // Owner / Creator — grouped active/inactive from API
  if (fieldName === "owner" || fieldName === "creator") {
    const userOpts = users.map((u: any) => ({
      value: String(u.userId || u.id),
      label: `👤 ${u.userName || u.name}`,
      isActive: u.isActive !== false,
    }));
    const groupedUserOpts = [
      { label: "Active users", options: userOpts.filter((u: any) => u.isActive) },
      { label: "Inactive users", options: [...userOpts.filter((u: any) => !u.isActive), { value: "anyInactiveUser", label: "👤 Any inactive user", isActive: false }] },
    ];
    return renderMultiSelect(groupedUserOpts, currentValue, onChange, "Select users...", isDisabled, true);
  }

  // Pipeline — from API/localStorage
  if (fieldName === "pipeline" || fieldName === "8") {
    const pipelineOpts = pipelines.map((p: any) => ({
      value: String(p.pipelineID || p.pipelineStages?.[0]?.pipelineID || ""),
      label: p.pipelineName || "Unknown Pipeline",
    }));
    return renderMultiSelect(pipelineOpts, currentValue, onChange, "Select pipeline...", isDisabled);
  }

  // Pipeline Type — from API
  if (fieldName === "pipelineType") {
    const ptOpts = pipelineTypes.map((pt: any) => ({ value: String(pt.pipelineTypeID || pt.id), label: pt.pipelineTypeName || pt.name }));
    return renderMultiSelect(ptOpts, currentValue, onChange, "Select pipeline type...", isDisabled);
  }

  // Stage — grouped by pipeline
  if (fieldName === "stage" || fieldName === "stageid") {
    const stageGroupedOpts = stages.map((item: any) => ({
      label: item.pipelineName || item.pipeLine,
      options: (item.pipelineStages || item.stages || []).map((s: any) => ({ value: String(s.stageID), label: s.stageName })),
    }));
    return renderMultiSelect(stageGroupedOpts, currentValue, onChange, "Select stage...", isDisabled, true);
  }

  // Fallback options (from getValueOptions / deal data)
  if (fallbackOptions.length > 0) {
    return renderMultiSelect(fallbackOptions, currentValue, onChange, "Select...", isDisabled);
  }

  // Number or text input
  return (
    <input
      className="form-control form-control-sm"
      type={isNumberField ? "number" : "text"}
      disabled={isDisabled}
      value={currentValue ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={isNumberField ? "Enter a number" : "Enter value"}
      style={{ height: "32px", ...errorStyle }}
    />
  );
};

export default FilterValueField;
