import React, { useState, useEffect } from "react";
import Multiselect from "multiselect-react-dropdown";
import { useFormContext } from "react-hook-form";

type Params = {
  item?: any;
  onItemChange?: (selectedItems: string) => void;
  list: Array<any>;
  selectedList: Array<any>;
  isValidationOptional?: boolean;
  selectedItem?: any;
  disable?: any;
};

const MultiSelectDropdownWithValidations = (props: Params) => {
  
  const { item, onItemChange, list, selectedList, isValidationOptional } = props;

  let register: any;
  let errors: any;

  let formContextAvailable = true;
  try {
    const methods = useFormContext();
    register = methods.register;
    errors = methods.formState.errors;
  } catch (error) {
    formContextAvailable = false;
  }

  const safeList = Array.isArray(list) ? list.filter((item) => item && typeof item.name === 'string') : [];
  const safeSelectedList = Array.isArray(selectedList) ? selectedList.filter((item) => item && typeof item.name === 'string') : [];

  const [options, setOptions] = useState([{ name: "Select All", value: "all" }, ...safeList]);
  const [selectedValues, setSelectedValues] = useState(safeSelectedList);

  useEffect(() => {
    setOptions([{ name: "Select All", value: "all" }, ...safeList]);
  }, [list]);

  useEffect(() => {
    setSelectedValues(safeSelectedList);
  }, [selectedList]);

  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll(".chip").forEach((chip: any) => {
        if (chip?.textContent?.trim() === "Select All") {
          chip.style.display = "none";
        }
      });
    }, 100);
  }, [selectedValues]);

  const onSelect = (selected: any) => {
    const isSelectAllClicked = selected.some((item: any) => item.value === "all");

    if (isSelectAllClicked) {
      if (selectedValues.length === list.length) {
        setSelectedValues([]);
        onItemChange?.("");
      } else {
        setSelectedValues([{ name: "Select All", value: "all" }, ...list]);
        onItemChange?.(list.map((x) => x[item?.bindable ?? "name"]).join(","));
      }
    } else {
      const allSelected = selected.length === list.length;
      setSelectedValues(allSelected ? [{ name: "Select All", value: "all" }, ...selected] : selected);
      onItemChange?.(selected.filter((i: any) => i.value !== "all").map((x: any) => x[item?.bindable ?? "name"]).join(","));
    }
  };

  const onRemove = (selected: any, selectedItem: any) => {
    let updatedSelected = selected;
    if (selectedItem.value === "all") {
      updatedSelected = [];
    }
    setSelectedValues(updatedSelected.filter((i:any) => i.value !== "all"));
    onItemChange?.(updatedSelected.map((x: any) => x[item?.bindable ?? "name"]).join(","));
  };

  return (
    <>
      {!isValidationOptional && formContextAvailable ? (
        <>
          <Multiselect
            showCheckbox
            options={options}
            selectedValues={selectedValues}
            onSelect={onSelect}
            onRemove={onRemove}
            displayValue="name"
            {...(register && item?.value ? register(item?.value) : {})}
            style={{
              multiselectContainer: {
                width: '100%'
              },
              searchBox: {
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '4px'
              },
              option: {
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              },
              optionContainer: {
                maxHeight: '200px',
                border: 'none'
              },
              highlightOption: {
                border: 'none'
              }
            }}
          />
          <p className="text-danger" id={`validationMsgfor_${item?.value}`}>
            {errors?.[item?.value]?.message}
          </p>
        </>
      ) : (
        <Multiselect
          showCheckbox
          options={options}
          selectedValues={selectedValues}
          onSelect={onSelect}
          onRemove={onRemove}
          displayValue="name"
          style={{
            multiselectContainer: {
              width: '100%'
            },
            searchBox: {
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '4px'
            },
            option: {
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            },
            optionContainer: {
              maxHeight: '200px',
              border: 'none'
            },
            highlightOption: {
              border: 'none'
            }
          }}
        />
      )}
    </>
  );
};

const MultiSelectDropdown = (props: Params) => {
  return <MultiSelectDropdownWithValidations {...props} />;
};

export default MultiSelectDropdown;
