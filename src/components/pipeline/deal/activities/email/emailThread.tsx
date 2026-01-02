import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useState } from "react";
import NestedEmailContent from "./nestedEmailContent";

type params = {
  emails: Array<any>;
  isFirstNestedEmail?: boolean;
};
const EmailThread = (props: params) => {
  const { emails, isFirstNestedEmail, ...others } = props;
  const [show, setShow] = useState(false);

  function formatDate(date:any) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Extract date components
    const dayOfWeek = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12 || 12; // Handle midnight

    // Construct the formatted date string
    const formattedDate = `On ${dayOfWeek}, ${month} ${day}, ${year} at ${hours}:${minutes} ${period}`;

    return formattedDate;
}

  return (
    <>
      <div hidden={emails.length == 0}>
        <div className="email-thread" hidden={!show && isFirstNestedEmail}>
          {emails.map((email: any) => (
            <div key={email.id} className="email-reply">
              <p>
                On {formatDate(new Date(new Date(email.timestamp).toString()))}, {email.sender}{" <"}
                <strong>{email.senderEmail}</strong>{">"} wrote:
              </p>
              <blockquote
                style={{
                  margin: "0 0 0 .8ex",
                  borderLeft: "1px #ccc solid",
                  paddingLeft: "1ex",
                }}
              >
                <NestedEmailContent body={email.content} />
                {email.replies.length > 0 && (
                  <EmailThread emails={email.replies} />
                )}
              </blockquote>
            </div>
          ))}
        </div>
        <div style={{ paddingLeft: "10px" }} hidden={!isFirstNestedEmail}>
          <MoreHorizIcon
            fontSize="large"
            onClick={(e: any) => setShow(!show)}
          />
        </div>
      </div>
    </>
  );
};

export default EmailThread;
