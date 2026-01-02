import React, { useState } from "react";
import Picker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datePicker.css";
import { useFormContext } from "react-hook-form";

type params = {
    item?: any;
    selectedItem: any;
    onChange?: any;
    value?: any;
    disable?: boolean;
    isValidationOptional?: boolean;
}

export const DatePickerWithValidation = (props: params) => {
    const { item, selectedItem, value, onChange, disable, isValidationOptional, ...others } = props;
    const [startDate, setStartDate] = useState<Date>(new Date());

    const { register, formState: { errors } } = useFormContext();
    // Determine showTimeSelect: default true, but allow override via item.showTimeSelect
    const showTimeSelect = item && typeof item.showTimeSelect === 'boolean' ? item.showTimeSelect : true;

    return (
        <>
            <Picker
                placeholderText={showTimeSelect ? "MM/DD/YYYY hh:mm:ss a" : "MM/DD/YYYY"}
                showIcon
                dateFormat={showTimeSelect ? "MM/d/yyyy h:mm aa" : "MM/d/yyyy"}
                selected={selectedItem[item.value] ? new Date(selectedItem[item.value]) : selectedItem[item.value]}
                className="form-control"
                showTimeSelect={showTimeSelect}
                disabled={disable}
                minDate={new Date()}
                {...register(item.value)}
                onChange={(date: Date | null) => 
                    {
                        
                        onChange(date as any)
                    }
                }
            />
            <p className="text-danger" id={`validationMsgfor_${item.value}`}>{(errors as any)?.[item.value]?.message}</p>
        </>
    )
}

export const DATEPICKER = (props: params) => {

    const { item, selectedItem, value, onChange, disable, isValidationOptional, ...others } = props;

    return (
        <>
            {
                isValidationOptional ?
                    <Picker
                        placeholderText="MM/DD/YYYY"
                        showIcon
                        value={value}
                        selected={value}
                        disabled={disable}
                        className="form-control"
                        minDate={new Date()}
                        onChange={(date: Date | null) => onChange(date as any)}
                    /> :
                    <>
                        <DatePickerWithValidation {...props} />
                    </>
            }
        </>
    );
};