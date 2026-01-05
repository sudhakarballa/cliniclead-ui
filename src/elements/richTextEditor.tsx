import { padding } from "@xstyled/styled-components";
import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import ReactQuill from "react-quill";
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
  const quillRef = useRef<ReactQuill>(null); // Reference for Quill editor
  const [cursorPosition, setCursorPosition] = useState<number | null>(null); // Store cursor position
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Close dropdown if clicking outside
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

  // Store cursor position before opening dropdown
  const handleAtClick = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        setCursorPosition(range.index); // Save cursor position
      }
    }
  };
  // Function to insert text at stored cursor position
  const insertTextAtCursor = (text: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill && cursorPosition !== null) {
      const currentContent = quill.getText(); // Get current content
      const updatedContent =
        currentContent.slice(0, cursorPosition) +
        text +
        " " +
        currentContent.slice(cursorPosition);

      quill.clipboard.dangerouslyPasteHTML(cursorPosition, text);
      quill.setSelection((cursorPosition + text?.length + 1) as any); // Move cursor after inserted text
      setCursorPosition(null); // Reset stored position
    }
    setShowDropdown(false); // Close dropdown
  };
  
  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'size': [] }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }], // Allow background colors
      [{ 'bold': true }, { 'italic': true }, { 'underline': true }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['image'],
      [{ 'indent': '-1' }, { 'indent': '+1' }]
    ]
  };


  return (
    <>
      <br hidden={hideSpace} />
      <div style={{ position: 'relative' }}>
        <ReactQuill
          ref={quillRef}
          modules={modules}
          onFocus={(e: any) => handleAtClick()}
          onChange={(e: any) => props.onChange(e)}
          value={value}
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

      {/* Dropdown - Show when @ is clicked */}
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
                insertTextAtCursor(option.value); // Append selected option to editor
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
  const quillRef = useRef<ReactQuill>(null); // Reference for Quill editor
  const [cursorPosition, setCursorPosition] = useState<number | null>(null); // Store cursor position
  const menuWrapperRef = useRef<HTMLDivElement>(null);
  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    // Add event listener when dropdown is open
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      // Remove event listener when component unmounts or dropdown closes
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Store cursor position before opening dropdown
  const handleAtClick = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        setCursorPosition(range.index); // Save cursor position
      }
    }
  };

  // Function to insert text at stored cursor position
  const insertTextAtCursor = (text: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill && cursorPosition !== null) {
      const currentContent = quill.getText(); // Get current content
      const updatedContent =
        currentContent.slice(0, cursorPosition) +
        text +
        " " +
        currentContent.slice(cursorPosition);

      quill.clipboard.dangerouslyPasteHTML(cursorPosition, text);
      quill.setSelection((cursorPosition + text?.length + 1) as any); // Move cursor after inserted text
      setCursorPosition(null); // Reset stored position
    }
    setShowDropdown(false); // Close dropdown
  };

  return (
    <>
      {isValidationOptional ? (
        <>
          <br hidden={hideSpace} />
          <div style={{ position: 'relative' }}>
            <ReactQuill
              ref={quillRef}
              onFocus={(e: any) => handleAtClick()}
              onChange={(e: any) => props.onChange(e)}
              value={value}
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

          {/* Dropdown - Show when @ is clicked */}
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
                 /* 👇 makes it scrollable */
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
                    insertTextAtCursor(option?.value); // Append selected option to editor
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
