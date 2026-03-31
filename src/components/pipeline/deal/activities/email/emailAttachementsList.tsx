import React, { useEffect, useState } from "react";
import DownloadIcon from "@mui/icons-material/Download";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";

type params = {
  attachments: Array<any>;
};

const base64ToBlob = (base64: any, contentType: any) => {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getFileIcon = (contentType: string) => {
  if (contentType === "application/pdf")
    return <PictureAsPdfIcon sx={{ fontSize: 20, color: "#e53935" }} />;
  if (contentType?.startsWith("image"))
    return <ImageIcon sx={{ fontSize: 20, color: "#43a047" }} />;
  return <InsertDriveFileIcon sx={{ fontSize: 20, color: "#1976d2" }} />;
};

const EmailAttachments = (props: params) => {
  const { attachments } = props;
  const [attachmentUrls, setAttachmentUrls] = useState<Array<any>>([]);

  useEffect(() => {
    const generateAttachmentUrls = () => {
      const fileAttachments = (attachments || []).filter(
        (a: any) => a.contentBytes && a.name
      );
      const urls = fileAttachments
        .map((attachment: any) => {
          try {
            const { contentBytes, contentType, name, size } = attachment;
            const blob = base64ToBlob(contentBytes, contentType);
            const objectUrl = URL.createObjectURL(blob);
            return { name, contentType, objectUrl, size };
          } catch (e) {
            console.error("Error processing attachment:", attachment.name, e);
            return null;
          }
        })
        .filter(Boolean);
      setAttachmentUrls(urls);
    };

    if (attachments && attachments.length > 0) {
      generateAttachmentUrls();
    } else {
      setAttachmentUrls([]);
    }

    return () => {
      attachmentUrls.forEach((attachment: any) => {
        if (attachment?.objectUrl) URL.revokeObjectURL(attachment.objectUrl);
      });
    };
  }, [attachments]);

  if (!attachmentUrls.length) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
          color: "#555",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <AttachFileIcon sx={{ fontSize: 16 }} />
        <span>
          {attachmentUrls.length}{" "}
          {attachmentUrls.length === 1 ? "Attachment" : "Attachments"}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {attachmentUrls.map((attachment, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              padding: "6px 10px",
              background: "#f9f9f9",
              maxWidth: 280,
              minWidth: 0,
            }}
          >
            {attachment.contentType?.startsWith("image") ? (
              <img
                src={attachment.objectUrl}
                alt={attachment.name}
                style={{
                  width: 32,
                  height: 32,
                  objectFit: "cover",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
            ) : (
              <span style={{ flexShrink: 0, display: "flex" }}>
                {getFileIcon(attachment.contentType)}
              </span>
            )}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: "#333",
                }}
                title={attachment.name}
              >
                {attachment.name}
              </div>
              {attachment.size > 0 && (
                <div style={{ fontSize: 11, color: "#888" }}>
                  {formatFileSize(attachment.size)}
                </div>
              )}
            </div>
            <a
              href={attachment.objectUrl}
              download={attachment.name}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                color: "#1976d2",
                padding: 2,
                borderRadius: 4,
              }}
              title="Download"
            >
              <DownloadIcon sx={{ fontSize: 18 }} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailAttachments;
