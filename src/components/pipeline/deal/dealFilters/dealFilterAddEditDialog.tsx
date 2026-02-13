import { yupResolver } from "@hookform/resolvers/yup";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import React, { useEffect, useState } from "react";
import Picker from "react-datepicker";
import { ErrorBoundary } from "react-error-boundary";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { AddEditDialog } from "../../../../common/addEditDialog";
import { ConditionCSV, DealFilter, Rule } from "../../../../models/dealFilters";
import { DotdigitalCampagin } from "../../../../models/dotdigitalCampagin";
import { JustcallCampagin } from "../../../../models/justcallCampagin";
import LocalStorageUtil from "../../../../others/LocalStorageUtil";
import Constants from "../../../../others/constants";
import Util from "../../../../others/util";
import { DealFiltersService } from "../../../../services/dealFiltersService";

const getOperators = (isValueType: false) => {
  return isValueType
    ? operatorOptions.concat(operatorsForNumberType)
    : operatorOptions;
};

const operatorsForNumberType = [
  { label: "Greater than", value: ">" },
  { label: "Less than", value: "<" },
  { label: "Greater than or equal to", value: ">=" },
  { label: "Less than or equal to", value: "<=" },
];

const operatorOptions = [
  { label: "Is empty", value: "IS NULL" },
  { label: "Is not empty", value: "IS NOT NULL" },
  { label: "Equals", value: "=" },
  { label: "Does not equal", value: "!=" },
];

const dateValues = [
  { label: "Last Quarter", value: "lastQuarter" },
  { label: "Next Quarter", value: "nextQuarter" },
  { label: "This Quarter", value: "thisQuarter" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Next Month", value: "nextMonth" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Week", value: "lastWeek" },
  { label: "Next Week", value: "nextWeek" },
  { label: "This Week", value: "thisWeek" },
  { label: "Last Year", value: "lastYear" },
  { label: "Next Year", value: "nextYear" },
  { label: "This Year", value: "thisYear" },
  { label: "6 Months Ago", value: "6MonthsAgo" },
  { label: "5 Months Ago", value: "5MonthsAgo" },
  { label: "4 Months Ago", value: "4MonthsAgo" },
  { label: "3 Months Ago", value: "3MonthsAgo" },
];

const dealStatusList = [
  { value: "1", label: "Open" },
  { value: "2", label: "Won" },
  { value: "3", label: "Lost" },
  { value: "4", label: "Closed" },
  { value: "5", label: "Deleted" },
];

const fieldOptions = [
  { value: "1", label: "Title" },
  { value: "2", label: "Creator" },
  { value: "ContactPersonID", label: "Owner", isNumberType: true },
  { value: "4", label: "Value", isNumberType: true },
  { value: "6", label: "Probability", isNumberType: true },
  { value: "7", label: "Organization" },
  { value: "8", label: "Pipeline" },
  { value: "AssigntoId", label: "Assign to", isNumberType: true },
  { value: "stageid", label: "Stage", isNumberType: true },
  { value: "11", label: "Label" },
  { value: "statusid", label: "Status", isNumberType: true },
  { value: "13", label: "Deal created", isDateType: true },
  { value: "14", label: "Update time", isDateType: true },
  { value: "15", label: "Last stage change", isDateType: true },
  { value: "16", label: "Next activity date", isDateType: true },
  { value: "17", label: "Last activity date", isDateType: true },
  { value: "18", label: "Won time", isDateType: true },
  { value: "19", label: "Last email received", isDateType: true },
  { value: "20", label: "Last email sent", isDateType: true },
  { value: "21", label: "Lost time", isDateType: true },
  { value: "22", label: "Deal closed on", isDateType: true },
  { value: "23", label: "Lost reason" },
  { value: "24", label: "Visible to" },
  // { value: "26", label: "Total activities" },
  // { value: "27", label: "Done activities" },
  // { value: "28", label: "Activities to do" },
  // { value: "29", label: "Email messages count" },
  // { value: "30", label: "Expected close date" },
  // { value: "34", label: "Source origin" },
  // { value: "35", label: "Source origin ID" },
  // { value: "36", label: "Source channel" },
  // { value: "37", label: "Source channel ID" },
  // { value: "38", label: "MRR" },
  // { value: "39", label: "ARR" },
  // { value: "40", label: "ACV" },
  // { value: "41", label: "Currency" },
  // { value: "42", label: "Date of entering stage" },
  // { value: "43", label: "Attached product" },
];

const filterTypeOptions = [
  { value: "deal", label: "Deal" },
  { value: "organization", label: "Organization" },
  { value: "person", label: "Person" },
  { value: "product", label: "Product" },
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
  value: Yup.string().required("Value is required"),
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
    new Date(getValues(`${conditionType}.${index}.value`)).getTime()
  );
  const [useExactDate, setUseExactDate] = useState(isDate ?? false);
  const [operatorsList, setOperatorsList] = useState<Array<any>>([]);
  interface Pipeline {
    pipelineID: string;
    pipelineName: string;
  }

  const [selectedObject, setSelectedObject] = useState(condition.object || "");
  const [selectedField, setSelectedField] = useState(condition.field || "");
  const [selectedOperator, setSelectedOperator] = useState(condition.operator || "");

  useEffect(() => {
    setSelectedObject(condition.object || "");
    setSelectedField(condition.field || "");
    setSelectedOperator(condition.operator || "");
    setValue(`${conditionType}.${index}.object`, condition.object);
    setValue(`${conditionType}.${index}.field`, condition.field);
    setOperatorsList(
      getOperators(
        fieldOptions.find((i) => i.value == condition.field)
          ?.isNumberType as any
      )
    );
    setTimeout(() => {
      setValue(`${conditionType}.${index}.operator`, condition.operator);
    }, 10);

    setValue(`${conditionType}.${index}.value`, condition.value);
  }, [condition, setValue, index, conditionType]);

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

  const getPipelines = (): Pipeline[] => {
    try {
      const data = localStorage.getItem("getAllPipeLinesAndStages");
      if (!data || data.trim() === '') {
        return [];
      }
      const res = JSON.parse(data);
      return res.map((pipeline: any) => ({
        pipelineID: pipeline.pipelineStages?.[0]?.pipelineID || "",
        pipelineName: pipeline.pipelineName || "Unknown Pipeline",
      }));
    } catch (error) {
      console.error('Error parsing getAllPipeLinesAndStages:', error);
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
      if (!data || data.trim() === '') {
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
          })
        ),
      };
      list.push(obj);
    });

      return list;
    } catch (error) {
      console.error('Error parsing getAllPipeLinesAndStages:', error);
      return [];
    }
  };

  const valueJSX = (key: string) => {
    switch (key) {
      case "8": // Pipeline
        return (
          <select
            className="form-control"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            {...register(`${conditionType}.${index}.value`)}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value)
            }
          >
            <option value="">Select</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.pipelineID} value={pipeline.pipelineID}>
                {pipeline.pipelineName}
              </option>
            ))}
          </select>
        );
      case "stageid":
        return (
          <select
            className="form-control"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            {...register(`${conditionType}.${index}.value`)}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value)
            }
          >
            <option value="">Select</option>
            {stages.map((item, idx) => (
              <React.Fragment key={idx}>
                <option
                  disabled
                  className="non-selectable-option"
                  style={{
                    fontWeight: "bold",
                    textAlign: "left",
                  }}
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
        return (
          <select
            className="form-control"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            value={getValues(`${conditionType}.${index}.value`) || ""}
            {...register(`${conditionType}.${index}.value`)}
            onChange={(e) =>
              setValue(`${conditionType}.${index}.value`, e.target.value)
            }
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
        return (
          <div className="row align-items-center">
            <div className="col">
              {useExactDate ? (
                <Picker
                  placeholderText="MM/DD/YYYY hh:mm:ss a"
                  showIcon
                  dateFormat={"MM/d/yyyy h:mm aa"}
                  disabled={!getValues(`${conditionType}.${index}.field`)}
                  selected={getValues(`${conditionType}.${index}.value`)}
                  className="form-control"
                  onChange={(e: any) =>
                    setValue(`${conditionType}.${index}.value`, e)
                  }
                />
              ) : (
                <select
                  className="form-control"
                  value={getValues(`${conditionType}.${index}.value`) || ""}
                  {...register(`${conditionType}.${index}.value`)}
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

            <div className="col-auto">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`useExactDate-${index}`}
                  checked={useExactDate}
                  onChange={(e) => {
                    setValue(`${conditionType}.${index}.value`, null);
                    setUseExactDate(e.target.checked);
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor={`useExactDate-${index}`}
                >
                  Use exact date
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <input
            className="form-control"
            type="text"
            disabled={!getValues(`${conditionType}.${index}.field`)}
            defaultValue={conditionType[index].value ?? null}
            {...register(`${conditionType}.${index}.value`)}
            placeholder="Value"
          />
        );
    }
  };

  const getDropdownListforValueJSX = (key: string) => {
    switch (key) {
      case "statusid":
        return dealStatusList;
      default:
        return [];
    }
  };

  return (
    <div className="form-group row pb-2">
      <div className="col-2">
        <select
          className="form-control"
          value={selectedObject}
          {...register(`${conditionType}.${index}.object`)}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedObject(newValue);
            setSelectedField("");
            setSelectedOperator("");
            setValue(`${conditionType}.${index}.field`, null);
            setValue(`${conditionType}.${index}.operator`, null);
            setValue(`${conditionType}.${index}.value`, null);
            setValue(`${conditionType}.${index}.object`, newValue);
          }}
        >
          <option value="">Select</option>
          {filterTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {<p className="error-text text-danger">{fieldError?.message}</p>}
      </div>
      <div className="col-3">
        <select
          className="form-control"
          value={selectedField}
          {...register(`${conditionType}.${index}.field`)}
          disabled={!selectedObject}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedField(newValue);
            setSelectedOperator("");
            setOperatorsList(
              getOperators(
                fieldOptions.find((i) => i.value == newValue)
                  ?.isNumberType as any
              )
            );
            setValue(`${conditionType}.${index}.operator`, null);
            setValue(`${conditionType}.${index}.value`, null);
            setValue(`${conditionType}.${index}.field`, newValue);
          }}
        >
          <option value="">Select</option>
          {fieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {<p className="error-text text-danger">{attributeError?.message}</p>}
      </div>

      <div className="col-2">
        <select
          className="form-control"
          value={selectedOperator}
          disabled={!selectedField}
          {...register(`${conditionType}.${index}.operator`)}
          onChange={(e: any) => {
            const newValue = e.target.value;
            setSelectedOperator(newValue);
            setValue(`${conditionType}.${index}.operator`, newValue);
          }}
        >
          <option value="">Select</option>
          {operatorsList.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}

          {/* Add more operators if needed */}
        </select>
        {<p className="error-text text-danger">{operatorError?.message}</p>}
      </div>

      <div className="col-4">
        {valueJSX(getValues(`${conditionType}.${index}.field`))}
        {<p className="error-text text-danger">{valueError?.message}</p>}
      </div>
      <div className="col-1" style={{ alignContent: "center" }}>
        {conditionType === "allConditions" ? "AND" : "OR"}
        <button
          hidden={conditionsLength == 1 && conditionType === "allConditions"}
          onClick={(e: any) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <RemoveCircleIcon />
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
    props.selectedFilter ?? new DealFilter()
  );
  const [showPreview, setShowPreview] = useState(
    selectedFilter.isPreview ?? false
  );
  const [isDotDigitalSelected, setIsDotDigitalSelected] = useState(false);
  const [isJustCallSelected, setisJustCallSelected] = useState(false);
  const [previewResponse, setPreviewResponse] = useState<any>();
  const dotDigitalCampaignList = (() => {
    try {
      const data = LocalStorageUtil.getItemObject(Constants.DOT_DIGITAL_CAMPAIGNSLIST) as any;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting DOT_DIGITAL_CAMPAIGNSLIST:', error);
      return [];
    }
  })();
  
  const justCallCampaignList = (() => {
    try {
      const data = LocalStorageUtil.getItemObject(Constants.JUST_CALL_CAMPAIGNSLIST) as any;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting JUST_CALL_CAMPAIGNSLIST:', error);
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
    let obj = {
      ...selectedFilter,
      visibility: Util.isNullOrUndefinedOrEmpty(selectedFilter.isPublic)
        ? "Private"
        : selectedFilter.isPublic
        ? "Public"
        : "Private",
    };

    if (selectedFilter.id > 0) {
      obj.allConditions = obj.conditions.find((i) => i.glue === "AND")
        ?.conditionList as any;
      setAllConditions(obj.allConditions ?? []);
      obj.anyConditions = obj.conditions.find((i) => i.glue === "OR")
        ?.conditionList as any;
      setAnyConditions(obj.anyConditions ?? []);
      onFilterTypeChange(selectedFilter.filterType);
    }

    if (dialogIsOpen) {
      reset(obj); // Set the form values to the binding object when the dialog opens
    }
  }, [dialogIsOpen, reset]);

  const [filterName, setFilterName] = useState<string>("");
  const [visibility, setVisibility] = useState<string>("");

  // Handlers for conditions
  const handleAddCondition = (
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>
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
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>
  ) => {
    setConditions((prev) =>
      prev.map((cond, i) => (i === index ? { ...cond, [key]: value } : cond))
    );
  };

  const handleDeleteCondition = (
    index: number,
    setConditions: React.Dispatch<React.SetStateAction<Condition[]>>,
    isAllConditions: boolean
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
        anyConditions.length > 0 ? formSchema2 : formSchema1
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
      ? selectedFilter.id ?? 0
      : selectedFilter.actulFilterId ?? actulFilterId;
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
        buildConditionsArray("AND", allConditions, obj.allConditions)
      );
    }
    if (anyConditions.length > 0) {
      dealFilter.conditions.push(
        buildConditionsArray("OR", anyConditions, obj.anyConditions)
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
            selectedFilter.id > 0 ? " updated " : " created "
          } successfully`
        );
        // Refresh the filters list after save
        dealFiltersSvc.getDealFilters().then((filters) => {
          if (filters && Array.isArray(filters)) {
            LocalStorageUtil.setItemObject(
              Constants.Deal_FILTERS,
              JSON.stringify(filters)
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
    objList: Array<any>
  ) => {
    let condition = new Rule();
    condition.glue = glue;
    condition.conditionList = [];

    let pipelines: Array<{pipelineID: string | null; pipelineName: string}> = [];
    try {
      const data = localStorage.getItem("getAllPipeLinesAndStages");
      if (data && data.trim() !== '') {
        pipelines = JSON.parse(data).map((pipeline: any) => ({
          pipelineID: pipeline.pipelineID || null,
          pipelineName: pipeline.pipelineName || "Unknown Pipeline",
        }));
      }
    } catch (error) {
      console.error('Error parsing pipelines in buildConditionsArray:', error);
      pipelines = [];
    }

    list.forEach((ac, index) => {
      let objItem = objList[index];
      let conditionCSV = new ConditionCSV();

      conditionCSV = { ...objItem };
      conditionCSV.extraValue = objItem.value; // Default extraValue

      if (objItem.field === "8") {
        // Check for Pipeline field
        console.log("Pipelines: ", pipelines);
        console.log("Pipeline value from objItem: ", objItem.value);

        const pipeline = pipelines.find(
          (p: any) =>
            p.pipelineID === objItem.value || p.pipelineName === objItem.value
        );

        if (pipeline) {
          console.log("Matched Pipeline: ", pipeline);
          conditionCSV.value = pipeline.pipelineID || "";
          conditionCSV.extraValue = pipeline.pipelineName;
        } else {
          console.log("No matching pipeline found!");
          conditionCSV.value = objItem.value || "";
        }
      }

      console.log("Condition CSV before pushing:", conditionCSV);
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
            onClick={handleSubmit(onSubmit)}
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
        header={"Add Dealfilter"}
        dialogSize={"xl"}
        closeDialog={oncloseDialog}
        onClose={oncloseDialog}
        customFooter={customFooter()}
        hideBody={showPreview}
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
                      )
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
