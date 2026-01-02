import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "react-bootstrap";
import { DealAuditLog } from "../../../../../models/dealAutidLog";
import { UserProfile } from "../../../../../models/userProfile";
import Util from "../../../../../others/util";
import { useAuthContext } from "../../../../../contexts/AuthContext";
import { Utility } from "../../../../../models/utility";
import Constants from "../../../../../others/constants";
import LocalStorageUtil from "../../../../../others/LocalStorageUtil";

type params = {
  log: DealAuditLog;
  index: number;
  selectedIndex: any;
  setSelectedIndex: any;
};
const DealActivityDetails = (props: params) => {
  
  const { userProfile } = useAuthContext();
  const { index, selectedIndex, log, ...others } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const userObj = userProfile || new UserProfile();
  const utility: Utility = JSON.parse(
    LocalStorageUtil.getItemObject(Constants.UTILITY) as any
  );
  
  const getCreatorName = (createdBy: number) => {
    console.log('Looking for creator:', createdBy);
    console.log('Available users:', utility?.users);
    console.log('Available persons:', utility?.persons);
    
    if (!createdBy) return 'System';
    
    const user = utility?.users?.find(u => u.id === createdBy);
    const person = utility?.persons?.find(p => p.personID === createdBy);
    
    console.log('Found user:', user);
    console.log('Found person:', person);
    
    return user?.name || person?.personName || `User ${createdBy}`;
  };

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = log?.eventDescription;
    }
  }, [props]);

  return (
    <div className="activityfilter-accrow  mb-3">
      <Accordion.Item eventKey={"" + index} key={index}>
        <Accordion.Header
          onClick={(e: any) => {
            props.setSelectedIndex((prevIndex: any) =>
              prevIndex === index ? null : index
            );
          }}
        >
          <span className="accoheader-title">
            <strong>{log?.eventType}</strong> by {(log as any)?.userName || getCreatorName(log?.createdBy)}
          </span>
          <span className="accoheader-date">
            {moment(log?.createdDate).format("MM-DD-YYYY hh:mm:ss a")}
          </span>
        </Accordion.Header>
        <Accordion.Body>
          <div
            ref={divRef}
            style={{ maxHeight: "200px", overflow: "auto" }}
          ></div>
        </Accordion.Body>
        <div className="accofooter" hidden={index == selectedIndex}>
          <FontAwesomeIcon icon={faCircleCheck} style={{ paddingRight: 5 }} />
          {log?.eventDescription?.replace(/<[^>]*>/g, "")}
        </div>
      </Accordion.Item>
    </div>
  );
};

export default DealActivityDetails;
