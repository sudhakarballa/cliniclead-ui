import { padding } from "@xstyled/styled-components";
import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import "react-quill/dist/quill.snow.css";

type params = {
  onChange: any;
  value: any;
  hideSpace?: boolean;
  item?: any;
  selectedItem?: any;
  isValidationOptional?: boolean;
  attachedData?: Array<any>;
};

const RitechTextEditorWithValidation = (props: params) => {
  
  const {
    value,
    onChange,
    hideSpace,
    item,
    selectedItem,
    isValidationOptional,
    attachedData,
    ...others
  } = props;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (menuWrapperRef.current && !menuWrapperRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  }
  if (showDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }
}, [showDropdown]);

  const handleAtClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (textareaRef.current && cursorPosition !== null) {
      const currentValue = textareaRef.current.value;
      const newValue = currentValue.slice(0, cursorPosition) + text + " " + currentValue.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(null);
    }
    setShowDropdown(false);
  };

  return (
    <>
      <br hidden={hideSpace} />
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleAtClick}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical'
          }}
          placeholder="Enter note details..."
        />
      </div>

      <div className="selectformtemplatebox"
        hidden={!attachedData || attachedData?.length == 0}
        style={{
          cursor: "pointer",
          fontSize: "14px",
          marginTop: "10px",
          display: "inline-block", marginLeft:"-74px",
        }}
        onClick={(e: any) => setShowDropdown(true)}
      >
      <b>Select From Template</b>  @
      </div>

      {showDropdown && (
        <div className="selectformtemplate"
          ref={dropdownRef}
          style={{
            position: "absolute", bottom:"0", marginLeft:"0",
            background: "white",
            border: "1px solid #ccc",
            marginTop: "5px",
            width: "200px",
            zIndex: 10,
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <option disabled style={{padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee", color: "#000000"}}>Select From Template</option>
          {attachedData?.map((option, index) => (
            <div
              key={index}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={(e) => {
                insertTextAtCursor(option.value);
              }}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}

      {item?.value && (
        <>
          <input
            type="text"
            {...register(item.value)}
            style={{ display: "none" }}
          />
          <p className="text-danger" id={`validationMsgfor_${item.value}`}>
            {(errors as any)?.[item.value]?.message}
          </p>
        </>
      )}
    </>
  );
};

const RichTextEditor = (props: params) => {
  
  const {
    onChange,
    value,
    hideSpace,
    isValidationOptional,
    attachedData,
    ...others
  } = props;
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleAtClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (textareaRef.current && cursorPosition !== null) {
      const currentValue = textareaRef.current.value;
      const newValue = currentValue.slice(0, cursorPosition) + text + " " + currentValue.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(null);
    }
    setShowDropdown(false);
  };

  return (
    <>
      {isValidationOptional ? (
        <>
          <br hidden={hideSpace} />
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleAtClick}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
              placeholder="Enter note details..."
            />
          </div>
          <br hidden={hideSpace} />
          <div ref={menuWrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
          <div className="selectformtemplatebox"
            hidden={!attachedData || attachedData?.length == 0}
            style={{
              cursor: "pointer",
              fontSize: "14px",
              marginTop: "10px",
              display: "inline-block",
            }}
            onClick={(e: any) => setShowDropdown(true)}
          >
           <b>Select From Template</b>  @
          </div>

          {showDropdown && (
            <div className="selectformtemplate"
              ref={dropdownRef}
              style={{
                position: "absolute",
                background: "white",
                border: "1px solid #ccc",
                marginTop: "5px",
                width: "150px",
                zIndex: 20000,
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                maxHeight: 280,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <option disabled style={{padding:"8px", cursor: "pointer", borderBottom: "1px solid #eee"}}>Select From Template</option>
              {attachedData?.map((option, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={(e) => {
                    insertTextAtCursor(option?.value);
                  }}
                >
                  {option?.name}
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      ) : (
        <RitechTextEditorWithValidation {...props} />
      )}
    </>
  );
};

export default RichTextEditor;
