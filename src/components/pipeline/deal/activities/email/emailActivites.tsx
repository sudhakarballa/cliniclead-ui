import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import Accordion from "react-bootstrap/Accordion";
import { toast } from "react-toastify";
import { DeleteDialog } from "../../../../../common/deleteDialog";
import { EmailCompose } from "../../../../../models/emailCompose";
import Util from "../../../../../others/util";
import { loginRequest, popupRedirectUri } from "./authConfig";
import EmailComposeDialog from "./emailComposeDialog";
import { deleteEmail, getSentEmails, sendEmail } from "./emailService"; // Assuming you have a function to fetch sent emails
import SentEmailsList from "./sentEmailsList";
import { DealAuditLogService } from "../../../../../services/dealAuditLogService";
import { ErrorBoundary } from "react-error-boundary";
import { DealEmailLog, PostAuditLog } from "../../../../../models/dealAutidLog";
import { EmailTemplateService } from "../../../../../services/emailTemplateService";
import LocalStorageUtil from "../../../../../others/LocalStorageUtil";
import Constants from "../../../../../others/constants";
import { DealService } from "../../../../../services/dealService";
import { DealEmailLogService } from "../../../../../services/dealEmailLogService";

type params = {
  dealId: any;
};
function EmailActivities(props: params) {
  const { dealId, ...others } = props;
  const { instance, accounts } = useMsal();
  const [emailSent, setEmailSent] = useState(false);
  const [emailsList, setEmailsList] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<any>(null);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const auditLogsvc = new DealAuditLogService(ErrorBoundary);
  const dealEmailLogService = new DealEmailLogService(ErrorBoundary)
  const emailTemplateSvc = new EmailTemplateService(ErrorBoundary);
  const [personEmail, setPersonEmail] = useState("");
  useEffect(() => {
    if (accounts.length == 0) {
      handleLogin();
    }

    if (accounts.length > 0 && instance) {
      emailTemplateSvc.getEmailTemplates().then((res) => {
        LocalStorageUtil.setItemObject(
          Constants.EMAIL_TEMPLATES,
          JSON.stringify(res)
        );
        fetchData();
      });
    }
  }, [(instance as any)?.controller?.initialized, accounts]);

  useEffect(() => {
    if (!dealId) return;
  
    const fetchDealDetails = async () => {
      try {
        const dealSvc = new DealService(ErrorBoundary);
        const response = await dealSvc.getDealsById(dealId);
        if (response && response.email) {
          let email = response.email;
          setPersonEmail(email || "default@example.com");
          console.log("Email Set:", email);
        } else {
          console.warn("contactPerson data missing in API response");
        }
      } catch (error) {
        console.error("Error fetching deal details:", error);
      }
    };
  
    fetchDealDetails();
  }, [dealId]);

  const fetchData = async () => {
    if ((instance as any)?.controller?.initialized) {
      try {
        setIsLoading(true);
        const accessTokenResponse = await instance.acquireTokenSilent({
          scopes: ["Mail.Read"], // Adjust scopes as per your requirements
          account: accounts[0],
        });
        // Fetch sent emails after acquiring token
        var emails: Array<any> = await getSentEmails(
          accessTokenResponse.accessToken
        );

        //Retrieving deal emails from localstorage

        var emailsResult: Array<any> = [];
        emails.forEach((e) => {
          let categories = e.categories[0]?.split(":") ?? [];
          if (categories.length > 0) {
            if (dealId == +categories[1]) {
              emailsResult.push(e);
            }
          }
        });

        emails.forEach((e) => {
          if (
            emailsResult.find(
              (er) =>
                er.conversationId == e.conversationId &&
                er.conversationIndex != e.conversationIndex
            )
          ) {
            emailsResult.push(e);
          }
        });

        emailsResult = Util.removeDuplicates(emailsResult, "conversationIndex");
        setEmailsList(
          emailsResult.sort(
            (a: any, b: any) =>
              new Date(b.sentDateTime).getTime() -
              new Date(a.sentDateTime).getTime()
          )
        ); //Filtering emails which are against to deal
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    try {
      let res = await instance.loginPopup({
        ...loginRequest,
        redirectUri: popupRedirectUri,
      });
      console.log("Login successful", res);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSendEmail = async (emailObj: any, attachmentFiles:Array<any>) => {
    try {
      const accessTokenResponse = await instance.acquireTokenSilent({
        scopes: ["Mail.Send"],
        account: accounts[0],
      });
      // Send email logic here

      

      const attachments = await Promise.all(
        attachmentFiles.map(async (file) => {
          const base64File = await fileToBase64(file?.file);
          return {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: file.file.name,
            contentType: file.file.type,
            contentBytes: base64File,
          };
        })
      );

      const emailBody = await prepareEmailBody(emailObj, dealId, attachments);

      let response: any = await sendEmail(
        accessTokenResponse.accessToken,emailBody,
        emailObj.isReply ? selectedEmail.id : null
      );
      if(!response.error){
        setEmailSent(true);
        setDialogIsOpen(false);
        toast.success("Email sent successfully");
        let auditLogObj = {
          ...new PostAuditLog(),
          eventType: "email Send",
          dealId: dealId,
        };
        auditLogObj.createdBy = Util.UserProfile()?.userId;
        auditLogObj.eventDescription = "A new email was sent for the deal";
        //await auditLogsvc.postAuditLog(auditLogObj);
        let dealEmailObj: DealEmailLog = new DealEmailLog();

        dealEmailObj.dealId = dealId;
        dealEmailObj.emailBody = emailObj.body;
        dealEmailObj.emailTo = emailObj.toAddress;
        dealEmailObj.emailDate = new Date();
        dealEmailObj.createdBy = Util.UserProfile()?.userId;
        dealEmailObj.createdDate = new Date();
        // = {
        //   ...new DealEmailLog(),
        //   eventType: "email Send",
        //   dealId: dealId,
        // };

        // auditLogObj.createdBy = auditLogObj.userId = Util.UserProfile()?.userId;
        // auditLogObj.eventDescription = "A new email was sent for the deal";
        await dealEmailLogService.postDealEmailLog(dealEmailObj);
        fetchData();
      }
      else{
        toast.error("Unable to send email please verify");
      }

    } catch (error) {
      console.error("Email sending failed", error);
      setDialogIsOpen(false);
      toast.warning("Unable to sent email please re try after sometime");
    }
  };

  const handleDeleteEmail = async () => {
    try {
      const accessTokenResponse = await instance.acquireTokenSilent({
        scopes: ["Mail.Send", "mail.read", "mail.readwrite"],
        account: accounts[0],
      });
      // Send email logic here
      await deleteEmail(accessTokenResponse.accessToken, selectedEmail.id);
      setShowDeleteDialog(false);
      toast.success("Email deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Email deleting failed", error);
      setDialogIsOpen(false);
      toast.warning("Unable to delete email please re try after sometime");
    }
  };

  return (
    <div>
      <>
        <div className="activityfilter-row pb-3">
          {isLoading ? (
            <div className="alignCenter">
              <Spinner />
            </div>
          ) : (
            <div className="createnote-row">
              <div className="d-flex">
                <div>
                  <button
                    type="button"
                    onClick={(e: any) => {
                      setSelectedEmail(new EmailCompose());
                      setDialogIsOpen(true);
                    }}
                    className="btn btn-y1app"
                  >
                    Send Email
                  </button>
                </div>
                <div style={{ paddingLeft: "10px" }}>
                  <button
                    type="button"
                    onClick={(e: any) => {
                      fetchData();
                    }}
                    className="btn btn-secondary"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div hidden={accounts.length === 0 || isLoading}>
          {/* <h3>April 2024</h3> */}
          <div
            className="activityfilter-accrow  mb-3"
            hidden={emailsList.length == 0}
          >
            <Accordion className="activityfilter-acco">
              {emailsList.map((email, index) => (
                <SentEmailsList
                  accounts={accounts}
                  email={email}
                  index={index}
                  setShowDeleteDialog={setShowDeleteDialog}
                  setDialogIsOpen={setDialogIsOpen}
                  selectedIndex={selectedIndex}
                  setSelectedEmail={setSelectedEmail}
                  setSelectedIndex={(e: any) => {
                    setSelectedIndex(e);
                  }}
                  emailsList={emailsList.filter(
                    (i) => i.conversationId == email.conversationId
                  )}
                />
              ))}
            </Accordion>
          </div>
          <div
            style={{ textAlign: "center" }}
            hidden={emailsList.length > 0 || accounts.length === 0}
          >
            No emails are available to show
          </div>
        </div>
      </>
      {dialogIsOpen && (
        <EmailComposeDialog
          personEmail={personEmail}
          fromAddress={accounts[0]}
          dialogIsOpen={dialogIsOpen}
          onCloseDialog={(e: any) => setSelectedEmail(null as any)}
          selectedItem={selectedEmail ?? new EmailCompose()}
          setSelectedItem={setSelectedEmail}
          setDialogIsOpen={setDialogIsOpen}
          onSave={async (e: any, attachmentFiles:Array<any>) => {
            
            await handleSendEmail(e, attachmentFiles);
          }}
        />
      )}
      {showDeleteDialog && (
        <DeleteDialog
          itemType={"Email"}
          itemName={""}
          dialogIsOpen={showDeleteDialog}
          closeDialog={(e: any) => setShowDeleteDialog(false)}
          onConfirm={(e: any) => {
            handleDeleteEmail();
          }}
          isPromptOnly={false}
          actionType={"Delete"}
        />
      )}
    </div>
  );
}

export default EmailActivities;

export const prepareToRecipients = (emailObj: any) => {
  let emails: Array<any> = [];
  emailObj.toAddress?.split(";")?.forEach((i: any) => {
    let obj: any = {
      emailAddress: {
        address: i,
      },
    };
    emails.push(obj);
  });
  return emails.length > 0 ? emails : emailObj?.toRecipients;
};

// Convert file to Base64 for email attachment
const fileToBase64 = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader as any).result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const prepareEmailBody = async (
  emailObj: EmailCompose,
  dealId?: number,
  attachments?:any
) => {
  return JSON.stringify({
    message: {
      subject: emailObj.subject,
      categories: ["dealId: " + dealId],
      body: {
        contentType: "HTML",
        content: emailObj.body,
      },
      toRecipients: prepareToRecipients(emailObj),
      attachments: attachments
      // ccRecipients: [
      //   {
      //     emailAddress: {
      //       address: emailObj.cc,
      //     },
      //   },
      // ],
      // bccRecipients: [
      //   {
      //     emailAddress: {
      //       address: emailObj.bcc,
      //     },
      //   },
      // ]
    },
  });
};
