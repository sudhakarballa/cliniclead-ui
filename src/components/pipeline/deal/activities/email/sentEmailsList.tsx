import {
  faCircleCheck
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "react-bootstrap";
import { EmailThreadObject } from "../../../../../models/emailCompose";
import EmailAttachments from "./emailAttachementsList";

type params = {
  email: any;
  index: number;
  setDialogIsOpen: any;
  setShowDeleteDialog: any;
  selectedIndex: any;
  setSelectedIndex: any;
  setSelectedEmail: any;
  emailsList: Array<any>;
  accounts:Array<any>;
};
const SentEmailsList = (props: params) => {
  
  const { index, email, selectedIndex, emailsList, accounts, ...others } = props;
  const { subject, sender, toRecipients, sentDateTime, body } = email;
  const divRef = useRef<HTMLDivElement>(null);
  
  const [attachments, setAttachments]=useState(email?.attachments ?? []);
  const accountEmail = accounts.length>0 ? accounts[0].username : null;

  useEffect(() => {
    if (divRef.current) {
      const raw = body?.content || "";
      if (!raw) {
        divRef.current.textContent = email?.bodyPreview || "";
      } else {
        // Parse the full HTML document and extract only the <body> inner content
        try {
          const doc = new DOMParser().parseFromString(raw, "text/html");
          divRef.current.innerHTML = doc.body?.innerHTML || raw;
        } catch {
          divRef.current.textContent = email?.bodyPreview || raw;
        }
      }
    }
    setAttachments(email?.attachments ?? []);
  }, [email]);

  const generateDynamicThreadObj = (
    input: any,
    index: number,
    threadEmails: Array<any>
  ) => {
    let threadObj = new EmailThreadObject();
    let nestedObj = threadEmails?.find(
      (i) => new Date(i.sentDateTime) < new Date(input.sentDateTime)
    );
    threadObj.id = index;
    threadObj.sender = input.sender.emailAddress.name;
    threadObj.senderEmail = input.sender.emailAddress.address;
    threadObj.timestamp = input.sentDateTime;
    threadObj.content = input.body.content;
    threadObj.replies = nestedObj
      ? generateDynamicThreadObj(nestedObj, threadObj.id + 1, threadEmails)
      : [];
    return [threadObj];
  };

  return (
    <div className="activityfilter-accrow mb-3">
      <Accordion className="activityfilter-acco">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <span className="accoheader-title">
              <strong>Email - </strong> from {sender?.emailAddress?.name}
            </span>
            <span className="accoheader-date">
              {moment(sentDateTime).format("MM-DD-YYYY hh:mm:ss a")}
            </span>
          </Accordion.Header>
          <Accordion.Body>
            <div
              ref={divRef}
              style={{ maxHeight: "200px", overflow: "auto" }}
            ></div>
            <EmailAttachments attachments={attachments}/>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
                  props.setDialogIsOpen(true);
                  props.setSelectedEmail(email as any);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 14px",
                  borderRadius: 14,
                  border: "1px solid #dadce0",
                  background: "#fff",
                  color: "#1a73e8",
                  cursor: "pointer",
                  fontWeight: 500,
                  lineHeight: "20px",
                }}
              >
                ↩ Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  props.setShowDeleteDialog(true);
                  props.setSelectedEmail(email as any);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 14px",
                  borderRadius: 14,
                  border: "1px solid #dadce0",
                  background: "#fff",
                  color: "#d93025",
                  cursor: "pointer",
                  fontWeight: 500,
                  lineHeight: "20px",
                }}
              >
                ✕ Delete
              </button>
            </div>
          </Accordion.Body>
          <div className="accofooter">
            <FontAwesomeIcon icon={faCircleCheck} /> {subject}
            {/* <span className="accoheader-date" style={{paddingLeft:"100px"}}>
              to{" "}
              {Array.from(
                toRecipients as Array<any>,
                (x: any) => x.emailAddress?.name
              )?.join(",")}
            </span> */}
          </div>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default SentEmailsList;
