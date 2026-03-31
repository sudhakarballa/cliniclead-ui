import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import * as Yup from "yup";
import Util from "../../../../../others/util";
import { AddEditDialog } from "../../../../../common/addEditDialog";
import { useEffect, useRef, useState } from "react";
import { useMsal } from "@azure/msal-react";
import LocalStorageUtil from "../../../../../others/LocalStorageUtil";
import Constants from "../../../../../others/constants";
import {
  EmailItemProps,
  EmailTemplate,
} from "../../../../../models/emailTemplate";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const fieldRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #e0e0e0",
  padding: "6px 0",
  gap: 0,
};

const labelStyle: React.CSSProperties = {
  width: 60,
  minWidth: 60,
  fontSize: 13,
  color: "#555",
  fontWeight: 500,
  textAlign: "right",
  paddingRight: 10,
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 13,
  padding: "4px 0",
  background: "transparent",
  fontFamily: "inherit",
};

const errorStyle: React.CSSProperties = {
  color: "#d32f2f",
  fontSize: 11,
  marginTop: 2,
  paddingLeft: 60,
};

const EmailComposeDialog = (props: any) => {
  const {
    header,
    onSave,
    closeDialog,
    selectedItem,
    setSelectedItem,
    dialogIsOpen,
    setDialogIsOpen,
    isReadOnly,
    setIsReadOnly,
    setLoadRowData,
    fromAddress,
    personEmail,
    ...others
  } = props;
  const { instance, accounts } = useMsal();

  const [attachmentFiles, setAttachmentFiles] = useState<Array<any>>([]);
  const [progress, setProgress] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  const stripHtml = (s = "") =>
    s
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  const extractBodyContent = (htmlString: string) => {
    if (!htmlString) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      return doc.body?.innerHTML || htmlString;
    } catch {
      return htmlString;
    }
  };

  const emailListRegex =
    /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}(?:\s*[,;]\s*[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7})*$/;

  const schema = Yup.object({
    toAddress: Yup.string()
      .required("To is required")
      .matches(emailListRegex, "Please enter valid email addresses"),
    fromAddress: Yup.string().required("From is required"),
    subject: Yup.string()
      .transform((v) => (v ?? "").trim())
      .min(1, "Subject is required")
      .required("Subject is required"),
    body: Yup.string()
      .test(
        "not-empty-html",
        "Body is required",
        (v) => stripHtml(v || "").length > 0
      )
      .required("Body is required"),
    cc: Yup.string().nullable(),
    bcc: Yup.string().nullable(),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = methods;

  // Close template menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        templateMenuRef.current &&
        !templateMenuRef.current.contains(e.target as Node)
      ) {
        setShowTemplateMenu(false);
      }
    }
    if (showTemplateMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTemplateMenu]);

  function addReToSubject(subject: any) {
    subject = (subject || "").trim();
    if (!subject.startsWith("Re:")) {
      subject = `Re: ${subject}`;
    }
    return subject;
  }

  const handleReplyClick = () => {
    let senderName = selectedItem.sender.emailAddress.name;
    let senderEmail = selectedItem.sender.emailAddress.address;
    let sentDate = formatEmailDate(
      new Date(selectedItem.sentDateTime).toLocaleString()
    );
    let message = extractBodyContent(
      selectedItem.body?.content ||
        selectedItem.bodyPreview?.split("\r")[0] ||
        ""
    );
    return `<br/><br/><div>${sentDate} ${senderName} &lt;<a href="mailto:${senderEmail}">${senderEmail}</a>&gt; wrote:</div><blockquote style="margin:0 0 0 .8ex;border-left:1px solid #ccc;padding-left:1ex"><div>${message}</div></blockquote>`;
  };

  function formatEmailDate(dateString: any) {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `On ${weekday}, ${month} ${day}, ${year} at ${time}`;
  }

  // Initialize form
  useEffect(() => {
    let toAddresses =
      selectedItem?.sender?.emailAddress?.address ||
      props.personEmail ||
      "";

    const isReply = !Util.isNullOrUndefinedOrEmpty(selectedItem.subject);
    let bodyContent = "";
    if (isReply) {
      bodyContent = handleReplyClick();
    } else if (selectedItem?.body?.content) {
      bodyContent = extractBodyContent(selectedItem.body.content);
    } else if (typeof selectedItem?.body === "string") {
      bodyContent = selectedItem.body;
    }

    let obj = {
      ...selectedItem,
      fromAddress: fromAddress?.username,
      toAddress: toAddresses,
      body: bodyContent,
      subject: selectedItem.subject ? addReToSubject(selectedItem.subject) : "",
      isReply: isReply,
    };
    setSelectedItem(obj);

    // Seed react-hook-form
    setValue("toAddress" as never, (obj.toAddress ?? "") as never, {
      shouldValidate: true,
    });
    setValue("fromAddress" as never, (obj.fromAddress ?? "") as never, {
      shouldValidate: true,
    });
    setValue("subject" as never, (obj.subject ?? "") as never, {
      shouldValidate: true,
    });
    setValue("cc" as never, (obj.cc ?? "") as never);
    setValue("bcc" as never, (obj.bcc ?? "") as never);
    setValue("body" as never, (obj.body ?? "") as never, {
      shouldValidate: true,
    });

    // Set contentEditable body
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.innerHTML = obj.body || "";
      }
    }, 0);
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    setSelectedItem((prev: any) => ({ ...prev, [field]: value }));
    setValue(field as never, value as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleBodyInput = () => {
    const html = bodyRef.current?.innerHTML || "";
    const isEmpty =
      !html || html === "<br>" || html === "<div><br></div>" || stripHtml(html).length === 0;
    const normalized = isEmpty ? "" : html;
    setSelectedItem((prev: any) => ({ ...prev, body: normalized }));
    setValue("body" as never, normalized as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (item: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (props.onSave) {
        await props.onSave(item, attachmentFiles);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttachedData = () => {
    let list: Array<EmailTemplate> = JSON.parse(
      LocalStorageUtil.getItemObject(Constants.EMAIL_TEMPLATES) as any
    );
    let itemList: Array<any> = [];
    list?.forEach((i) => {
      let h: EmailItemProps = JSON.parse(i.header as any);
      let b = JSON.parse(i.body as any);
      let f = JSON.parse(i.footer as any);
      let content = `<div style="text-align:${h.position};background-color:${h.backGroundColor}">${h.content}</div><br/><hr><div style="text-align:${b.position};background-color:${b.backGroundColor}">${b.content}</div><div style="text-align:${f.position};background-color:${f.backGroundColor}">${f.content}</div>`;
      itemList.push({ name: i.name, value: content });
    });
    return itemList;
  };

  const insertTemplate = (html: string) => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = html;
      handleBodyInput();
    }
    setShowTemplateMenu(false);
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map((file) => ({ file, progress: 0 }));
    setAttachmentFiles((prev) => [...prev, ...newFiles]);
    selectedFiles.forEach((file) => uploadFile(file));
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const uploadFile = async (file: any) => {
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://graph.microsoft.com/v1.0/me/drive/root:/${file.name}:/content`,
      true
    );
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.upload.onprogress = (event: any) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress((prev: any) => ({ ...prev, [file.name]: pct }));
      }
    };
    xhr.onload = () => {
      if (xhr.status !== 200) console.error(`Upload failed for ${file.name}`);
    };
    xhr.send(formData);
  };

  const getAccessToken = async () => {
    try {
      const res = await instance.acquireTokenSilent({
        scopes: ["Files.ReadWrite", "Mail.Send"],
        account: accounts[0],
      });
      return res.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const res = await instance.acquireTokenPopup({
          scopes: ["Files.ReadWrite", "Mail.Send"],
        });
        return res.accessToken;
      }
      throw error;
    }
  };

  const handleDelete = (fileName: string) => {
    setAttachmentFiles((prev) =>
      prev.filter((f) => f.file.name !== fileName)
    );
    setProgress((prev: any) => {
      const { [fileName]: _, ...rest } = prev;
      return rest;
    });
  };

  const customFooter = () => (
    <div className="modalfootbar" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-upload-input"
        />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("file-upload-input")?.click();
          }}
          style={{ color: "#555" }}
          title="Attach files"
        >
          <AttachFileIcon />
        </a>
      </div>
      <button
        onClick={() => setDialogIsOpen(false)}
        className="btn btn-secondary btn-sm"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => {
          if (!isSubmitting) handleSubmit(onSubmit)();
        }}
        className="btn btn-primary btn-sm"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send"}
      </button>
    </div>
  );

  const templates = getAttachedData();

  return (
    <FormProvider {...methods}>
      <AddEditDialog
        dialogIsOpen={dialogIsOpen}
        header={"Email"}
        closeDialog={() => setDialogIsOpen(false)}
        customFooter={customFooter()}
        onClose={() => setDialogIsOpen(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting) handleSubmit(onSubmit)();
          }}
        >
          {/* To */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>To</span>
            <input
              style={inputStyle}
              value={selectedItem?.toAddress || ""}
              onChange={(e) => handleFieldChange("toAddress", e.target.value)}
              placeholder="Recipients"
            />
          </div>
          {errors.toAddress && (
            <div style={errorStyle}>{(errors.toAddress as any)?.message}</div>
          )}

          {/* CC */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>CC</span>
            <input
              style={inputStyle}
              value={selectedItem?.cc || ""}
              onChange={(e) => handleFieldChange("cc", e.target.value)}
            />
          </div>

          {/* Bcc */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Bcc</span>
            <input
              style={inputStyle}
              value={selectedItem?.bcc || ""}
              onChange={(e) => handleFieldChange("bcc", e.target.value)}
            />
          </div>

          {/* From */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>From</span>
            <input
              style={{ ...inputStyle, color: "#888", cursor: "not-allowed" }}
              value={selectedItem?.fromAddress || ""}
              disabled
            />
          </div>

          {/* Subject */}
          <div style={fieldRowStyle}>
            <span style={labelStyle}>Subject</span>
            <input
              style={inputStyle}
              value={selectedItem?.subject || ""}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
              placeholder="Subject"
            />
          </div>
          {errors.subject && (
            <div style={errorStyle}>{(errors.subject as any)?.message}</div>
          )}

          {/* Body */}
          <div style={{ marginTop: 8 }}>
            <div
              ref={bodyRef}
              contentEditable
              onInput={handleBodyInput}
              onBlur={handleBodyInput}
              style={{
                minHeight: 180,
                maxHeight: 320,
                overflowY: "auto",
                padding: 10,
                border: "1px solid #e0e0e0",
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                lineHeight: 1.5,
              }}
              suppressContentEditableWarning
            />
            {errors.body && (
              <div style={{ ...errorStyle, paddingLeft: 0 }}>
                {(errors.body as any)?.message}
              </div>
            )}
          </div>

          {/* Template selector */}
          {templates && templates.length > 0 && (
            <div style={{ position: "relative", marginTop: 6 }}>
              <span
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#1976d2",
                  fontWeight: 500,
                }}
                onClick={() => setShowTemplateMenu(true)}
              >
                Select From Template @
              </span>
              {showTemplateMenu && (
                <div
                  ref={templateMenuRef}
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
                  <div
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      color: "#888",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    Select a template
                  </div>
                  {templates.map((t: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                        borderBottom: "1px solid #f5f5f5",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                      onClick={() => insertTemplate(t.value)}
                    >
                      {t.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hidden inputs for react-hook-form */}
          <input type="hidden" {...register("toAddress")} />
          <input type="hidden" {...register("fromAddress")} />
          <input type="hidden" {...register("subject")} />
          <input type="hidden" {...register("body")} />
          <input type="hidden" {...register("cc")} />
          <input type="hidden" {...register("bcc")} />
        </form>

        {/* Attachments */}
        {attachmentFiles.length > 0 && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {attachmentFiles.map(({ file }: any, index: number) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #e0e0e0",
                  borderRadius: 6,
                  padding: "4px 8px",
                  background: "#f9f9f9",
                  maxWidth: 240,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <InsertDriveFileIcon
                  sx={{ fontSize: 16, color: "#1976d2", flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#333",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    minWidth: 0,
                  }}
                  title={file.name}
                >
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(file.name)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    flexShrink: 0,
                    color: "#999",
                  }}
                  title="Remove"
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </button>
                {/* Progress bar overlay */}
                {progress[file.name] > 0 && progress[file.name] < 100 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: 2,
                      width: `${progress[file.name]}%`,
                      background: "#4caf50",
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </AddEditDialog>
    </FormProvider>
  );
};

export default EmailComposeDialog;
