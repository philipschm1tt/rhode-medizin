import styled from 'styled-components'

const CallToActionButton = styled.button`
  color: ${props => props.theme.colors.companyBlue};
  text-shadow: 0 0 15px white;
  background: linear-gradient(rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.1)),
    ${props => props.theme.colors.yellow};
  padding: 10px ${props => props.theme.sizes.innerPadding};
  border: 1px solid ${props => props.theme.colors.yellow};
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.5);
  font-family: font-bold, Arial, sans-serif;
  font-size: ${props => props.theme.fontSizes.smallScreens.L};
  line-height: ${props => props.theme.lineHeights.smallScreens.L};
  font-weight: bold;
  justify-self: start;

  @media (min-width: ${props => props.theme.sizes.breakpoints.largeScreens}) {
    font-size: ${props => props.theme.fontSizes.largeScreens.L};
    line-height: ${props => props.theme.lineHeights.largeScreens.L};

    padding: 10px ${props => props.theme.sizes.doubleBaseLineHeight};
  }
`

export default CallToActionButton
