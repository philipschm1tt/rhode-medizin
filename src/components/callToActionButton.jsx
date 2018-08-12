import styled from 'styled-components'

const CallToActionButton = styled.button`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
  background: linear-gradient(rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.1)),
    ${props => props.theme.colors.yellow};
  padding: 10px 50px;
  border: 1px solid ${props => props.theme.colors.yellow};
  border-radius: 3px;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  margin: 0 20px;
  font-size: ${props => props.theme.fontSizes.L};
  line-height: ${props => props.theme.lineHeights.L};
`

export default CallToActionButton
