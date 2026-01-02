import React, { useEffect, useRef, useState } from "react";
import { EmailTemplate } from "../../../models/emailTemplate";

type params = {
  selectedItem: EmailTemplate;
  setHieghtWidth: boolean;
};
const TemplatePreview = (props: params) => {
  const { setHieghtWidth, ...others } = props;

  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<EmailTemplate>(
    props.selectedItem
  );

  useEffect(() => {
    setSelectedItem(props.selectedItem);
  }, [props]);

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.innerHTML =
        selectedItem.header.content ?? "Your Sample Header";
    }
    if (bodyRef.current) {
      bodyRef.current.innerHTML =
        selectedItem.body.content ?? "Your Sample Body";
    }
    if (footerRef.current) {
      footerRef.current.innerHTML =
        selectedItem.footer.content ?? "Your Sample Footer";
    }
  }, [selectedItem]);

  return (
    <div
      className="sampleemailpreview preview-pane"
      style={{
        width: setHieghtWidth ? "200px" : "",
        height: setHieghtWidth ? "200px" : "",
      }}
    >
      {/* Preview */}
      <div className="email-preview">
        <div
          className="email-header"
          style={{ textAlign: selectedItem?.header?.position, backgroundColor: selectedItem?.header?.backGroundColor}}
          ref={headerRef}
        ></div>
        <div
          className="email-body"
          style={{ textAlign: selectedItem?.body?.position, backgroundColor: selectedItem?.body?.backGroundColor }}
          ref={bodyRef}
        >
          Body
        </div>
        <div
          className="email-footer"
          style={{ textAlign: selectedItem?.footer?.position, backgroundColor: selectedItem?.footer?.backGroundColor }}
          ref={footerRef}
        >
          footer
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
