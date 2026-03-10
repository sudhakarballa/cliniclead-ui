import { yupResolver } from "@hookform/resolvers/yup";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import React, { useEffect, useState } from "react";
import Picker from "react-datepicker";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import Select from "react-select";
import { AddEditDialog } from "../../../../common/addEditDialog";
import { ConditionCSV, DealFilter, Rule } from "../../../../models/dealFilters";
import { DotdigitalCampagin } from "../../../../models/dotdigitalCampagin";
import { JustcallCampagin } from "../../../../models/justcallCampagin";
import LocalStorageUtil from "../../../../others/LocalStorageUtil";
import Constants from "../../../../others/constants";
import Util from "../../../../others/util";
import { DealFiltersService } from "../../../../services/dealFiltersService";
import { StageService } from "../../../../services/stageService";
import { ClinicService } from "../../../../services/clinicService";
import { personService } from "../../../../services/personService";
import { UserService } from "../../../../services/UserService";
import { PipeLineTypeService } from "../../../../services/pipeLineTypeService";
import { getValueOptionsForField } from "../../../common/filterUtils";
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
} from "../../../reporting/reportConstants";
import {
  dealFieldOptions as fieldOptions,
  personFieldOptions,
  activityFieldOptions,
  operators1,
  operators2,
  operators3,
  operators4,
  operators5,
  operators6,
  operators7,
  operators8,
  operatorsForNumberType
} from "../../../common/fieldConstants";

const getOperatorsByField = (fieldValue: string) => {
  const fieldOperatorMap: { [key: string]: any[] } = {
    activitiesToDo: operators1,
    acv: operators1,
    apiCallsMade: operators2,
    appointmentStatus: operators3,
    archiveTime: operators4,
    arr: operators1,
    assignedBdManager: operators3,
    attachedProduct: operators5,
    blandDealIdentifier: operators3,
    clientNumber: operators1,
    clinic: operators5,
    company: operators3,
    consentCheckbox: operators5,
    consultDate: operators4,
    contactPerson: operators5,
    cosmeticProcedure: operators3,
    creator: operators6,
    currencyOfValue: operators7,
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
    electivaLocations: operators5,
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
    stage: operators8,
    status: operators7,
    submissionId: operators3,
    tcConsent: operators5,
    title: operators3,
    totalActivities: operators1,
    treatment: operators2,
    updateTime: operators4,
    value: operators1,
    wonTime: operators4,
    zandaInvoiceValue: operators1,
  };
  return fieldOperatorMap[fieldValue] || operators5;
};

const fieldsWithOperators1 = ['activitiesToDo', 'acv', 'arr', 'clientNumber', 'doneActivities', 'emailMessagesCount', 'probability', 'revenue', 'score', 'totalActivities', 'value', 'zandaInvoiceValue'];

const operatorOptions = [
  { label: "Is empty", value: "IS NULL" },
  { label: "Is not empty", value: "IS NOT NULL" },
  { label: "Equals", value: "=" },
  { label: "Does not equal", value: "!=" },
];

const dateValues = [
  { category: "Relative Date Intervals", value: "lastQuarter", label: "last quarter" },
  { category: "Relative Date Intervals", value: "nextQuarter", label: "next quarter" },
  { category: "Relative Date Intervals", value: "thisQuarter", label: "this quarter" },
  { category: "Relative Date Intervals", value: "lastMonth", label: "last month" },
  { category: "Relative Date Intervals", value: "nextMonth", label: "next month" },
  { category: "Relative Date Intervals", value: "thisMonth", label: "this month" },
  { category: "Relative Date Intervals", value: "lastWeek", label: "last week" },
  { category: "Relative Date Intervals", value: "nextWeek", label: "next week" },
  { category: "Relative Date Intervals", value: "thisWeek", label: "this week" },
  { category: "Relative Date Intervals", value: "lastYear", label: "last year" },
  { category: "Relative Date Intervals", value: "nextYear", label: "next year" },
  { category: "Relative Date Intervals", value: "thisYear", label: "this year" },
  { category: "Relative Dates", value: "sixMonthsAgo", label: "6 months ago" },
  { category: "Relative Dates", value: "fiveMonthsAgo", label: "5 months ago" },
  { category: "Relative Dates", value: "fourMonthsAgo", label: "4 months ago" },
  { category: "Relative Dates", value: "threeMonthsAgo", label: "3 months ago" },
  { category: "Relative Dates", value: "twoMonthsAgo", label: "2 months ago" },
  { category: "Relative Dates", value: "oneMonthAgo", label: "1 month ago" },
  { category: "Relative Dates", value: "threeWeeksAgo", label: "3 weeks ago" },
  { category: "Relative Dates", value: "twoWeeksAgo", label: "2 weeks ago" },
  { category: "Relative Dates", value: "oneWeekAgo", label: "1 week ago" },
  { category: "Relative Dates", value: "fiveDaysAgo", label: "5 days ago" },
  { category: "Relative Dates", value: "fourDaysAgo", label: "4 days ago" },
  { category: "Relative Dates", value: "threeDaysAgo", label: "3 days ago" },
  { category: "Relative Dates", value: "yesterday", label: "yesterday" },
  { category: "Relative Dates", value: "beforeToday", label: "before today" },
  { category: "Relative Dates", value: "today", label: "today" },
  { category: "Relative Dates", value: "now", label: "now" },
  { category: "Relative Dates", value: "todayOrLater", label: "today or later" },
  { category: "Relative Dates", value: "beforeTomorrow", label: "before tomorrow" },
  { category: "Relative Dates", value: "tomorrow", label: "tomorrow" },
  { category: "Relative Dates", value: "tomorrowOrLater", label: "tomorrow or later" },
  { category: "Relative Dates", value: "inOneWeek", label: "in 1 week" },
  { category: "Relative Dates", value: "inTwoWeeks", label: "in 2 weeks" },
  { category: "Relative Dates", value: "inThreeWeeks", label: "in 3 weeks" },
  { category: "Relative Dates", value: "inOneMonth", label: "in 1 month" },
  { category: "Relative Dates", value: "inTwoMonths", label: "in 2 months" },
  { category: "Relative Dates", value: "inThreeMonths", label: "in 3 months" },
  { category: "Relative Dates", value: "inFourMonths", label: "in 4 months" },
  { category: "Relative Dates", value: "inFiveMonths", label: "in 5 months" },
  { category: "Relative Dates", value: "inSixMonths", label: "in 6 months" },
  { category: "Relative Dates", value: "twelveMonthsAgo", label: "12 months ago" },
  { category: "Deal Specific", value: "rottenTime", label: "Rotten time" },
  { category: "Exact Date", value: "exactDate", label: "Use exact date" }
];

const dealStatusList = [
  { value: "1", label: "Open" },
  { value: "2", label: "Won" },
  { value: "3", label: "Lost" },
  { value: "4", label: "Closed" },
  { value: "5", label: "Deleted" },
];

const filterTypeOptions = [
  { value: "deal", label: "Deal" },
  // { value: "organization", label: "Organization" },
  { value: "person", label: "Person" },
  // { value: "product", label: "Product" },
  { value: "activity", label: "Activity" },
];

const filterTypes = [
  { value: "justCall", label: "JustCall" },
  { value: "dotDigital", label: "DotDigital" },
  { value: "others", label: "Others" },
];

// Condition schema
const conditionSchema = Yup.object().shape({
  object: Yup.string().required("Field is required"),
  field: Yup.string().required("Attribute is required"),
  operator: Yup.string().required("Operator is required"),
  value: Yup.string().when(['operator', 'field'], {
    is: (operator: string, field: string) => {
      if (operator === 'isEmpty' || operator === 'isNotEmpty' || operator === 'empty' || operator === 'not_empty') {
        return false;
      }
      return true;
    },
    then: (schema) => schema.required("Value is required").test('is-number-for-activities', 'Enter a valid number', function(value) {
      const { field } = this.parent;
      if (fieldsWithOperators1.includes(field)) {
        return !isNaN(Number(value)) && value !== '';
      }
      return true;
    }),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Main form schema
const formSchema1 = Yup.object().shape({
  name: Yup.string().required("Filter name is required"),
  visibility: Yup.string().required("Visibility is required"),
  filterType: Yup.string().nullable(),
  filterAction: Yup.string().nullable(),

  // Validate 'ALL' conditions
  allConditions: Yup.array()
    .of(conditionSchema)
    .min(1, "At least one condition is required in ALL conditions"),

  // // Validate 'ANY' conditions
  // anyConditions: Yup.array()
  //   .of(conditionSchema)
});

const formSchema2 = Yup.object().shape({
  name: Yup.string().required("Filter name is required"),
  visibility: Yup.string().required("Visibility is required"),
  filterType: Yup.string().nullable(),
  filterAction: Yup.string().nullable(),

  // Validate 'ALL' conditions
  allConditions: Yup.array()
    .of(conditionSchema)
    .min(1, "At least one condition is required in ALL conditions"),

  // Validate 'ANY' conditions
  anyConditions: Yup.array()
    .of(conditionSchema)
    .min(1, "At least one condition is required in ALL conditions"),
});

// Define types for conditions and props
interface Condition {
  object: string;
  field: string;
  operator: string;
  value: any;
}

interface FilterConditionProps {
  condition: Condition;
  onChange: (key: keyof Condition, value: string | number) => void;
  onDelete: () => void;
  index: number; // pass the index to access specific errors
  conditionType: any; // either "allConditions" or "anyConditions" to handle different arrays
  conditionsLength: number;
}

// FilterCondition Component
const FilterCondition: React.FC<FilterConditionProps> = ({
  condition,
  onChange,
  onDelete,
  index, // pass the index to access specific errors
  conditionType, // either "allConditions" or "anyConditions" to handle different arrays
  conditionsLength,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();
  // Access specific errors for each condition
  const errorPath = `${conditionType}[${index as any}]`;
  const fieldError = (errors[conditionType] as any)?.[index]?.object;
  const attributeError = (errors[conditionType] as any)?.[index]?.field;
  const operatorError = (errors[conditionType] as any)?.[index]?.operator;
  const valueError = (errors[conditionType] as any)?.[index]?.value;

  const isDate = !isNaN(
    new Date(getValues(`${conditionType}.${index}.value`)).getTime(),
  );
  const [useExactDate, setUseExactDate] = useState(isDate ?? false);
  const [operatorsList, setOperatorsList] = useState<Array<any>>([]);
  interface Pipeline {
    pipelineID: string;
    pipelineName: string;
  }

  const [selectedObject, setSelectedObject] = useState(condition.object || "");
  const [selectedField, setSelectedField] = useState(condition.field || "");
  const [selectedOperator, setSelectedOperator] = useState(
    condition.operator || "",
  );
  const [filteredFieldOptions, setFilteredFieldOptions] = useState<Array<any>>(
    [],
  );
  const [deals, setDeals] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pipelineTypes, setPipelineTypes] = useState<any[]>([]);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const stageService = new StageService(null);
        const dealsResponse = await stageService.getAllDealsByPipelines(
          1,
          10000,
        );
        const allDeals = dealsResponse?.dealsDtos?.deals || [];
        console.log("Loaded deals from API:", allDeals.length);
        setDeals(allDeals);
      } catch (error) {
        console.error("Error loading deals:", error);
        setDeals([]);
      }
    };
    loadDeals();

    const loadClinics = async () => {
      try {
        const clinicService = new ClinicService(null);
        const clinicsResponse = await clinicService.getClinics();
        setClinics(clinicsResponse || []);
      } catch (error) {
        console.error("Error loading clinics:", error);
        setClinics([]);
      }
    };
    loadClinics();

    const loadPersons = async () => {
      try {
        const personSvc = new personService(null);
        const personsResponse = await personSvc.getPersons();
        setPersons(personsResponse || []);
      } catch (error) {
        console.error("Error loading persons:", error);
        setPersons([]);
      }
    };
    loadPersons();

    const loadUsers = async () => {
      try {
        const userService = new UserService(null);
        const usersResponse = await userService.getUsers();
        setUsers(usersResponse || []);
      } catch (error) {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    };
    loadUsers();

    const loadPipelineTypes = async () => {
      try {
        const pipelineTypeService = new PipeLineTypeService(null);
        const pipelineTypesResponse = await pipelineTypeService.getPipelineTypes();
        setPipelineTypes(pipelineTypesResponse || []);
      } catch (error) {
        console.error("Error loading pipeline types:", error);
        setPipelineTypes([]);
      }
    };
    loadPipelineTypes();
  }, []);

  useEffect(() => {
    setSelectedObject(condition.object || "");
    setSelectedField(condition.field || "");
    setSelectedOperator(condition.operator || "");
    updateFilteredFieldOptions(condition.object);
    setOperatorsList(getOperatorsByField(condition.field));
    
    // Set value after field is set
    if (condition.value !== undefined && condition.value !== null) {
      setValue(`${conditionType}.${index}.value`, condition.value);
    }
  }, [condition.object, condition.field, condition.operator, condition.value]);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    const loadPipelines = () => {
      const data = getPipelines();
      if (data.length > 0) {
        setPipelines(data);
        return true;
      }
      return false;
    };

    if (!loadPipelines()) {
      const interval = setInterval(() => {
        if (loadPipelines()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const loadStages = () => {
      const data = getAllPipeLinesAndStages();
      if (data.length > 0) {
        setStages(data);
        return true;
      }
      return false;
    };

    if (!loadStages()) {
      const interval = setInterval(() => {
        if (loadStages()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  const updateFilteredFieldOptions = (objectType: string) => {
    if (!objectType) {
      setFilteredFieldOptions([]);
      return;
    }

    if (objectType === "deal") {
      setFilteredFieldOptions(fieldOptions);
    } else if (objectType === "person") {
      setFilteredFieldOptions(personFieldOptions);
    } else if (objectType === "activity") {
      setFilteredFieldOptions(activityFieldOptions);
    } else {
      setFilteredFieldOptions([]);
    }
  };

  const getPipelines = (): Pipeline[] => {
    try {
      const data = localStorage.getItem("getAllPipeLinesAndStages");
      if (!data || data.trim() === "") {
        return [];
      }
      const res = JSON.parse(data);
      return res.map((pipeline: any) => ({
        pipelineID: pipeline.pipelineStages?.[0]?.pipelineID || "",
        pipelineName: pipeline.pipelineName || "Unknown Pipeline",
      }));
    } catch (error) {
      console.error("Error parsing getAllPipeLinesAndStages:", error);
      return [];
    }
  };

  const getAllPipeLinesAndStages = (): Array<{
    pipeLine: string;
    pipelineID: string | null;
    stages: Array<{ stageID: string; stageName: string }>;
  }> => {
    let list: Array<any> = [];
    try {
      const data = localStorage.getItem("getAllPipeLinesAndStages");
      if (!data || data.trim() === "") {
        return [];
      }
      const res = JSON.parse(data);

      res.forEach((pipeline: any) => {
        const obj = {
          pipeLine: pipeline.pipelineName || "Unknown Pipeline",
          pipelineID: pipeline.pipelineStages?.[0]?.pipelineID || null,
          stages: (pipeline.pipelineStages || []).map(
            (stage: { stageID: string; stageName: string }) => ({
              stageID: stage.stageID || "Unknown Stage ID",
              stageName: stage.stageName || "Unknown Stage Name",
            }),
          ),
        };
        list.push(obj);
      });

      return list;
    } catch (error) {
      console.error("Error parsing getAllPipeLinesAndStages:", error);
      return [];
    }
  };

  const getValueOptions = (field: string) => {
    if (!field) return [];
    const fieldOption = [
      ...fieldOptions,
      ...personFieldOptions,
      ...activityFieldOptions,
    ].find((f) => f.value === field);
    if (fieldOption?.isDateType) return dateValues;
    
    // Use shared utility for common fields
    const sharedOptions = getValueOptionsForField(field, deals);
    if (sharedOptions.length > 0) return sharedOptions;
    
    // Handle legacy field mappings
    const uniqueValues = new Set<string>();
    deals.forEach((deal: any) => {
      switch (field) {
        case "1":
          if (deal.title) uniqueValues.add(deal.title);
          break;
        case "2":
          if (deal.creatorName) uniqueValues.add(deal.creatorName);
          break;
        case "ContactPersonID":
          if (deal.ownerName) uniqueValues.add(deal.ownerName);
          break;
        case "4":
          if (deal.value) uniqueValues.add(deal.value);
          break;
        case "6":
          if (deal.probability) uniqueValues.add(deal.probability);
          break;
        case "7":
          if (deal.organizationName || deal.name)
            uniqueValues.add(deal.organizationName || deal.name);
          break;
        case "AssigntoId":
          if (deal.assignedToName) uniqueValues.add(deal.assignedToName);
          break;
        case "11":
          if (deal.label) uniqueValues.add(deal.label);
          break;
        case "23":
          if (deal.lostReason) uniqueValues.add(deal.lostReason);
          break;
        case "24":
          if (deal.visibleTo) uniqueValues.add(deal.visibleTo);
          break;
      }
    });
    return Array.from(uniqueValues)
      .sort()
      .map((value) => ({ value, label: value }));
  };

  const valueJSX = (key: string) => {
    const options = getValueOptions(key);
    const hasOptions = options.length > 0;

    switch (key) {
      case "currencyOfACV":
      case "currencyOfARR":
      case "currencyOfMRR":
      case "currencyOfRevenue":
      case "currencyOfValue":
      case "currencyOfZandaInvoiceValue":
        const selectedCurrencyValue = getValues(`${conditionType}.${index}.value`);
        const selectedCurrencyArray = selectedCurrencyValue ? selectedCurrencyValue.split(',').map((v: string) => v.trim()) : [];
        return (
          <Select
            isMulti
            options={currencyOptions}
            value={currencyOptions.filter(option => selectedCurrencyArray.includes(option.value))}
            onChange={(selected: any) => {
              const values = selected ? selected.map((item: any) => item.value).join(',') : '';
              setValue(`${conditionType}.${index}.value`, values, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            isDisabled={!getValues(`${conditionType}.${index}.field`)}
            placeholder="Select currencies..."
            menuPortalTarget={document.body}
            styles={{
              control: (base) => ({ ...base, minHeight: "32px", height: "auto" }),
              valueContainer: (base) => ({ ...base, padding: "0 6px" }),
              input: (base) => ({ ...base, margin: "0px" }),
              indicatorsContainer: (base) => ({ ...base, height: "32px" }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        );
      case "creator":
      case "owner":
        const activeUsers = users.filter((user: any) => user.isActive !== false);
        const inactiveUsers = users.filter((user: any) => user.isActive === false);
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
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
      case "contactPerson":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {persons.map((person: any) => (
              <option key={person.personID || person.id} value={person.personID || person.id}>
                👤 {person.personName || person.name}
              </option>
            ))}
          </select>
        );
      case "consentCheckbox":
      case "tcConsent":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      case "clinic":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {clinics.map((clinic: any) => (
              <option key={clinic.clinicID || clinic.id} value={clinic.clinicID || clinic.id}>
                {clinic.clinicName || clinic.name}
              </option>
            ))}
          </select>
        );
      case "apiCallsMade":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {apiCallOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electiveBreastSurgery":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {procedureOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaEntSurgery":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {entProcedureOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaGastroenterology":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {gastroenterologyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaGeneralSurgery":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {generalSurgeryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaGynaecologyTreatments":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {gynaecologyTreatmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaOrthopaedicTreatments":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {orthopaedicTreatmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "electivaTreatments":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {electivaTreatmentsOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "treatment":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {treatmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "archiveTime":
      case "consultDate":
      case "dateOfEnteringStage":
      case "dealClosedOn":
      case "dealCreated":
      case "expectedCloseDate":
      case "lastActivityDate":
      case "lastEmailReceived":
      case "lastEmailSent":
      case "lastStageChange":
      case "nextActivityDate":
      case "operationDate":
      case "updateTime":
      case "wonTime":
        const selectedDateValue = getValues(`${conditionType}.${index}.value`);
        const isExactDate = selectedDateValue instanceof Date;
        
        return (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%" }}>
            <div style={{ flex: 1 }}>
              {!isExactDate ? (
                <select
                  className="form-control form-control-sm"
                  disabled={!getValues(`${conditionType}.${index}.field`)}
                  value={selectedDateValue instanceof Date ? "" : (selectedDateValue || "")}
                  {...register(`${conditionType}.${index}.value`)}
                  onChange={(e) => {
                    setValue(`${conditionType}.${index}.value`, e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  style={{ height: "32px" }}
                >
                  <option value="">Select</option>
                  <optgroup label="Relative Date Intervals">
                    {dateValues.filter(item => item.category === "Relative Date Intervals").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Relative Dates">
                    {dateValues.filter(item => item.category === "Relative Dates").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Deal Specific">
                    {dateValues.filter(item => item.category === "Deal Specific").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <Picker
                  placeholderText="MM/DD/YYYY"
                  showIcon
                  dateFormat={"MM/d/yyyy h:mm aa"}
                  disabled={!getValues(`${conditionType}.${index}.field`)}
                  selected={selectedDateValue instanceof Date ? selectedDateValue : null}
                  className="form-control form-control-sm"
                  onChange={(date: any) =>
                    setValue(`${conditionType}.${index}.value`, date, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  wrapperClassName="w-100"
                />
              )}
            </div>
            <div
              className="form-check"
              style={{
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              <input
                className="form-check-input"
                type="checkbox"
                id={`useExactDate-${conditionType}-${index}`}
                checked={isExactDate}
                disabled={!getValues(`${conditionType}.${index}.field`)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setValue(`${conditionType}.${index}.value`, new Date(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  } else {
                    setValue(`${conditionType}.${index}.value`, "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                style={{ margin: "0 4px 0 0", cursor: "pointer" }}
              />
              <label
                className="form-check-label"
                htmlFor={`useExactDate-${conditionType}-${index}`}
                style={{ fontSize: "11px", cursor: "pointer", margin: 0 }}
              >
                Exact
              </label>
            </div>
          </div>
        );
      case "1":
      case "2":
      case "ContactPersonID":
      case "4":
      case "6":
      case "7":
      case "AssigntoId":
      case "11":
      case "23":
      case "24":
      case "p1":
      case "p2":
      case "p3":
      case "p4":
      case "p5":
      case "p6":
      case "a1":
      case "a2":
      case "a4":
      case "a5":
      case "a6":
      case "a7":
      case "a8":
        if (hasOptions) {
          return (
            <select
              className="form-control form-control-sm"
              disabled={!getValues(`${conditionType}.${index}.field`)}
              value={getValues(`${conditionType}.${index}.value`) || ""}
              {...register(`${conditionType}.${index}.value`)}
              onChange={(e) => {
                e.stopPropagation();
                setValue(`${conditionType}.${index}.value`, e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              style={{ height: "32px" }}
            >
              <option value="">Select</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            className="form-control form-control-sm"
            type="text"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            {...register(`${conditionType}.${index}.value`)}
            placeholder="Enter value"
            style={{ height: "32px" }}
          />
        );
      case "8":
      case "pipeline":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {pipelines.map((pipeline) => (
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
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {pipelineTypes.map((pipelineType: any) => (
              <option key={pipelineType.pipelineTypeID || pipelineType.id} value={pipelineType.pipelineTypeID || pipelineType.id}>
                {pipelineType.pipelineTypeName || pipelineType.name}
              </option>
            ))}
          </select>
        );
      case "stageid":
      case "stage":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {stages.map((item, idx) => (
              <React.Fragment key={idx}>
                <option
                  disabled
                  className="non-selectable-option"
                  style={{ fontWeight: "bold", textAlign: "left" }}
                >
                  {item.pipeLine}
                </option>
                {item.stages.map((stage: any) => (
                  <option
                    className="pl-4"
                    key={stage.stageID}
                    value={stage.stageID}
                  >
                    &nbsp; &nbsp; {stage.stageName}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        );
      case "statusid":
      case "status":
        return (
          <select
            className="form-control form-control-sm"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            style={{ height: "32px" }}
          >
            <option value="">Select</option>
            {getDropdownListforValueJSX(key).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "13":
      case "14":
      case "15":
      case "16":
      case "17":
      case "18":
      case "19":
      case "20":
      case "21":
      case "22":
      case "p7":
      case "p8":
      case "a3":
        return (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              {useExactDate ? (
                <Picker
                  placeholderText="MM/DD/YYYY"
                  showIcon
                  dateFormat={"MM/d/yyyy h:mm aa"}
                  disabled={!getValues(`${conditionType}.${index}.field`)}
                  selected={getValues(`${conditionType}.${index}.value`)}
                  className="form-control form-control-sm"
                  onChange={(e: any) =>
                    setValue(`${conditionType}.${index}.value`, e, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  wrapperClassName="w-100"
                />
              ) : (
                <select
                  className="form-control form-control-sm"
                  value={getValues(`${conditionType}.${index}.value`) || ""}
                  {...register(`${conditionType}.${index}.value`)}
                  style={{ height: "32px" }}
                >
                  <option value="">Select</option>
                  {dateValues.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div
              className="form-check"
              style={{
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              <input
                className="form-check-input"
                type="checkbox"
                id={`useExactDate-${conditionType}-${index}`}
                checked={useExactDate}
                onChange={(e) => {
                  setValue(`${conditionType}.${index}.value`, null);
                  setUseExactDate(e.target.checked);
                }}
                style={{ margin: "0 4px 0 0", cursor: "pointer" }}
              />
              <label
                className="form-check-label"
                htmlFor={`useExactDate-${conditionType}-${index}`}
                style={{ fontSize: "11px", cursor: "pointer", margin: 0 }}
              >
                Exact
              </label>
            </div>
          </div>
        );

      default:
        const isNumberField = fieldsWithOperators1.includes(selectedField);
        return (
          <input
            className="form-control form-control-sm"
            type={isNumberField ? "number" : "text"}
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) ?? ""}
            onChange={(e) => {
              setValue(`${conditionType}.${index}.value`, e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            placeholder={isNumberField ? "Enter a number" : "Value"}
            style={{ height: "32px" }}
          />
        );
    }
  };

  const getDropdownListforValueJSX = (key: string) => {
    switch (key) {
      case "statusid":
      case "status":
        return dealStatusList;
      default:
        return [];
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selectedField === "dateOfEnteringStage" ? "140px 180px 140px 140px 1fr auto auto" : "140px 180px 140px 1fr auto auto",
        gap: "12px",
        alignItems: "start",
        padding: "12px",
        backgroundColor: "#fff",
        borderRadius: "6px",
        border: "1px solid #e0e0e0",
        marginBottom: "10px",
      }}
    >
      <div>
        <select
          className="form-control form-control-sm"
          value={selectedObject}
          {...register(`${conditionType}.${index}.object`)}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedObject(newValue);
            setSelectedField("");
            setSelectedOperator("");
            updateFilteredFieldOptions(newValue);
            setValue(`${conditionType}.${index}.field`, null);
            setValue(`${conditionType}.${index}.operator`, null);
            setValue(`${conditionType}.${index}.value`, null);
            setValue(`${conditionType}.${index}.object`, newValue);
          }}
          style={{ height: "32px" }}
        >
          <option value="">Select Type</option>
          {filterTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError && (
          <div style={{ fontSize: "10px", color: "#dc3545", marginTop: "2px" }}>
            {fieldError?.message}
          </div>
        )}
      </div>

      <div>
        <select
          className="form-control form-control-sm"
          value={selectedField}
          {...register(`${conditionType}.${index}.field`)}
          disabled={!selectedObject}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedField(newValue);
            setSelectedOperator("");
            setOperatorsList(getOperatorsByField(newValue));
            setValue(`${conditionType}.${index}.operator`, null);
            setValue(`${conditionType}.${index}.value`, null);
            setValue(`${conditionType}.${index}.field`, newValue);
          }}
          style={{ height: "32px" }}
        >
          <option value="">Select Field</option>
          {filteredFieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {attributeError && (
          <div style={{ fontSize: "10px", color: "#dc3545", marginTop: "2px" }}>
            {attributeError?.message}
          </div>
        )}
      </div>

      {selectedField === "dateOfEnteringStage" && (
        <div>
          <select
            className="form-control form-control-sm"
            style={{ height: "32px" }}
          >
            <option value="">Select Stage</option>
            {stages.map((item, idx) => (
              <React.Fragment key={idx}>
                <option
                  disabled
                  className="non-selectable-option"
                  style={{ fontWeight: "bold", textAlign: "left" }}
                >
                  {item.pipeLine}
                </option>
                {item.stages.map((stage: any) => (
                  <option
                    className="pl-4"
                    key={stage.stageID}
                    value={stage.stageID}
                  >
                    &nbsp; &nbsp; {stage.stageName}
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>
      )}

      <div>
        <select
          className="form-control form-control-sm"
          value={selectedOperator}
          disabled={!selectedField}
          {...register(`${conditionType}.${index}.operator`)}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedOperator(newValue);
            setValue(`${conditionType}.${index}.operator`, newValue);
          }}
          style={{ height: "32px" }}
        >
          <option value="">Operator</option>
          {operatorsList.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {operatorError && (
          <div style={{ fontSize: "10px", color: "#dc3545", marginTop: "2px" }}>
            {operatorError?.message}
          </div>
        )}
      </div>

      <div>
        {(selectedOperator === "isEmpty" || selectedOperator === "isNotEmpty" || selectedOperator === "empty" || selectedOperator === "not_empty") ? null : valueJSX(getValues(`${conditionType}.${index}.field`))}
        {valueError && (
          <div style={{ fontSize: "10px", color: "#dc3545", marginTop: "2px" }}>
            {valueError?.message}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "50px",
          height: "32px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          padding: "0 10px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#495057",
        }}
      >
        {conditionType === "allConditions" ? "AND" : "OR"}
      </div>

      <div style={{ display: "flex", alignItems: "center", height: "32px" }}>
        <button
          onClick={(e: any) => {
            e.preventDefault();
            onDelete();
          }}
          disabled={conditionsLength === 1}
          style={{
            background: "none",
            border: "none",
            cursor: conditionsLength === 1 ? "not-allowed" : "pointer",
            padding: "4px",
            color: conditionsLength === 1 ? "#ccc" : "#dc3545",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: conditionsLength === 1 ? 0.5 : 1,
          }}
          title={
            conditionsLength === 1
              ? "At least one condition is required"
              : "Remove condition"
          }
        >
          <RemoveCircleIcon style={{ fontSize: "20px" }} />
        </button>
      </div>
    </div>
  );
};

type params = {
  dialogIsOpen: boolean;
  setDialogIsOpen: any;
  onSaveChanges: any;
  index?: number;
  selectedPipeLineId?: number;
  selectedStageId?: any;
  selectedFilter: DealFilter;
  setSelectedFilter: any;
  onPreview: any;
};

// Main FilterEditor Component
const DealFilterAddEditDialog = (props: params) => {
  // State for conditions in both ALL and ANY sections

  const {
    dialogIsOpen,
    setDialogIsOpen,
    onSaveChanges,
    index,
    selectedPipeLineId,
    selectedStageId,
    ...others
  } = props;

  const dealFiltersSvc = new DealFiltersService(ErrorBoundary);
  const [selectedFilter, setSelectedFilter] = useState(
    props.selectedFilter ?? new DealFilter(),
  );
  const [showPreview, setShowPreview] = useState(
    selectedFilter.isPreview ?? false,
  );
  const [isDotDigitalSelected, setIsDotDigitalSelected] = useState(false);
  const [isJustCallSelected, setisJustCallSelected] = useState(false);
  const [previewResponse, setPreviewResponse] = useState<any>();
  const dotDigitalCampaignList = (() => {
    try {
      const data = LocalStorageUtil.getItemObject(
        Constants.DOT_DIGITAL_CAMPAIGNSLIST,
      ) as any;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error getting DOT_DIGITAL_CAMPAIGNSLIST:", error);
      return [];
    }
  })();

  const justCallCampaignList = (() => {
    try {
      const data = LocalStorageUtil.getItemObject(
        Constants.JUST_CALL_CAMPAIGNSLIST,
      ) as any;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error getting JUST_CALL_CAMPAIGNSLIST:", error);
      return [];
    }
  })();

  const [allConditions, setAllConditions] = useState<Condition[]>([
    { object: "", field: "", operator: "", value: null as any },
  ]);
  const [anyConditions, setAnyConditions] = useState<Condition[]>([]);

  const [formOptions, setFormOptions] = useState({
    resolver: yupResolver(anyConditions.length > 0 ? formSchema2 : formSchema1),
    defaultValues: {
      name: "",
      visibility: "Private",
      allConditions: [
        { object: "", field: "", operator: "", value: null as any },
      ],
      anyConditions: [],
    },
  });

  const methods = useForm(formOptions as any);

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (!dialogIsOpen) return;

    let obj: any = {
      name: selectedFilter.name || "",
      visibility: Util.isNullOrUndefinedOrEmpty(selectedFilter.isPublic)
        ? "Private"
        : selectedFilter.isPublic
          ? "Public"
          : "Private",
      filterType: selectedFilter.filterType || "",
      filterAction: selectedFilter.filterAction || "",
      allConditions: [],
      anyConditions: [],
    };

    if (selectedFilter.id > 0) {
      const allConds = selectedFilter.conditions?.find((i) => i.glue === "AND")
        ?.conditionList || [];
      const anyConds = selectedFilter.conditions?.find((i) => i.glue === "OR")
        ?.conditionList || [];

      obj.allConditions = allConds.map((cond: any) => {
        const fieldOption = [
          ...fieldOptions,
          ...personFieldOptions,
          ...activityFieldOptions,
        ].find((f) => f.value === cond.field);
        
        const isDateField = fieldOption?.isDateType;
        const isExactDate = isDateField && (cond.extraValue === "exact" || 
          (cond.extraValue && !dateValues.some(dv => dv.value === cond.extraValue)));
        
        return {
          object: cond.object || "",
          field: cond.field || "",
          operator: cond.operator || "",
          value: isExactDate && cond.value ? new Date(cond.value) : (cond.value || "")
        };
      });

      obj.anyConditions = anyConds.map((cond: any) => {
        const fieldOption = [
          ...fieldOptions,
          ...personFieldOptions,
          ...activityFieldOptions,
        ].find((f) => f.value === cond.field);
        
        const isDateField = fieldOption?.isDateType;
        const isExactDate = isDateField && (cond.extraValue === "exact" || 
          (cond.extraValue && !dateValues.some(dv => dv.value === cond.extraValue)));
        
        return {
          object: cond.object || "",
          field: cond.field || "",
          operator: cond.operator || "",
          value: isExactDate && cond.value ? new Date(cond.value) : (cond.value || "")
        };
      });

      setAllConditions(obj.allConditions.length > 0 ? obj.allConditions : [{ object: "", field: "", operator: "", value: "" }]);
      setAnyConditions(obj.anyConditions);
      onFilterTypeChange(selectedFilter.filterType);
    } else {
      obj.allConditions = [{ object: "", field: "", operator: "", value: "" }];
      setAllConditions(obj.allConditions);
      setAnyConditions([]);
    }

    reset(obj);
  }, [dialogIsOpen, selectedFilter, reset]);

  const [filterName, setFilterName] = useState<string>("");
  const [visibility, setVisibility] = useState<string>("");

  // Handlers for conditions
  const handleAddCondition = (
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>,
  ) => {
    setConditions((prev) => [
      ...prev,
      { object: "", field: "", operator: "", value: null as any },
    ]);
  };

  const handleConditionChange = (
    index: number,
    key: keyof Condition,
    value: string | number,
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>,
  ) => {
    setConditions((prev) =>
      prev.map((cond, i) => (i === index ? { ...cond, [key]: value } : cond)),
    );
  };

  const handleDeleteCondition = (
    index: number,
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>,
    isAllConditions: boolean,
  ) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const oncloseDialog = () => {
    setDialogIsOpen(false);
    setSelectedFilter(new DealFilter());
    props.setSelectedFilter(null);
  };

  useEffect(() => {
    setFormOptions({
      resolver: yupResolver(
        anyConditions.length > 0 ? formSchema2 : formSchema1,
      ),
      defaultValues: {
        name: "",
        visibility: "Private",
        allConditions: [
          { object: "", field: "", operator: "", value: null as any },
        ],
        anyConditions: [],
      },
    });
  }, [allConditions.length, anyConditions.length]);

  const onSubmit = (obj: any) => {
    // let filtersList =
    //   JSON.parse(localStorage.getItem("dealFilters") as any) ?? [];
    // let dealFilter = { ...obj, isPublic: obj.visibility === "Public" };
    // filtersList.push(dealFilter);
    // localStorage.setItem("dealFilters", JSON.stringify(filtersList));
    continueToSave(obj);
  };

  const continueToSave = (obj: any, isPreview: boolean = false) => {
    let dealFilter = new DealFilter();
    let actulFilterId =
      !selectedFilter.isPreview && !isPreview ? selectedFilter.id : 0;
    dealFilter.id = selectedFilter.isPreview
      ? (selectedFilter.id ?? 0)
      : (selectedFilter.actulFilterId ?? actulFilterId);
    dealFilter.isPublic = obj.visibility === "Public";
    dealFilter.isPreview = isPreview;
    dealFilter.createdBy = Util.UserProfile()?.userId;
    dealFilter.modifiedBy = Util.UserProfile()?.userId;
    dealFilter.createdDate = new Date();
    dealFilter.conditions = [];
    dealFilter.name = isPreview ? obj.name + "_clone" : obj.name;
    dealFilter.filterType = obj.filterType;
    dealFilter.filterAction = obj.filterAction ?? "N/A";

    if (allConditions.length > 0) {
      dealFilter.conditions.push(
        buildConditionsArray("AND", allConditions, obj.allConditions),
      );
    }
    if (anyConditions.length > 0) {
      dealFilter.conditions.push(
        buildConditionsArray("OR", anyConditions, obj.anyConditions),
      );
    }

    dealFiltersSvc.saveDealFilters(dealFilter).then((res) => {
      if (res?.result) {
        setSelectedFilter({ ...res.result, actulFilterId: actulFilterId });
        props.setSelectedFilter({
          ...res.result,
          actulFilterId: actulFilterId,
        });
      }

      if (res?.result && !isPreview) {
        toast.success(
          `Deal filter ${
            dealFilter.id > 0 ? "updated" : "created"
          } successfully`,
        );
        // Refresh the filters list after save
        dealFiltersSvc.getDealFilters().then((filters) => {
          if (filters && Array.isArray(filters)) {
            LocalStorageUtil.setItemObject(
              Constants.Deal_FILTERS,
              JSON.stringify(filters),
            );
          }
        });
        props.onSaveChanges(res.result);
      }
    });
  };

  const buildConditionsArray = (
    glue: string,
    list: Array<any>,
    objList: Array<any>,
  ) => {
    let condition = new Rule();
    condition.glue = glue;
    condition.conditionList = [];

    let pipelines: Array<{ pipelineID: string | null; pipelineName: string }> =
      [];
    try {
      const data = localStorage.getItem("getAllPipeLinesAndStages");
      if (data && data.trim() !== "") {
        pipelines = JSON.parse(data).map((pipeline: any) => ({
          pipelineID: pipeline.pipelineID || null,
          pipelineName: pipeline.pipelineName || "Unknown Pipeline",
        }));
      }
    } catch (error) {
      console.error("Error parsing pipelines in buildConditionsArray:", error);
      pipelines = [];
    }

    list.forEach((ac, index) => {
      let objItem = objList[index];
      let conditionCSV = new ConditionCSV();

      conditionCSV = { ...objItem };

      // Check if the value is an exact date (Date object) FIRST
      if (objItem.value instanceof Date) {
        conditionCSV.extraValue = "exact";
      } else if (objItem.field === "8") {
        // Check for Pipeline field
        const pipeline = pipelines.find(
          (p: any) =>
            p.pipelineID === objItem.value || p.pipelineName === objItem.value,
        );

        if (pipeline) {
          conditionCSV.value = pipeline.pipelineID || "";
          conditionCSV.extraValue = pipeline.pipelineName;
        } else {
          conditionCSV.value = objItem.value || "";
          conditionCSV.extraValue = objItem.value;
        }
      } else {
        conditionCSV.extraValue = objItem.value; // Default extraValue
      }

      condition.conditionList.push(conditionCSV);
    });

    console.log("Final Condition Object:", condition);
    return condition;
  };

  const onFilterTypeChange = (type: any) => {
    setValue("filterAction", null as any);
    setIsDotDigitalSelected(type === "dotDigital");
    setisJustCallSelected(type === "justCall");
  };

  const getDotDigitalProgramsList = () => {
    return (
      dotDigitalCampaignList?.map((item: DotdigitalCampagin) => ({
        name: item.name,
        value: item.id,
      })) ?? []
    );
  };
  const getJustCallCampaignList = () => {
    return (
      justCallCampaignList.map((item: JustcallCampagin) => ({
        name: item.name,
        value: item.id,
      })) ?? []
    );
  };

  const handlePreview = (item: any) => {
    setShowPreview(true);
    continueToSave(item, true);
    props.onPreview();
  };

  const customFooter = () => {
    return (
      <>
        <div className="modalfootbar">
          <button
            className="btn btn-secondary btn-sm me-2"
            onClick={(e: any) => {
              setDialogIsOpen(false);
              props.setSelectedFilter(null);
            }}
            id="closeDialog"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              const currentName = getValues("name");
              if (!currentName || currentName.trim() === "") {
                const autoGeneratedName = `Auto Filter - ${new Date()
                  .toISOString()
                  .slice(0, 19)
                  .replace("T", " ")}`;
                setValue("name", autoGeneratedName, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
              handleSubmit(handlePreview)(e);
            }}
            className="btn btn-success btn-sm me-2"
            id="closeDialog"
            hidden={showPreview}
          >
            Preview
          </button>

          <button
            onClick={(e: any) => setShowPreview(false)}
            className="btn btn-success btn-sm me-2"
            id="closeDialog"
            hidden={!showPreview}
          >
            ContinueEditing
          </button>
          <button
            onClick={(e) => {
              console.log("Save button clicked");
              console.log("Form errors:", errors);
              console.log("Form values:", getValues());
              handleSubmit(
                (data) => {
                  console.log(
                    "Form validation passed, calling onSubmit with:",
                    data,
                  );
                  onSubmit(data);
                },
                (errors) => {
                  console.error("Form validation failed:", errors);
                },
              )(e);
            }}
            className="btn btn-primary btn-sm me-2"
            id="closeDialog"
          >
            Save
          </button>
        </div>
      </>
    );
  };

  return (
    <FormProvider {...methods}>
      <AddEditDialog
        dialogIsOpen={dialogIsOpen}
        header={
          showPreview
            ? "Preview Filter"
            : selectedFilter.id > 0
              ? "Edit Deal Filter"
              : "Add Deal Filter"
        }
        dialogSize={"xl"}
        closeDialog={oncloseDialog}
        onClose={oncloseDialog}
        customFooter={customFooter()}
        hideBody={false}
        position={showPreview ? "top" : ""}
      >
        {
          <>
            <div className="filter-editor" hidden={showPreview}>
              {/* ALL conditions section */}
              <h6 className="pb-2">
                Show deals that match ALL of these conditions:
              </h6>
              <div
                className="condition-group"
                style={{
                  backgroundColor: "#f7f7f7",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                {allConditions.map((condition, index) => (
                  <FilterCondition
                    key={`all-${index}`}
                    condition={condition}
                    onChange={(key, value) =>
                      handleConditionChange(index, key, value, setAllConditions)
                    }
                    onDelete={() =>
                      handleDeleteCondition(index, setAllConditions, true)
                    }
                    index={index}
                    conditionType={"allConditions"}
                    conditionsLength={allConditions.length}
                  />
                ))}
                <button
                  onClick={(event: any) => {
                    event.preventDefault();
                    handleAddCondition(setAllConditions);
                  }}
                >
                  + Add condition
                </button>
              </div>

              <div
                className="pt-2"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <button
                  hidden={anyConditions.length > 0}
                  onClick={(event: any) => {
                    event.preventDefault();
                    handleAddCondition(setAnyConditions);
                  }}
                >
                  + Add Any conditions
                </button>
              </div>

              <div
                hidden={anyConditions.length == 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  position: "relative",
                  margin: "20px 0",
                }}
              >
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #333", // Make the line thicker and darker
                    width: "100%", // Ensure it spans the full width
                    margin: "0 10px", // Adds some space around the line
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    backgroundColor: "white",
                    padding: "0 10px",
                    fontWeight: "bold", // Make text bold to stand out more
                    fontSize: "16px", // Adjust font size if needed
                    color: "#333", // Set text color to match the line color
                  }}
                >
                  Any conditions
                </span>
              </div>

              {/* ANY conditions section */}
              <h6 className="pb-2">And match ANY of these conditions:</h6>
              <div
                className="condition-group"
                style={{
                  backgroundColor: "#f7f7f7",
                  padding: "20px",
                  borderRadius: "8px",
                }}
                hidden={anyConditions.length == 0}
              >
                {anyConditions.map((condition, index) => (
                  <FilterCondition
                    key={`any-${index}`}
                    condition={condition}
                    onChange={(key, value) =>
                      handleConditionChange(index, key, value, setAnyConditions)
                    }
                    onDelete={() =>
                      handleDeleteCondition(index, setAnyConditions, false)
                    }
                    index={index}
                    conditionType={"anyConditions"}
                    conditionsLength={anyConditions.length}
                  />
                ))}
                <button
                  onClick={(event: any) => {
                    event.preventDefault();
                    handleAddCondition(setAnyConditions);
                  }}
                >
                  + Add condition
                </button>
              </div>

              <br />
              {/* Filter details */}
              <div className="col-12 d-flex">
                <div className="col-5">
                  <label>Filter name:</label>
                  <input
                    className="form-control"
                    type="text"
                    defaultValue={filterName}
                    {...methods.register("name")}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Filter name"
                  />
                  {errors.name && (
                    <p className="error-text text-danger">
                      {errors.name.message as any}
                    </p>
                  )}
                </div>
                <div className="col-2"></div>
                <div className="col-5">
                  <label>Visibility:</label>
                  <select
                    className="form-control"
                    defaultValue={visibility}
                    {...methods.register("visibility")}
                    onChange={(e) =>
                      setVisibility(e.target.value as "Private" | "Public")
                    }
                  >
                    <option value="">Select</option>
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                  </select>
                  {errors.visibility && (
                    <p className="error-text text-danger">
                      {errors.visibility.message as any}
                    </p>
                  )}
                </div>
              </div>

              <div className="col-12 d-flex pt-4">
                <div className="col-5">
                  <label>Filter Type:</label>
                  <select
                    className="form-control"
                    defaultValue={getValues("filterType")}
                    {...methods.register("filterType")}
                    onChange={(e: any) => onFilterTypeChange(e.target.value)}
                  >
                    <option value="">Select</option>
                    {filterTypes.map((item, index) => (
                      <option key={index} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-2"></div>
                <div className="col-5">
                  <label>Filter Action:</label>
                  <select
                    className="form-control"
                    defaultValue={getValues("filterAction")}
                    hidden={!isDotDigitalSelected}
                    {...methods.register("filterAction")}
                    onChange={(e: any) =>
                      setValue("filterAction", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {getDotDigitalProgramsList().map(
                      (item: any, index: any) => (
                        <option key={index} value={item.value}>
                          {item.name}
                        </option>
                      ),
                    )}
                  </select>
                  <select
                    className="form-control"
                    defaultValue={getValues("filterAction")}
                    hidden={!isJustCallSelected}
                    {...methods.register("filterAction")}
                    onChange={(e: any) =>
                      setValue("filterAction", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    {getJustCallCampaignList().map((item: any, index: any) => (
                      <option key={index} value={item.value}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-control"
                    type="text"
                    defaultValue={getValues("filterAction")}
                    hidden={isDotDigitalSelected || isJustCallSelected}
                    {...methods.register("filterAction")}
                    placeholder="Filter action"
                  />
                </div>
              </div>
            </div>
          </>
        }
      </AddEditDialog>
    </FormProvider>
  );
};

export default DealFilterAddEditDialog;
