import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";

type params = {
  onChange: any;
  value: any;
  hideSpace?: boolean;
  item?: any;
  selectedItem?: any;
  isValidationOptional?: boolean;
  attachedData?: Array<any>;
};

const toolbarBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid transparent",
  borderRadius: 3,
  cursor: "pointer",
  padding: "3px 5px",
  display: "flex",
  alignItems: "center",
  color: "#555",
};

const Toolbar = ({ onExecCmd, onInsertLink }: { onExecCmd: (cmd: string, val?: string) => void; onInsertLink: () => void }) => (
  <div
    style={{
      display: "flex",
      gap: 2,
      padding: "3px 6px",
      border: "1px solid #ccc",
      borderBottom: "none",
      borderRadius: "4px 4px 0 0",
      background: "#f5f5f5",
      flexWrap: "wrap",
    }}
  >
    {[
      { cmd: "bold", icon: <FormatBoldIcon sx={{ fontSize: 18 }} />, title: "Bold" },
      { cmd: "italic", icon: <FormatItalicIcon sx={{ fontSize: 18 }} />, title: "Italic" },
      { cmd: "underline", icon: <FormatUnderlinedIcon sx={{ fontSize: 18 }} />, title: "Underline" },
      { cmd: "insertUnorderedList", icon: <FormatListBulletedIcon sx={{ fontSize: 18 }} />, title: "Bullet list" },
      { cmd: "insertOrderedList", icon: <FormatListNumberedIcon sx={{ fontSize: 18 }} />, title: "Numbered list" },
    ].map((btn) => (
      <button
        key={btn.cmd}
        type="button"
        title={btn.title}
        onMouseDown={(e) => { e.preventDefault(); onExecCmd(btn.cmd); }}
        style={toolbarBtnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        {btn.icon}
      </button>
    ))}
    <button
      type="button"
      title="Insert link"
      onMouseDown={(e) => { e.preventDefault(); onInsertLink(); }}
      style={toolbarBtnStyle}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <LinkIcon sx={{ fontSize: 18 }} />
    </button>
    <select
      onChange={(e) => { onExecCmd("fontSize", e.target.value); e.target.value = ""; }}
      style={{ border: "1px solid #ccc", borderRadius: 3, fontSize: 11, padding: "2px 4px", background: "#fff", cursor: "pointer", marginLeft: 4 }}
      defaultValue=""
    >
      <option value="" disabled>Size</option>
      <option value="1">Small</option>
      <option value="3">Normal</option>
      <option value="5">Large</option>
      <option value="7">Huge</option>
    </select>
  </div>
);

const RitechTextEditorWithValidation = (props: params) => {
  const { value, onChange, hideSpace, item, attachedData } = props;
  const editorRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncValue();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  const syncValue = () => {
    const html = editorRef.current?.innerHTML || "";
    onChange(html);
  };

  const insertTemplate = (html: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      syncValue();
    }
    setShowDropdown(false);
  };

  return (
    <>
      <br hidden={hideSpace} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Toolbar onExecCmd={execCmd} onInsertLink={insertLink} />
        <div
          ref={editorRef}
          contentEditable
          onInput={syncValue}
          onBlur={syncValue}
          style={{
            flex: 1,
            minHeight: 80,
            overflowY: "auto",
            padding: 8,
            border: "1px solid #ccc",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            lineHeight: 1.5,
          }}
          suppressContentEditableWarning
        />
      </div>

      <div
        hidden={!attachedData || attachedData?.length === 0}
        style={{ position: "relative", marginTop: 6, display: "inline-block" }}
      >
        <span
          style={{ cursor: "pointer", fontSize: 12, color: "#1976d2", fontWeight: 500 }}
          onClick={() => setShowDropdown(true)}
        >
          Select From Template @
        </span>
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 4,
              width: 220,
              zIndex: 20000,
              boxShadow: "0 4px 12px rgba(0,0,0,.12)",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            <div style={{ padding: "6px 10px", fontSize: 11, color: "#888", borderBottom: "1px solid #eee" }}>
              Select a template
            </div>
            {attachedData?.map((option, index) => (
              <div
                key={index}
                style={{ padding: "8px 10px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f5f5f5" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                onClick={() => insertTemplate(option.value)}
              >
                {option.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {item?.value && (
        <>
          <input type="text" {...register(item.value)} style={{ display: "none" }} />
          <p className="text-danger" id={`validationMsgfor_${item.value}`}>
            {(errors as any)?.[item.value]?.message}
          </p>
        </>
      )}
    </>
  );
};

const RichTextEditor = (props: params) => {
  const { onChange, value, hideSpace, isValidationOptional, attachedData } = props;
  const editorRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncValue();
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) execCmd("createLink", url);
  };

  const syncValue = () => {
    const html = editorRef.current?.innerHTML || "";
    onChange(html);
  };

  const insertTemplate = (html: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      syncValue();
    }
    setShowDropdown(false);
  };

  return (
    <>
      {isValidationOptional ? (
        <>
          <br hidden={hideSpace} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <Toolbar onExecCmd={execCmd} onInsertLink={insertLink} />
            <div
              ref={editorRef}
              contentEditable
              onInput={syncValue}
              onBlur={syncValue}
              style={{
                flex: 1,
                minHeight: 80,
                overflowY: "auto",
                padding: 8,
                border: "1px solid #ccc",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                lineHeight: 1.5,
              }}
              suppressContentEditableWarning
            />
          </div>

          <div
            hidden={!attachedData || attachedData?.length === 0}
            style={{ position: "relative", marginTop: 6, display: "inline-block" }}
          >
            <span
              style={{ cursor: "pointer", fontSize: 12, color: "#1976d2", fontWeight: 500 }}
              onClick={() => setShowDropdown(true)}
            >
              Select From Template @
            </span>
            {showDropdown && (
              <div
                ref={dropdownRef}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  width: 220,
                  zIndex: 20000,
                  boxShadow: "0 4px 12px rgba(0,0,0,.12)",
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div style={{ padding: "6px 10px", fontSize: 11, color: "#888", borderBottom: "1px solid #eee" }}>
                  Select a template
                </div>
                {attachedData?.map((option, index) => (
                  <div
                    key={index}
                    style={{ padding: "8px 10px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f5f5f5" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    onClick={() => insertTemplate(option?.value)}
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
