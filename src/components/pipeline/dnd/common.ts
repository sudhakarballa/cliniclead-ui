import { colors } from "@atlaskit/theme";
import styled from "@xstyled/styled-components";
import { grid } from "./styles/constants";

export const Container = styled.divBox`
margin: ${grid}px;
display: flex;
flex-direction: column;
`;

export const Header = styled.divBox`
display: flex;
align-items: center;
justify-content: center;
border-top-left-radius: 4px;
border-top-right-radius: 4px;
background-color: ${(props: { isDragging?: boolean }) =>
    props.isDragging ? colors.G50 : colors.N30};
transition: background-color 0.2s ease;
&:hover {
  background-color: ${colors.G50};
}
`;