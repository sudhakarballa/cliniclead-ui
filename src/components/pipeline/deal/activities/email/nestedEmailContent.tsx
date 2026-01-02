import React, { useEffect, useRef } from "react";

type params = {
  body: any;
};
const NestedEmailContent = (props: params) => {
  const { body, ...others } = props;
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = body;
    }
  }, [props]);

  return (
    <div className="email-content">
      <span
        style={{
          fontFamily: "sans-serif",
          fontSize: "14.6667px",
          lineHeight: "17.60004px",
          color: "#444444",
        }}
      >
        <div ref={divRef}></div>
      </span>
      <br />
    </div>
  );
};

export default NestedEmailContent;
