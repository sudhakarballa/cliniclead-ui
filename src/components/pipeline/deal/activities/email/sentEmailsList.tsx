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
  
  const [attachments, setAttachments]=useState(email?.attachments);
  const accountEmail = accounts.length>0 ? accounts[0].username : null;

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = body?.content;
    }
  }, [props]);

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
            <div>
            <EmailAttachments attachments={attachments}/>
            </div>
            <div className="form-group-row d-flex">
              <div className="editstage-delete">
                <button
                  className="editstage-deletebtn"
                  onClick={(e: any) => {
                    props.setDialogIsOpen(true);
                    props.setSelectedEmail(email as any);
                  }}
                >
                  <strong>Reply</strong>
                </button>
              </div>
              <div className="editstage-delete" style={{ paddingLeft: "10px" }}>
                <button
                  className="editstage-deletebtn"
                  onClick={(e: any) => {
                    props.setShowDeleteDialog(true);
                    props.setSelectedEmail(email as any);
                  }}
                >
                  <strong>Delete</strong>
                </button>
              </div>
            </div>
            <br />
            {/* <div hidden={accountEmail && email.sender?.emailAddress?.address!=accountEmail}>
              <EmailThread
                emails={getNestedEmails()}
                isFirstNestedEmail={true}
              />
            </div> */}
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
