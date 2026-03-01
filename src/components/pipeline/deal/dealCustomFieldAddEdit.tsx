import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import * as Yup from "yup";
import { useEffect, useRef, useState } from "react";
import { AddEditDialog } from "../../../common/addEditDialog";
import GenerateElements from "../../../common/generateElements";
import { ElementType, IControl } from "../../../models/iControl";
import Util from "../../../others/util";
import { toast } from "react-toastify";
import { PipeLine } from "../../../models/pipeline";
import { ErrorBoundary } from "react-error-boundary";
import { CustomFieldService } from "../../../services/customFieldService";
import { DealCustomFields } from "../../../models/deal";

interface Params {
  customFields: Array<IControl>;
  setCustomFields: (fields: IControl[]) => void;
  dialogIsOpen: boolean;
  setDialogIsOpen: (val: boolean) => void;
  selectedFieldIndex: number;
  onFieldsSubmit: (index: number) => void;
  refreshCustomFields: () => void;
  originalCustomFields: DealCustomFields[];
}

const DealCustomFieldAddEdit = ({
  customFields,
  setCustomFields,
  dialogIsOpen,
  setDialogIsOpen,
  selectedFieldIndex,
  onFieldsSubmit,
  refreshCustomFields,
  originalCustomFields,
}: Params) => {
  const [selectedItem, setSelectedItem] = useState<any>({});
  const allPipeLinesList: Array<PipeLine> = JSON.parse(
    localStorage.getItem("allPipeLines") || "[]"
  );

  const [selectedPipeLines, setSelectedPipeLines] = useState<PipeLine[]>([]);
  const [fieldType, setFieldType] = useState<string>("");
  const [optionInput, setOptionInput] = useState("");
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const customFieldsService = new CustomFieldService(ErrorBoundary);
  const hasSubmitted = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const controlsList: Array<IControl> = [
    {
      key: "Field Name",
      value: "fieldName",
      isRequired: true,
      isControlInNewLine: true,
    },
    {
      key: "Field Type",
      value: "fieldType",
      isRequired: true,
      type: ElementType.dropdown,
      isControlInNewLine: true,
    },
    {
      key: "PipeLine",
      value: "pipelineIds",
      isRequired: true,
      type: ElementType.multiSelectDropdown,
      isControlInNewLine: true,
      bindable: "value",
    },
  ];

  const schema = Yup.object().shape({
    fieldName: Yup.string().required("Field name is required"),
    fieldType: Yup.string().required("Field type is required"),
    pipelineIds: Yup.array()
      .of(Yup.string())
      .min(1, "At least one pipeline is required"),
  });

  const methods = useForm({ resolver: yupResolver(schema) });
  const { handleSubmit, setValue, watch } = methods;

  // ✅ Sync selectedPipeLines with pipelineIds field
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "pipelineIds" && Array.isArray(value.pipelineIds)) {
        const selectedList = value.pipelineIds
          .map((id: any) => allPipeLinesList.find((p) => p.pipelineID === +id))
          .filter(Boolean) as PipeLine[];
        setSelectedPipeLines(selectedList);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onChange = (value: any, item: any) => {
    
    if (item.key === "Field Type") {
      setFieldType(value);
      setValue("fieldType" as never, value as never);
      setSelectedItem({ ...selectedItem, fieldType: value });
      setOptionsList([]);
    }

    if (item.key === "PipeLine") {
      let idArray: string[] = [];

      if (Array.isArray(value)) {
        idArray = value.map((v: any) =>
          typeof v === "object" ? String(v.value) : String(v)
        );
      } else if (typeof value === "string") {
        idArray = value.split(",").map((v) => v.trim()).filter(Boolean);
      }

      // Remove duplicates and ensure only valid pipeline IDs
      const uniqueIdArray = Array.from(new Set(idArray)).filter(id => 
        allPipeLinesList.some(pl => String(pl.pipelineID) === id)
      );
      
      setValue("pipelineIds" as never, uniqueIdArray as never);
      
      // Update selectedPipeLines state immediately
      const selectedList = uniqueIdArray
        .map(id => allPipeLinesList.find(p => String(p.pipelineID) === id))
        .filter(Boolean) as PipeLine[];
      setSelectedPipeLines(selectedList);
    }
  };

  const oncloseDialog = () => setDialogIsOpen(false);

  useEffect(() => {
    
    if (selectedFieldIndex >= 0) {
      const field = customFields[selectedFieldIndex];
      let pipelineIdString = "";

      if (typeof field.pipelineIds === "string") {
        pipelineIdString = field.pipelineIds;
      } else if (Array.isArray(field.pipelineIds)) {
        pipelineIdString = (field.pipelineIds as string[]).join(",");
      } else if (typeof field.pipelineIds === "number") {
        pipelineIdString = String(field.pipelineIds);
      } else if ("pipelineId" in field && field.pipelineId !== undefined) {
        pipelineIdString = String((field as any).pipelineId);
      }

      const pipelineIdArray = pipelineIdString
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const selectedList = pipelineIdArray
        .map((id) => allPipeLinesList.find((p) => p.pipelineID === +id))
        .filter(Boolean) as PipeLine[];

      setSelectedPipeLines(selectedList);
      setValue("pipelineIds" as never, pipelineIdArray as never);

      const elementTypeKey =
        Object.entries(ElementType).find(
          ([_, val]) => val === field.type
        )?.[0] ?? "";

      
      setSelectedItem({
        fieldName: field.key,
        fieldType: elementTypeKey,
        pipelineIds: pipelineIdArray,
        id: field.id,
      });

      setValue("fieldName" as never, field.key as never);
      setValue("fieldType" as never, elementTypeKey as never);
      setFieldType(elementTypeKey);

      const dropdownOptions = (field.options || []).map((opt) =>
        typeof opt === "string" ? opt : opt.key ?? opt.value
      );
      setOptionsList(dropdownOptions);
    } else {
      setSelectedItem({});
      setValue("fieldName" as never, "" as never);
      setValue("fieldType" as never, "" as never);
      setValue("pipelineIds" as never, [] as never);
      setOptionsList([]);
      setOptionInput("");
      setFieldType("");
      setSelectedPipeLines([]);
    }
  }, []);

  const onSubmit = async (item: any) => {
    if (fieldType === "dropdown" && optionsList.length === 0) {
      toast.warn("Please add at least one option to proceed further");
      return;
    }

    if (isSaving) return;
    setIsSaving(true);
    try {
      const pipelineIdsArray =
        typeof item.pipelineIds === "string"
          ? item.pipelineIds
              .split(",")
              .map((p: string) => p.trim())
              .filter(Boolean)
          : Array.isArray(item.pipelineIds)
          ? item.pipelineIds.map(String)
          : [];

      const updatedFields = [...customFields];
      const isDuplicate = updatedFields.some(
        (i, index) => i.key === item.fieldName && selectedFieldIndex !== index
      );

      if (isDuplicate && selectedFieldIndex === -1) {
        toast.warn("Custom field with same Name already exists.");
        setIsSaving(false);
        return;
      }

      const newField: IControl = {
        key: item.fieldName,
        value: `value${
          selectedFieldIndex === -1
            ? updatedFields.length + 1
            : selectedFieldIndex + 1
        }`,
        isControlInNewLine: true,
        showDelete: true,
        showEdit: true,
        isRequired: true,
        elementSize: 9,
        pipelineIds: pipelineIdsArray,
        type: item.fieldType,
        options: [],
      };

      if (selectedFieldIndex === -1) {
        updatedFields.push(newField);
      } else {
        updatedFields[selectedFieldIndex] = newField;
      }

      setCustomFields([...updatedFields]);
      await saveCustomField({
        ...newField,
        options: ["dropdown", "singleOption", "multiSelectDropdown"].includes(fieldType.toLowerCase())
          ? optionsList.map((opt) => ({ key: opt, value: opt }))
          : undefined,
      });

      toast.success(
        `Custom field ${
          selectedFieldIndex >= 0 ? "updated" : "added"
        } successfully ✅`
      );
      refreshCustomFields();
      setDialogIsOpen(false);
    } catch (error) {
      console.error("Error saving custom field:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCustomField = async (item: IControl) => {
    
    const pipelineIdList =
      typeof item.pipelineIds === "string"
        ? item.pipelineIds.split(",").map((p) => p.trim())
        : Array.isArray(item.pipelineIds)
        ? item.pipelineIds
        : [];

    const fullPipelineIds = pipelineIdList.join(",");

    const isDropdown = ["singleoption", "dropdown", "multiSelectDropdown"].includes(
      (item.type || "")
    );

    const matchingOriginal = originalCustomFields.find(
      (f) => f.fieldName === item.key
    );

    const payload: DealCustomFields = {
      id: selectedItem.id ?? matchingOriginal?.id ?? 0,
      dealFieldId: 0,
      dealId: 0,
      fieldName: item.key,
      fieldType: item.type || "textbox",
      fieldValue: "",
      options:
        isDropdown && optionsList.length
          ? Array.from(optionsList, x=>x).join(",")
          : "",
      pipelineId: 0,
      pipelineIds: Array.from(pipelineIdList, (x) => x).join(","),
      createdBy: Util.UserProfile()?.userId,
      updatedDate: new Date(),
      userId: Util.UserProfile()?.userId,
      createdDate: new Date(),
      modifiedDate: new Date(),
      modifiedBy: Util.UserProfile()?.userId,
      updatedBy: Util.UserProfile()?.userId,
    };

    try {
      await customFieldsService.postItem({...payload, options:Array.from(optionsList, x=>x).join(",")});
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || "Failed to save custom field";
      toast.error(errorMessage);
      throw error;
    }
  };

  let excludedList = ["checkbox", "custom", "slider","datepicker"];
  const getDropdownValues = (item: any) => {
    if (item.key === "Field Type") {
      const seen = new Set<string>();
      return Object.entries(ElementType)
        .filter(([key, label]) => {
          if (excludedList.includes(key)) return false; // ❌ Skip "few"
          if (seen.has(label)) return false; // ❌ Skip duplicate labels
          seen.add(label);
          return true;
        })
        .map(([key, value]) => ({ name: value, value: key }));
    }

    if (item.key === "PipeLine") {
      // Create a map to track unique pipeline IDs and their names
      const uniquePipelines = new Map();
      
      allPipeLinesList.forEach(pl => {
        if (!uniquePipelines.has(pl.pipelineID)) {
          uniquePipelines.set(pl.pipelineID, pl);
        }
      });
      
      const pipelineArray = Array.from(uniquePipelines.values());
      const nameCountMap = new Map();
      
      return pipelineArray.map((pl) => {
        // Count occurrences of this pipeline name
        const sameNamePipelines = allPipeLinesList.filter(p => p.pipelineName === pl.pipelineName);
        
        if (sameNamePipelines.length > 1) {
          // Find the index of this pipeline among those with the same name
          const sortedSameName = sameNamePipelines.sort((a, b) => a.pipelineID - b.pipelineID);
          const sequenceNumber = sortedSameName.findIndex(p => p.pipelineID === pl.pipelineID) + 1;
          
          return {
            name: `${pl.pipelineName} #${sequenceNumber}`,
            value: String(pl.pipelineID),
          };
        }
        
        return {
          name: pl.pipelineName,
          value: String(pl.pipelineID),
        };
      });
    }
    return [];
  };

  const getSelectedList = (field?: any) => {
    
    if (field?.key === "PipeLine") {
      // Ensure unique selected pipelines based on ID
      const uniqueSelected = selectedPipeLines.filter((pl, index, self) => 
        self.findIndex(p => p.pipelineID === pl.pipelineID) === index
      );
      
      return uniqueSelected.map((pl) => {
        // Count occurrences of this pipeline name
        const sameNamePipelines = allPipeLinesList.filter(p => p.pipelineName === pl.pipelineName);
        
        if (sameNamePipelines.length > 1) {
          // Find the index of this pipeline among those with the same name
          const sortedSameName = sameNamePipelines.sort((a, b) => a.pipelineID - b.pipelineID);
          const sequenceNumber = sortedSameName.findIndex(p => p.pipelineID === pl.pipelineID) + 1;
          
          return {
            name: `${pl.pipelineName} #${sequenceNumber}`,
            value: String(pl.pipelineID),
          };
        }
        
        return {
          name: pl.pipelineName,
          value: String(pl.pipelineID),
        };
      });
    }
    return [];
  };

  const customHTMLControl = () => {
    
    return (
      <>
        {["dropdown", "singleOption", "multiSelectDropdown"].includes(fieldType) && (
          <div style={{ marginTop: "1rem" }}>
            <label>
              <strong>Options (required)</strong>
            </label>
            <ul
              style={{
                listStyle: "none",
                paddingLeft: 0,
                marginBottom: "1rem",
              }}
            >
              {optionsList.map((opt, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span style={{ width: "1rem" }}>☰</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...optionsList];
                      updated[idx] = e.target.value;
                      setOptionsList(updated);
                    }}
                    className="form-control"
                    style={{ flexGrow: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() =>
                      setOptionsList(optionsList.filter((_, i) => i !== idx))
                    }
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <textarea
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Enter multiple options (Shift+Enter for newline)"
                className="form-control"
                rows={3}
                style={{ resize: "vertical", flexGrow: 1 }}
              />
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  const newOptions = optionInput
                    .split("\n")
                    .map((opt) => opt.trim())
                    .filter((opt) => opt && !optionsList.includes(opt));
                  if (newOptions.length > 0) {
                    setOptionsList([...optionsList, ...newOptions]);
                    setOptionInput("");
                  }
                }}
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <FormProvider {...methods}>
      <AddEditDialog
        dialogIsOpen={dialogIsOpen}
        header="Add Custom Field"
        dialogSize="lg"
        closeDialog={oncloseDialog}
        onClose={oncloseDialog}
        onSave={handleSubmit(onSubmit)}
        customSaveChangesButtonName={
          selectedFieldIndex >= 0 ? "Update" : "Save"
        }
      >
        <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <GenerateElements
            controlsList={controlsList.slice(0, 2)}
            selectedItem={selectedItem}
            onChange={onChange}
            getListofItemsForDropdown={getDropdownValues}
            getSelectedList={getSelectedList}
          />
          {fieldType === "dropdown" || fieldType === "multiSelectDropdown"
            ? customHTMLControl()
            : null}
          <GenerateElements
            controlsList={controlsList.slice(2)}
            selectedItem={selectedItem}
            onChange={onChange}
            getListofItemsForDropdown={getDropdownValues}
            getSelectedList={getSelectedList}
          />
        </form>
      </AddEditDialog>
    </FormProvider>
  );
};

export default DealCustomFieldAddEdit;
