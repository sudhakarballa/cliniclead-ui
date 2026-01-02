import { Card, CardContent } from "@mui/material";
import { useEffect, useState } from "react";
import styled from "styled-components";

type params = {
  element: any;
  height?: any;
  width?: any;
};
export const GirdElement = (props: params) => {
  const { height, width, ...others } = props;
  const [element, setElement] = useState(props.element);

  const GridItemWrapper = styled.div`
    // background: trasparent;
  `;

  const GridItemContent = styled.div`
    // padding: 0px;
    // height: 100%;
  `;

  useEffect(() => {
    setElement(props.element);
  }, [props]);

  return (
    <GridItemWrapper key={"test"}>
          <GridItemContent className="chartItem">
                  <Card className="chartCard">
                      <CardContent className="chartCardBody" style={{height:height, width:width}}>
                          {element}
                      </CardContent>
                  </Card>
          </GridItemContent>
      </GridItemWrapper>
  );
};