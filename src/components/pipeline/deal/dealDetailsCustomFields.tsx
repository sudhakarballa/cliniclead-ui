import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as Yup from "yup";
import GenerateElements from "../../../common/generateElements";
import { Deal, DealCustomFields } from "../../../models/deal";
import Util from "../../../others/util";
import DealCustomFieldAddEdit from "./dealCustomFieldAddEdit";
import { toast } from "react-toastify";
import { CustomDealFieldsService } from "../../../services/customDealFieldsService";
import { ErrorBoundary } from "react-error-boundary";
import { Spinner } from "react-bootstrap";
import { DeleteDialog } from "../../../common/deleteDialog";
import { ElementType, IControl } from "../../../models/iControl";
import { CustomFieldService } from "../../../services/customFieldService";

interface Params {
  dealItem: Deal;
  setDealItem: (deal: Deal) => void;
  originalCustomFields?: DealCustomFields[]; // ✅ Add this
}

type FormValues = {
  [key: string]: string;
};

const DealDetailsCustomFields = ({ dealItem }: Params) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customFields, setCustomFields] = useState<IControl[]>([]);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(-1);
  const [originalCustomFields, setOriginalCustomFields] = useState<
    DealCustomFields[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<FormValues>({});
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const customDealFieldsService = new CustomDealFieldsService(ErrorBoundary);
  const customFieldsService = new CustomFieldService(ErrorBoundary);

  const methods = useForm<FormValues>({
    resolver: yupResolver(
      Yup.object().shape(Util.buildValidations(customFields))
    ),
  });

  const { getValues, setValue, register } = methods;

  const getListofItemsForDropdown = (item: IControl) => {
    const match = customFields.find((f) => f.key === item.key);
    return (
      match?.options?.map((opt) => ({ name: opt, value: opt })) ?? []
    );
  };

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = () => {
    setIsLoading(true);

    customDealFieldsService
      .getCustomFields(dealItem.dealID, dealItem.pipelineID)
      .then((res: any) => {
        
        const fields: IControl[] = [];
        const selectedObj: FormValues = {};

        const filteredFields = res.customFields.filter(
          (cf: DealCustomFields) =>cf.pipelineId==dealItem.pipelineID
        );

        filteredFields.forEach((cf: DealCustomFields, index: number) => {
          
          const valueKey = `value${index + 1}`;
          const isDropdown = ["singleoption", "dropdown"].includes(
            cf.fieldType?.toLowerCase?.() ?? ""
          );

          const field: IControl = {
            id:cf.id,
            key: cf.fieldName,
            value: valueKey,
            isControlInNewLine: true,
            // disableDelete: cf.dealFieldId <= 0,
            showDelete: true,
            showEdit: true,
            isRequired: true,
            elementSize: 9,
            type: ElementType[cf.fieldType as keyof typeof ElementType],
            pipelineId: cf.pipelineId,
            options: cf.options?.split(","),
          };

          selectedObj[valueKey]=cf.fieldValue;
          setValue(valueKey as never, cf.fieldValue as never);

          register(valueKey);

          // if (isDropdown) {
          //   let parsedOptions: any[] = [];

          //   try {
          //     let rawOptions = cf.customFieldOptions;

          //     // Attempt to parse deeply nested JSON strings
          //     while (typeof rawOptions === "string") {
          //       rawOptions = JSON.parse(rawOptions);
          //     }

          //     if (Array.isArray(rawOptions)) {
          //       parsedOptions = rawOptions;
          //     }
          //   } catch (e) {
          //     console.warn(
          //       `⚠️ Failed to parse options for '${cf.customField}'`,
          //       e
          //     );
          //   }

          //   // Convert to { key, value } format
          //   const dropdownOptions = parsedOptions.map((opt: any) => {
          //     const key =
          //       typeof opt === "string"
          //         ? opt
          //         : opt.key ?? opt.name ?? opt.value;
          //     const value = typeof opt === "string" ? opt : opt.value ?? key;
          //     return { key: String(key), value: String(value) };
          //   });

          //   field.options = dropdownOptions;

          //   const matched = dropdownOptions.find(
          //     (opt) =>
          //       String(opt.value ?? "").toLowerCase() ===
          //       String(cf.customFieldValue ?? "").toLowerCase()
          //   );

          //   const selectedValue = matched?.value ?? "";
          //   selectedObj[valueKey] = selectedValue;
          //   setValue(valueKey, selectedValue);
          // } else {
          //   const val = cf.customFieldValue ?? "";
          //   selectedObj[valueKey] = val;
          //   setValue(valueKey, val);
          // }

          fields.push(field);
        });

        console.log("✅ Deal pipeline ID:", dealItem.pipelineID);
        console.log("✅ Raw customFields from API:", res.customFields);
        console.log("✅ Filtered fields for current pipeline:", filteredFields);
        console.log("✅ Fields ready to render:", fields);

        setOriginalCustomFields(res.customFields);
        setCustomFields(fields);
        setSelectedItem(selectedObj);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("❌ Failed to load custom fields", err);
        toast.error("Failed to load custom fields");
        setIsLoading(false);
      });
  };

  const onChange = (value: any, item: any) => {
    
    const index = customFields.findIndex((f) => f.key === item.key);
    const valueKey = `value${index + 1}`;
    setValue(valueKey, value);
    setSelectedItem((prev) => ({ ...prev, [valueKey]: value }));
  };

  const deleteCustomField = () => {
    setShowDeleteDialog(false);
    const field = customFields[selectedFieldIndex];
    
    // Find the matching original field by fieldName and pipelineId
    const matchingField = originalCustomFields.find(
      (o) => o.fieldName === field.key && o.pipelineId === field.pipelineId
    );
    
    const id = matchingField?.id ?? 0;

    if (id > 0) {
      customFieldsService
        .delete(id)
        .then(() => {
          toast.success("Custom field deleted");
          // Remove from local state immediately
          const updatedFields = customFields.filter((_, index) => index !== selectedFieldIndex);
          setCustomFields(updatedFields);
          // Reload to sync with server
          loadCustomFields();
        })
        .catch(() => {
          toast.error("Delete failed");
        });
    } else {
      // Field not saved yet, just remove from local state
      const updatedFields = customFields.filter((_, index) => index !== selectedFieldIndex);
      setCustomFields(updatedFields);
    }
  };

  const saveCustomFields = () => {
    const fieldsToSave: DealCustomFields[] = customFields.map(
      (field, index) => {
        const cf = new DealCustomFields();
        
        // Find existing field by fieldName to get the correct ID
        const existingField = originalCustomFields.find(
          (o) => o.fieldName === field.key && o.pipelineId === field.pipelineId
        );
        
        cf.id = field.id ?? existingField?.id ?? 0;
        cf.dealId = dealItem.dealID;
        cf.fieldName = field.key;
        cf.dealFieldId = existingField?.dealFieldId ?? 0;
        
        const isDropdown =
          field.type === ElementType.dropdown ||
          field.type?.toLowerCase?.() === "singleoption";

        cf.fieldType = isDropdown ? "singleOption" : "textbox";
        cf.fieldValue = getValues(field.value);
        cf.createdBy = Util.UserProfile()?.userId;

        if (isDropdown && Array.isArray(field.options)) {
          cf.options = JSON.stringify(
            field.options.map((opt) =>
              typeof opt === "string" ? { key: opt, value: opt } : opt
            )
          );
        }

        cf.pipelineId = "" + (field.pipelineId ?? "");

        return cf;
      }
    );

    setIsLoading(true);

    customDealFieldsService
      .postItemBySubURL(fieldsToSave, "")
      .then(() => {
        toast.success("Custom fields saved successfully");
        loadCustomFields();
      })
      .catch(() => {
        toast.error("Failed to save custom fields");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <FormProvider {...methods}>
      <div className="appdealblock-head">
        <div className="appblock-headcolleft">
          <button className="appblock-collapse" onClick={() => setDetailsCollapsed((prev) => !prev)}>
            <span className="appblock-titlelabel">
              <FontAwesomeIcon icon={faAngleDown} style={{ transform: detailsCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} /> Details
            </span>
          </button>
        </div>
      </div>

      {!detailsCollapsed && (
        isLoading ? (
          <div className="alignCenter">
            <Spinner />
          </div>
        ) : (
          <>
            {customFields.length > 0 && (
              <GenerateElements
                controlsList={customFields}
                selectedItem={selectedItem}
                onChange={onChange}
                getSelectedList={() => []}
                getListofItemsForDropdown={getListofItemsForDropdown}
                onElementDelete={(index: number) => {
                  setSelectedFieldIndex(index);
                  setShowDeleteDialog(true);
                }}
                onElementEdit={(index: number) => {
                  setSelectedFieldIndex(index);
                  setDialogIsOpen(true);
                }}
              />
            )}

            <div>
              {customFields.length === 0 && (
                <p>Add custom fields to include more deal information.</p>
              )}
              <div className="d-flex">
                <div className="col-sm-10 pt-4">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedFieldIndex(-1); // <== Ensure it's reset for 'Add'
                      setDialogIsOpen(true);
                    }}
                  >
                    + Custom Field
                  </button>
                </div>
                <div className="col-sm-2 pt-4">
                  <button
                    disabled={customFields.length === 0}
                    className="btn btn-primary btn-sm"
                    onClick={saveCustomFields}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      )}

      {dialogIsOpen && (
        <DealCustomFieldAddEdit
          selectedFieldIndex={selectedFieldIndex}
          customFields={customFields}
          setCustomFields={setCustomFields}
          dialogIsOpen={dialogIsOpen}
          setDialogIsOpen={setDialogIsOpen}
          onFieldsSubmit={() => {}}
          refreshCustomFields={loadCustomFields}
          originalCustomFields={originalCustomFields}
        />
      )}

      {showDeleteDialog && (
        <DeleteDialog
          itemType="Custom Field"
          itemName="Custom Field"
          dialogIsOpen={showDeleteDialog}
          closeDialog={() => setShowDeleteDialog(false)}
          onConfirm={deleteCustomField}
          isPromptOnly={false}
          actionType="Delete"
        />
      )}
    </FormProvider>
  );
};

export default DealDetailsCustomFields;
